import {
  createCliRenderer,
  Box,
  Text,
  ASCIIFont,
  TextAttributes,
  SelectRenderable,
  SelectRenderableEvents,
  RGBA,
} from "@opentui/core";
import type { CliRenderer, KeyEvent } from "@opentui/core";

import { Fraction } from "./fraction";
import type { Note, ModeName, SpeciesValue } from "./types";
import { createNote, Mode, Species, getSpeciesName, getSpeciesDescription, CANTUS_FIRMUS_PRESETS } from "./types";
import { generateCounterpoint } from "./generator";
import { pitchToNoteName } from "./utils";
import { exportToMidi } from "./midi";
import { spawn } from "child_process";

type AppScreen = "menu" | "species" | "mode" | "cantus" | "generating" | "result";

interface AppState {
  screen: AppScreen;
  selectedSpecies: SpeciesValue;
  selectedMode: ModeName;
  cantusFirmus: Note[];
  counterpoint: Note[];
  generationProgress: number;
  bestFitness: number;
}

let renderer: CliRenderer;
let state: AppState = {
  screen: "menu",
  selectedSpecies: Species.FIRST,
  selectedMode: "IONIAN",
  cantusFirmus: [],
  counterpoint: [],
  generationProgress: 0,
  bestFitness: 0,
};

function createCantusFirmusFromPitches(pitches: readonly number[]): Note[] {
  return pitches.map((pitch, i) => createNote(pitch, Fraction.ONE, Fraction.from(i)));
}

let elementIdCounter = 0;
const trackedIds: string[] = [];

function clearScreen(): void {
  for (const id of trackedIds) {
    try {
      renderer.root.remove(id);
    } catch {
    }
  }
  trackedIds.length = 0;
}

function getNextId(): string {
  elementIdCounter++;
  const id = `el-${elementIdCounter}`;
  trackedIds.push(id);
  return id;
}

async function renderMenu(): Promise<void> {
  clearScreen();

  const container = Box(
    { id: getNextId(), flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1 },
    Box(
      { flexDirection: "column", alignItems: "center", marginBottom: 2 },
      ASCIIFont({ font: "tiny", text: "HARMONIA", color: RGBA.fromHex("#9D4EDD") }),
      Text({ content: "Counterpoint Generation System", fg: "#E0AAFF", attributes: TextAttributes.DIM })
    )
  );

  renderer.root.add(container);

  const menuId = getNextId();
  const menu = new SelectRenderable(renderer, {
    id: menuId,
    width: 40,
    height: 8,
    options: [
      { name: "Generate Counterpoint", description: "Create a new counterpoint melody" },
      { name: "Select Species", description: `Current: ${getSpeciesName(state.selectedSpecies)}` },
      { name: "Select Mode", description: `Current: ${Mode[state.selectedMode].name}` },
      { name: "Exit", description: "Quit the application" },
    ],
    position: "absolute",
    left: Math.floor((process.stdout.columns - 40) / 2),
    top: 12,
  });

  menu.on(SelectRenderableEvents.ITEM_SELECTED, async (index: number) => {
    switch (index) {
      case 0:
        state.screen = "cantus";
        await renderCantusFirmusSelection();
        break;
      case 1:
        state.screen = "species";
        await renderSpeciesSelection();
        break;
      case 2:
        state.screen = "mode";
        await renderModeSelection();
        break;
      case 3:
        process.exit(0);
    }
  });

  renderer.root.add(menu);
  menu.focus();
}

