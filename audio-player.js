class AudioPlayer {
    constructor(avatarScene) {
        this.avatarScene = avatarScene;
        this.tracks = avatarScene.tracks;
        this.currentTrackIndex = 3; // Hip Hop par défaut
        this.isRandom = true; // Mode aléatoire activé par défaut
        
        this.audio = document.getElementById('audio-element');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.playIcon = document.getElementById('play-icon');
        this.pauseIcon = document.getElementById('pause-icon');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.loadingIndicator = document.getElementById('loading-indicator');
        
        this.init();
    }
    
    init() {
        // Event listeners
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        
        // Audio events
        this.audio.addEventListener('ended', () => this.nextTrack());
        
        // Avatar loading events
        window.addEventListener('avatarLoading', () => this.showLoading());
        window.addEventListener('avatarLoaded', () => this.hideLoading());
        window.addEventListener('avatarError', () => this.hideLoading());
    }
    
    async selectTrack(index) {
        if (index === this.currentTrackIndex || this.avatarScene.isLoading) return;
        
        const wasPlaying = !this.audio.paused;
        
        // Pause current
        this.audio.pause();
        
        // Update index
        this.currentTrackIndex = index;
        
        // Load new track
        const track = this.tracks[index];
        this.audio.src = track.audio;
        
        // Load 3D model
        await this.avatarScene.loadTrack(index);
        
        // Cleanup old models
        this.avatarScene.cleanupCache(track.id);
        
        // Auto-play if was playing
        if (wasPlaying) {
            this.audio.play();
            this.updatePlayPauseIcon(true);
        }
    }
    
    togglePlay() {
        if (this.audio.paused) {
            // Si l'audio est à la fin ou jamais lancé, charger la track
            if (!this.audio.src || this.audio.currentTime >= this.audio.duration) {
                const track = this.tracks[this.currentTrackIndex];
                this.audio.src = track.audio;
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
        if (isPlaying) {
            this.playIcon.style.display = 'none';
            this.pauseIcon.style.display = 'block';
        } else {
            this.playIcon.style.display = 'block';
            this.pauseIcon.style.display = 'none';
        }
    }
    
    showLoading() {
        this.loadingIndicator.classList.remove('hidden');
    }
    
    hideLoading() {
        this.loadingIndicator.classList.add('hidden');
    }
}

// Initialize after avatar scene is ready
window.addEventListener('DOMContentLoaded', () => {
    // Attendre que avatarScene soit disponible
    const checkAvatarScene = setInterval(() => {
        if (window.avatarScene && window.avatarScene.tracks) {
            window.audioPlayer = new AudioPlayer(window.avatarScene);
            clearInterval(checkAvatarScene);
        }
    }, 100);
});
