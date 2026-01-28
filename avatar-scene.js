import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

class AvatarScene {
    constructor() {
        this.container = document.getElementById('avatar-3d-container');
        this.canvas = document.getElementById('avatar-canvas');
        
        if (!this.container || !this.canvas) {
            console.warn('Avatar container not found');
            return;
        }
        
        // Déterminer si on est en mode Zero Bullshit
        this.isZeroBullshitMode = document.body.classList.contains('zb-mode');
        
        // Configuration des animations selon le mode
        if (this.isZeroBullshitMode) {
            // Mode ZB : danses avec changement de tracks
            this.tracks = [
                {
                    id: 'carlton',
                    name: 'Carlton Dance',
                    fbx: './carlton Dancing.fbx',
                    audio: './It s Not Unusual.mp3',
                    type: 'fbx'
                },
                {
                    id: 'thriller',
                    name: 'Thriller',
                    fbx: './thriller.fbx',
                    audio: './Michael Jackson Thriller Official Video Shortened Version.mp3',
                    type: 'fbx'
                },
                {
                    id: 'sugarhill',
                    name: 'Sugarhill Gang',
                    fbx: './charley.fbx',
                    audio: './The Sugarhill Gang Apache Jump On It Official Video.mp3',
                    type: 'fbx'
                }
            ];
        } else {
            // Mode Normal : running en loop, pas de tracks audio
            this.tracks = [
                {
                    id: 'running',
                    name: 'Running',
                    fbx: './Jogging_compressed.glb',
                    audio: null,
                    type: 'glb'
                }
            ];
        }
        
        this.currentTrackIndex = 0;
        this.loadedModels = new Map(); // Cache des modèles FBX/GLB
        this.isLoading = false;
        this.animationStarted = false;
        
        // Animation transition properties
        this.transitionSpeed = 0.008; // Vitesse normale
        this.targetSpeed = 0.008;
        this.isTransitioning = false;
        
        this.init();
    }

