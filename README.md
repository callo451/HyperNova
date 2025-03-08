# HyperNova - Sci-Fi Battle Royale Game

A browser-based multiplayer FPS game built with Three.js, designed for sci-fi battle royale gameplay.

## Features

### Core Gameplay
- **Three.js 3D Environment**: Immersive sci-fi world with dynamic lighting and effects
- **Player Movement**: WASD movement with mouse look, jumping, climbing, and sprinting
- **Dynamic Storm System**: Shrinking play area with timer and damage mechanics
- **Weapon System**: Multiple weapons with different characteristics and shooting mechanics
- **Asset Loading**: Dynamic loading of GLB models and textures from the public directory
- **Advanced Collision Detection**: Solid surfaces with accurate player collision

### Futuristic City Map
- **City Grid Layout**: 5x5 grid of city blocks connected by wide roads with glowing markings
- **Diverse Buildings**: 
  - Skyscrapers (50-100 units tall)
  - Office buildings (30-50 units tall)
  - Residential structures (20-40 units tall)
- **Building Features**:
  - Glowing windows and entrances
  - Internal staircases for roof access
  - Solid collision detection for all building parts
- **Central Plaza**:
  - Large circular gathering area
  - Central monument with floating rings
  - Decorative benches and light poles
  - Energy pillars with particle effects
- **Energy Ladders**: Glowing climbing systems with 8 steps per ladder
- **Jumping Blocks**: Strategic platforms of varying heights (1-2.5 units)
- **Boundary System**: Semi-transparent energy walls marking the playable area

### User Interface
- **Health & Armor System**: Visual health bar with armor protection
- **Ammo Counter**: Dynamic ammo display for current weapon
- **Inventory System**: Quick weapon switching with 3 slots
- **Storm Timer**: Countdown display for storm shrinking phases
- **Mini-map**:
  - Real-time player position and rotation
  - Storm circle visualization
  - Building locations and road layout
  - Power-up spot indicators
- **Crosshair**: Dynamic aiming reticle

### Visual Effects
- **Weapon Effects**: 
  - Muzzle flash
  - Impact effects
  - Hit detection
- **Environment**: 
  - Space-themed skybox with stars
  - Glowing energy surfaces with emission
  - Atmospheric fog and lighting
  - Ground details with proper textures
- **Dynamic Lighting**: 
  - Real-time shadows
  - Emissive materials for buildings and objects
  - Point lights for city atmosphere
  - Building windows that emit light

### Gameplay Systems
- **Storm Mechanics**:
  - Dynamic shrinking safe zone
  - Damage to players outside the safe area
  - Visual indicators on mini-map and in-world
  - Timer countdown for phase changes
- **Climbing System**:
  - Energy ladders for vertical movement
  - Smooth climbing mechanics with proper collision
  - Automatic snapping to climbing surfaces
- **Enhanced Movement**:
  - Improved jumping with proper collision detection
  - Smooth player movement with acceleration and deceleration
  - Building navigation with stairs and platforms

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/hypernova.git
   cd hypernova
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Game Controls

- **W, A, S, D**: Movement
- **Mouse**: Look around
- **Left Mouse Button**: Shoot
- **Space**: Jump
- **W (near ladder)**: Climb up ladder
- **S (while climbing)**: Climb down ladder
- **C**: Toggle crouch
- **Shift**: Sprint
- **1, 2, 3**: Switch weapons

## Project Structure

```
hypernova/
├── public/               # Static assets
│   ├── models/          # 3D models (GLB)
│   │   └── weapons/     # Weapon models
│   └── textures/        # Texture files (JPG/PNG)
├── src/                 # Source code
│   ├── components/      # UI components
│   │   ├── UI.ts        # Main HUD interface
│   │   └── MiniMap.ts   # Mini-map implementation
│   └── game/            # Game logic
│       ├── main.ts      # Main game initialization
│       ├── Player.ts    # Player mechanics
│       ├── Weapon.ts    # Weapon system
│       ├── World.ts     # World environment and city generation
│       ├── Storm.ts     # Storm system mechanics
│       ├── AssetLoader.ts # Asset management
│       └── SkyBox.ts    # Skybox implementation
├── index.html           # Main HTML file
├── styles.css           # Global styles
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
└── vite.config.js       # Vite configuration
```

## Adding Custom Assets

### Models

1. Place your GLB models in the `public/models/` directory
2. Load them in your code using the AssetLoader:
   ```typescript
   const model = await assetLoader.loadModel('/models/your-model.glb');
   ```

### Textures

1. Place your texture files (JPG/PNG) in the `public/textures/` directory
2. Load them in your code using the AssetLoader:
   ```typescript
   const texture = await assetLoader.loadTexture('/textures/your-texture.jpg');
   ```

## Futuristic City Features

### City Grid
- 5x5 grid of city blocks
- 10-unit wide roads with glowing markings
- Distinct building zones with varied architecture

### Buildings
- Skyscrapers (50-100 units tall)
  - Modern glass facades with energy highlights
  - Multiple floors with interior access
  - Rooftop access points
- Office buildings (30-50 units tall)
  - Corporate design with wider footprints
  - Geometric patterns and energy motifs
- Residential structures (20-40 units tall)
  - Smaller, modular designs
  - More entrances and accessible layouts

### Central Plaza
- Large circular gathering area (80 units diameter)
- Central monument with floating energy rings
- Decorative benches for player positioning
- Energy pillar focal points emitting light

### Navigation Features
- Energy ladders with 8 glowing steps for climbing
- Jumping blocks of varying heights (1-2.5 units)
- Solid stairways inside buildings
- Rooftop access from building interiors

### Storm System
- Dynamic circle that shrinks over time
- Visual indicators on mini-map
- In-world boundary visualization
- Damage system for players outside the safe zone
- Timer display for phase changes

## Development

This project uses:
- **TypeScript** for type-safe code
- **Three.js** for 3D rendering
- **Vite** for fast development and building

### Recent Improvements
- Added dynamic storm system with timer and damage mechanics
- Redesigned the world as a futuristic city with buildings and roads
- Implemented advanced collision detection for all objects
- Added climbing mechanics for energy ladders
- Created jumping blocks and platforms for vertical gameplay
- Enhanced lighting with emissive materials and shadow mapping
- Improved ground and boundary collision
- Fixed rendering issues for better performance

### Planned Features
- Multiplayer networking
- Additional weapons
- More city variations and building types
- Advanced physics
- Sound effects
- Character customization

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js community for the excellent 3D library
- Various open-source projects that inspired this game
- Contributors and testers 