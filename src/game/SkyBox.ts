import * as THREE from 'three';

export class SkyBox {
  private scene: THREE.Scene;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createSkyBox();
  }
  
  private createSkyBox(): void {
    // Create a simple procedural skybox for now
    // In a real game, you would use 6 textures for a proper skybox
    
    const geometry = new THREE.BoxGeometry(1000, 1000, 1000);
    
    // Create materials for each side of the skybox
    const materials = [
      this.createSpaceMaterial(0x000022), // right
      this.createSpaceMaterial(0x000022), // left
      this.createSpaceMaterial(0x000033), // top
      this.createSpaceMaterial(0x000011), // bottom
      this.createSpaceMaterial(0x000022), // front
      this.createSpaceMaterial(0x000022)  // back
    ];
    
    // Create the skybox mesh
    const skybox = new THREE.Mesh(geometry, materials);
    skybox.position.set(0, 0, 0);
    
    // Add stars to the skybox
    this.addStars();
    
    // Add a distant nebula
    this.addNebula();
    
    // Add the skybox to the scene
    this.scene.add(skybox);
  }
  
  private createSpaceMaterial(color: number): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.BackSide,
      fog: false
    });
  }
  
  private addStars(): void {
    // Create a particle system for stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      sizeAttenuation: false
    });
    
    // Generate random star positions
    const starsCount = 2000;
    const starsPositions = new Float32Array(starsCount * 3);
    
    for (let i = 0; i < starsCount; i++) {
      const i3 = i * 3;
      // Generate random positions on a sphere
      const radius = 500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      starsPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starsPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starsPositions[i3 + 2] = radius * Math.cos(phi);
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    
    // Create the particle system
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }
  
  private addNebula(): void {
    // Create a simple nebula effect using a large sphere with a gradient material
    const nebulaGeometry = new THREE.SphereGeometry(400, 32, 32);
    
    // Create a shader material for the nebula
    const nebulaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vPosition;
        
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        uniform float time;
        
        // Simple noise function
        float noise(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
        }
        
        void main() {
          // Create a gradient based on position
          vec3 pos = normalize(vPosition);
          float n = noise(pos * 5.0);
          
          // Create nebula colors
          vec3 color1 = vec3(0.1, 0.0, 0.2); // Dark purple
          vec3 color2 = vec3(0.5, 0.0, 0.5); // Purple
          vec3 color3 = vec3(0.0, 0.2, 0.4); // Blue
          
          // Mix colors based on position and noise
          vec3 finalColor = mix(color1, color2, n);
          finalColor = mix(finalColor, color3, noise(pos * 3.0 + vec3(time * 0.01)));
          
          // Add some stars
          if (n > 0.97) {
            finalColor = vec3(1.0);
          }
          
          // Apply alpha for transparency
          float alpha = smoothstep(0.0, 0.5, n) * 0.3;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    
    // Create the nebula mesh
    const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
    
    // Animate the nebula
    const animate = () => {
      nebulaMaterial.uniforms.time.value = performance.now() / 1000;
      requestAnimationFrame(animate);
    };
    animate();
    
    this.scene.add(nebula);
  }
} 