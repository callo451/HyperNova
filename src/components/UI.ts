import { Player } from '../game/Player';
import { Storm } from '../game/Storm';

export class UI {
  private healthBar: HTMLElement | null;
  private healthFill: HTMLElement | null;
  private ammoCounter: HTMLElement | null;
  private inventorySlots: NodeListOf<Element>;
  private stormTimer: HTMLElement | null;
  
  constructor() {
    // Get UI elements
    this.healthBar = document.getElementById('health-bar');
    this.healthFill = document.getElementById('health-fill');
    this.ammoCounter = document.getElementById('ammo-counter');
    this.inventorySlots = document.querySelectorAll('.inventory-slot');
    this.stormTimer = document.getElementById('storm-timer');
    
    // Initialize UI
    this.init();
  }
  
  private init(): void {
    // Set initial UI state
    if (this.healthFill) {
      this.healthFill.style.width = '100%';
    }
    
    if (this.ammoCounter) {
      this.ammoCounter.textContent = '30 / 120';
    }

    // Create storm timer if it doesn't exist
    if (!this.stormTimer) {
      this.stormTimer = document.createElement('div');
      this.stormTimer.id = 'storm-timer';
      this.stormTimer.className = 'storm-timer';
      const hud = document.getElementById('hud');
      if (hud) {
        hud.appendChild(this.stormTimer);
      }
    }
  }
  
  public update(player: Player, storm: Storm): void {
    this.updateHealth(player);
    this.updateAmmoCounter(player);
    this.updateStormTimer(storm);
  }
  
  private updateStormTimer(storm: Storm): void {
    if (this.stormTimer) {
      const timeRemaining = Math.ceil(storm.getTimeRemaining());
      const phase = storm.getCurrentPhase();
      
      let timerText = '';
      if (phase === 'paused') {
        timerText = `Storm shrinks in: ${timeRemaining}s`;
      } else {
        timerText = `Storm shrinking: ${timeRemaining}s`;
      }
      
      this.stormTimer.textContent = timerText;
      
      // Add warning effect when time is low
      if (timeRemaining <= 10) {
        this.stormTimer.classList.add('warning');
      } else {
        this.stormTimer.classList.remove('warning');
      }
    }
  }
  
  private updateHealth(player: Player): void {
    if (this.healthFill) {
      const healthPercentage = (player.getHealth() / player.getMaxHealth()) * 100;
      this.healthFill.style.width = `${healthPercentage}%`;
      
      // Change color based on health
      if (healthPercentage > 60) {
        this.healthFill.style.backgroundColor = '#ff3e3e';
      } else if (healthPercentage > 30) {
        this.healthFill.style.backgroundColor = '#ff9d3e';
      } else {
        this.healthFill.style.backgroundColor = '#ff3e3e';
      }
    }
  }
  
  private updateAmmoCounter(player: Player): void {
    if (this.ammoCounter) {
      const currentWeapon = player.getCurrentWeapon();
      
      if (currentWeapon) {
        const ammo = currentWeapon.getAmmo();
        const reserveAmmo = currentWeapon.getReserveAmmo();
        this.ammoCounter.textContent = `${ammo} / ${reserveAmmo}`;
        
        // Show reloading text if weapon is reloading
        if (currentWeapon.isCurrentlyReloading()) {
          this.ammoCounter.textContent = 'RELOADING...';
        }
      } else {
        this.ammoCounter.textContent = '0 / 0';
      }
    }
  }
  
  public updateActiveWeapon(index: number): void {
    // Update active weapon in inventory UI
    this.inventorySlots.forEach((slot, i) => {
      if (i === index) {
        slot.classList.add('active');
      } else {
        slot.classList.remove('active');
      }
    });
  }
  
  public showMessage(message: string, duration: number = 3000): void {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.style.position = 'absolute';
    messageElement.style.top = '20%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translateX(-50%)';
    messageElement.style.color = 'white';
    messageElement.style.fontSize = '24px';
    messageElement.style.fontWeight = 'bold';
    messageElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    messageElement.style.padding = '10px 20px';
    messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    messageElement.style.borderRadius = '5px';
    messageElement.style.zIndex = '100';
    messageElement.style.pointerEvents = 'none';
    messageElement.textContent = message;
    
    // Add message to DOM
    document.getElementById('hud')?.appendChild(messageElement);
    
    // Remove message after duration
    setTimeout(() => {
      messageElement.remove();
    }, duration);
  }
  
  public showGameOver(): void {
    // Create game over screen
    const gameOverElement = document.createElement('div');
    gameOverElement.style.position = 'absolute';
    gameOverElement.style.top = '0';
    gameOverElement.style.left = '0';
    gameOverElement.style.width = '100%';
    gameOverElement.style.height = '100%';
    gameOverElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    gameOverElement.style.display = 'flex';
    gameOverElement.style.flexDirection = 'column';
    gameOverElement.style.justifyContent = 'center';
    gameOverElement.style.alignItems = 'center';
    gameOverElement.style.zIndex = '1000';
    
    // Add game over text
    const gameOverText = document.createElement('h1');
    gameOverText.textContent = 'GAME OVER';
    gameOverText.style.color = 'red';
    gameOverText.style.fontSize = '48px';
    gameOverText.style.marginBottom = '20px';
    
    // Add restart button
    const restartButton = document.createElement('button');
    restartButton.textContent = 'RESTART';
    restartButton.style.padding = '10px 20px';
    restartButton.style.fontSize = '24px';
    restartButton.style.backgroundColor = '#ff3e3e';
    restartButton.style.color = 'white';
    restartButton.style.border = 'none';
    restartButton.style.borderRadius = '5px';
    restartButton.style.cursor = 'pointer';
    
    restartButton.addEventListener('click', () => {
      window.location.reload();
    });
    
    // Add elements to game over screen
    gameOverElement.appendChild(gameOverText);
    gameOverElement.appendChild(restartButton);
    
    // Add game over screen to DOM
    document.body.appendChild(gameOverElement);
  }
} 