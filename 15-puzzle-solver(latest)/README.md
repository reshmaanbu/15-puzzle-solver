# 15 Puzzle Solver

This is an interactive 15 Puzzle game with an A* algorithm solver. The 15 puzzle is a sliding puzzle that consists of a 4×4 grid with 15 numbered tiles and one empty space. The goal is to arrange the tiles in numerical order.

## Features

- Interactive 15 puzzle game
- Shuffle functionality to randomize the puzzle
- A* algorithm solver that finds the optimal solution
- Step-by-step solution visualization
- Move counter and status display

## How to Use

1. Open `index.html` in a web browser
2. Use the following controls:
   - **Shuffle**: Randomizes the puzzle
   - **Solve**: Uses the A* algorithm to find and visualize the solution
   - **Reset**: Resets the puzzle to its solved state

## A* Algorithm Implementation

The solver uses the A* algorithm with Manhattan distance heuristic to find the optimal solution path. The implementation includes:

- Priority queue for the open set
- Closed set to avoid revisiting states
- Manhattan distance heuristic to estimate the cost to reach the goal
- Step-by-step solution visualization

## Technologies Used

- HTML
- CSS
- JavaScript (Vanilla JS, no dependencies)
