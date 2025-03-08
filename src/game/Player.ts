import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Weapon } from './Weapon';
import { AssetLoader } from './AssetLoader';
import { World } from './World';
import { PowerUp } from './PowerUp';

export class Player {
  // Movement properties
  public moveForward: boolean = false;
  public moveBackward: boolean = false;
  public moveLeft: boolean = false;
  public moveRight: boolean = false;
  public sprint: boolean = false;
  
  // Physics properties
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private direction: THREE.Vector3 = new THREE.Vector3();
  private position: THREE.Vector3 = new THREE.Vector3(0, 2, 0);
  private gravity: number = 9.8;
  private jumpVelocity: number = 5;
  private walkSpeed: number = 5;
  private sprintSpeed: number = 10;
  private isCrouching: boolean = false;
  private isJumping: boolean = false;
  private standingHeight: number = 2;
  private crouchingHeight: number = 1;
  
  // Player stats
  private health: number = 100;
  private maxHealth: number = 100;
  private armor: number = 0;
  private maxArmor: number = 100;
  
  // Weapons
  private weapons: Weapon[] = [];
  private currentWeaponIndex: number = 0;
  
  // Controls and camera
  private controls: PointerLockControls;
  private camera: THREE.PerspectiveCamera;
  
  // Collision properties
  private raycaster: THREE.Raycaster;
  private collisionDistance: number = 1; // Distance to check for collisions
  private playerRadius: number = 0.5; // Player collision radius
  
  // Climbing properties
  private isClimbing: boolean = false;
  private climbSpeed: number = 3;
  
  constructor(controls: PointerLockControls, camera: THREE.PerspectiveCamera) {
    this.controls = controls;
    this.camera = camera;
    
    // Set initial position higher up and away from the center
    this.position = new THREE.Vector3(30, 2, 30);
    this.controls.getObject().position.copy(this.position);

    // Initialize raycaster for collision detection
    this.raycaster = new THREE.Raycaster();
    
    // Set camera properties
    this.camera.near = 0.1;
    this.camera.far = 1000;
    this.camera.updateProjectionMatrix();
  }
  
  public async initWeapons(assetLoader: AssetLoader, scene: THREE.Scene): Promise<void> {
    // Initialize weapons
    const assaultRifle = new Weapon({
      name: 'Assault Rifle',
      damage: 20,
      fireRate: 10,
      ammo: 30,
      maxAmmo: 30,
      reserveAmmo: 120,
      maxReserveAmmo: 240,
      reloadTime: 2,
      modelPath: '/models/weapons/assault_rifle.glb',
      muzzleFlashPosition: new THREE.Vector3(0, 0, -1),
      isAutomatic: true
    }, assetLoader, this.camera, scene);
    
    const shotgun = new Weapon({
      name: 'Shotgun',
      damage: 80,
      fireRate: 1,
      ammo: 8,
      maxAmmo: 8,
      reserveAmmo: 32,
      maxReserveAmmo: 64,
      reloadTime: 3,
      modelPath: '/models/weapons/shotgun.glb',
      muzzleFlashPosition: new THREE.Vector3(0, 0, -1.2),
      isAutomatic: false
    }, assetLoader, this.camera, scene);
    
    const pistol = new Weapon({
      name: 'Pistol',
      damage: 15,
      fireRate: 3,
      ammo: 12,
      maxAmmo: 12,
      reserveAmmo: 48,
      maxReserveAmmo: 96,
      reloadTime: 1.5,
      modelPath: '/models/weapons/pistol.glb',
      muzzleFlashPosition: new THREE.Vector3(0, 0, -0.8),
      isAutomatic: false
    }, assetLoader, this.camera, scene);
    
    // Add weapons to player's inventory
    this.weapons.push(assaultRifle, shotgun, pistol);
    
    // Initialize all weapons
    await Promise.all(this.weapons.map(weapon => weapon.init()));
    
    // Set current weapon
    this.switchWeapon(0);
  }
  
