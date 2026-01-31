// ============================================
// TRANSCRIPT SYSTEM
// ============================================

const transcriptSystem = {
    isAudioEnabled: false,
    isVisible: true,
    
    /**
     * Detect if audio playback is available
     * @returns {Promise<boolean>}
     */
    async detectAudioCapability() {
        try {
            const testAudio = new Audio();
            testAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==';
            await testAudio.play();
            testAudio.pause();
            this.isAudioEnabled = true;
            return true;
        } catch (error) {
            this.isAudioEnabled = false;
            this.showAudioDisabledWarning();
            return false;
        }
    },
    
    /**
     * Show warning when audio is disabled
     */
    showAudioDisabledWarning() {
        const lang = window.currentLang || 'fr';
        const transcriptOutput = document.getElementById('transcriptOutput');
        if (!transcriptOutput) return;
        
        transcriptOutput.innerHTML = `
            <div class="transcript-line muted">${UI_TEXT.transcript.audioOff[lang]}</div>
            <div class="transcript-line">${UI_TEXT.transcript.transcriptMode[lang]}</div>
        `;
    },
    
    /**
     * Display text with typewriter effect in transcript panel
     * @param {string} text - Text to display
     * @param {number} speed - Characters per interval (ms)
     * @returns {Promise<void>}
     */
    async displayTranscript(text, speed = 30) {
        const transcriptOutput = document.getElementById('transcriptOutput');
        if (!transcriptOutput) return;
        
        // Create new line element
        const line = document.createElement('div');
        line.className = 'transcript-line speaking typing';
        
        // Add audio indicator if audio is enabled
        if (this.isAudioEnabled) {
            const indicator = document.createElement('span');
            indicator.className = 'audio-indicator';
            line.appendChild(indicator);
        }
        
        // Add text span
        const textSpan = document.createElement('span');
        line.appendChild(textSpan);
        
        // Add to output
        transcriptOutput.appendChild(line);
        transcriptOutput.scrollTop = transcriptOutput.scrollHeight;
        
        // Typewriter effect
        let i = 0;
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (i < text.length) {
                    textSpan.textContent += text[i];
                    i++;
                    transcriptOutput.scrollTop = transcriptOutput.scrollHeight;
                } else {
                    clearInterval(interval);
                    line.classList.remove('typing');
                    
                    // Remove audio indicator after a delay
                    setTimeout(() => {
                        const indicator = line.querySelector('.audio-indicator');
                        if (indicator) indicator.remove();
                    }, 1000);
                    
                    resolve();
                }
            }, speed);
        });
    },
    
    /**
     * Add a simple log line (no typewriter)
     * @param {string} text - Text to add
     * @param {string} type - 'muted', 'speaking', or default
     */
    addLine(text, type = '') {
        const transcriptOutput = document.getElementById('transcriptOutput');
        if (!transcriptOutput) return;
        
        const line = document.createElement('div');
        line.className = `transcript-line ${type}`;
        line.textContent = text;
        
        transcriptOutput.appendChild(line);
        transcriptOutput.scrollTop = transcriptOutput.scrollHeight;
    },
    
    /**
     * Clear transcript output
     */
    clear() {
        const lang = window.currentLang || 'fr';
        const transcriptOutput = document.getElementById('transcriptOutput');
        if (!transcriptOutput) return;
        
        transcriptOutput.innerHTML = `<div class="transcript-line muted">${UI_TEXT.transcript.waiting[lang]}</div>`;
    },
    
    /**
     * Toggle transcript visibility
     */
    toggle() {
        const container = document.querySelector('.voice-transcript-container');
        const iconVisible = document.querySelector('.icon-visible');
        const iconHidden = document.querySelector('.icon-hidden');
        
        if (!container) return;
        
        this.isVisible = !this.isVisible;
        
        if (this.isVisible) {
            container.classList.remove('collapsed');
            if (iconVisible) iconVisible.classList.remove('hidden');
            if (iconHidden) iconHidden.classList.add('hidden');
        } else {
            container.classList.add('collapsed');
            if (iconVisible) iconVisible.classList.add('hidden');
            if (iconHidden) iconHidden.classList.remove('hidden');
        }
    },
    
    /**
     * Initialize transcript toggle button
     */
    initToggle() {
        const toggleBtn = document.getElementById('transcriptToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    }
};

// Make available globally
window.transcriptSystem = transcriptSystem;
