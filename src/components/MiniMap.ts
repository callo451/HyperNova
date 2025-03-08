import * as THREE from 'three';
import { Player } from '../game/Player';
import { World } from '../game/World';
import { Storm } from '../game/Storm';

export class MiniMap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private playerIndicator: HTMLElement;
  private mapScale: number;
  private worldSize: number;
  
  constructor() {
    this.canvas = document.getElementById('mini-map') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.playerIndicator = document.getElementById('player-indicator')!;
    
    // Set canvas size
    this.canvas.width = 200;
    this.canvas.height = 200;
    
    // World size is 200x200, map is 200x200 pixels
    this.worldSize = 200;
    this.mapScale = this.canvas.width / this.worldSize;
    
    // Initial draw
    this.drawBackground();
    this.drawCommandCenter();
    this.drawOutposts();
    this.drawCargoContainers();
  }
  
  public update(player: Player, world: World, storm?: Storm): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw map elements
    this.drawBackground();
    this.drawCommandCenter();
    this.drawOutposts();
    this.drawCargoContainers();
    
    // Draw storm if available
    if (storm) {
      this.drawStorm(storm);
    }
    
    // Update player indicator position
    const playerPos = player.getPosition();
    const mapX = (playerPos.x + this.worldSize / 2) * this.mapScale;
    const mapZ = (playerPos.z + this.worldSize / 2) * this.mapScale;
    
    this.playerIndicator.style.left = `${mapX}px`;
    this.playerIndicator.style.top = `${mapZ}px`;
    
    // Update player indicator rotation
    const rotation = player.getRotation();
    this.playerIndicator.style.transform = `translate(-50%, -50%) rotate(${rotation}rad)`;
  }
  
  private drawStorm(storm: Storm): void {
    const center = new THREE.Vector2(this.canvas.width / 2, this.canvas.height / 2);
    const radius = (storm.getRadius() / this.worldSize) * this.canvas.width;
    
    // Draw storm boundary
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#00ffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Draw storm area (outside safe zone)
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    this.ctx.rect(this.canvas.width, 0, -this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
    this.ctx.fill();
    
    // Add pulse effect when storm is shrinking
    if (storm.getCurrentPhase() === 'shrinking') {
      this.ctx.beginPath();
      this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }
  }
  
  private drawBackground(): void {
    // Draw background
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i <= this.canvas.width; i += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.canvas.height);
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
      this.ctx.stroke();
    }
  }
  
  private drawCommandCenter(): void {
    // Draw command center
    this.ctx.fillStyle = '#3366ff';
    this.ctx.beginPath();
    this.ctx.arc(
      this.canvas.width / 2,
      this.canvas.height / 2,
      15 * this.mapScale,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }
  
  private drawOutposts(): void {
    // Draw outposts at corners
    const outpostPositions = [
      { x: 80, z: 80 },
      { x: -80, z: -80 },
      { x: 80, z: -80 },
      { x: -80, z: 80 }
    ];
    
    this.ctx.fillStyle = '#ff3366';
    outpostPositions.forEach(pos => {
      const mapX = (pos.x + this.worldSize / 2) * this.mapScale;
      const mapZ = (pos.z + this.worldSize / 2) * this.mapScale;
      
      this.ctx.beginPath();
      this.ctx.arc(mapX, mapZ, 8 * this.mapScale, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
  
  private drawCargoContainers(): void {
    const containerPositions = [
      { x: 30, z: 30 },
      { x: -30, z: -30 },
      { x: 30, z: -30 },
      { x: -30, z: 30 }
    ];
    
    this.ctx.fillStyle = '#ff3366';
    containerPositions.forEach(pos => {
      const mapX = (pos.x + this.worldSize / 2) * this.mapScale;
      const mapZ = (pos.z + this.worldSize / 2) * this.mapScale;
      const width = 6 * this.mapScale;
      const height = 12 * this.mapScale;
      
      this.ctx.fillRect(mapX - width / 2, mapZ - height / 2, width, height);
    });
  }
} 