  public update(delta: number, world: World): void {
    // Check for climbing state
    this.checkClimbing(world);

    // Apply gravity only when not climbing
    if (!this.isClimbing) {
      if (!this.isOnGround(world)) {
        this.velocity.y -= this.gravity * delta;
      } else if (this.velocity.y < 0) {
        this.velocity.y = -0.1;
        this.isJumping = false;
      }
    }
    
    // Calculate movement direction
    this.direction.z = Number(this.moveBackward) - Number(this.moveForward);
    this.direction.x = Number(this.moveLeft) - Number(this.moveRight);
    this.direction.normalize();
    
    // Apply movement
    const speed = this.sprint ? this.sprintSpeed : this.walkSpeed;
    const actualSpeed = this.isCrouching ? speed * 0.5 : speed;
    
    // Store intended velocity
    let intendedVelocityX = 0;
    let intendedVelocityZ = 0;

    if (this.moveForward || this.moveBackward) {
      intendedVelocityZ = -this.direction.z * actualSpeed;
      // Apply climbing movement
      if (this.isClimbing && this.moveForward) {
        this.velocity.y = this.climbSpeed;
      } else if (this.isClimbing) {
        this.velocity.y = 0;
      }
    }
    
    if (this.moveLeft || this.moveRight) {
      intendedVelocityX = -this.direction.x * actualSpeed;
    }

    // Check collisions and adjust velocity
    const currentPosition = this.controls.getObject().position;
    const collisionResults = this.checkCollisions(world, currentPosition, intendedVelocityX, intendedVelocityZ);
    
    this.velocity.x = collisionResults.velocityX;
    this.velocity.z = collisionResults.velocityZ;
    
    // Update position
    this.controls.getObject().position.y += this.velocity.y * delta;
    this.controls.moveRight(this.velocity.x * delta);
    this.controls.moveForward(this.velocity.z * delta);
    
    // Ensure player doesn't fall below ground
    if (this.controls.getObject().position.y < (this.isCrouching ? this.crouchingHeight : this.standingHeight) / 2) {
      this.controls.getObject().position.y = (this.isCrouching ? this.crouchingHeight : this.standingHeight) / 2;
      this.velocity.y = 0;
    }
    
    // Update current weapon
    if (this.weapons.length > 0 && this.currentWeaponIndex >= 0) {
      this.weapons[this.currentWeaponIndex].update(delta);
    }
  }
  
  private checkCollisions(world: World, position: THREE.Vector3, velocityX: number, velocityZ: number): { velocityX: number, velocityZ: number } {
    const objects = world.getCollidableObjects();
    const directions = [
      new THREE.Vector3(1, 0, 0),  // Right
      new THREE.Vector3(-1, 0, 0), // Left
      new THREE.Vector3(0, 0, 1),  // Forward
      new THREE.Vector3(0, 0, -1), // Backward
    ];

    // Check each direction for collisions
    for (const direction of directions) {
      this.raycaster.set(position, direction);
      const intersects = this.raycaster.intersectObjects(objects);

      // If there's a collision within our radius + collision distance
      if (intersects.length > 0 && intersects[0].distance < this.playerRadius + this.collisionDistance) {
        // Check if we're moving towards the object
        const dot = direction.dot(new THREE.Vector3(velocityX, 0, velocityZ));
        if (dot > 0) {
          // If moving towards object, prevent movement in that direction
          if (Math.abs(direction.x) > 0) {
            velocityX = 0;
          }
          if (Math.abs(direction.z) > 0) {
            velocityZ = 0;
          }
        }
      }
    }

    return { velocityX, velocityZ };
  }
  
  public jump(): void {
    this.velocity.y = this.jumpVelocity;
  }
  
  public toggleCrouch(): void {
    this.isCrouching = !this.isCrouching;
    
    // Adjust camera height
    const heightDifference = this.standingHeight - this.crouchingHeight;
    if (this.isCrouching) {
      this.controls.getObject().position.y -= heightDifference / 2;
    } else {
      this.controls.getObject().position.y += heightDifference / 2;
    }
  }
  
