console.log('[AudioPlayer] Script loaded');

class AudioPlayer {
    constructor(avatarScene) {
        console.log('[AudioPlayer] Constructor called', {
            hasTracks: !!(avatarScene?.tracks),
            tracksLength: avatarScene?.tracks?.length
        });
        
        this.avatarScene = avatarScene;
        this.tracks = avatarScene.tracks || [];
        this.currentTrackIndex = 3; // Hip Hop par défaut
        this.isRandom = true; // Mode aléatoire activé par défaut
        
        this.audio = document.getElementById('audio-element');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.playIcon = document.getElementById('play-icon');
        this.pauseIcon = document.getElementById('pause-icon');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.loadingIndicator = document.getElementById('loading-indicator');
        
        console.log('[AudioPlayer] DOM elements:', {
            audio: !!this.audio,
            playPauseBtn: !!this.playPauseBtn,
            playIcon: !!this.playIcon,
            pauseIcon: !!this.pauseIcon,
            prevBtn: !!this.prevBtn,
            nextBtn: !!this.nextBtn,
            loadingIndicator: !!this.loadingIndicator
        });
        
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
        console.log('[AudioPlayer] nextTrack called', {
            hasTracks: !!this.tracks,
            tracksLength: this.tracks?.length,
            currentIndex: this.currentTrackIndex
        });
        
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
window.addEventListener('DOMContentLoaded', () => {
    console.log('[AudioPlayer] DOMContentLoaded fired');
    
    // Protection : vérifier qu'on ne crée qu'une seule instance
    if (window.audioPlayer) {
        console.warn('[AudioPlayer] Instance already exists, skipping initialization');
        return;
    }
    
    let checkCount = 0;
    // Attendre que avatarScene soit disponible
    const checkAvatarScene = setInterval(() => {
        checkCount++;
        console.log(`[AudioPlayer] Check #${checkCount}: avatarScene=${!!window.avatarScene}, tracks=${window.avatarScene?.tracks?.length}, audioPlayer=${!!window.audioPlayer}`);
        
        // Timeout de sécurité : arrêter après 50 tentatives (5 secondes)
        if (checkCount > 50) {
            console.error('[AudioPlayer] Timeout: avatarScene not ready after 5 seconds');
            clearInterval(checkAvatarScene);
            return;
        }
        
        if (window.avatarScene && window.avatarScene.tracks && window.avatarScene.tracks.length > 0) {
            console.log('[AudioPlayer] Condition met - creating AudioPlayer');
            
            // Double protection : vérifier à nouveau qu'on n'a pas déjà créé l'instance
            if (window.audioPlayer) {
                console.warn('[AudioPlayer] Race condition detected, instance already created');
                clearInterval(checkAvatarScene);
                return;
            }
            
            window.audioPlayer = new AudioPlayer(window.avatarScene);
            console.log('[AudioPlayer] Instance created, clearing interval');
            clearInterval(checkAvatarScene);
        }
    }, 100);
});
