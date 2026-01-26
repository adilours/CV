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
        
        this.init();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Camera - Vue de profil (side view)
        this.camera = new THREE.PerspectiveCamera(
            50, 
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
        
        // Lighting - Éclairage renforcé pour meilleure visibilité
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        this.scene.add(ambientLight);
        
        // Lumière de face principale
        const frontLight = new THREE.DirectionalLight(0xffffff, 1.5);
        frontLight.position.set(0, 3, 5);
        this.scene.add(frontLight);
        
        // Lumière de côté droit
        const sideLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sideLight.position.set(4, 2, 0);
        this.scene.add(sideLight);
        
        // Lumière de côté gauche (fill)
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
        fillLight.position.set(-3, 2, 2);
        this.scene.add(fillLight);
        
        // Camera position - Vue de profil (side)
        this.camera.position.set(3, 1.5, 0); // Position latérale
        this.camera.lookAt(0, 1, 0);
        
        // Load FBX
        this.loadAvatar();
        
        // Handle resize
        window.addEventListener('resize', () => this.onResize());
        
        // Dark mode adaptation
        this.setupDarkModeObserver();
    }

    loadAvatar() {
        const loader = new FBXLoader();
        
        loader.load(
            './Hip Hop Dancing.fbx',
            (fbx) => {
                this.avatar = fbx;
                this.scene.add(fbx);
                
                // Scale augmenté 3-4x pour meilleure visibilité
                fbx.scale.setScalar(0.035); 
                fbx.position.set(0, 0, 0);
                
                // Rotation pour vue de profil optimale
                fbx.rotation.y = Math.PI / 4; // 45° pour angle dynamique
                
                // Animation setup
                if (fbx.animations && fbx.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(fbx);
                    const action = this.mixer.clipAction(fbx.animations[0]);
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    action.play();
                }
                
                // Fade in
                this.container.classList.add('loaded');
                
                // Start animation loop
                this.animate();
                
                console.log('Avatar loaded successfully');
            },
            (progress) => {
                if (progress.total > 0) {
                    const percent = (progress.loaded / progress.total * 100).toFixed(0);
                    console.log(`Loading avatar: ${percent}%`);
                }
            },
            (error) => {
                console.error('Error loading FBX:', error);
            }
        );
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Update animation mixer
        if (this.mixer) {
            this.mixer.update(0.016); // 60fps
        }
        
        // Subtle rotation continue pour dynamisme
        if (this.avatar) {
            this.avatar.rotation.y += 0.001; // Rotation très subtile
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