  public shoot(): void {
    if (this.weapons.length > 0 && this.currentWeaponIndex >= 0) {
      this.weapons[this.currentWeaponIndex].shoot();
    }
  }
  
  public switchWeapon(index: number): void {
    if (index >= 0 && index < this.weapons.length) {
      // Hide current weapon
      if (this.currentWeaponIndex >= 0 && this.currentWeaponIndex < this.weapons.length) {
        this.weapons[this.currentWeaponIndex].hide();
      }
      
      // Switch to new weapon
      this.currentWeaponIndex = index;
      this.weapons[this.currentWeaponIndex].show();
    }
  }
  
  public takeDamage(amount: number): void {
    // Apply damage to armor first
    if (this.armor > 0) {
      const armorDamage = Math.min(this.armor, amount * 0.5);
      this.armor -= armorDamage;
      amount -= armorDamage;
    }
    
    // Apply remaining damage to health
    this.health = Math.max(0, this.health - amount);
  }
  
  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  public addArmor(amount: number): void {
    this.armor = Math.min(this.maxArmor, this.armor + amount);
  }
  
  public getCurrentWeapon(): Weapon | null {
    if (this.weapons.length > 0 && this.currentWeaponIndex >= 0) {
      return this.weapons[this.currentWeaponIndex];
    }
    return null;
  }
  
  public getHealth(): number {
    return this.health;
  }
  
  public getMaxHealth(): number {
    return this.maxHealth;
  }
  
  public getArmor(): number {
    return this.armor;
  }
  
  public getMaxArmor(): number {
    return this.maxArmor;
  }
  
  private isOnGround(world: World | null): boolean {
    // Simple ground check
    // In a real game, you would use raycasting to check for collision with the ground
    return this.controls.getObject().position.y <= (this.isCrouching ? this.crouchingHeight : this.standingHeight) / 2;
  }
  
  public getPosition(): THREE.Vector3 {
    return this.controls.getObject().position;
  }
  
  public getRotation(): number {
    // Get the player's rotation around the Y axis (yaw)
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    return Math.atan2(direction.x, direction.z);
  }
  
  public pickUpPowerUp(powerUp: PowerUp): void {
    if (powerUp.getType() === 'shield') {
      this.addShield();
    }
    // Logic to remove the power-up from the scene
  }
  
  private addShield(): void {
    // Logic to add shield effect (e.g., increase armor)
    this.armor += 50; // Example: increase armor by 50
  }

  private checkClimbing(world: World): void {
    const position = this.controls.getObject().position;
    
    // Check in front of the player for climbable surfaces
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(this.camera.quaternion);
    forward.y = 0; // Keep it horizontal
    forward.normalize();
    
    this.raycaster.set(position, forward);
    const intersects = this.raycaster.intersectObjects(world.getCollidableObjects());
    
    // Check if we're near a climbable surface
    let canClimb = false;
    for (const intersect of intersects) {
        if (intersect.distance < 1.5 && // Close enough to climb
            intersect.object.userData.isClimbable) { // Is a climbing zone
            canClimb = true;
            break;
        }
    }
    
    // Update climbing state
    if (canClimb && this.moveForward) {
        this.isClimbing = true;
        // Snap to ladder position when starting to climb
        if (!this.isClimbing) {
            const ladder = intersects[0].object;
            const ladderPos = new THREE.Vector3();
            ladder.getWorldPosition(ladderPos);
            // Maintain player's current Y position
            this.controls.getObject().position.x = ladderPos.x;
            this.controls.getObject().position.z = ladderPos.z - 1;
        }
    } else {
        this.isClimbing = false;
    }
    
    // If climbing, disable gravity and allow vertical movement
    if (this.isClimbing) {
        this.velocity.y = this.moveForward ? this.climbSpeed : 
                         this.moveBackward ? -this.climbSpeed : 0;
    }
  }
} 