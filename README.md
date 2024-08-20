# Harmonia: Advanced Counterpoint Generation System

*"Music is the arithmetic of sounds as optics is the geometry of light." - Claude Debussy*


## Overview

Harmonia is a sophisticated AI-powered tool designed to generate musically valid and aesthetically pleasing counterpoint melodies. By leveraging computational techniques, it explores the intricate balance between mathematical precision and artistic expression in music composition.

## Features

- Generate counterpoint for all five species
- Support for various modes (Ionian, Dorian, Phrygian, etc.)
- Intelligent harmonic and melodic analysis
- Customizable rule sets for experimentation
- MIDI export functionality

## Technical Architecture

Harmonia employs a combination of graph theory, dynamic programming, and genetic algorithms to create counterpoint that adheres to classical rules while maintaining musical interest. The system's core components include:

1. **Graph-based Representation**: Models potential note combinations as a weighted, directed graph.
2. **Dynamic Programming**: Efficiently finds optimal paths through the counterpoint graph.
3. **Genetic Algorithms**: Evolves populations of counterpoint melodies to explore creative solutions.
4. **Rule-based Validation**: Implements comprehensive checks for adherence to counterpoint rules.

### Key Components

- `CounterpointGraph`: Represents the space of possible counterpoint melodies.
- `CounterpointGenerator`: Implements various generation strategies.
- `SpeciesValidator`: Ensures adherence to rules for each counterpoint species.
- `ModeHandler`: Manages scale degrees and intervals for different modes.
- `FitnessEvaluator`: Scores generated counterpoint based on musical criteria.

## Aesthetic Philosophy

Harmonia serves as a digital atelier for musical exploration, aiming to capture the essence of counterpoint while pushing the boundaries of AI-assisted composition. The project draws inspiration from:

- The mathematical precision of J.S. Bach
- The modal explorations of Palestrina
- The algorithmic music of Iannis Xenakis

## To be continued...