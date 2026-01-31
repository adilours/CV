class AudioPlayer {
    constructor(avatarScene) {
        this.avatarScene = avatarScene;
        this.tracks = avatarScene.tracks || [];
        this.currentTrackIndex = 0; // Carlton par défaut
        this.isRandom = false; // Mode séquentiel activé par défaut
        
        // Spatial audio awareness
        this.targetVolume = 1;
        this.isFadingOut = false;
        this.wasPlayingBeforeFade = false;
        this.fadeAnimation = null;
        
        // Récupérer les éléments DOM avec vérification
        this.audio = document.getElementById('audio-element');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.playIcon = document.getElementById('play-icon');
        this.pauseIcon = document.getElementById('pause-icon');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.loadingIndicator = document.getElementById('loading-indicator');
        
        // Vérifier que les éléments critiques existent
        if (!this.audio || !this.playPauseBtn || !this.prevBtn || !this.nextBtn) {
            return;
        }
        
        this.init();
    }
    
    init() {
        // Event listeners - vérifier que les éléments existent
        if (this.playPauseBtn) {
            this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        }
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.previousTrack());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextTrack());
        }
        
        // Audio events
        if (this.audio) {
            this.audio.addEventListener('ended', () => this.nextTrack());
        }
        
        // Avatar loading events
        window.addEventListener('avatarLoading', () => this.showLoading());
        window.addEventListener('avatarLoaded', () => this.hideLoading());
        window.addEventListener('avatarError', () => this.hideLoading());
        
        // Écouter les changements de mode
        window.addEventListener('avatarModeChanged', (e) => {
            this.handleModeChange(e.detail.isZeroBullshit);
        });
        
        // Initialiser la visibilité selon le mode actuel
        this.handleModeChange(document.body.classList.contains('zb-mode'));
        
        // Setup spatial audio awareness (fade when quiz visible)
        this.setupSpatialAwareness();
    }
    
    // ============================================
    // SPATIAL AUDIO AWARENESS
    // ============================================
    
    setupSpatialAwareness() {
        const terminal = document.getElementById('diagnostic-terminal');
        if (!terminal) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Only apply in ZB mode
                if (!document.body.classList.contains('zb-mode')) return;
                
                if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                    // Terminal visible → fade out music
                    this.fadeOutForQuiz();
                } else {
                    // Terminal hidden → fade in music
                    this.fadeInFromQuiz();
                }
            });
        }, {
            threshold: [0, 0.3, 0.5, 0.7, 1]
        });
        
        observer.observe(terminal);
    }
    
    fadeOutForQuiz() {
        if (this.isFadingOut) return;
        
        this.isFadingOut = true;
        this.wasPlayingBeforeFade = this.audio && !this.audio.paused;
        
        this.fadeVolume(0, 400, () => {
            // Pause after fade complete
            if (this.audio && !this.audio.paused) {
                this.audio.pause();
            }
        });
    }
    
    fadeInFromQuiz() {
        if (!this.isFadingOut) return;
        
        this.isFadingOut = false;
        
        // Only resume if was playing before
        if (this.wasPlayingBeforeFade && this.audio) {
            this.audio.play().catch(() => {});
            this.fadeVolume(1, 400);
            this.updatePlayPauseIcon(true);
        }
    }
    
    fadeVolume(target, duration, onComplete = null) {
        if (!this.audio) return;
        
        // Cancel any existing fade
        if (this.fadeAnimation) {
            cancelAnimationFrame(this.fadeAnimation);
        }
        
        const startVolume = this.audio.volume;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            // Clamp volume between 0 and 1
            this.audio.volume = Math.max(0, Math.min(1, startVolume + (target - startVolume) * eased));
            
            if (progress < 1) {
                this.fadeAnimation = requestAnimationFrame(animate);
            } else {
                this.audio.volume = Math.max(0, Math.min(1, target));
                this.fadeAnimation = null;
                if (onComplete) onComplete();
            }
        };
        
        this.fadeAnimation = requestAnimationFrame(animate);
    }
    
    handleModeChange(isZeroBullshit) {
        const playerContainer = document.getElementById('audio-player');
        
        if (!playerContainer) return;
        
        // Reset spatial awareness state
        this.isFadingOut = false;
        this.wasPlayingBeforeFade = false;
        if (this.audio) this.audio.volume = 1;
        
        if (isZeroBullshit) {
            // Mode ZB : afficher le player
            playerContainer.style.display = 'flex';
            
            // Mettre à jour les tracks depuis avatarScene
            this.tracks = this.avatarScene.tracks;
            this.currentTrackIndex = 0;
            
            // Charger et jouer la première track
            if (this.audio && this.tracks.length > 0) {
                const track = this.tracks[0];
                if (track.audio) {
                    this.audio.src = track.audio;
                    this.audio.play().catch(() => {
                        // L'autoplay peut être bloqué par le navigateur
                    });
                    this.updatePlayPauseIcon(true);
                }
            }
        } else {
            // Mode Normal : masquer le player et arrêter la musique
            playerContainer.style.display = 'none';
            
            if (this.audio) {
                this.audio.pause();
                this.audio.currentTime = 0;
                this.audio.src = '';
            }
            this.updatePlayPauseIcon(false);
        }
    }
    
    async selectTrack(index) {
        if (!this.tracks || !this.tracks.length) return;
        if (index === this.currentTrackIndex || this.avatarScene.isLoading) return;
        
        const wasPlaying = this.audio && !this.audio.paused;
        
        // Pause current
        if (this.audio) {
            this.audio.pause();
        }
        
        // Update index
        this.currentTrackIndex = index;
        
        // Load new track
        const track = this.tracks[index];
        if (this.audio && track) {
            this.audio.src = track.audio;
        }
        
        // Load 3D model
        await this.avatarScene.loadTrack(index);
        
        // Cleanup old models
        this.avatarScene.cleanupCache(track.id);
        
        // Auto-play if was playing
        if (wasPlaying && this.audio) {
            this.audio.play();
            this.updatePlayPauseIcon(true);
        }
    }
    
    togglePlay() {
        if (!this.audio || !this.tracks || !this.tracks.length) return;
        
        if (this.audio.paused) {
            // Si l'audio est à la fin ou jamais lancé, charger la track
            if (!this.audio.src || this.audio.currentTime >= this.audio.duration) {
                const track = this.tracks[this.currentTrackIndex];
                if (track) {
                    this.audio.src = track.audio;
                }
            }
            this.audio.play();
            this.updatePlayPauseIcon(true);
        } else {
            // Stop : pause et retour au début
            this.audio.pause();
            this.audio.currentTime = 0;
            this.updatePlayPauseIcon(false);
        }
    }
    
    previousTrack() {
        if (!this.tracks || !this.tracks.length) return;
        
        let newIndex;
        if (this.isRandom) {
            // Mode aléatoire : choisir une track différente de la courante
            do {
                newIndex = Math.floor(Math.random() * this.tracks.length);
            } while (newIndex === this.currentTrackIndex && this.tracks.length > 1);
        } else {
            newIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
        }
        this.selectTrack(newIndex);
    }
    
    nextTrack() {
        if (!this.tracks || !this.tracks.length) return;
        
        let newIndex;
        if (this.isRandom) {
            // Mode aléatoire : choisir une track différente de la courante
            do {
                newIndex = Math.floor(Math.random() * this.tracks.length);
            } while (newIndex === this.currentTrackIndex && this.tracks.length > 1);
        } else {
            newIndex = (this.currentTrackIndex + 1) % this.tracks.length;
        }
        this.selectTrack(newIndex);
    }
    
    updatePlayPauseIcon(isPlaying) {
        if (!this.playIcon || !this.pauseIcon) return;
        
        if (isPlaying) {
            this.playIcon.style.display = 'none';
            this.pauseIcon.style.display = 'block';
        } else {
            this.playIcon.style.display = 'block';
            this.pauseIcon.style.display = 'none';
        }
    }
    
    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.remove('hidden');
        }
    }
    
    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.add('hidden');
        }
    }
}

// Initialize after avatar scene is ready
(function initAudioPlayer() {
    // Protection globale : empêcher toute double initialisation
    if (window.__audioPlayerInitialized) {
        return;
    }
    window.__audioPlayerInitialized = true;
    
    // Fonction d'initialisation
    function tryInit() {
        // Vérifier que tout est prêt
        if (document.readyState === 'loading') {
            return false;
        }
        
        if (!window.avatarScene || !window.avatarScene.tracks || window.avatarScene.tracks.length === 0) {
            return false;
        }
        
        if (window.audioPlayer) {
            return true; // Déjà initialisé
        }
        
        // Tout est prêt, créer l'instance
        window.audioPlayer = new AudioPlayer(window.avatarScene);
        return true;
    }
    
    // Essayer d'initialiser immédiatement
    if (tryInit()) {
        return;
    }
    
    // Sinon, attendre DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            tryInit();
        }, { once: true });
    }
    
    // Et aussi attendre avatarScene avec un interval limité
    let attempts = 0;
    const maxAttempts = 30;
    const checkInterval = setInterval(() => {
        attempts++;
        
        if (tryInit() || attempts >= maxAttempts) {
            clearInterval(checkInterval);
        }
    }, 200);
})();
