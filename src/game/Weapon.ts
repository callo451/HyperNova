import * as THREE from 'three';
import { AssetLoader } from './AssetLoader';

interface WeaponConfig {
  name: string;
  damage: number;
  fireRate: number;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  maxReserveAmmo: number;
  reloadTime: number;
  modelPath: string;
  muzzleFlashPosition: THREE.Vector3;
  isAutomatic: boolean;
}

export class Weapon {
  private config: WeaponConfig;
  private model: THREE.Object3D | null = null;
  private assetLoader: AssetLoader;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  
  private ammo: number;
  private reserveAmmo: number;
  private isReloading: boolean = false;
  private lastShotTime: number = 0;
  private shootingInterval: number;
  
  private muzzleFlash: THREE.PointLight | null = null;
  private muzzleFlashMesh: THREE.Mesh | null = null;
  private raycaster: THREE.Raycaster;
  
  constructor(config: WeaponConfig, assetLoader: AssetLoader, camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    this.config = config;
    this.assetLoader = assetLoader;
    this.camera = camera;
    this.scene = scene;
    
    this.ammo = config.ammo;
    this.reserveAmmo = config.reserveAmmo;
    this.shootingInterval = 1 / config.fireRate;
    
    this.raycaster = new THREE.Raycaster();
  }
  
  public async init(): Promise<void> {
    try {
      // Load weapon model
      this.model = await this.assetLoader.loadModel(this.config.modelPath);
      
      if (this.model) {
        // Position the weapon in front of the camera
        this.model.position.set(0.3, -0.3, -0.5);
        this.model.scale.set(0.1, 0.1, 0.1);
        this.model.rotation.y = Math.PI;
        
        // Add weapon to camera
        this.camera.add(this.model);
        
        // Hide weapon initially
        this.hide();
        
        // Create muzzle flash
        this.createMuzzleFlash();
      }
    } catch (error) {
      console.error(`Failed to load weapon model: ${error}`);
    }
  }
  
  private createMuzzleFlash(): void {
    // Create muzzle flash light
    this.muzzleFlash = new THREE.PointLight(0xffaa00, 3, 3);
    this.muzzleFlash.position.copy(this.config.muzzleFlashPosition);
    this.muzzleFlash.visible = false;
    
    // Create muzzle flash mesh
    const muzzleGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const muzzleMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    this.muzzleFlashMesh = new THREE.Mesh(muzzleGeometry, muzzleMaterial);
    this.muzzleFlashMesh.position.copy(this.config.muzzleFlashPosition);
    this.muzzleFlashMesh.visible = false;
    
    // Add to model
    if (this.model) {
      this.model.add(this.muzzleFlash);
      this.model.add(this.muzzleFlashMesh);
    }
  }
  
  public update(delta: number): void {
    // Handle reloading
    if (this.isReloading) {
      this.lastShotTime += delta;
      
      if (this.lastShotTime >= this.config.reloadTime) {
        this.completeReload();
      }
    }
    
    // Hide muzzle flash after a short time
    if (this.muzzleFlash && this.muzzleFlash.visible) {
      this.lastShotTime += delta;
      
      if (this.lastShotTime > 0.05) {
        this.muzzleFlash.visible = false;
        if (this.muzzleFlashMesh) this.muzzleFlashMesh.visible = false;
      }
    }
  }
  
  public shoot(): void {
    // Check if can shoot
    if (this.isReloading || this.ammo <= 0) {
      if (this.ammo <= 0) this.reload();
      return;
    }
    
    const now = performance.now() / 1000;
    if (now - this.lastShotTime < this.shootingInterval) {
      return;
    }
    
    // Update shot time
    this.lastShotTime = now;
    
    // Decrease ammo
    this.ammo--;
    
    // Show muzzle flash
    if (this.muzzleFlash) {
      this.muzzleFlash.visible = true;
      if (this.muzzleFlashMesh) this.muzzleFlashMesh.visible = true;
    }
    
    // Perform raycasting for hit detection
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      
      // Check if hit an enemy or object
      if (hit.object.userData.isEnemy) {
        // Apply damage to enemy
        hit.object.userData.takeDamage(this.config.damage);
      } else {
        // Create impact effect
        this.createImpactEffect(hit.point, hit.face?.normal || new THREE.Vector3(0, 1, 0));
      }
    }
  }
  
  private createImpactEffect(position: THREE.Vector3, normal: THREE.Vector3): void {
    // Create impact light
    const impactLight = new THREE.PointLight(0xffaa00, 1, 2);
    impactLight.position.copy(position);
    this.scene.add(impactLight);
    
    // Create impact particles (simplified)
    const impactGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const impactMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const impactMesh = new THREE.Mesh(impactGeometry, impactMaterial);
    impactMesh.position.copy(position);
    this.scene.add(impactMesh);
    
    // Remove after a short time
    setTimeout(() => {
      this.scene.remove(impactLight);
      this.scene.remove(impactMesh);
    }, 200);
  }
  
  public reload(): void {
    if (this.isReloading || this.ammo === this.config.maxAmmo || this.reserveAmmo <= 0) {
      return;
    }
    
    this.isReloading = true;
    this.lastShotTime = 0;
  }
  
  private completeReload(): void {
    const ammoNeeded = this.config.maxAmmo - this.ammo;
    const ammoToAdd = Math.min(ammoNeeded, this.reserveAmmo);
    
    this.ammo += ammoToAdd;
    this.reserveAmmo -= ammoToAdd;
    
    this.isReloading = false;
  }
  
  public show(): void {
    if (this.model) {
      this.model.visible = true;
    }
  }
  
  public hide(): void {
    if (this.model) {
      this.model.visible = false;
    }
  }
  
  public getName(): string {
    return this.config.name;
  }
  
  public getAmmo(): number {
    return this.ammo;
  }
  
  public getMaxAmmo(): number {
    return this.config.maxAmmo;
  }
  
  public getReserveAmmo(): number {
    return this.reserveAmmo;
  }
  
  public getMaxReserveAmmo(): number {
    return this.config.maxReserveAmmo;
  }
  
  public isCurrentlyReloading(): boolean {
    return this.isReloading;
  }
  
  public addAmmo(amount: number): void {
    this.reserveAmmo = Math.min(this.config.maxReserveAmmo, this.reserveAmmo + amount);
  }
} 