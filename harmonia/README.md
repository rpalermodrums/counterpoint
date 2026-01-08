# Harmonia (CLI)

Harmonia is an interactive Terminal User Interface (TUI) application for generating and exploring musical counterpoint. It uses a sophisticated algorithmic approach to create counterpoint melodies against a Cantus Firmus, adhering to the rules of various species counterpoint.

## Features

-   **Interactive TUI**: Navigate menus, select options, and view results directly in your terminal.
-   **Multiple Species**: Support for First through Fifth (Florid) species counterpoint.
-   **Modal System**: Generate music in various modes (Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian).
-   **Preset Cantus Firmus**: Choose from a collection of classic Cantus Firmus melodies to practice with.
-   **Visual Graph**: View the generated counterpoint and Cantus Firmus on a pitch-time graph.
-   **MIDI Export**: Save your creations to standard MIDI files.
-   **Instant Playback**: Listen to your generated counterpoint immediately using the built-in player.

## Prerequisites

-   [Bun](https://bun.sh/) (v1.0.0 or later recommended)
-   **macOS**: Playback requires no additional software (uses native AVFoundation).


## Installation

1.  Navigate to the `harmonia` directory:
    ```bash
    cd harmonia
    ```

2.  Install dependencies:
    ```bash
    bun install
    ```

## Usage

Start the application in development mode:

```bash
bun dev
```

### Navigation

-   **Arrow Keys**: Navigate menus.
-   **Enter**: Select an option.
-   **Escape**: Go back / Return to main menu.

### Workflow

1.  **Select Species**: Choose the strictness/style of counterpoint (e.g., First Species is note-for-note).
2.  **Select Mode**: Choose the musical mode (scale) for the composition.
3.  **Generate Counterpoint**:
    -   Select "Generate Counterpoint" from the main menu.
    -   Choose a Cantus Firmus (melody base).
    -   Watch the generation process (evolutionary algorithm + optimization).
    -   View the result.

### Result Actions

Once generation is complete:

-   **[P] Play**: Listen to the generated counterpoint.
-   **[E] Export**: Save the result to a MIDI file (e.g., `counterpoint_123456789.mid`).
-   **[Enter]**: Return to the main menu to start over.

## Technical Details

Harmonia is built with:
-   **TypeScript**: For type-safe application logic.
-   **@opentui/core**: For rendering the terminal user interface.
-   **Bun**: For fast runtime execution and package management.

## Development

The project structure:
-   `src/index.ts`: Main entry point and UI logic.
-   `src/generator.ts`: Core counterpoint generation algorithm.
-   `src/rules.ts`: Implementation of species counterpoint rules.
-   `src/midi.ts`: MIDI encoding logic.

To extend the application (e.g., add new rules or UI features):
1.  Modify the source files in `src/`.
2.  The application will auto-reload if running with `bun dev`.
