import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TextureLoader } from 'three';

interface AssetCache {
  models: Map<string, THREE.Object3D>;
  textures: Map<string, THREE.Texture>;
}

export class AssetLoader {
  private gltfLoader: GLTFLoader;
  private textureLoader: TextureLoader;
  private cache: AssetCache;
  
  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.cache = {
      models: new Map<string, THREE.Object3D>(),
      textures: new Map<string, THREE.Texture>()
    };
  }
  
  public async loadModel(path: string): Promise<THREE.Object3D> {
    // Check cache first
    if (this.cache.models.has(path)) {
      const cachedModel = this.cache.models.get(path);
      if (cachedModel) {
        // Clone the model to avoid modifying the cached version
        return cachedModel.clone();
      }
    }
    
    // Load the model
    try {
      const gltf = await this.loadGLTF(path);
      const model = gltf.scene;
      
      // Process the model (add shadows, etc.)
      model.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Cache the model
      this.cache.models.set(path, model.clone());
      
      return model;
    } catch (error) {
      console.error(`Error loading model from ${path}:`, error);
      // Return an empty object as a fallback
      return new THREE.Object3D();
    }
  }
  
  public async loadTexture(path: string): Promise<THREE.Texture> {
    // Check cache first
    if (this.cache.textures.has(path)) {
      const cachedTexture = this.cache.textures.get(path);
      if (cachedTexture) {
        return cachedTexture.clone();
      }
    }
    
    // Load the texture
    try {
      const texture = await this.loadTextureAsync(path);
      
      // Cache the texture
      this.cache.textures.set(path, texture);
      
      return texture;
    } catch (error) {
      console.error(`Error loading texture from ${path}:`, error);
      // Return a default texture as a fallback
      return new THREE.Texture();
    }
  }
  
  private loadGLTF(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error)
      );
    });
  }
  
  private loadTextureAsync(path: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          resolve(texture);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }
  
  public async loadAssets(): Promise<void> {
    // Preload common assets here
    const assetsToPreload = [
      // Models
      { type: 'model', path: '/models/weapons/assault_rifle.glb' },
      { type: 'model', path: '/models/weapons/shotgun.glb' },
      { type: 'model', path: '/models/weapons/pistol.glb' },
      
      // Textures
      { type: 'texture', path: '/textures/ground.jpg' },
      { type: 'texture', path: '/textures/wall.jpg' },
    ];
    
    const loadPromises = assetsToPreload.map(asset => {
      if (asset.type === 'model') {
        return this.loadModel(asset.path).catch(error => {
          console.warn(`Failed to preload model ${asset.path}:`, error);
          return null;
        });
      } else if (asset.type === 'texture') {
        return this.loadTexture(asset.path).catch(error => {
          console.warn(`Failed to preload texture ${asset.path}:`, error);
          return null;
        });
      }
      return Promise.resolve(null);
    });
    
    await Promise.all(loadPromises);
    console.log('Assets preloaded successfully');
  }
  
  public clearCache(): void {
    this.cache.models.clear();
    this.cache.textures.clear();
  }
} 