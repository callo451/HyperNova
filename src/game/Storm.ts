import * as THREE from 'three';

interface StormConfig {
  initialRadius: number;
  finalRadius: number;
  shrinkDuration: number;
  pauseDuration: number;
  damage: number;
  color: number;
}

export class Storm {
  private radius: number;
  private targetRadius: number;
  private center: THREE.Vector2;
  private mesh: THREE.Mesh;
  private config: StormConfig;
  private phase: 'shrinking' | 'paused' = 'paused';
  private timeRemaining: number;
  private nextPhaseTime: number;

  constructor(scene: THREE.Scene) {
    this.config = {
      initialRadius: 200, // Reduced from 500 to match map size
      finalRadius: 20,    // Reduced from 50 to be more challenging
      shrinkDuration: 60, // Time in seconds for storm to shrink
      pauseDuration: 30,  // Time in seconds between shrinks
      damage: 2,         // Damage per second when outside storm
      color: 0x00ffff,   // Sci-fi cyan color
    };

    this.radius = this.config.initialRadius;
    this.targetRadius = this.config.initialRadius;
    this.center = new THREE.Vector2(0, 0);
    this.timeRemaining = this.config.pauseDuration;
    this.nextPhaseTime = this.config.pauseDuration;

    // Create storm visual effect
    const geometry = new THREE.CylinderGeometry(this.radius, this.radius, 300, 64); // Made taller
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        color: { value: new THREE.Color(this.config.color) },
        time: { value: 0 },
        radius: { value: this.radius },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        uniform float radius;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          // Base opacity gradient from edge to center
          float distFromCenter = length(vPosition.xz) / radius;
          float edgeGradient = smoothstep(0.95, 1.0, distFromCenter);
          
          // Animated noise pattern
          float noise = sin(vUv.y * 20.0 + time * 2.0) * 0.5 + 0.5;
          noise *= sin(vUv.x * 10.0 - time * 1.5) * 0.5 + 0.5;
          
          // Vertical gradient
          float heightGradient = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
          
          // Pulse effect
          float pulse = sin(time * 3.0) * 0.5 + 0.5;
          
          // Combine effects
          float opacity = mix(0.4, 0.8, edgeGradient); // Increased base opacity
          opacity *= heightGradient;
          opacity *= mix(0.8, 1.0, noise);
          opacity *= mix(0.9, 1.0, pulse);
          
          // Add color variation
          vec3 finalColor = mix(color, color * 1.5, noise * pulse);
          
          gl_FragColor = vec4(finalColor, opacity);
        }
      `,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.y = 150; // Raised higher to be more visible
    scene.add(this.mesh);

    // Add a ground ring to show the storm boundary
    const ringGeometry = new THREE.RingGeometry(this.radius - 2, this.radius, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: this.config.color,
      transparent: true,
      opacity: 0.8, // Increased opacity
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    this.mesh.add(ring);
  }

  public update(delta: number, playerPosition: THREE.Vector3): number {
    // Update shader time
    const material = this.mesh.material as THREE.ShaderMaterial;
    material.uniforms.time.value += delta;

    // Update storm phase and timing
    this.timeRemaining -= delta;
    
    if (this.timeRemaining <= 0) {
      if (this.phase === 'paused') {
        // Start shrinking
        this.phase = 'shrinking';
        this.timeRemaining = this.config.shrinkDuration;
        this.nextPhaseTime = this.config.shrinkDuration;
        this.targetRadius = Math.max(this.radius * 0.7, this.config.finalRadius);
      } else {
        // Start pause
        this.phase = 'paused';
        this.timeRemaining = this.config.pauseDuration;
        this.nextPhaseTime = this.config.pauseDuration;
      }
    }

    // Update storm radius
    if (this.phase === 'shrinking') {
      const shrinkAmount = delta * ((this.radius - this.targetRadius) / this.timeRemaining);
      this.radius = Math.max(this.radius - shrinkAmount, this.targetRadius);
      
      // Update visual effect
      const scale = this.radius / this.config.initialRadius;
      this.mesh.scale.set(scale, 1, scale);
      material.uniforms.radius.value = this.radius;
    }

    // Calculate damage (if player is outside the storm)
    const distanceFromCenter = new THREE.Vector2(playerPosition.x, playerPosition.z).distanceTo(this.center);
    const isOutsideStorm = distanceFromCenter > this.radius;
    
    return isOutsideStorm ? this.config.damage * delta : 0;
  }

  public getTimeRemaining(): number {
    return this.timeRemaining;
  }

  public getNextPhaseTime(): number {
    return this.nextPhaseTime;
  }

  public getCurrentPhase(): string {
    return this.phase;
  }

  public getRadius(): number {
    return this.radius;
  }
} 