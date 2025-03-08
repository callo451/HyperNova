import * as THREE from 'three';
import { AssetLoader } from './AssetLoader';
import { LootChest } from './LootChest';

export class World {
  private scene: THREE.Scene;
  private assetLoader: AssetLoader;
  private objects: THREE.Object3D[] = [];
  private mapSize: number = 200; // Map is 200x200 units
  private boundaryWalls: THREE.Mesh[] = [];
  private collidableObjects: THREE.Object3D[] = [];
  private cityBlocks: number = 5; // 5x5 grid of city blocks
  private blockSize: number = 40; // Each block is 40 units
  private roadWidth: number = 10; // Roads are 10 units wide
  private blinkingLights: {light: THREE.PointLight, phase: number}[] = [];
  private plazaLights: {light: THREE.PointLight, baseIntensity: number, phase: number, radius: number}[] = [];
  private particleSystems: {system: THREE.Points, positions: Float32Array, centerX: number, centerZ: number, height: number}[] = [];
  private floatingRings: {ring: THREE.Mesh, height: number, baseY: number, rotationSpeed: number, oscillationSpeed: number, oscillationAmplitude: number, phase: number}[] = [];
  private energyPillars: {core: THREE.Mesh, particles: THREE.Points, positions: Float32Array, centerX: number, centerZ: number, height: number}[] = [];
  private floatingPlatforms: {platform: THREE.Mesh, glow: THREE.Mesh, light: THREE.PointLight, baseHeight: number, oscillationSpeed: number, oscillationAmplitude: number, phase: number}[] = [];
  private terminalScreens: {screen: THREE.Mesh, phase: number}[] = [];
  private holographicDisplays: {hologram: THREE.Mesh, particles: THREE.Points, positions: Float32Array, centerX: number, centerY: number, centerZ: number, radius: number}[] = [];
  
  constructor(scene: THREE.Scene, assetLoader: AssetLoader) {
    this.scene = scene;
    this.assetLoader = assetLoader;
  }
  
  public async init(): Promise<void> {
    // Initialize the world
    this.initWorld();
    
    // Load any necessary textures
    const groundTexture = await this.assetLoader.loadTexture('/textures/ground.jpg');
    const roadTexture = await this.assetLoader.loadTexture('/textures/road.jpg');
    
    // Apply textures
    if (groundTexture) {
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(20, 20);
    }
    
    if (roadTexture) {
        roadTexture.wrapS = THREE.RepeatWrapping;
        roadTexture.wrapT = THREE.RepeatWrapping;
        roadTexture.repeat.set(5, 5);
    }
  }
  
  private initWorld(): void {
    // Create the ground with roads
    this.createGround();
    
    // Create city grid
    this.createCityGrid();
    
    // Create boundary
    this.createBoundary();
    
    // Add ambient details
    this.createAmbientDetails();
    
    // Add power-up locations
    this.createPowerUpLocations();

    // Set up basic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }
  
  private createGround(): void {
    // Create main ground with larger size and proper collision
    const groundGeometry = new THREE.BoxGeometry(this.mapSize, 1, this.mapSize);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.5; // Center the ground so the surface is at y=0
    ground.receiveShadow = true;
    ground.castShadow = false;
    this.scene.add(ground);
    this.addToCollidable(ground);

    // Create roads slightly above ground
    this.createRoads();
  }
  
  private createRoads(): void {
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.9,
      metalness: 0.1
    });

