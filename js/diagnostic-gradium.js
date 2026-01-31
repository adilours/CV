// ============================================
// API ELEVENLABS - TEXT-TO-SPEECH
// ============================================

const elevenlabsAPI = {
    
    /**
     * Generate voiceover from text using ElevenLabs API
     * @param {string} text - Text to convert to speech
     * @returns {Promise<string|null>} - Audio blob URL or null on error
     */
    async generateVoiceover(text) {
        try {
            const response = await fetch(
                `${ELEVENLABS_CONFIG.baseUrl}/text-to-speech/${ELEVENLABS_CONFIG.voiceId}?output_format=mp3_44100_128`,
                {
                    method: 'POST',
                    headers: {
                        'xi-api-key': ELEVENLABS_CONFIG.apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: ELEVENLABS_CONFIG.modelId
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            return audioUrl;

        } catch (error) {
            console.error('[ElevenLabs] Voiceover generation failed:', error);
            return null;
        }
    },
    
    /**
     * Get a random question intro personalized with first name
     * @param {number} questionNum - Question number (1-4)
     * @param {string} firstName - User's first name
     * @param {string} lang - Language code ('fr' or 'en')
     * @returns {string} - Personalized intro text
     */
    getRandomQuestionIntro(questionNum, firstName, lang = 'fr') {
        const intros = QUIZ_CONFIG.questionIntros[lang][questionNum];
        if (!intros || intros.length === 0) return '';
        
        const randomIntro = intros[Math.floor(Math.random() * intros.length)];
        return randomIntro.replace(/{firstName}/g, firstName);
    },
    
    /**
     * Get verdict audio text personalized with first name
     * @param {number} score - Quiz score (0-12)
     * @param {string} firstName - User's first name
     * @param {string} lang - Language code ('fr' or 'en')
     * @returns {string} - Personalized verdict audio text
     */
    getVerdictAudioText(score, firstName, lang = 'fr') {
        let verdict;
        
        if (score <= 4) {
            verdict = VERDICTS_CONFIG.incompatible;
        } else if (score <= 8) {
            verdict = VERDICTS_CONFIG.moderate;
        } else {
            verdict = VERDICTS_CONFIG.match;
        }
        
        return verdict.audio[lang].replace(/{firstName}/g, firstName);
    },
    
    /**
     * Get feedback text for a score
     * @param {number} score - Option score (0, 1, or 3)
     * @param {string} lang - Language code
     * @returns {string} - Feedback text
     */
    getFeedbackText(score, lang = 'fr') {
        return QUIZ_CONFIG.feedbacks[lang][score] || '';
    }
};

// Alias for backward compatibility
const gradiumAPI = elevenlabsAPI;

// Make available globally
window.elevenlabsAPI = elevenlabsAPI;
window.gradiumAPI = gradiumAPI;