    calculateResponsiveScale() {
        const width = window.innerWidth;
        
        // Échelle de base selon la largeur d'écran
        if (width < 1440) {
            return 0.030; // Petits écrans : plus petit
        } else if (width < 1920) {
            return 0.035; // Écrans moyens : taille actuelle
        } else if (width < 2560) {
            return 0.038; // Grands écrans : légèrement plus grand
        } else {
            return 0.040; // Très grands écrans : encore plus grand
        }
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
            premultipliedAlpha: false,
            antialias: true 
        });
        this.renderer.setSize(
            this.container.offsetWidth, 
            this.container.offsetHeight
        );
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimisation perfs
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // CRITICAL FIX: Set clear color to transparent
        this.renderer.setClearColor(0x000000, 0); // Black with alpha 0 = fully transparent
        
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
        
        // Camera position - Recentré car le container est maintenant décalé via CSS
        this.camera.position.set(4.5, 0.8, 0); 
        this.camera.lookAt(0, 0.5, 0);
        
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
        
        // Ralentir l'animation pendant la transition
        this.slowDownForTransition();
        
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
        
        // #region agent log
        console.log('[DEBUG-H1] loadTrack START - track:', track.id, 'type:', track.type, 'file:', track.fbx);
        // #endregion
        
        // Choisir le bon loader selon le type
        let loader;
        
        if (track.type === 'glb') {
            // Configuration du GLTFLoader avec DRACO support
            loader = new GLTFLoader();
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
            loader.setDRACOLoader(dracoLoader);
            // #region agent log
            console.log('[DEBUG-H1] GLB loader configured with DRACO');
            // #endregion
        } else {
            loader = new FBXLoader();
        }
        
        try {
            let model;
            
            if (track.type === 'glb') {
                // #region agent log
                console.log('[DEBUG-H1] Loading GLB file...');
                // #endregion
                // Charger GLB
                const gltf = await new Promise((resolve, reject) => {
                    loader.load(track.fbx, resolve, undefined, reject);
                });
                // #region agent log
                console.log('[DEBUG-H1] GLB loaded successfully, scene:', gltf.scene ? 'exists' : 'null', 'animations:', gltf.animations?.length || 0);
                // #endregion
                model = gltf.scene;
                
                // Pour GLB, les animations sont dans gltf.animations
                if (gltf.animations && gltf.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(model);
                    const action = mixer.clipAction(gltf.animations[0]);
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    action.play();
                    
                    // Stocker le mixer séparément pour GLB
                    model.userData.mixer = mixer;
                }
            } else {
                // Charger FBX
                model = await new Promise((resolve, reject) => {
                    loader.load(track.fbx, resolve, undefined, reject);
                });
                
                // Pour FBX, les animations sont dans fbx.animations
                if (model.animations && model.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(model);
                    const action = mixer.clipAction(model.animations[0]);
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    action.play();
                    
                    model.userData.mixer = mixer;
                }
            }
            
            // Configurer le modèle
            let scale;
            if (track.type === 'glb') {
                // #region agent log
                const boxBeforeScale = new THREE.Box3().setFromObject(model);
                const sizeBeforeScale = new THREE.Vector3();
                boxBeforeScale.getSize(sizeBeforeScale);
                console.log('[DEBUG-H2] GLB BEFORE scale:', {minY:boxBeforeScale.min.y, maxY:boxBeforeScale.max.y, sizeX:sizeBeforeScale.x, sizeY:sizeBeforeScale.y, sizeZ:sizeBeforeScale.z});
                // #endregion
                
                // Scale fixe calibré pour le modèle GLB
                // Le modèle GLB natif fait ~0.47 unités de haut
                scale = 2.0;
                model.scale.setScalar(scale);
                model.userData.baseScale = scale;
                
                // #region agent log
                console.log('[DEBUG-H4] Scale applied:', scale);
                // #endregion
                
                // Centrer le modèle après scaling
                const box = new THREE.Box3().setFromObject(model);
                const center = new THREE.Vector3();
                box.getCenter(center);
                const size = new THREE.Vector3();
                box.getSize(size);
                
                // #region agent log
                console.log('[DEBUG-H2-H3] Box AFTER scale:', {minY:box.min.y, maxY:box.max.y, sizeY:size.y, centerY:center.y});
                // #endregion
                
                // Centrer horizontalement et en profondeur
                model.position.set(-center.x, 0, -center.z);
                
                // Placer les pieds plus bas
                model.position.y = -box.min.y - 1.5;
                
                // #region agent log
                console.log('[DEBUG-H3-H5] FINAL position:', {posX:model.position.x, posY:model.position.y, posZ:model.position.z, finalHeight:size.y});
                // #endregion
            } else {
                // FBX: logique existante
                scale = this.calculateResponsiveScale();
                model.userData.baseScale = scale;
                model.scale.setScalar(scale);
                model.position.set(0, 0, 0);
            }

            model.rotation.y = Math.PI / 4;
            
            // Stocker en cache
            this.loadedModels.set(track.id, { 
                model: model, 
                mixer: model.userData.mixer, 
                scale 
            });
            
            // Basculer vers ce modèle
            this.switchToModel(track.id);
            
            // Fade in
            this.container.classList.add('loaded');
            
            window.dispatchEvent(new CustomEvent('avatarLoaded', { 
                detail: { trackName: track.name } 
            }));
            
        } catch (error) {
            // #region agent log
            console.log('[DEBUG-ERROR] GLB/FBX loading FAILED:', error.message);
            // #endregion
            console.error(error);
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
            
            // S'assurer que la position est centrale dans le container décalé
            if (cached.model) {
                this.avatar.position.copy(cached.model.position);
            }
            
            this.scene.add(this.avatar);
            
            // Accélérer l'animation après le changement
            this.speedUpAfterTransition();
            
            if (!this.animationStarted) {
                this.animate();
                this.animationStarted = true;
            }
        }
    }
    
    slowDownForTransition() {
        // Ralentir progressivement l'animation
        this.targetSpeed = 0.002;
        this.isTransitioning = true;
    }
    
    speedUpAfterTransition() {
        // Accélérer progressivement l'animation
        this.targetSpeed = 0.008;
        this.isTransitioning = true;
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
        
        // Interpolation progressive de la vitesse (lerp avec easing)
        if (this.isTransitioning) {
            const lerpFactor = 0.05; // Facteur d'interpolation (plus petit = plus lent)
            const diff = Math.abs(this.transitionSpeed - this.targetSpeed);
            
            if (diff < 0.0001) {
                // Transition terminée
                this.transitionSpeed = this.targetSpeed;
                this.isTransitioning = false;
            } else {
                // Interpolation ease-in-out
                this.transitionSpeed += (this.targetSpeed - this.transitionSpeed) * lerpFactor;
            }
        }
        
        // Update animation mixer avec vitesse dynamique
        if (this.mixer) {
            this.mixer.update(this.transitionSpeed);
        }
        
        // Subtle rotation continue pour dynamisme
        if (this.avatar) {
            this.avatar.rotation.y += 0.0005; // Rotation encore plus subtile
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        if (!this.container || this.container.offsetWidth === 0) return;
        
        this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(
            this.container.offsetWidth, 
            this.container.offsetHeight
        );
        
        // Ne PAS modifier le scale au resize
        // Le scale est fixe et ne dépend pas de la taille du viewport
    }
    
    setupDarkModeObserver() {
        // Adapter l'éclairage et switcher les animations selon le mode Zero BS
        const observer = new MutationObserver(() => {
            const isDark = document.body.classList.contains('zb-mode');
            
            // Si le mode a changé, recharger l'animation appropriée
            if (isDark !== this.isZeroBullshitMode) {
                this.isZeroBullshitMode = isDark;
                this.switchMode();
            }
            
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
    
    switchMode() {
        // Nettoyer l'animation actuelle
        if (this.avatar) {
            this.scene.remove(this.avatar);
            this.avatar = null;
            this.mixer = null;
        }
        
        // Vider le cache
        this.loadedModels.forEach((data) => {
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
        });
        this.loadedModels.clear();
        
        // Reconfigurer les tracks
        if (this.isZeroBullshitMode) {
            this.tracks = [
                {
                    id: 'carlton',
                    name: 'Carlton Dance',
                    fbx: './carlton Dancing.fbx',
                    audio: './It s Not Unusual.mp3',
                    type: 'fbx'
                },
                {
                    id: 'thriller',
                    name: 'Thriller',
                    fbx: './thriller.fbx',
                    audio: './Michael Jackson Thriller Official Video Shortened Version.mp3',
                    type: 'fbx'
                },
                {
                    id: 'sugarhill',
                    name: 'Sugarhill Gang',
                    fbx: './charley.fbx',
                    audio: './The Sugarhill Gang Apache Jump On It Official Video.mp3',
                    type: 'fbx'
                }
            ];
            this.currentTrackIndex = 0;
        } else {
            this.tracks = [
                {
                    id: 'running',
                    name: 'Running',
                    fbx: './Jogging_compressed.glb',
                    audio: null,
                    type: 'glb'
                }
            ];
            this.currentTrackIndex = 0;
        }
        
        // Charger la nouvelle animation
        this.loadTrack(this.currentTrackIndex);
        
        // Dispatch event pour le player audio
        window.dispatchEvent(new CustomEvent('avatarModeChanged', { 
            detail: { isZeroBullshit: this.isZeroBullshitMode } 
        }));
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
