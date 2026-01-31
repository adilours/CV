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
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/86f688f9-a472-48e4-9a37-f10ef76ffe42',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'diagnostic-transcript.js:detectAudioCapability',message:'Starting audio detection',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6'})}).catch(()=>{});
        // #endregion
        try {
            const testAudio = new Audio();
            // Use a proper silent MP3 that works across browsers
            testAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNB07AAAAAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNB07AAAAAAAAAAAAAAAAAAAAA';
            testAudio.volume = 0.01; // Nearly silent
            await testAudio.play();
            testAudio.pause();
            this.isAudioEnabled = true;
            // #region agent log
            fetch('http://127.0.0.1:7248/ingest/86f688f9-a472-48e4-9a37-f10ef76ffe42',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'diagnostic-transcript.js:detectAudioCapability',message:'Audio detection SUCCESS',data:{isAudioEnabled:true},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6'})}).catch(()=>{});
            // #endregion
            return true;
        } catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7248/ingest/86f688f9-a472-48e4-9a37-f10ef76ffe42',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'diagnostic-transcript.js:detectAudioCapability',message:'Audio detection FAILED',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H6'})}).catch(()=>{});
            // #endregion
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