async function renderSpeciesSelection(): Promise<void> {
  clearScreen();

  const header = Box(
    { id: getNextId(), flexDirection: "column", alignItems: "center", width: "100%", marginBottom: 2 },
    Text({ content: "Select Species of Counterpoint", fg: "#9D4EDD", attributes: TextAttributes.BOLD }),
    Text({ content: "Press Enter to select, Escape to go back", fg: "#666666", attributes: TextAttributes.DIM })
  );
  renderer.root.add(header);

  const speciesOptions = [
    { name: "First Species (1:1)", description: getSpeciesDescription(Species.FIRST) },
    { name: "Second Species (2:1)", description: getSpeciesDescription(Species.SECOND) },
    { name: "Third Species (4:1)", description: getSpeciesDescription(Species.THIRD) },
    { name: "Fourth Species", description: getSpeciesDescription(Species.FOURTH) },
    { name: "Fifth Species (Florid)", description: getSpeciesDescription(Species.FIFTH) },
  ];

  const menuId = getNextId();
  const menu = new SelectRenderable(renderer, {
    id: menuId,
    width: 60,
    height: 10,
    options: speciesOptions,
    position: "absolute",
    left: Math.floor((process.stdout.columns - 60) / 2),
    top: 6,
  });

  menu.on(SelectRenderableEvents.ITEM_SELECTED, async (index: number) => {
    state.selectedSpecies = (index + 1) as SpeciesValue;
    state.screen = "menu";
    await renderMenu();
  });

  renderer.root.add(menu);
  menu.focus();

  const handleEscape = async (key: KeyEvent) => {
    if (key.name === "escape") {
      renderer.keyInput.off("keypress", handleEscape);
      state.screen = "menu";
      await renderMenu();
    }
  };
  renderer.keyInput.on("keypress", handleEscape);
}

async function renderModeSelection(): Promise<void> {
  clearScreen();

  const header = Box(
    { id: getNextId(), flexDirection: "column", alignItems: "center", width: "100%", marginBottom: 2 },
    Text({ content: "Select Mode", fg: "#9D4EDD", attributes: TextAttributes.BOLD }),
    Text({ content: "Press Enter to select, Escape to go back", fg: "#666666", attributes: TextAttributes.DIM })
  );
  renderer.root.add(header);

  const modeNames: ModeName[] = ["IONIAN", "DORIAN", "PHRYGIAN", "LYDIAN", "MIXOLYDIAN", "AEOLIAN", "LOCRIAN"];
  const modeOptions = modeNames.map((name) => ({
    name: Mode[name].name,
    description: `Intervals: ${Mode[name].intervals.join(", ")}`,
  }));

  const menuId = getNextId();
  const menu = new SelectRenderable(renderer, {
    id: menuId,
    width: 50,
    height: 10,
    options: modeOptions,
    position: "absolute",
    left: Math.floor((process.stdout.columns - 50) / 2),
    top: 6,
  });

  menu.on(SelectRenderableEvents.ITEM_SELECTED, async (index: number) => {
    const selectedMode = modeNames[index];
    if (selectedMode) state.selectedMode = selectedMode;
    state.screen = "menu";
    await renderMenu();
  });

  renderer.root.add(menu);
  menu.focus();

  const handleEscape = async (key: KeyEvent) => {
    if (key.name === "escape") {
      renderer.keyInput.off("keypress", handleEscape);
      state.screen = "menu";
      await renderMenu();
    }
  };
  renderer.keyInput.on("keypress", handleEscape);
}

async function renderCantusFirmusSelection(): Promise<void> {
  clearScreen();

  const header = Box(
    { id: getNextId(), flexDirection: "column", alignItems: "center", width: "100%", marginBottom: 2 },
    Text({ content: "Select Cantus Firmus", fg: "#9D4EDD", attributes: TextAttributes.BOLD }),
    Text({ content: "Choose a melody to generate counterpoint against", fg: "#666666", attributes: TextAttributes.DIM })
  );
  renderer.root.add(header);

  const cfOptions = CANTUS_FIRMUS_PRESETS.map((cf) => ({
    name: cf.name,
    description: cf.pitches.map(pitchToNoteName).join(" → "),
  }));

  const menuId = getNextId();
  const menu = new SelectRenderable(renderer, {
    id: menuId,
    width: 70,
    height: 8,
    options: cfOptions,
    position: "absolute",
    left: Math.floor((process.stdout.columns - 70) / 2),
    top: 6,
  });

  menu.on(SelectRenderableEvents.ITEM_SELECTED, async (index: number) => {
    const preset = CANTUS_FIRMUS_PRESETS[index];
    if (!preset) return;
    state.cantusFirmus = createCantusFirmusFromPitches(preset.pitches);
    state.selectedMode = preset.mode;
    state.screen = "generating";
    await renderGenerating();
  });

  renderer.root.add(menu);
  menu.focus();

  const handleEscape = async (key: KeyEvent) => {
    if (key.name === "escape") {
      renderer.keyInput.off("keypress", handleEscape);
      state.screen = "menu";
      await renderMenu();
    }
  };
  renderer.keyInput.on("keypress", handleEscape);
}

