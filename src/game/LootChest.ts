import * as THREE from 'three';

export class LootChest {
    private position: THREE.Vector3;
    private isOpen: boolean = false;
    private mesh: THREE.Mesh;

    constructor(position: THREE.Vector3) {
        this.position = position;
        this.mesh = this.createChestMesh();
    }

    private createChestMesh(): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown color for the chest
        const chest = new THREE.Mesh(geometry, material);
        chest.position.copy(this.position);
        return chest;
    }

    public getMesh(): THREE.Mesh {
        return this.mesh;
    }

    public open(): void {
        this.isOpen = true;
        // Logic to drop loot (e.g., power-ups)
    }

    public isOpened(): boolean {
        return this.isOpen;
    }
} 