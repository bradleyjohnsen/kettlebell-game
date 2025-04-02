# Kettlebell Game

A physics-based platformer inspired by "Getting Over It," where you control a character wielding a kettlebell to climb a junk pile.

Play the game online: [https://bradleyjohnsen.github.io/kettlebell-game/](https://bradleyjohnsen.github.io/kettlebell-game/)

## Game Concept

In Kettlebell Game, you control a character who uses a kettlebell to propel themselves up a pile of junk. The core mechanic is a "kettlebell clean jump" - you charge power (0-100%) and then release to leap in a frog-like motion. Direction is controlled by input (hold left or right), and the power of your jump depends on how long you charge.

## How to Play

1. Open `index.html` in a web browser
2. Controls:
   - Hold Left Arrow (or A) to charge a jump to the left
   - Hold Right Arrow (or D) to charge a jump to the right
   - Release the key to perform the jump
   - Press R to reset to your last checkpoint
   - Press Space to restart after victory

## Game Mechanics

- **Charging**: Hold left or right to charge your jump. The longer you hold, the more powerful the jump.
- **Jumping**: Release the key to jump in the charged direction. A fully charged jump launches you far and high.
- **Physics**: The game features realistic physics with gravity, friction, and bounce effects.
- **Checkpoints**: When you land on a high platform, your checkpoint is automatically updated.
- **Goal**: Reach the golden platform at the top right of the level to win.

## Development

This game is built using HTML5 Canvas and JavaScript. The code structure includes:
- Physics simulation
- Input handling
- Collision detection
- Rendering
- Game state management

## Future Enhancements

- Multiple levels with increasing difficulty
- Sound effects and music
- More detailed graphics and animations
- Additional mechanics like swinging or grabbing
