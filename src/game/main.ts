import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Player } from './Player';
import { Weapon } from './Weapon';
import { AssetLoader } from './AssetLoader';
import { SkyBox } from './SkyBox';
import { World } from './World';
import { UI } from '../components/UI';
import { MiniMap } from '../components/MiniMap';
import { Storm } from './Storm';

class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private controls: PointerLockControls;
  private player: Player;
  private world: World;
  private assetLoader: AssetLoader;
  private ui: UI;
  private miniMap: MiniMap;
  private storm: Storm;
  private isGameRunning: boolean = false;
  
  constructor() {
    // Initialize Three.js components
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    document.getElementById('game-container')?.appendChild(this.renderer.domElement);
    
    // Initialize game clock
    this.clock = new THREE.Clock();
    
    // Initialize asset loader
    this.assetLoader = new AssetLoader();
    
    // Initialize controls
    this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
    this.scene.add(this.controls.getObject());
    
    // Initialize player
    this.player = new Player(this.controls, this.camera);
    
    // Initialize world
    this.world = new World(this.scene, this.assetLoader);
    
    // Initialize storm
    this.storm = new Storm(this.scene);
    
    // Initialize UI
    this.ui = new UI();
    
    // Initialize mini-map
    this.miniMap = new MiniMap();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup lighting
    this.setupLighting();
    
    // Setup skybox
    new SkyBox(this.scene);
    
    // Start the game loop
    this.animate();
  }
  
  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);
    
    // Point lights for atmosphere
    const pointLight1 = new THREE.PointLight(0x3366ff, 1, 20);
    pointLight1.position.set(5, 5, 5);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff3366, 1, 20);
    pointLight2.position.set(-5, 5, -5);
    this.scene.add(pointLight2);
  }
  
  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Handle pointer lock
    document.addEventListener('click', () => {
      if (!this.isGameRunning) {
        this.controls.lock();
      }
    });
    
    this.controls.addEventListener('lock', () => {
      this.isGameRunning = true;
    });
    
    this.controls.addEventListener('unlock', () => {
      this.isGameRunning = false;
    });
    
    // Handle shooting
    document.addEventListener('mousedown', (event) => {
      if (this.isGameRunning && event.button === 0) {
        this.player.shoot();
      }
    });
    
    // Handle key presses
    const onKeyDown = (event: KeyboardEvent) => {
      if (!this.isGameRunning) return;
      
      switch (event.code) {
        case 'KeyW':
          this.player.moveForward = true;
          break;
        case 'KeyS':
          this.player.moveBackward = true;
          break;
        case 'KeyA':
          this.player.moveLeft = true;
          break;
        case 'KeyD':
          this.player.moveRight = true;
          break;
        case 'Space':
          this.player.jump();
          break;
        case 'ShiftLeft':
          this.player.sprint = true;
          break;
        case 'KeyC':
          this.player.toggleCrouch();
          break;
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
          const weaponIndex = parseInt(event.code.charAt(5)) - 1;
          this.player.switchWeapon(weaponIndex);
          this.ui.updateActiveWeapon(weaponIndex);
          break;
      }
    };
    
    const onKeyUp = (event: KeyboardEvent) => {
      if (!this.isGameRunning) return;
      
      switch (event.code) {
        case 'KeyW':
          this.player.moveForward = false;
          break;
        case 'KeyS':
          this.player.moveBackward = false;
          break;
        case 'KeyA':
          this.player.moveLeft = false;
          break;
        case 'KeyD':
          this.player.moveRight = false;
          break;
        case 'ShiftLeft':
          this.player.sprint = false;
          break;
      }
    };
    
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }
  
  private animate(): void {
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    
    if (this.isGameRunning) {
      // Update player
      this.player.update(delta, this.world);
      
      // Update storm and apply damage if player is outside
      const stormDamage = this.storm.update(delta, this.controls.getObject().position);
      if (stormDamage > 0) {
        this.player.takeDamage(stormDamage);
      }
      
      // Update world effects
      this.world.update(delta);
      
      // Update UI
      this.ui.update(this.player, this.storm);
      
      // Update mini-map
      this.miniMap.update(this.player, this.world, this.storm);
      
      // Check loot collisions
      this.checkLootCollisions();
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
  
  private checkLootCollisions(): void {
    // Logic to check if player is near a loot chest or power-up
    // If so, call the appropriate methods to open the chest or pick up the power-up
  }
  
  public async init(): Promise<void> {
    // Load assets
    await this.assetLoader.loadAssets();
    
    // Initialize world
    await this.world.init();
    
    // Initialize player weapons
    await this.player.initWeapons(this.assetLoader, this.scene);

    // Initialize storm
    this.storm = new Storm(this.scene);
    
    // Show initial message
    this.ui.showMessage('Storm will begin shrinking soon...', 5000);
    
    console.log('Game initialized successfully!');
  }
}

// Initialize and start the game
const game = new Game();
game.init().catch(console.error); 