    const roadMarkingMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: 0x666666,
      emissiveIntensity: 0.5
    });

    const roadGlowMaterial = new THREE.MeshStandardMaterial({
      color: 0x44aaff, 
      emissive: 0x44aaff,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.7
    });

    // Create grid of roads
    for (let i = 0; i <= this.cityBlocks; i++) {
      // Horizontal roads
      const horizontalRoad = new THREE.Mesh(
        new THREE.PlaneGeometry(this.mapSize, this.roadWidth),
        roadMaterial
      );
      horizontalRoad.rotation.x = -Math.PI / 2;
      horizontalRoad.position.set(
        0,
        0.1, // Slightly above ground
        -this.mapSize/2 + i * (this.mapSize/this.cityBlocks)
      );
      this.scene.add(horizontalRoad);

      // Vertical roads
      const verticalRoad = new THREE.Mesh(
        new THREE.PlaneGeometry(this.roadWidth, this.mapSize),
        roadMaterial
      );
      verticalRoad.rotation.x = -Math.PI / 2;
      verticalRoad.position.set(
        -this.mapSize/2 + i * (this.mapSize/this.cityBlocks),
        0.1,
        0
      );
      this.scene.add(verticalRoad);

      // Add road markings and glowing lanes
      this.createRoadMarkings(horizontalRoad.position, true);
      this.createRoadMarkings(verticalRoad.position, false);
    }

    // Add glowing lanes along the roads
    for (let i = 0; i <= this.cityBlocks; i++) {
      // Horizontal glowing lanes
      const horizontalLaneLeft = new THREE.Mesh(
        new THREE.PlaneGeometry(this.mapSize, 0.5),
        roadGlowMaterial
      );
      horizontalLaneLeft.rotation.x = -Math.PI / 2;
      horizontalLaneLeft.position.set(
        0,
        0.15,
        -this.mapSize/2 + i * (this.mapSize/this.cityBlocks) - this.roadWidth/2 + 1
      );
      this.scene.add(horizontalLaneLeft);

      const horizontalLaneRight = new THREE.Mesh(
        new THREE.PlaneGeometry(this.mapSize, 0.5),
        roadGlowMaterial
      );
      horizontalLaneRight.rotation.x = -Math.PI / 2;
      horizontalLaneRight.position.set(
        0,
        0.15,
        -this.mapSize/2 + i * (this.mapSize/this.cityBlocks) + this.roadWidth/2 - 1
      );
      this.scene.add(horizontalLaneRight);

      // Vertical glowing lanes
      const verticalLaneLeft = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, this.mapSize),
        roadGlowMaterial
      );
      verticalLaneLeft.rotation.x = -Math.PI / 2;
      verticalLaneLeft.position.set(
        -this.mapSize/2 + i * (this.mapSize/this.cityBlocks) - this.roadWidth/2 + 1,
        0.15,
        0
      );
      this.scene.add(verticalLaneLeft);

      const verticalLaneRight = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, this.mapSize),
        roadGlowMaterial
      );
      verticalLaneRight.rotation.x = -Math.PI / 2;
      verticalLaneRight.position.set(
        -this.mapSize/2 + i * (this.mapSize/this.cityBlocks) + this.roadWidth/2 - 1,
        0.15,
        0
      );
      this.scene.add(verticalLaneRight);
    }

    // Add crossroad details at intersections
    for (let x = 0; x <= this.cityBlocks; x++) {
      for (let z = 0; z <= this.cityBlocks; z++) {
        const crossroadX = -this.mapSize/2 + x * (this.mapSize/this.cityBlocks);
        const crossroadZ = -this.mapSize/2 + z * (this.mapSize/this.cityBlocks);

        // Add a circular marking at intersection
        const crossroadMarking = new THREE.Mesh(
          new THREE.CircleGeometry(3, 16),
          roadMarkingMaterial
        );
        crossroadMarking.rotation.x = -Math.PI / 2;
        crossroadMarking.position.set(crossroadX, 0.12, crossroadZ);
        this.scene.add(crossroadMarking);

        // Add a glowing point light at each intersection
        const intersectionLight = new THREE.PointLight(0x44aaff, 0.6, 8);
        intersectionLight.position.set(crossroadX, 0.5, crossroadZ);
        this.scene.add(intersectionLight);
      }
    }
  }
  
  private createRoadMarkings(position: THREE.Vector3, isHorizontal: boolean): void {
    const markingMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: 0x666666
    });

    const markingSize = 2;
    const markingSpacing = 5;
    const numMarkings = Math.floor(this.mapSize / markingSpacing);

    for (let i = 0; i < numMarkings; i++) {
      const marking = new THREE.Mesh(
        new THREE.PlaneGeometry(markingSize, 0.5),
        markingMaterial
      );
      marking.rotation.x = -Math.PI / 2;
      
      if (isHorizontal) {
        marking.position.set(
          -this.mapSize/2 + i * markingSpacing,
          0.2,
          position.z
        );
      } else {
        marking.rotation.z = Math.PI / 2;
        marking.position.set(
          position.x,
          0.2,
          -this.mapSize/2 + i * markingSpacing
        );
      }
      this.scene.add(marking);
    }
  }
  
  private createCityGrid(): void {
    for (let x = 0; x < this.cityBlocks; x++) {
      for (let z = 0; z < this.cityBlocks; z++) {
        // Skip center block for central plaza
        if (x === Math.floor(this.cityBlocks/2) && z === Math.floor(this.cityBlocks/2)) {
          this.createCentralPlaza(x, z);
          continue;
        }

        const blockX = -this.mapSize/2 + (x + 0.5) * (this.mapSize/this.cityBlocks);
        const blockZ = -this.mapSize/2 + (z + 0.5) * (this.mapSize/this.cityBlocks);
        
        // Create buildings in each block
        this.createCityBlock(blockX, blockZ);
      }
    }
  }
  
  private createCityBlock(x: number, z: number): void {
    const buildingTypes = ['skyscraper', 'office', 'residential'];
    const buildingCount = 2 + Math.floor(Math.random() * 2); // 2-3 buildings per block

    for (let i = 0; i < buildingCount; i++) {
      const type = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
      const offsetX = (Math.random() - 0.5) * (this.blockSize - this.roadWidth - 10);
      const offsetZ = (Math.random() - 0.5) * (this.blockSize - this.roadWidth - 10);
      
      this.createBuilding(
        x + offsetX,
        z + offsetZ,
        type
      );
    }
  }
  
  private createBuilding(x: number, z: number, type: string): void {
    const buildingGroup = new THREE.Group();
    let height: number;
    let width: number;
    let depth: number;
    let floors: number;
    let hasPodium: boolean = Math.random() > 0.5;
    let hasAntennas: boolean = Math.random() > 0.7;
    let baseColor: THREE.Color;
    let emissiveColor: THREE.Color;
    let emissiveIntensity: number;

    switch(type) {
      case 'skyscraper':
        height = 60 + Math.random() * 40;
        width = 10 + Math.random() * 5;
        depth = 10 + Math.random() * 5;
        floors = Math.floor(height / 4);
        baseColor = new THREE.Color(Math.random() > 0.5 ? 0x3366ff : 0x66aaff);
        emissiveColor = new THREE.Color(0x001133);
        emissiveIntensity = 0.3;
        break;
      case 'office':
        height = 30 + Math.random() * 20;
        width = 15 + Math.random() * 10;
        depth = 15 + Math.random() * 10;
        floors = Math.floor(height / 3.5);
        baseColor = new THREE.Color(Math.random() > 0.5 ? 0x22ccaa : 0x2299aa);
        emissiveColor = new THREE.Color(0x005544);
        emissiveIntensity = 0.25;
        break;
      default: // residential
        height = 20 + Math.random() * 15;
        width = 12 + Math.random() * 8;
        depth = 12 + Math.random() * 8;
        floors = Math.floor(height / 3);
        baseColor = new THREE.Color(Math.random() > 0.5 ? 0xff6688 : 0xaa44cc);
        emissiveColor = new THREE.Color(0x330022);
        emissiveIntensity = 0.2;
    }

    // Create main building structure with multiple segments
    this.createBuildingStructure(
      buildingGroup, 
      height, 
      width, 
      depth, 
      floors, 
      hasPodium, 
      baseColor, 
      emissiveColor, 
      emissiveIntensity
    );

    // Add rooftop structures
    this.createRooftopStructures(buildingGroup, height, width, depth, hasAntennas);

    // Add windows (moved to a separate method)
    this.addBuildingWindows(buildingGroup, height, width, depth, floors);

    // Add entrance
    this.createBuildingEntrance(buildingGroup, width, depth);

    // Add stairs inside
    this.createBuildingStairs(buildingGroup, height, width, depth);

    // Add roof access
    this.createRoofAccess(buildingGroup, height, width, depth);

    // If it's tall enough, add a skybridge to nearby building (15% chance)
    if (height > 40 && Math.random() > 0.85) {
      this.createSkyBridge(buildingGroup, height, width, depth);
    }

    // Position and add to scene
    buildingGroup.position.set(x, 0, z);
    buildingGroup.castShadow = true;
    buildingGroup.receiveShadow = true;
    this.scene.add(buildingGroup);
    this.objects.push(buildingGroup);
  }
  
  private createBuildingStructure(
    buildingGroup: THREE.Group, 
    height: number, 
    width: number, 
    depth: number, 
    floors: number,
    hasPodium: boolean,
    baseColor: THREE.Color,
    emissiveColor: THREE.Color,
    emissiveIntensity: number
  ): void {
    // Create base/podium if applicable
    if (hasPodium) {
      const podiumHeight = 4;
      const podiumExtraSize = 4;
      
      const podiumGeometry = new THREE.BoxGeometry(
        width + podiumExtraSize, 
        podiumHeight, 
        depth + podiumExtraSize
      );
      
      const podiumMaterial = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.5,
        metalness: 0.7,
        emissive: emissiveColor,
        emissiveIntensity: emissiveIntensity * 0.8
      });
      
      const podium = new THREE.Mesh(podiumGeometry, podiumMaterial);
      podium.position.set(0, podiumHeight/2, 0);
      podium.castShadow = true;
      podium.receiveShadow = true;
      buildingGroup.add(podium);
      this.addToCollidable(podium);
      
      // Adjust main building position to sit on podium
      height -= podiumHeight;
    }

    // Create the main building with potential setbacks
    let currentHeight = hasPodium ? 4 : 0;
    let remainingHeight = height;
    let currentWidth = width;
    let currentDepth = depth;
    
    // Up to 3 sections with setbacks for taller buildings
    const sections = Math.min(3, 1 + Math.floor(floors / 10));
    
    for (let i = 0; i < sections; i++) {
      const sectionHeight = remainingHeight / (sections - i);
      
      const buildingGeometry = new THREE.BoxGeometry(
        currentWidth, 
        sectionHeight, 
        currentDepth
      );
      
      const buildingMaterial = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.3,
        metalness: 0.8,
        emissive: emissiveColor,
        emissiveIntensity: emissiveIntensity * (1 + i*0.1) // Higher sections glow more
      });
      
      const buildingSection = new THREE.Mesh(buildingGeometry, buildingMaterial);
      buildingSection.position.set(0, currentHeight + sectionHeight/2, 0);
      buildingSection.castShadow = true;
      buildingSection.receiveShadow = true;
      buildingGroup.add(buildingSection);
      this.addToCollidable(buildingSection);
      
      // Add facade details
      this.addBuildingFacadeDetails(
        buildingGroup, 
        currentWidth,
        currentDepth,
        sectionHeight,
        currentHeight,
        baseColor,
        emissiveColor
      );
      
      currentHeight += sectionHeight;
      remainingHeight -= sectionHeight;
      
      // Create setback for next section
      if (i < sections - 1) {
        currentWidth *= 0.8;
        currentDepth *= 0.8;
      }
    }
  }
  
  private addBuildingFacadeDetails(
    buildingGroup: THREE.Group,
    width: number,
    depth: number,
    height: number,
    baseHeight: number,
    baseColor: THREE.Color,
    emissiveColor: THREE.Color
  ): void {
    // Skip details for very small buildings
    if (height < 10) return;
    
    // Add vertical pillar details
    const pillarWidth = 0.3;
    const pillarDepth = 0.3;
    const pillarSpacing = 4;
    
    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: baseColor.clone().multiplyScalar(1.2), // Slightly lighter
      roughness: 0.2,
      metalness: 0.9,
      emissive: emissiveColor,
      emissiveIntensity: 0.4
    });
    
    // Front and back pillars
    for (let x = -width/2 + pillarWidth; x <= width/2 - pillarWidth; x += pillarSpacing) {
      // Front
      const frontPillar = new THREE.Mesh(
        new THREE.BoxGeometry(pillarWidth, height, pillarDepth),
        pillarMaterial
      );
      frontPillar.position.set(x, baseHeight + height/2, depth/2 + pillarDepth/2);
      buildingGroup.add(frontPillar);
      
      // Back
      const backPillar = new THREE.Mesh(
        new THREE.BoxGeometry(pillarWidth, height, pillarDepth),
        pillarMaterial
      );
      backPillar.position.set(x, baseHeight + height/2, -depth/2 - pillarDepth/2);
      buildingGroup.add(backPillar);
    }
    
    // Left and right pillars
    for (let z = -depth/2 + pillarWidth; z <= depth/2 - pillarWidth; z += pillarSpacing) {
      // Left
      const leftPillar = new THREE.Mesh(
        new THREE.BoxGeometry(pillarDepth, height, pillarWidth),
        pillarMaterial
      );
      leftPillar.position.set(-width/2 - pillarDepth/2, baseHeight + height/2, z);
      buildingGroup.add(leftPillar);
      
      // Right
      const rightPillar = new THREE.Mesh(
        new THREE.BoxGeometry(pillarDepth, height, pillarWidth),
        pillarMaterial
      );
      rightPillar.position.set(width/2 + pillarDepth/2, baseHeight + height/2, z);
      buildingGroup.add(rightPillar);
    }
    
    // Add horizontal band at top
    const bandHeight = 0.5;
    const bandMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 1.0,
      emissive: 0xaaaaff,
      emissiveIntensity: 0.8
    });
    
    const topBand = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.6, bandHeight, depth + 0.6),
      bandMaterial
    );
    topBand.position.set(0, baseHeight + height - bandHeight/2, 0);
    buildingGroup.add(topBand);
  }
  
  private createRooftopStructures(
    buildingGroup: THREE.Group, 
    height: number, 
    width: number, 
    depth: number,
    hasAntennas: boolean
  ): void {
    // Add mechanical room
    const mechanicalWidth = width * 0.4;
    const mechanicalDepth = depth * 0.4;
    const mechanicalHeight = 2;
    
    const mechanicalGeometry = new THREE.BoxGeometry(
      mechanicalWidth,
      mechanicalHeight,
      mechanicalDepth
    );
    
    const mechanicalMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.7,
      metalness: 0.3
    });
    
    const mechanical = new THREE.Mesh(
      mechanicalGeometry,
      mechanicalMaterial
    );
    
    mechanical.position.set(0, height + mechanicalHeight/2, 0);
    buildingGroup.add(mechanical);
    this.addToCollidable(mechanical);
    
    // Add antennas/spires if applicable
    if (hasAntennas) {
      const antennaCount = 1 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < antennaCount; i++) {
        const antennaHeight = 5 + Math.random() * 10;
        const antennaWidth = 0.2;
        
        const antennaGeometry = new THREE.CylinderGeometry(
          antennaWidth, antennaWidth, antennaHeight
        );
        
        const antennaMaterial = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          roughness: 0.3,
          metalness: 0.8,
          emissive: 0xff0000,
          emissiveIntensity: 0.5
        });
        
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        
        // Position randomly on the mechanical room
        const offsetX = (Math.random() - 0.5) * (mechanicalWidth * 0.7);
        const offsetZ = (Math.random() - 0.5) * (mechanicalDepth * 0.7);
        
        antenna.position.set(
          offsetX,
          height + mechanicalHeight + antennaHeight/2,
          offsetZ
        );
        
        buildingGroup.add(antenna);
        
        // Add blinking light at top
        const blinkingLight = new THREE.PointLight(0xff0000, 1, 10);
        blinkingLight.position.set(
          offsetX,
          height + mechanicalHeight + antennaHeight - 0.1,
          offsetZ
        );
        buildingGroup.add(blinkingLight);
        
        // Store this light for animation
        if (!this.blinkingLights) this.blinkingLights = [];
        this.blinkingLights.push({
          light: blinkingLight,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }
  
  private createSkyBridge(
    buildingGroup: THREE.Group,
    height: number,
    width: number,
    depth: number
  ): void {
    // Create a sky bridge at a random height between 1/3 and 2/3 of the building
    const bridgeHeight = height * (0.33 + Math.random() * 0.33);
    const bridgeWidth = 3;
    const bridgeDepth = 15; // Length of the bridge
    
    const bridgeGeometry = new THREE.BoxGeometry(
      bridgeWidth,
      3, // Bridge height
      bridgeDepth
    );
    
    const bridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x88aaff,
      transparent: true,
      opacity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x0033aa,
      emissiveIntensity: 0.4
    });
    
    const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    
    // Position the bridge extending from one of the four sides
    const side = Math.floor(Math.random() * 4);
    let bridgeX = 0;
    let bridgeZ = 0;
    let bridgeRotation = 0;
    
    switch(side) {
      case 0: // North
        bridgeZ = depth/2 + bridgeDepth/2;
        bridgeRotation = 0;
        break;
      case 1: // East
        bridgeX = width/2 + bridgeDepth/2;
        bridgeRotation = Math.PI/2;
        break;
      case 2: // South
        bridgeZ = -depth/2 - bridgeDepth/2;
        bridgeRotation = 0;
        break;
      case 3: // West
        bridgeX = -width/2 - bridgeDepth/2;
        bridgeRotation = Math.PI/2;
        break;
    }
    
    bridge.position.set(bridgeX, bridgeHeight, bridgeZ);
    bridge.rotation.y = bridgeRotation;
    buildingGroup.add(bridge);
    this.addToCollidable(bridge);
    
    // Add support beams
    const supportCount = 3;
    const supportMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.5,
      metalness: 0.8
    });
    
    for (let i = 0; i < supportCount; i++) {
      const supportGeometry = new THREE.BoxGeometry(
        0.5,
        2, 
        bridgeDepth * 0.8
      );
      
      const support = new THREE.Mesh(supportGeometry, supportMaterial);
      support.position.copy(bridge.position);
      
      // Adjust y position to be at the bottom of the bridge
      support.position.y -= 0.5;
      
      // Space supports evenly along the bridge
      const offset = (i - (supportCount-1)/2) * (bridgeDepth * 0.4);
      if (side === 0 || side === 2) {
        support.position.x += offset;
      } else {
        support.position.z += offset;
      }
      
      support.rotation.y = bridgeRotation;
      buildingGroup.add(support);
    }
    
    // Add glass railings
    const railingMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.4,
      roughness: 0,
      metalness: 1.0
    });
    
    const createRailing = (side: 'left' | 'right') => {
      const railingGeometry = new THREE.BoxGeometry(
        bridgeWidth + 0.2,
        1.5, 
        0.1
      );
      
      const railing = new THREE.Mesh(railingGeometry, railingMaterial);
      railing.position.copy(bridge.position);
      
      // Position on the appropriate side of the bridge
      if (side === 'left') {
        if (bridgeRotation === 0) {
          railing.position.z -= bridgeDepth/2 - 0.05;
        } else {
          railing.position.x -= bridgeDepth/2 - 0.05;
        }
      } else {
        if (bridgeRotation === 0) {
          railing.position.z += bridgeDepth/2 - 0.05;
        } else {
          railing.position.x += bridgeDepth/2 - 0.05;
        }
      }
      
      // Adjust y position to the top of the bridge
      railing.position.y += 0.75;
      
      railing.rotation.y = bridgeRotation;
      
      // For side railings, rotate them
      if (bridgeRotation === 0) {
        railing.rotation.y = Math.PI/2;
      }
      
      buildingGroup.add(railing);
    };
    
    createRailing('left');
    createRailing('right');
  }
  
  private createCentralPlaza(blockX: number, blockZ: number): void {
    const plazaSize = this.blockSize - this.roadWidth;
    const centerX = -this.mapSize/2 + (blockX + 0.5) * (this.mapSize/this.cityBlocks);
    const centerZ = -this.mapSize/2 + (blockZ + 0.5) * (this.mapSize/this.cityBlocks);
    
    // Create main plaza floor
    const plazaGeometry = new THREE.CircleGeometry(plazaSize/2, 32);
    const plazaMaterial = new THREE.MeshStandardMaterial({
      color: 0x334455,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x223344,
      emissiveIntensity: 0.2
    });
    
    const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(centerX, 0.1, centerZ);
    this.scene.add(plaza);
    
    // Add concentric rings to the floor with different materials
    const ringSizes = [plazaSize*0.4, plazaSize*0.3, plazaSize*0.2, plazaSize*0.1];
    const ringColors = [0x3366ff, 0x33aacc, 0x33ccaa, 0x33eebb];
    const ringEmissives = [0x002266, 0x002244, 0x004433, 0x003322];
    
    for (let i = 0; i < ringSizes.length; i++) {
      const ringGeometry = new THREE.RingGeometry(
        ringSizes[i] - 0.5, 
        ringSizes[i], 
        32
      );
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: ringColors[i],
        roughness: 0.2,
        metalness: 0.9,
        emissive: ringEmissives[i],
        emissiveIntensity: 0.6
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(centerX, 0.15, centerZ);
      this.scene.add(ring);
      
      // Add animated ring light
      const ringLight = new THREE.PointLight(
        new THREE.Color(ringColors[i]), 
        0.8, 
        ringSizes[i] * 2
      );
      ringLight.position.set(centerX, 0.5, centerZ);
      this.scene.add(ringLight);
      
      // Store for animation
      if (!this.plazaLights) this.plazaLights = [];
      this.plazaLights.push({
        light: ringLight,
        baseIntensity: 0.8,
        phase: i * (Math.PI / 2),
        radius: ringSizes[i]
      });
    }

    // Create a central monument
    this.createCentralMonument(centerX, centerZ);
    
    // Add decorative elements
    this.createPlazaDecorations(centerX, centerZ, plazaSize);
    
    // Add interactive terminals around the plaza
    this.createInteractiveTerminals(centerX, centerZ, plazaSize);
    
    // Add holographic display
    this.createHolographicDisplay(centerX, centerZ);
  }
  
  private createCentralMonument(x: number, z: number): void {
    // Base platform for the monument
    const baseDiameter = 10;
    const baseHeight = 1;
    const baseGeometry = new THREE.CylinderGeometry(
      baseDiameter/2, baseDiameter/2, baseHeight, 16
    );
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.3
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, baseHeight/2, z);
    this.scene.add(base);
    this.addToCollidable(base);
    
    // Central pillar
    const pillarHeight = 15;
    const pillarRadiusTop = 0.5;
    const pillarRadiusBottom = 1.5;
    const pillarGeometry = new THREE.CylinderGeometry(
      pillarRadiusTop, pillarRadiusBottom, pillarHeight, 8
    );
    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x444466,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x2233aa,
      emissiveIntensity: 0.4
    });
    
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.set(x, baseHeight + pillarHeight/2, z);
    this.scene.add(pillar);
    this.addToCollidable(pillar);
    
    // Energy beam emanating from the top
    const beamHeight = 20;
    const beamRadius = 0.3;
    const beamGeometry = new THREE.CylinderGeometry(
      beamRadius, beamRadius, beamHeight, 8
    );
    const beamMaterial = new THREE.MeshStandardMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.7,
      emissive: 0x66ccff,
      emissiveIntensity: 1.0
    });
    
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(x, baseHeight + pillarHeight + beamHeight/2, z);
    this.scene.add(beam);
    
    // Add particle system for the beam
    const particleCount = 300;
    const particles = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x77ddff,
      size: 0.2,
      transparent: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = Math.random() * beamRadius * 2;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * beamHeight;
      
      particlePositions[i3] = x + Math.cos(angle) * radius;
      particlePositions[i3+1] = baseHeight + pillarHeight + beamHeight/2 + height;
      particlePositions[i3+2] = z + Math.sin(angle) * radius;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    this.scene.add(particleSystem);
    
    // Store for animation
    if (!this.particleSystems) this.particleSystems = [];
    this.particleSystems.push({
      system: particleSystem,
      positions: particlePositions,
      centerX: x,
      centerZ: z,
      height: baseHeight + pillarHeight + beamHeight/2
    });
    
    // Add floating rings around the beam
    const ringCount = 4;
    
    for (let i = 0; i < ringCount; i++) {
      const ringGeometry = new THREE.TorusGeometry(2 + i * 0.5, 0.2, 16, 32);
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0x66aaff,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0x3366cc,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.9
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      const height = baseHeight + pillarHeight/2 + i * 3;
      ring.position.set(x, height, z);
      
      // Store for rotation animation
      if (!this.floatingRings) this.floatingRings = [];
      this.floatingRings.push({
        ring: ring,
        height: height,
        baseY: height,
        rotationSpeed: 0.2 + i * 0.1,
        oscillationSpeed: 0.5 + i * 0.2,
        oscillationAmplitude: 0.5,
        phase: i * (Math.PI / 2)
      });
      
      this.scene.add(ring);
    }
    
    // Add light at the top of the beam
    const beamLight = new THREE.PointLight(0x66ccff, 2, 30);
    beamLight.position.set(x, baseHeight + pillarHeight + beamHeight, z);
    this.scene.add(beamLight);
    
    // Add ground spotlights around the monument
    const spotlightCount = 4;
    for (let i = 0; i < spotlightCount; i++) {
      const angle = (i / spotlightCount) * Math.PI * 2;
      const distance = baseDiameter/2 + 1;
      const spotX = x + Math.cos(angle) * distance;
      const spotZ = z + Math.sin(angle) * distance;
      
      const spotlight = new THREE.SpotLight(0x4466ff, 2, 20, Math.PI/6, 0.5, 1);
      spotlight.position.set(spotX, 0.2, spotZ);
      spotlight.target.position.set(x, baseHeight + pillarHeight/2, z);
      spotlight.castShadow = true;
      
      this.scene.add(spotlight);
      this.scene.add(spotlight.target);
    }
  }
  
  private createPlazaDecorations(centerX: number, centerZ: number, plazaSize: number): void {
    // Add benches around the plaza
    const benchCount = 8;
    const benchDistance = plazaSize * 0.3;
    
    for (let i = 0; i < benchCount; i++) {
      const angle = (i / benchCount) * Math.PI * 2;
      const benchX = centerX + Math.cos(angle) * benchDistance;
      const benchZ = centerZ + Math.sin(angle) * benchDistance;
      
      this.createFuturisticBench(benchX, benchZ, angle);
    }
    
    // Add decorative light pillars
    const pillarCount = 6;
    const pillarDistance = plazaSize * 0.4;
    
    for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      const pillarX = centerX + Math.cos(angle) * pillarDistance;
      const pillarZ = centerZ + Math.sin(angle) * pillarDistance;
      
      this.createEnergyPillar(pillarX, pillarZ);
    }
    
    // Add floating platforms
    const platformCount = 3;
    const platformDistance = plazaSize * 0.25;
    
    for (let i = 0; i < platformCount; i++) {
      const angle = (i / platformCount) * Math.PI * 2 + Math.PI/6;
      const platformX = centerX + Math.cos(angle) * platformDistance;
      const platformZ = centerZ + Math.sin(angle) * platformDistance;
      
      this.createFloatingPlatform(platformX, platformZ, 3 + i);
    }
  }
  
  private createFuturisticBench(x: number, z: number, rotation: number): void {
    const benchGroup = new THREE.Group();
    
    // Create bench base
    const baseWidth = 4;
    const baseHeight = 0.2;
    const baseDepth = 1.5;
    
    const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.5,
      metalness: 0.7
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, baseHeight/2, 0);
    benchGroup.add(base);
    this.addToCollidable(base);
    
    // Create seat
    const seatWidth = baseWidth;
    const seatHeight = 0.1;
    const seatDepth = baseDepth * 0.8;
    
    const seatGeometry = new THREE.BoxGeometry(seatWidth, seatHeight, seatDepth);
    const seatMaterial = new THREE.MeshStandardMaterial({
      color: 0x3366aa,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x112233,
      emissiveIntensity: 0.2
    });
    
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(0, baseHeight + seatHeight/2, 0);
    benchGroup.add(seat);
    this.addToCollidable(seat);
    
    // Create backrest
    const backrestWidth = baseWidth;
    const backrestHeight = 1.2;
    const backrestDepth = 0.2;
    
    const backrestGeometry = new THREE.BoxGeometry(backrestWidth, backrestHeight, backrestDepth);
    const backrestMaterial = seatMaterial;
    
    const backrest = new THREE.Mesh(backrestGeometry, backrestMaterial);
    backrest.position.set(0, baseHeight + seatHeight + backrestHeight/2, -seatDepth/2 + backrestDepth/2);
    benchGroup.add(backrest);
    this.addToCollidable(backrest);
    
    // Add glowing strip on the bench
    const stripWidth = baseWidth;
    const stripHeight = 0.05;
    const stripDepth = 0.05;
    
    const stripGeometry = new THREE.BoxGeometry(stripWidth, stripHeight, stripDepth);
    const stripMaterial = new THREE.MeshStandardMaterial({
      color: 0x66aaff,
      emissive: 0x66aaff,
      emissiveIntensity: 1.0
    });
    
    const strip = new THREE.Mesh(stripGeometry, stripMaterial);
    strip.position.set(0, baseHeight + seatHeight + 0.1, seatDepth/2 - stripDepth/2);
    benchGroup.add(strip);
    
    // Add another strip on the backrest
    const backStripGeometry = new THREE.BoxGeometry(stripWidth, stripHeight, stripDepth);
    const backStrip = new THREE.Mesh(backStripGeometry, stripMaterial);
    backStrip.position.set(0, baseHeight + seatHeight + backrestHeight - 0.1, -seatDepth/2 + stripDepth/2);
    benchGroup.add(backStrip);
    
    // Position the bench
    benchGroup.position.set(x, 0, z);
    benchGroup.rotation.y = rotation;
    this.scene.add(benchGroup);
  }

  private createPowerUpLocations(): void {
    const powerUpSpots = [
        { x: 40, z: 40 },
        { x: -40, z: -40 },
        { x: 40, z: -40 },
        { x: -40, z: 40 }
    ];

    const powerUpGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 16);
    const powerUpMaterial = new THREE.MeshStandardMaterial({
        color: 0x66ffff,
        emissive: 0x33ffff,
        emissiveIntensity: 0.5
    });

    powerUpSpots.forEach(spot => {
        const powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
        powerUp.position.set(spot.x, 1, spot.z);
        this.scene.add(powerUp);
        
        // Add point light
        const light = new THREE.PointLight(0x66ffff, 0.5, 5);
        light.position.set(spot.x, 2, spot.z);
        this.scene.add(light);
    });
  }

  private addBuildingWindows(buildingGroup: THREE.Group, height: number, width: number, depth: number, floors: number): void {
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x66ffff,
      emissive: 0x33ffff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9
    });

    const windowSize = 0.8;
    const windowSpacing = 1.5;
    const floorHeight = height / floors;
    
    // Create windows on all four sides
    for (let floor = 1; floor < floors; floor++) {
      const y = floor * floorHeight - height/2 + floorHeight/2;
      
      // Calculate how many windows fit on each side
      const windowColsWidth = Math.floor(width / windowSpacing) - 1;
      const windowColsDepth = Math.floor(depth / windowSpacing) - 1;
      
      // Front and back windows
      for (let col = 1; col < windowColsWidth; col++) {
        const x = col * windowSpacing - width/2;
        
        // Randomly skip some windows for variation
        if (Math.random() > 0.9) continue;
        
        // Different color for some windows to simulate occupancy
        const thisWindowMaterial = Math.random() > 0.3 ? 
          windowMaterial : 
          windowMaterial.clone();
        
        if (thisWindowMaterial !== windowMaterial) {
          thisWindowMaterial.emissive = new THREE.Color(
            Math.random() > 0.5 ? 0xffaa22 : 0x22aaff
          );
          thisWindowMaterial.emissiveIntensity = 0.3 + Math.random() * 0.5;
        }
        
        const frontWindow = new THREE.Mesh(
          new THREE.PlaneGeometry(windowSize, windowSize),
          thisWindowMaterial
        );
        frontWindow.position.set(x, y, depth/2 + 0.1);
        buildingGroup.add(frontWindow);

        const backWindow = new THREE.Mesh(
          new THREE.PlaneGeometry(windowSize, windowSize),
          Math.random() > 0.3 ? thisWindowMaterial : windowMaterial
        );
        backWindow.rotation.y = Math.PI;
        backWindow.position.set(x, y, -depth/2 - 0.1);
        buildingGroup.add(backWindow);
      }

      // Side windows
      for (let col = 1; col < windowColsDepth; col++) {
        const z = col * windowSpacing - depth/2;
        
        // Randomly skip some windows
        if (Math.random() > 0.9) continue;
        
        // Different color for some windows
        const thisWindowMaterial = Math.random() > 0.3 ? 
          windowMaterial : 
          windowMaterial.clone();
        
        if (thisWindowMaterial !== windowMaterial) {
          thisWindowMaterial.emissive = new THREE.Color(
            Math.random() > 0.5 ? 0xffaa22 : 0x22aaff
          );
          thisWindowMaterial.emissiveIntensity = 0.3 + Math.random() * 0.5;
        }

        const rightWindow = new THREE.Mesh(
          new THREE.PlaneGeometry(windowSize, windowSize),
          thisWindowMaterial
        );
        rightWindow.rotation.y = Math.PI / 2;
        rightWindow.position.set(width/2 + 0.1, y, z);
        buildingGroup.add(rightWindow);

        const leftWindow = new THREE.Mesh(
          new THREE.PlaneGeometry(windowSize, windowSize),
          Math.random() > 0.3 ? thisWindowMaterial : windowMaterial
        );
        leftWindow.rotation.y = -Math.PI / 2;
        leftWindow.position.set(-width/2 - 0.1, y, z);
        buildingGroup.add(leftWindow);
      }
    }
  }

  private createBuildingEntrance(buildingGroup: THREE.Group, width: number, depth: number): void {
    // Create entrance doorway with futuristic design
    const doorWidth = 3;
    const doorHeight = 4;
    
    // Create a recessed doorway area
    const doorwayDepth = 1;
    const recessGeometry = new THREE.BoxGeometry(doorWidth + 2, doorHeight + 1, doorwayDepth);
    const recessMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
      metalness: 0.5
    });
    
    const doorRecess = new THREE.Mesh(recessGeometry, recessMaterial);
    doorRecess.position.set(0, doorHeight/2, depth/2 - doorwayDepth/2);
    buildingGroup.add(doorRecess);
    this.addToCollidable(doorRecess);
    
    // Create sliding door panels
    const doorPanelWidth = doorWidth / 2;
    const doorPanelGeometry = new THREE.BoxGeometry(doorPanelWidth, doorHeight, 0.2);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x3344aa,
      emissiveIntensity: 0.2
    });
    
    // Left door panel
    const leftDoor = new THREE.Mesh(doorPanelGeometry, doorMaterial);
    leftDoor.position.set(-doorPanelWidth/2, doorHeight/2, depth/2 + 0.1);
    buildingGroup.add(leftDoor);
    this.addToCollidable(leftDoor);
    
    // Right door panel
    const rightDoor = new THREE.Mesh(doorPanelGeometry, doorMaterial);
    rightDoor.position.set(doorPanelWidth/2, doorHeight/2, depth/2 + 0.1);
    buildingGroup.add(rightDoor);
    this.addToCollidable(rightDoor);
    
    // Add glowing frame around doorway
    const frameGeometry = new THREE.BoxGeometry(doorWidth + 2, 0.2, 0.1);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x66aaff,
      emissive: 0x66aaff,
      emissiveIntensity: 1.0
    });
    
    // Top frame
    const topFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    topFrame.position.set(0, doorHeight + 0.1, depth/2 + 0.15);
    buildingGroup.add(topFrame);
    
    // Bottom frame
    const bottomFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    bottomFrame.position.set(0, 0.1, depth/2 + 0.15);
    buildingGroup.add(bottomFrame);
    
    // Side frames
    const sideFrameGeometry = new THREE.BoxGeometry(0.2, doorHeight, 0.1);
    
    // Left frame
    const leftFrame = new THREE.Mesh(sideFrameGeometry, frameMaterial);
    leftFrame.position.set(-doorWidth/2 - 0.1, doorHeight/2, depth/2 + 0.15);
    buildingGroup.add(leftFrame);
    
    // Right frame
    const rightFrame = new THREE.Mesh(sideFrameGeometry, frameMaterial);
    rightFrame.position.set(doorWidth/2 + 0.1, doorHeight/2, depth/2 + 0.15);
    buildingGroup.add(rightFrame);
    
    // Add steps leading to entrance
    const stepsWidth = doorWidth + 2;
    const stepCount = 3;
    const stepHeight = 0.3;
    const stepDepth = 0.5;

    for (let i = 0; i < stepCount; i++) {
      const stepGeometry = new THREE.BoxGeometry(stepsWidth, stepHeight, stepDepth);
      const stepMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.6,
        metalness: 0.4
      });
      
      const step = new THREE.Mesh(stepGeometry, stepMaterial);
      step.position.set(
        0,
        i * stepHeight,
        depth/2 + stepDepth * (i + 1)
      );
      buildingGroup.add(step);
      this.addToCollidable(step);
    }
  }

  private createBuildingStairs(buildingGroup: THREE.Group, height: number, width: number, depth: number): void {
    const stairWidth = 3;
    const stairHeight = 0.3;
    const stairDepth = 0.5;
    const stairsPerFlight = 10;
    const flightCount = Math.floor(height / (stairHeight * stairsPerFlight));
    
    const stairsMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.8,
      metalness: 0.2
    });
    
    // Create central stairwell column
    const stairwellRadius = stairWidth / 2 + 1;
    const stairwellHeight = height * 0.8;
    const stairwellGeometry = new THREE.CylinderGeometry(
      stairwellRadius, stairwellRadius, stairwellHeight, 8
    );
    const stairwellMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.3
    });
    
    const stairwell = new THREE.Mesh(stairwellGeometry, stairwellMaterial);
    stairwell.position.set(width/4, stairwellHeight/2, depth/4);
    buildingGroup.add(stairwell);
    this.addToCollidable(stairwell);
    
    // Create spiral staircase
    const spiralSteps = Math.floor(stairwellHeight / stairHeight);
    const degreesPerStep = 15;
    
    for (let i = 0; i < spiralSteps; i++) {
      const stepGeometry = new THREE.BoxGeometry(stairWidth, stairHeight, stairDepth);
      const step = new THREE.Mesh(stepGeometry, stairsMaterial);
      
      // Calculate position based on height and rotation
      const angle = (i * degreesPerStep) * (Math.PI / 180);
      const radius = stairwellRadius - 0.5;
      
      const x = width/4 + Math.cos(angle) * radius;
      const z = depth/4 + Math.sin(angle) * radius;
      const y = i * stairHeight + stairHeight/2;
      
      step.position.set(x, y, z);
      step.rotation.y = angle + Math.PI/2;
      
      buildingGroup.add(step);
      this.addToCollidable(step);
    }
  }

  private createRoofAccess(buildingGroup: THREE.Group, height: number, width: number, depth: number): void {
    // Create roof access structure
    const accessWidth = 4;
    const accessHeight = 3;
    const accessDepth = 4;
    
    const accessGeometry = new THREE.BoxGeometry(accessWidth, accessHeight, accessDepth);
    const accessMaterial = new THREE.MeshStandardMaterial({
      color: 0x3366ff,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x001133,
      emissiveIntensity: 0.2
    });
    
    const access = new THREE.Mesh(accessGeometry, accessMaterial);
    access.position.set(width/4, height + accessHeight/2, depth/4);
    buildingGroup.add(access);
    this.addToCollidable(access);

    // Add door to roof access
    const doorGeometry = new THREE.BoxGeometry(2, 2.5, 0.2);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x0022aa,
      emissiveIntensity: 0.3
    });
    
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, -accessHeight/2 + 1.25, accessDepth/2);
    access.add(door);
    this.addToCollidable(door);
    
    // Add a small rooftop light
    const lightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffff00,
      emissiveIntensity: 1.0
    });
    
    const lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
    lightMesh.position.set(0, accessHeight/2 + 0.3, 0);
    access.add(lightMesh);
    
    // Add actual point light
    const pointLight = new THREE.PointLight(0xffff33, 1, 15);
    pointLight.position.copy(lightMesh.position);
    access.add(pointLight);
  }

  private createInteractiveTerminals(centerX: number, centerZ: number, plazaSize: number): void {
    const terminalCount = 4;
    const distance = plazaSize * 0.25;
    
    for (let i = 0; i < terminalCount; i++) {
      const angle = (i / terminalCount) * Math.PI * 2 + Math.PI / 4;
      const x = centerX + Math.cos(angle) * distance;
      const z = centerZ + Math.sin(angle) * distance;
      
      // Create terminal base
      const baseWidth = 1;
      const baseHeight = 0.8;
      const baseDepth = 0.8;
      
      const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.5,
        metalness: 0.7
      });
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(x, baseHeight/2, z);
      this.scene.add(base);
      this.addToCollidable(base);
      
      // Create screen
      const screenWidth = 0.8;
      const screenHeight = 1.2;
      const screenDepth = 0.1;
      
      const screenGeometry = new THREE.BoxGeometry(screenWidth, screenHeight, screenDepth);
      const screenMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.1,
        metalness: 0.9,
        emissive: 0x113366,
        emissiveIntensity: 0.5
      });
      
      const screen = new THREE.Mesh(screenGeometry, screenMaterial);
      screen.position.set(x, baseHeight + screenHeight/2, z);
      screen.rotation.y = angle + Math.PI;
      this.scene.add(screen);
      this.addToCollidable(screen);
      
      // Add screen content
      const contentGeometry = new THREE.PlaneGeometry(screenWidth * 0.9, screenHeight * 0.8);
      const contentMaterial = new THREE.MeshBasicMaterial({
        color: 0x66aaff,
        transparent: true,
        opacity: 0.8
      });
      
      const content = new THREE.Mesh(contentGeometry, contentMaterial);
      content.position.set(0, 0, screenDepth/2 + 0.01);
      screen.add(content);
      
      // Store for animation
      if (!this.terminalScreens) this.terminalScreens = [];
      this.terminalScreens.push({
        screen: content,
        phase: i * (Math.PI / 2)
      });
    }
  }

  private createHolographicDisplay(centerX: number, centerZ: number): void {
    // Create base for holographic projector
    const baseRadius = 2;
    const baseHeight = 0.5;
    
    const baseGeometry = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 16);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.8
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(centerX, baseHeight/2, centerZ);
    this.scene.add(base);
    this.addToCollidable(base);
    
    // Create holographic projection
    const holoRadius = 3;
    const holoHeight = 6;
    
    const holoGeometry = new THREE.SphereGeometry(holoRadius, 32, 16);
    const holoMaterial = new THREE.MeshStandardMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.3,
      wireframe: true,
      emissive: 0x66ccff,
      emissiveIntensity: 0.5
    });
    
    const hologram = new THREE.Mesh(holoGeometry, holoMaterial);
    hologram.position.set(centerX, baseHeight + holoRadius, centerZ);
    this.scene.add(hologram);
    
    // Create particles inside the hologram
    const particleCount = 200;
    const particles = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x55ccff,
      size: 0.1,
      transparent: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Create particles in a spherical distribution
      const radius = Math.random() * holoRadius;
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      
      particlePositions[i3] = centerX + radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i3+1] = baseHeight + holoRadius + radius * Math.cos(phi);
      particlePositions[i3+2] = centerZ + radius * Math.sin(phi) * Math.sin(theta);
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    this.scene.add(particleSystem);
    
    // Store for animation
    if (!this.holographicDisplays) this.holographicDisplays = [];
    this.holographicDisplays.push({
      hologram: hologram,
      particles: particleSystem,
      positions: particlePositions,
      centerX: centerX,
      centerY: baseHeight + holoRadius,
      centerZ: centerZ,
      radius: holoRadius
    });
    
    // Add light in the center of the hologram
    const light = new THREE.PointLight(0x66ccff, 1, 15);
    light.position.set(centerX, baseHeight + holoRadius, centerZ);
    this.scene.add(light);
  }

  private createFloatingPlatform(x: number, z: number, height: number): void {
    // Create a hovering platform
    const platformWidth = 4;
    const platformHeight = 0.3;
    const platformDepth = 4;
    
    const platformGeometry = new THREE.BoxGeometry(platformWidth, platformHeight, platformDepth);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x3355aa,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x001133,
      emissiveIntensity: 0.2
    });
    
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(x, height, z);
    this.scene.add(platform);
    this.addToCollidable(platform);
    
    // Add glow effect underneath
    const glowGeometry = new THREE.CircleGeometry(platformWidth * 0.6, 16);
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: 0x66aaff,
      emissive: 0x66aaff,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.rotation.x = Math.PI / 2;
    glow.position.set(x, height - 0.5, z);
    this.scene.add(glow);
    
    // Add subtle point light under the platform
    const light = new THREE.PointLight(0x66aaff, 1, 10);
    light.position.set(x, height - 1, z);
    this.scene.add(light);
    
    // Store for animation
    if (!this.floatingPlatforms) this.floatingPlatforms = [];
    this.floatingPlatforms.push({
      platform: platform,
      glow: glow,
      light: light,
      baseHeight: height,
      oscillationSpeed: 0.5,
      oscillationAmplitude: 0.2,
      phase: Math.random() * Math.PI * 2
    });
  }

  private createEnergyPillar(x: number, z: number): void {
    const pillarHeight = 6;
    const pillarRadius = 0.4;
    
    // Create the outer shell
    const shellGeometry = new THREE.CylinderGeometry(pillarRadius, pillarRadius, pillarHeight, 8);
    const shellMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.3,
      metalness: 0.9,
      transparent: true,
      opacity: 0.8
    });
    
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    shell.position.set(x, pillarHeight/2, z);
    this.scene.add(shell);
    this.addToCollidable(shell);
    
    // Create the energy core
    const coreRadius = pillarRadius * 0.6;
    const coreGeometry = new THREE.CylinderGeometry(coreRadius, coreRadius, pillarHeight * 0.8, 8);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x66ffff,
      emissive: 0x33ccff,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.9
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.set(x, pillarHeight/2, z);
    this.scene.add(core);
    
    // Add particles inside the pillar
    const particleCount = 100;
    const particles = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x77eeff,
      size: 0.1,
      transparent: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = Math.random() * coreRadius;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * pillarHeight * 0.8;
      
      particlePositions[i3] = x + Math.cos(angle) * radius;
      particlePositions[i3+1] = pillarHeight/2 + height;
      particlePositions[i3+2] = z + Math.sin(angle) * radius;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    this.scene.add(particleSystem);
    
    // Store for animation
    if (!this.energyPillars) this.energyPillars = [];
    this.energyPillars.push({
      core: core,
      particles: particleSystem,
      positions: particlePositions,
      centerX: x,
      centerZ: z,
      height: pillarHeight/2
    });
    
    // Add point light
    const light = new THREE.PointLight(0x66ccff, 1, 10);
    light.position.set(x, pillarHeight/2, z);
    this.scene.add(light);
    
    // Add top and bottom caps
    const capRadius = pillarRadius * 1.2;
    const capHeight = 0.2;
    
    const capGeometry = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 8);
    const capMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.3,
      metalness: 0.9
    });
    
    // Top cap
    const topCap = new THREE.Mesh(capGeometry, capMaterial);
    topCap.position.set(x, pillarHeight, z);
    this.scene.add(topCap);
    this.addToCollidable(topCap);
    
    // Bottom cap
    const bottomCap = new THREE.Mesh(capGeometry, capMaterial);
    bottomCap.position.set(x, 0.1, z);
    this.scene.add(bottomCap);
    this.addToCollidable(bottomCap);
  }

  private createBoundary(): void {
    const wallHeight = 50;
    const wallThickness = 2;
    const halfSize = this.mapSize / 2;

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x3366ff,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.3,
      emissive: 0x0033aa,
      emissiveIntensity: 0.3
    });

    // Create each wall segment
    const createWall = (x1: number, z1: number, x2: number, z2: number) => {
      const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
      const wallGeometry = new THREE.BoxGeometry(length, wallHeight, wallThickness);
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      
      // Position the wall
      wall.position.set((x1 + x2) / 2, wallHeight / 2, (z1 + z2) / 2);
      
      // Rotate the wall
      const angle = Math.atan2(z2 - z1, x2 - x1);
      wall.rotation.y = angle;
      
      this.scene.add(wall);
      this.boundaryWalls.push(wall);
      this.addToCollidable(wall);
      
      // Add glowing trim at the top and bottom of the wall
      const trimGeometry = new THREE.BoxGeometry(length, 0.5, wallThickness + 0.2);
      const trimMaterial = new THREE.MeshStandardMaterial({
        color: 0x66aaff,
        emissive: 0x66aaff,
        emissiveIntensity: 1.0
      });
      
      // Top trim
      const topTrim = new THREE.Mesh(trimGeometry, trimMaterial);
      topTrim.position.copy(wall.position);
      topTrim.position.y = wallHeight - 0.25;
      topTrim.rotation.y = angle;
      this.scene.add(topTrim);
      
      // Bottom trim
      const bottomTrim = new THREE.Mesh(trimGeometry, trimMaterial);
      bottomTrim.position.copy(wall.position);
      bottomTrim.position.y = 0.25;
      bottomTrim.rotation.y = angle;
      this.scene.add(bottomTrim);
    };

    // Create the four walls
    createWall(-halfSize, -halfSize, halfSize, -halfSize); // South
    createWall(halfSize, -halfSize, halfSize, halfSize);   // East
    createWall(halfSize, halfSize, -halfSize, halfSize);   // North
    createWall(-halfSize, halfSize, -halfSize, -halfSize); // West
  }

  private createAmbientDetails(): void {
    // Add atmospheric fog
    const fog = new THREE.FogExp2(0x000033, 0.002);
    this.scene.fog = fog;

    // Create stars in the sky
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const starsPositions = new Float32Array(starsCount * 3);
    
    for (let i = 0; i < starsCount * 3; i += 3) {
      starsPositions[i] = (Math.random() - 0.5) * 1000;
      starsPositions[i+1] = Math.random() * 500 + 50; // Only above the horizon
      starsPositions[i+2] = (Math.random() - 0.5) * 1000;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: false
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);

    // Add ambient lighting for general scene illumination
    const ambientLight = new THREE.AmbientLight(0x333344, 0.5);
    this.scene.add(ambientLight);

    // Add main directional light (like a distant sun)
    const sunLight = new THREE.DirectionalLight(0x9999ff, 0.8);
    sunLight.position.set(100, 100, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this.scene.add(sunLight);
    
    // Add subtle blue hemisphere light for sci-fi feel
    const hemiLight = new THREE.HemisphereLight(0x6688cc, 0x334455, 0.6);
    this.scene.add(hemiLight);
    
    // Add distant colored lights for ambiance
    const colors = [0xff2266, 0x22ffaa, 0x2266ff, 0xffaa22];
    const positions = [
      new THREE.Vector3(100, 30, -100),
      new THREE.Vector3(-100, 40, 100),
      new THREE.Vector3(-100, 20, -100),
      new THREE.Vector3(100, 50, 100)
    ];
    
    for (let i = 0; i < colors.length; i++) {
      const light = new THREE.PointLight(colors[i], 0.5, 300);
      light.position.copy(positions[i]);
      this.scene.add(light);
    }
  }

  private addToCollidable(object: THREE.Object3D): void {
    this.collidableObjects.push(object);
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        this.collidableObjects.push(child);
      }
    });
  }

  public update(delta: number): void {
    // Update any animated elements
    
    // Animate blinking lights on buildings
    if (this.blinkingLights) {
      this.blinkingLights.forEach(light => {
        light.phase += delta * 2;
        light.light.intensity = 0.5 + 0.5 * Math.sin(light.phase);
      });
    }
    
    // Animate plaza floor lights
    if (this.plazaLights) {
      this.plazaLights.forEach(light => {
        light.phase += delta;
        light.light.intensity = light.baseIntensity + 0.3 * Math.sin(light.phase);
        
        // Move the light in a circular pattern
        const x = light.light.position.x + Math.cos(light.phase * 0.2) * 0.5;
        const z = light.light.position.z + Math.sin(light.phase * 0.2) * 0.5;
        light.light.position.set(x, light.light.position.y, z);
      });
    }
    
    // Animate floating rings
    if (this.floatingRings) {
      this.floatingRings.forEach(ring => {
        // Rotate the ring
        ring.ring.rotation.x += delta * ring.rotationSpeed;
        ring.ring.rotation.z += delta * ring.rotationSpeed * 0.7;
        
        // Oscillate up and down
        ring.phase += delta * ring.oscillationSpeed;
        ring.ring.position.y = ring.baseY + Math.sin(ring.phase) * ring.oscillationAmplitude;
      });
    }
    
    // Animate particle systems
    if (this.particleSystems) {
      this.particleSystems.forEach(system => {
        const positions = system.positions;
        
        for (let i = 0; i < positions.length; i += 3) {
          // Add some randomness to particle positions
          positions[i] += (Math.random() - 0.5) * 0.05;
          positions[i+1] += (Math.random() - 0.5) * 0.05;
          positions[i+2] += (Math.random() - 0.5) * 0.05;
          
          // Pull particles back toward the center
          const dx = positions[i] - system.centerX;
          const dy = positions[i+1] - system.height;
          const dz = positions[i+2] - system.centerZ;
          
          positions[i] -= dx * 0.01;
          positions[i+1] -= dy * 0.01;
          positions[i+2] -= dz * 0.01;
        }
        
        system.system.geometry.attributes.position.needsUpdate = true;
      });
    }
    
    // Animate energy pillars
    if (this.energyPillars) {
      this.energyPillars.forEach(pillar => {
        // Rotate the core
        pillar.core.rotation.y += delta * 0.5;
        
        // Animate particles
        const positions = pillar.positions;
        
        for (let i = 0; i < positions.length; i += 3) {
          // Move particles upward
          positions[i+1] += delta * 2;
          
          // Reset particles that go too high
          if (positions[i+1] > pillar.height + 3) {
            positions[i+1] = pillar.height - 3;
            
            // Randomize x and z when resetting
            const radius = Math.random() * 0.3;
            const angle = Math.random() * Math.PI * 2;
            positions[i] = pillar.centerX + Math.cos(angle) * radius;
            positions[i+2] = pillar.centerZ + Math.sin(angle) * radius;
          }
        }
        
        pillar.particles.geometry.attributes.position.needsUpdate = true;
      });
    }
    
    // Animate floating platforms
    if (this.floatingPlatforms) {
      this.floatingPlatforms.forEach(platform => {
        // Oscillate the platform up and down
        platform.phase += delta * platform.oscillationSpeed;
        const newY = platform.baseHeight + Math.sin(platform.phase) * platform.oscillationAmplitude;
        
        platform.platform.position.y = newY;
        platform.glow.position.y = newY - 0.5;
        platform.light.position.y = newY - 1;
      });
    }
    
    // Animate terminal screens
    if (this.terminalScreens) {
      this.terminalScreens.forEach(terminal => {
        terminal.phase += delta * 2;
        
        // Change color over time
        const r = 0.4 + 0.2 * Math.sin(terminal.phase);
        const g = 0.6 + 0.2 * Math.sin(terminal.phase + Math.PI * 2/3);
        const b = 1.0;
        
        if (terminal.screen.material instanceof THREE.MeshBasicMaterial) {
          terminal.screen.material.color.setRGB(r, g, b);
        }
      });
    }
    
    // Animate holographic displays
    if (this.holographicDisplays) {
      this.holographicDisplays.forEach(holo => {
        // Rotate the hologram
        holo.hologram.rotation.y += delta * 0.2;
        
        // Pulse the hologram
        const scale = 1.0 + 0.05 * Math.sin(Date.now() * 0.001);
        holo.hologram.scale.set(scale, scale, scale);
        
        // Animate particles
        const positions = holo.positions;
        
        for (let i = 0; i < positions.length; i += 3) {
          // Move particles in a spherical pattern
          const x = positions[i] - holo.centerX;
          const y = positions[i+1] - holo.centerY;
          const z = positions[i+2] - holo.centerZ;
          
          // Calculate distance from center
          const distance = Math.sqrt(x*x + y*y + z*z);
          
          // Calculate normalized direction
          const nx = x / distance;
          const ny = y / distance;
          const nz = z / distance;
          
          // Move particles along tangent
          const speed = 0.5;
          positions[i] += delta * speed * (ny * nz);
          positions[i+1] += delta * speed * (nz * nx);
          positions[i+2] += delta * speed * (nx * ny);
          
          // Keep particles within sphere
          const newX = positions[i] - holo.centerX;
          const newY = positions[i+1] - holo.centerY;
          const newZ = positions[i+2] - holo.centerZ;
          const newDistance = Math.sqrt(newX*newX + newY*newY + newZ*newZ);
          
          if (newDistance > holo.radius) {
            // Reset particle to random position within sphere
            const radius = Math.random() * holo.radius;
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;
            
            positions[i] = holo.centerX + radius * Math.sin(phi) * Math.cos(theta);
            positions[i+1] = holo.centerY + radius * Math.cos(phi);
            positions[i+2] = holo.centerZ + radius * Math.sin(phi) * Math.sin(theta);
          }
        }
        
        holo.particles.geometry.attributes.position.needsUpdate = true;
      });
    }
  }
} 