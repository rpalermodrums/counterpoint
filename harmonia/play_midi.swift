import AVFoundation
import Foundation

guard CommandLine.arguments.count > 1 else {
    print("Usage: swift play_midi.swift <midi_file>")
    exit(1)
}

let filePath = CommandLine.arguments[1]
let fileURL = URL(fileURLWithPath: filePath)

do {
    // Create a bank from the system default
    let player = try AVMIDIPlayer(contentsOf: fileURL, soundBankURL: nil)
    
    player.prepareToPlay()
    print("Playing \(filePath)...")
    
    player.play {
        print("Playback finished.")
        exit(0)
    }
    
    // Keep the script running while playing
    RunLoop.main.run()
    
} catch {
    print("Error playing MIDI file: \(error)")
    exit(1)
}