async function renderGenerating(): Promise<void> {
  clearScreen();

  const container = Box(
    { id: getNextId(), flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1 },
    Text({ content: "Generating Counterpoint...", fg: "#9D4EDD", attributes: TextAttributes.BOLD }),
    Text({ content: `Species: ${getSpeciesName(state.selectedSpecies)}`, fg: "#E0AAFF" }),
    Text({ content: `Mode: ${Mode[state.selectedMode].name}`, fg: "#E0AAFF" }),
    Box({ height: 2 }),
    Text({ content: `Generation: ${state.generationProgress}/50`, fg: "#FFFFFF" }),
    Text({ content: `Best Fitness: ${(state.bestFitness * 100).toFixed(1)}%`, fg: "#00FF00" })
  );

  renderer.root.add(container);

  await new Promise<void>((resolve) => setTimeout(resolve, 100));

  state.counterpoint = generateCounterpoint(state.cantusFirmus, state.selectedSpecies, Mode[state.selectedMode], {
    populationSize: 50,
    maxGenerations: 30,
    mutationRate: 0.1,
    onProgress: (generation, bestFitness) => {
      state.generationProgress = generation;
      state.bestFitness = bestFitness;
    },
  });

  state.screen = "result";
  await renderResult();
}


import { exportToMidi } from "./midi";
import { spawn } from "child_process";

// ... existing imports ...

// Helper function for playback
async function playMidi(filename: string): Promise<void> {
  // Use afplay on macOS (Darwin), or check for aplay/other on Linux
  // The environment says 'darwin', so afplay is safe.
  const player = "afplay"; 
  try {
    const child = spawn(player, [filename]);
    child.on("error", (err) => {
        // We can't easily log to console in TUI, but maybe we can show a status
    });
  } catch (e) {
      // Ignore errors for now
  }
}

// ... existing code ...

async function playMidi(filename: string): Promise<void> {
  const logError = async (msg: string) => {
      await Bun.write("debug.log", `[${new Date().toISOString()}] ${msg}\n`, { append: true });
  };

  const player = "swift";
  const args = ["play_midi.swift", filename];
  
  await logError(`Attempting to play ${filename} with ${player} ${args.join(" ")}`);

  try {
    const child = spawn(player, args);
    
    child.stdout.on("data", (data) => logError(`STDOUT: ${data}`));
    child.stderr.on("data", (data) => logError(`STDERR: ${data}`));
    
    child.on("error", (err) => {
        logError(`Spawn Error: ${err.message}`);
    });
    
    child.on("exit", (code) => {
        logError(`Process exited with code ${code}`);
    });

  } catch (e) {
      if (e instanceof Error) {
        await logError(`Catch Error: ${e.message}`);
      }
  }
}

