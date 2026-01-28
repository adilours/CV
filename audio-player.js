class AudioPlayer {
    constructor(avatarScene) {
        this.avatarScene = avatarScene;
        this.tracks = avatarScene.tracks;
        this.currentTrackIndex = 3; // Hip Hop par défaut
        
        this.audio = document.getElementById('audio-element');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.playIcon = document.getElementById('play-icon');
        this.pauseIcon = document.getElementById('pause-icon');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.progressBar = document.getElementById('progress-bar');
        this.currentTimeEl = document.getElementById('current-time');
        this.durationEl = document.getElementById('duration');
        this.trackNameEl = document.getElementById('track-name');
        this.trackArtistEl = document.getElementById('track-artist');
        this.minimizeBtn = document.getElementById('player-minimize');
        this.playerEl = document.getElementById('audio-player');
        this.loadingIndicator = document.getElementById('loading-indicator');
        
        this.isMinimized = false;
        
        this.init();
    }
    
    init() {
        // Event listeners
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.progressBar.addEventListener('input', (e) => this.seek(e));
        this.minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        
        // Track selection
        document.querySelectorAll('.track-item').forEach((btn, index) => {
            btn.addEventListener('click', () => this.selectTrack(index));
        });
        
        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.nextTrack());
        
        // Avatar loading events
        window.addEventListener('avatarLoading', () => this.showLoading());
        window.addEventListener('avatarLoaded', () => this.hideLoading());
        window.addEventListener('avatarError', () => this.hideLoading());
        
        // Charger la track initiale
        this.updateTrackInfo();
    }
    
    async selectTrack(index) {
        if (index === this.currentTrackIndex || this.avatarScene.isLoading) return;
        
        const wasPlaying = !this.audio.paused;
        
        // Pause current
        this.audio.pause();
        
        // Update index
        this.currentTrackIndex = index;
        
        // Update UI
        this.updateTrackInfo();
        this.updateActiveTrack();
        
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
            this.audio.play();
            this.updatePlayPauseIcon(true);
        } else {
            this.audio.pause();
            this.updatePlayPauseIcon(false);
        }
    }
    
    previousTrack() {
        const newIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
        this.selectTrack(newIndex);
    }
    
    nextTrack() {
        const newIndex = (this.currentTrackIndex + 1) % this.tracks.length;
        this.selectTrack(newIndex);
    }
    
    seek(e) {
        const time = (e.target.value / 100) * this.audio.duration;
        this.audio.currentTime = time;
    }
    
    updateProgress() {
        if (this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressBar.value = progress;
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        }
    }
    
    updateDuration() {
        this.durationEl.textContent = this.formatTime(this.audio.duration);
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    
    updateTrackInfo() {
        const track = this.tracks[this.currentTrackIndex];
        this.trackNameEl.textContent = track.name;
        // Extract artist from audio filename (simple approach)
        const artistName = track.audio.split('/').pop().split('.')[0];
        this.trackArtistEl.textContent = artistName.substring(0, 30);
    }
    
    updateActiveTrack() {
        document.querySelectorAll('.track-item').forEach((btn, index) => {
            if (index === this.currentTrackIndex) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        if (this.isMinimized) {
            this.playerEl.classList.add('minimized');
        } else {
            this.playerEl.classList.remove('minimized');
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
        if (window.avatarScene) {
            window.audioPlayer = new AudioPlayer(window.avatarScene);
            clearInterval(checkAvatarScene);
        }
    }, 100);
});
