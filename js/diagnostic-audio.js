// ============================================
// AUDIO SYSTEM - Cache & Playback
// ============================================

const audioSystem = {
    cache: {},           // Cached audio URLs
    transcripts: {},     // Cached transcript texts
    currentAudio: null,  // Currently playing audio
    isGenerating: false,
    
    /**
     * Pre-generate all question audios during welcome screen
     * @param {string} firstName - User's first name
     * @param {string} lang - Language code
     * @param {function} onProgress - Progress callback (0-100)
     * @returns {Promise<boolean>} - Success status
     */
    async generateAllAudios(firstName, lang = 'fr', onProgress = null) {
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/86f688f9-a472-48e4-9a37-f10ef76ffe42',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'diagnostic-audio.js:generateAllAudios',message:'Start generating all audios',data:{firstName:firstName,lang:lang},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
        // #endregion
        this.isGenerating = true;
        let completed = 0;
        const total = 7; // 4 intros + 3 feedbacks
        
        const updateProgress = () => {
            completed++;
            if (onProgress) {
                onProgress(Math.round((completed / total) * 100));
            }
        };
        
        try {
            // Generate question intros (4)
            for (let i = 1; i <= 4; i++) {
                const text = gradiumAPI.getRandomQuestionIntro(i, firstName, lang);
                // #region agent log
                fetch('http://127.0.0.1:7248/ingest/86f688f9-a472-48e4-9a37-f10ef76ffe42',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'diagnostic-audio.js:generateAllAudios',message:`Generating q${i} intro`,data:{text:text?.slice(0,50)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
                // #endregion
                const audioUrl = await gradiumAPI.generateVoiceover(text);
                
                this.cache[`q${i}_intro`] = audioUrl;
                this.transcripts[`q${i}_intro`] = text;
                updateProgress();
            }
            
            // Generate feedbacks (3 - for scores 0, 1, 3)
            for (const score of [0, 1, 3]) {
                const text = gradiumAPI.getFeedbackText(score, lang);
                const audioUrl = await gradiumAPI.generateVoiceover(text);
                
                this.cache[`feedback_${score}`] = audioUrl;
                this.transcripts[`feedback_${score}`] = text;
                updateProgress();
            }
            
            this.isGenerating = false;
            return true;
            
        } catch (error) {
            console.error('[AudioSystem] Generation failed:', error);
            this.isGenerating = false;
            return false;
        }
    },
    
    /**
     * Generate verdict audio (called after quiz completion)
     * @param {number} score - Quiz score
     * @param {string} firstName - User's first name
     * @param {string} lang - Language code
     * @returns {Promise<string|null>} - Audio URL
     */
    async generateVerdictAudio(score, firstName, lang = 'fr') {
        try {
            const text = gradiumAPI.getVerdictAudioText(score, firstName, lang);
            const audioUrl = await gradiumAPI.generateVoiceover(text);
            
            this.cache['verdict'] = audioUrl;
            this.transcripts['verdict'] = text;
            
            return audioUrl;
        } catch (error) {
            console.error('[AudioSystem] Verdict generation failed:', error);
            return null;
        }
    },

    /**
     * Run a short audio self-test to validate playback
     * @param {string} lang - Language code
     * @returns {Promise<{ok: boolean, error?: string}>}
     */
    async runAudioSelfTest(lang = 'fr') {
        const testText = lang === 'fr'
            ? 'Test audio. Diagnostic en cours.'
            : 'Audio test. Diagnostic initializing.';
        let audioUrl = null;

        try {
            audioUrl = await gradiumAPI.generateVoiceover(testText);
            if (!audioUrl) {
                return { ok: false, error: 'audio_url_missing' };
            }

            this.stop();
            const audio = new Audio(audioUrl);
            this.currentAudio = audio;

            await audio.play();
            await new Promise(resolve => audio.onended = resolve);
            URL.revokeObjectURL(audioUrl);

            return { ok: true };
        } catch (error) {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            console.error('[AudioSystem] Self-test failed:', error);
            return { ok: false, error: error.message };
        }
    },
    
    /**
     * Play audio with synchronized transcript display
     * @param {string} audioKey - Cache key for the audio
     * @param {string} fallbackText - Text to use if no cached transcript
     * @returns {Promise<void>}
     */
    async playWithTranscript(audioKey, fallbackText = null) {
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/86f688f9-a472-48e4-9a37-f10ef76ffe42',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'diagnostic-audio.js:playWithTranscript',message:'Play requested',data:{audioKey:audioKey,hasCache:!!this.cache[audioKey],isAudioEnabled:transcriptSystem?.isAudioEnabled},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3-H4'})}).catch(()=>{});
        // #endregion
        const transcriptText = fallbackText || this.transcripts[audioKey];
        
        if (!transcriptText) {
            console.warn('[AudioSystem] No transcript for:', audioKey);
            return;
        }
        
        // Start transcript display
        const transcriptPromise = transcriptSystem.displayTranscript(transcriptText);
        
        // Try to play audio if available
        if (transcriptSystem.isAudioEnabled && this.cache[audioKey]) {
            try {
                // Stop any currently playing audio
                this.stop();
                
                const audio = new Audio(this.cache[audioKey]);
                this.currentAudio = audio;
                
                // #region agent log
                fetch('http://127.0.0.1:7248/ingest/86f688f9-a472-48e4-9a37-f10ef76ffe42',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'diagnostic-audio.js:playWithTranscript',message:'About to play audio',data:{audioUrl:this.cache[audioKey]?.slice(0,50)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
                // #endregion
                await audio.play();
                
                // Wait for either audio to end or transcript to complete
                await Promise.race([
                    new Promise(resolve => audio.onended = resolve),
                    transcriptPromise
                ]);
                
            } catch (error) {
                console.error('[AudioSystem] Playback failed:', error);
                await transcriptPromise;
            }
        } else {
            // No audio, just wait for transcript
            await transcriptPromise;
        }
    },
    
    /**
     * Play audio only (no transcript)
     * @param {string} audioKey - Cache key
     * @returns {Promise<void>}
     */
    async play(audioKey) {
        if (!transcriptSystem.isAudioEnabled || !this.cache[audioKey]) {
            return;
        }
        
        try {
            this.stop();
            const audio = new Audio(this.cache[audioKey]);
            this.currentAudio = audio;
            await audio.play();
            await new Promise(resolve => audio.onended = resolve);
        } catch (error) {
            console.error('[AudioSystem] Playback failed:', error);
        }
    },
    
    /**
     * Stop currently playing audio
     */
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    },
    
    /**
     * Clear all cached audio
     */
    clearCache() {
        // Revoke all object URLs to free memory
        Object.values(this.cache).forEach(url => {
            if (url) URL.revokeObjectURL(url);
        });
        
        this.cache = {};
        this.transcripts = {};
    },
    
    /**
     * Check if audio is cached
     * @param {string} audioKey - Cache key
     * @returns {boolean}
     */
    hasAudio(audioKey) {
        return !!this.cache[audioKey];
    }
};

// Make available globally
window.audioSystem = audioSystem;