async function renderResult(): Promise<void> {
  clearScreen();

  const container = Box(
    { id: getNextId(), flexDirection: "column", alignItems: "center", width: "100%", padding: 2 },
    Text({ content: "Generated Counterpoint", fg: "#9D4EDD", attributes: TextAttributes.BOLD }),
    Box({ height: 1 }),
    Text({ content: `Species: ${getSpeciesName(state.selectedSpecies)} | Mode: ${Mode[state.selectedMode].name}`, fg: "#E0AAFF" }),
    Box({ height: 2 })
  );

  renderer.root.add(container);

  const cfDisplay = Box(
    { id: getNextId(), flexDirection: "column", position: "absolute", left: 4, top: 8 },
    Text({ content: "Cantus Firmus:", fg: "#FFAA00", attributes: TextAttributes.BOLD }),
    Text({ content: state.cantusFirmus.map((n) => pitchToNoteName(n.pitch)).join("  "), fg: "#FFFFFF" })
  );

  renderer.root.add(cfDisplay);

  const cpDisplay = Box(
    { id: getNextId(), flexDirection: "column", position: "absolute", left: 4, top: 12 },
    Text({ content: "Counterpoint:", fg: "#00AAFF", attributes: TextAttributes.BOLD }),
    Text({ content: state.counterpoint.map((n) => pitchToNoteName(n.pitch)).join("  "), fg: "#FFFFFF" })
  );

  renderer.root.add(cpDisplay);

  const allPitches = [...state.cantusFirmus, ...state.counterpoint].map((n) => n.pitch);
  const minPitch = Math.min(...allPitches);
  const maxPitch = Math.max(...allPitches);
  const range = maxPitch - minPitch || 1;

  const maxLen = Math.max(state.cantusFirmus.length, state.counterpoint.length);
  for (let i = 0; i < maxLen; i++) {
    const cfNote = state.cantusFirmus[i];
    if (cfNote) {
      const cfY = Math.round(((maxPitch - cfNote.pitch) / range) * 8);
      renderer.root.add(
        Text({
          id: getNextId(),
          content: "●",
          fg: "#FFAA00",
          position: "absolute",
          left: 4 + i * 6,
          top: 18 + cfY,
        })
      );
    }

    const cpNote = state.counterpoint[i];
    if (cpNote) {
      const cpY = Math.round(((maxPitch - cpNote.pitch) / range) * 8);
      renderer.root.add(
        Text({
          id: getNextId(),
          content: "○",
          fg: "#00AAFF",
          position: "absolute",
          left: 4 + i * 6,
          top: 18 + cpY,
        })
      );
    }
  }

  const statusId = getNextId();
  const statusText = Text({ content: "", fg: "#00FF00", position: "absolute", left: 4, bottom: 4 });
  renderer.root.add(statusText);

  const footer = Box(
    { id: getNextId(), position: "absolute", left: 4, bottom: 2 },
    Text({ content: "Press [Enter] to return, [R] Retry, [E] Export MIDI, [P] Play Audio", fg: "#666666", attributes: TextAttributes.DIM })
  );
  renderer.root.add(footer);

  const handleKey = async (key: KeyEvent) => {
    if (key.name === "return" || key.name === "escape") {
      renderer.keyInput.off("keypress", handleKey);
      state.screen = "menu";
      await renderMenu();
    } else if (key.name === "r" || key.name === "R") {
      renderer.keyInput.off("keypress", handleKey);
      state.screen = "generating";
      await renderGenerating();
    } else if (key.name === "e" || key.name === "E") {
        const filename = `counterpoint_${Date.now()}.mid`;
        await exportToMidi(state.cantusFirmus, state.counterpoint, filename);
        
        try {
            renderer.root.remove(statusId);
            renderer.root.add(Text({ id: statusId, content: `Exported to ${filename}!`, fg: "#00FF00", position: "absolute", left: 4, bottom: 4 }));
        } catch {}
    } else if (key.name === "p" || key.name === "P") {
        const tempFile = `temp_playback_${Date.now()}.mid`;
        await exportToMidi(state.cantusFirmus, state.counterpoint, tempFile);
        
        try {
            renderer.root.remove(statusId);
            renderer.root.add(Text({ id: statusId, content: `Playing...`, fg: "#00FF00", position: "absolute", left: 4, bottom: 4 }));
        } catch {}

        await playMidi(tempFile);
    }
  };
  renderer.keyInput.on("keypress", handleKey);
}

async function main(): Promise<void> {
  renderer = await createCliRenderer({ exitOnCtrlC: true });

  await renderMenu();

  renderer.keyInput.on("keypress", (key: KeyEvent) => {
    if (key.ctrl && key.name === "c") {
      process.exit(0);
    }
  });
}

main().catch(console.error);
