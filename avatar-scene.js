import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

class AvatarScene {
    constructor() {
        this.container = document.getElementById('avatar-3d-container');
        this.canvas = document.getElementById('avatar-canvas');
        
        if (!this.container || !this.canvas) {
            console.warn('Avatar container not found');
            return;
        }
        
        // Configuration des tracks (musique + danse)
        this.tracks = [
            {
                id: 'carlton',
                name: 'Carlton Dance',
                fbx: './carlton Dancing.fbx',
                audio: './It s Not Unusual.mp3'
            },
            {
                id: 'thriller',
                name: 'Thriller',
                fbx: './thriller.fbx',
                audio: './Michael Jackson Thriller Official Video Shortened Version.mp3'
            },
            {
                id: 'sugarhill',
                name: 'Sugarhill Gang',
                fbx: './charley.fbx',
                audio: './The Sugarhill Gang Apache Jump On It Official Video.mp3'
            },
            {
                id: 'hiphop',
                name: 'Hip Hop',
                fbx: './Hip Hop Dancing.fbx',
                audio: './19 - Cut Killer - Mystical Scratch.mp3'
            }
        ];
        
        this.currentTrackIndex = 3; // Démarre avec Hip Hop (déjà chargé)
        this.loadedModels = new Map(); // Cache des modèles FBX
        this.isLoading = false;
        this.animationStarted = false;
        
        this.init();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Camera - Vue de profil avec FOV augmenté pour éviter le crop
        this.camera = new THREE.PerspectiveCamera(
            70, 
            this.container.offsetWidth / this.container.offsetHeight, 
            0.1, 
            1000
        );
        
        // Renderer avec fond transparent
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            alpha: true,
            antialias: true 
        });
        this.renderer.setSize(
            this.container.offsetWidth, 
            this.container.offsetHeight
        );
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimisation perfs
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Lighting - Éclairage soft et enveloppant
        // Lumière ambiante forte pour illumination globale soft
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(ambientLight);
        
        // Hemisphere light pour lumière douce naturelle
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.8);
        hemiLight.position.set(0, 10, 0);
        this.scene.add(hemiLight);
        
        // Lumière de face principale très douce
        const frontLight = new THREE.DirectionalLight(0xffffff, 1.8);
        frontLight.position.set(0, 3, 5);
        this.scene.add(frontLight);
        
        // Lumière de côté droit
        const sideLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sideLight.position.set(4, 2, 0);
        this.scene.add(sideLight);
        
        // Lumière de côté gauche (fill) renforcée
        const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
        fillLight.position.set(-3, 2, 2);
        this.scene.add(fillLight);
        
        // Point lights pour effet wrap-around soft
        const pointLight1 = new THREE.PointLight(0xffffff, 1.0, 10);
        pointLight1.position.set(2, 2, 2);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xffffff, 0.8, 10);
        pointLight2.position.set(-2, 1, 3);
        this.scene.add(pointLight2);
        
        // Camera position - Plus reculée pour éviter le crop
        this.camera.position.set(4, 1.5, 0); // Position latérale plus éloignée
        this.camera.lookAt(0, 1, 0);
        
        // Load initial track
        this.loadTrack(this.currentTrackIndex);
        
        // Handle resize
        window.addEventListener('resize', () => this.onResize());
        
        // Dark mode adaptation
        this.setupDarkModeObserver();
    }

    async loadTrack(trackIndex) {
        if (this.isLoading) return;
        this.isLoading = true;
        
        const track = this.tracks[trackIndex];
        
        // Émission d'événement pour UI
        window.dispatchEvent(new CustomEvent('avatarLoading', { 
            detail: { trackName: track.name } 
        }));
        
        // Vérifier si déjà en cache
        if (this.loadedModels.has(track.id)) {
            this.switchToModel(track.id);
            this.isLoading = false;
            window.dispatchEvent(new CustomEvent('avatarLoaded', { 
                detail: { trackName: track.name } 
            }));
            return;
        }
        
        const loader = new FBXLoader();
        
        try {
            const fbx = await new Promise((resolve, reject) => {
                loader.load(
                    track.fbx,
                    resolve,
                    (progress) => {
                        if (progress.total > 0) {
                            const percent = (progress.loaded / progress.total * 100).toFixed(0);
                            console.log(`Loading ${track.name}: ${percent}%`);
                        }
                    },
                    reject
                );
            });
            
            // Configurer le modèle
            fbx.scale.setScalar(0.035);
            fbx.position.set(0, 0, 0);
            fbx.rotation.y = Math.PI / 4;
            
            // Setup animation
            let mixer = null;
            if (fbx.animations && fbx.animations.length > 0) {
                mixer = new THREE.AnimationMixer(fbx);
                const action = mixer.clipAction(fbx.animations[0]);
                action.setLoop(THREE.LoopRepeat, Infinity);
                action.play();
            }
            
            // Stocker en cache
            this.loadedModels.set(track.id, { model: fbx, mixer });
            
            // Basculer vers ce modèle
            this.switchToModel(track.id);
            
            // Fade in
            this.container.classList.add('loaded');
            
            window.dispatchEvent(new CustomEvent('avatarLoaded', { 
                detail: { trackName: track.name } 
            }));
            
            console.log('Avatar loaded successfully:', track.name);
            
        } catch (error) {
            console.error('Error loading track:', track.name, error);
            window.dispatchEvent(new CustomEvent('avatarError', { 
                detail: { trackName: track.name } 
            }));
        }
        
        this.isLoading = false;
    }

    switchToModel(trackId) {
        // Retirer le modèle actuel
        if (this.avatar) {
            this.scene.remove(this.avatar);
        }
        
        // Ajouter le nouveau modèle
        const cached = this.loadedModels.get(trackId);
        if (cached) {
            this.avatar = cached.model;
            this.mixer = cached.mixer;
            this.scene.add(this.avatar);
            
            if (!this.animationStarted) {
                this.animate();
                this.animationStarted = true;
            }
        }
    }

    cleanupCache(keepTrackId) {
        if (this.loadedModels.size > 3) {
            for (let [id, data] of this.loadedModels.entries()) {
                if (id !== keepTrackId) {
                    // Dispose geometry et materials
                    data.model.traverse((child) => {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(m => m.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    });
                    this.loadedModels.delete(id);
                    console.log('Cleaned up model:', id);
                    break; // Ne supprimer qu'un à la fois
                }
            }
        }
    }

    loadAvatar() {
        // Deprecated - kept for compatibility, use loadTrack instead
        this.loadTrack(this.currentTrackIndex);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Update animation mixer - Vitesse ralentie
        if (this.mixer) {
            this.mixer.update(0.008); // Ralenti 2x (au lieu de 0.016)
        }
        
        // Subtle rotation continue pour dynamisme
        if (this.avatar) {
            this.avatar.rotation.y += 0.0005; // Rotation encore plus subtile
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        if (!this.container) return;
        
        this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(
            this.container.offsetWidth, 
            this.container.offsetHeight
        );
    }
    
    setupDarkModeObserver() {
        // Adapter l'éclairage en mode Zero BS
        const observer = new MutationObserver(() => {
            const isDark = document.body.classList.contains('zb-mode');
            
            // Ajuster opacité en mode dark
            if (isDark) {
                this.container.style.opacity = '0.7'; // Plus subtil en dark mode
            } else {
                this.container.style.opacity = '0.85'; // Style normal
            }
        });
        
        observer.observe(document.body, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
    }
    
    // Cleanup method
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        window.removeEventListener('resize', this.onResize);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.avatarScene = new AvatarScene();
    });
} else {
    window.avatarScene = new AvatarScene();
}
