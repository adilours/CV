// ============================================
// DIAGNOSTIC QUIZ - Main Flow Controller
// ============================================

const diagnosticQuiz = {
    // State
    currentStep: 0,
    score: 0,
    firstName: '',
    email: '',
    startTime: null,
    timerInterval: null,
    isInitialized: false,
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    init() {
        if (this.isInitialized) return;
        
        // Get language
        this.lang = window.currentLang || 'fr';
        
        // Initialize transcript system
        transcriptSystem.initToggle();
        
        // Bind form
        this.bindLeadCaptureForm();
        
        // Show lead capture screen
        this.showScreen('leadCaptureScreen');
        
        // Add initial logs
        this.addLog('SÉQUENCE D\'INITIATION TERMINÉE.');
        this.addLog('EN ATTENTE DE PARAMÈTRES...');
        
        this.isInitialized = true;
        console.log('[DiagnosticQuiz] Initialized');
    },
    
    // ============================================
    // SCREEN NAVIGATION
    // ============================================
    
    showScreen(screenId) {
        document.querySelectorAll('#diagnostic-terminal .screen').forEach(s => {
            s.classList.remove('active');
        });
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }
    },
    
    // ============================================
    // TELEMETRY LOG
    // ============================================
    
    addLog(message, isAlert = false) {
        const logStream = document.getElementById('logStream');
        if (!logStream) return;
        
        const entry = document.createElement('div');
        entry.className = 'log-entry' + (isAlert ? ' alert' : '');
        entry.textContent = `> ${message}`;
        logStream.prepend(entry);
        
        // Limit log entries
        while (logStream.children.length > 20) {
            logStream.removeChild(logStream.lastChild);
        }
    },
    
    // ============================================
    // SESSION TIMER
    // ============================================
    
    startTimer() {
        this.startTime = Date.now();
        
        this.timerInterval = setInterval(() => {
            if (!this.startTime) return;
            
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
            const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
            const s = String(elapsed % 60).padStart(2, '0');
            
            const timerEl = document.getElementById('sessionTimer');
            if (timerEl) {
                timerEl.textContent = `${UI_TEXT.quiz.session}: ${h}:${m}:${s}`;
            }
        }, 1000);
    },
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },
    
    // ============================================
    // LEAD CAPTURE
    // ============================================
    
    bindLeadCaptureForm() {
        const form = document.getElementById('leadCaptureForm');
        const startBtn = document.getElementById('diagnosticStartBtn');
        const statusEl = document.getElementById('audioSelfTestStatus');
        if (!form) return;
        
        // Prevent any click on checkbox from bubbling
        const consent = document.getElementById('diagnosticConsent');
        if (consent) {
            consent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        const getStatusText = (kind) => {
            if (!statusEl) return '';
            const lang = window.currentLang || 'fr';
            if (kind === 'pending') {
                return statusEl.getAttribute(`data-${lang}`) || statusEl.textContent;
            }
            return statusEl.getAttribute(`data-${lang}-${kind}`) || statusEl.textContent;
        };

        const setStatus = (state, kind) => {
            if (!statusEl) return;
            statusEl.classList.remove('muted', 'success', 'error');
            statusEl.classList.add(state);
            const text = getStatusText(kind);
            if (text) statusEl.textContent = text;
        };

        const handleStart = async (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            setStatus('muted', 'pending');
            await transcriptSystem.detectAudioCapability();

            const firstName = document.getElementById('diagnosticFirstName')?.value.trim();
            const email = document.getElementById('diagnosticEmail')?.value.trim();
            const consentChecked = document.getElementById('diagnosticConsent')?.checked;

            if (!firstName || !email || !consentChecked) {
                this.addLog('ERREUR : DONNÉES INCOMPLÈTES');
                return;
            }

            // Validate email
            if (!this.isValidEmail(email)) {
                this.addLog('ERREUR : EMAIL INVALIDE');
                return;
            }

            this.firstName = firstName;
            this.email = email;
            this.lang = window.currentLang || 'fr';

            // Store in localStorage
            localStorage.setItem('diagnostic_user', JSON.stringify({
                firstName,
                email,
                timestamp: Date.now()
            }));

            this.addLog(`IDENTIFICATION : ${firstName.toUpperCase()}`, true);
            this.addLog(`EMAIL ENREGISTRÉ : ${email}`);

            const selfTest = await audioSystem.runAudioSelfTest(this.lang);
            window.__audioSelfTestResult = selfTest.ok;
            if (selfTest.ok) {
                transcriptSystem.isAudioEnabled = true;
                setStatus('success', 'ok');
            } else {
                transcriptSystem.isAudioEnabled = false;
                setStatus('error', 'fail');
            }

            // Proceed to welcome screen
            await this.showWelcomeScreen();
        };

        form.addEventListener('submit', handleStart);
        if (startBtn) {
            startBtn.addEventListener('click', handleStart);
        }
    },
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    // ============================================
    // WELCOME SCREEN
    // ============================================
    
    async showWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (!welcomeScreen) return;
        
        const t = UI_TEXT.welcome;
        
        welcomeScreen.innerHTML = `
            <div class="welcome-container">
                <div class="welcome-header">
                    <div class="status-line success">${t.connected[this.lang]}</div>
                    <div class="status-line">${t.identity[this.lang]} : ${this.firstName.toUpperCase()} // ${this.email}</div>
                </div>

                <div class="separator-line"></div>

                <div class="welcome-message">
                    <p class="welcome-line">${t.greeting[this.lang].replace('{firstName}', this.firstName)}</p>
                    <p class="welcome-line">${t.intro1[this.lang]}</p>
                    <p class="welcome-line emphasis">${t.intro2[this.lang]}</p>
                </div>

                <div class="protocol-info">
                    <p>${t.protocol[this.lang]}</p>
                </div>

                <div class="briefing">
                    <p>${t.briefing[this.lang]}</p>
                </div>

                <div class="separator-line"></div>

                <div class="generation-status">
                    <div class="status-label" id="welcomeLabel">${t.generating[this.lang]}</div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" id="welcomeProgress"></div>
                    </div>
                    <div class="substatus" id="welcomeSubstatus">${UI_TEXT.analysis.init[this.lang]}</div>
                </div>
            </div>
        `;
        
        this.showScreen('welcomeScreen');
        this.addLog('GÉNÉRATION PROTOCOLE VOCAL...', true);
        
        // Generate all audios
        try {
            await this.simulateGeneration();
            await audioSystem.generateAllAudios(this.firstName, this.lang, (progress) => {
                const progressBar = document.getElementById('welcomeProgress');
                if (progressBar) progressBar.style.width = progress + '%';
            });
            
            this.addLog('PROTOCOLE VOCAL PRÊT', true);
            
            // Wait a moment then start quiz
            setTimeout(() => {
                this.startQuiz();
            }, 1500);
            
        } catch (error) {
            console.error('[DiagnosticQuiz] Audio generation failed:', error);
            this.addLog('ERREUR GÉNÉRATION - MODE SILENCIEUX ACTIVÉ');
            
            setTimeout(() => {
                this.startQuiz();
            }, 1500);
        }
    },
    
    async simulateGeneration() {
        const progressBar = document.getElementById('welcomeProgress');
        const substatus = document.getElementById('welcomeSubstatus');
        
        const tasks = [
            { label: "CHARGEMENT...", progress: 15 },
            { label: "QUESTION 1...", progress: 30 },
            { label: "QUESTION 2...", progress: 45 },
            { label: "QUESTION 3...", progress: 60 },
            { label: "QUESTION 4...", progress: 75 },
            { label: "CALIBRATION...", progress: 90 },
            { label: "PRÊT.", progress: 100 }
        ];
        
        for (const task of tasks) {
            if (substatus) substatus.textContent = task.label;
            if (progressBar) progressBar.style.width = task.progress + '%';
            await this.sleep(400);
        }
    },
    
    // ============================================
    // QUIZ FLOW
    // ============================================
    
    startQuiz() {
        this.currentStep = 0;
        this.score = 0;
        this.startTimer();
        this.showScreen('quizScreen');
        transcriptSystem.clear();
        this.loadQuestion();
    },
    
    async loadQuestion() {
        const question = QUIZ_CONFIG.questions[this.currentStep];
        if (!question) return;
        
        // Update counter
        const counter = document.getElementById('stepCounter');
        if (counter) {
            counter.textContent = `${UI_TEXT.quiz.parameter[this.lang]} 0${this.currentStep + 1}/04`;
        }
        
        // Clear options
        const optionsGrid = document.getElementById('optionsGrid');
        if (optionsGrid) optionsGrid.innerHTML = '';
        
        // Play question intro audio
        const audioKey = `q${this.currentStep + 1}_intro`;
        audioSystem.playWithTranscript(audioKey);
        
        // Typewriter effect for question text
        await this.typeText(question.text[this.lang]);
        
        // Render options
        this.renderOptions(question.options);
    },
    
    async typeText(text) {
        const typewriterEl = document.getElementById('typewriterText');
        if (!typewriterEl) return;
        
        typewriterEl.textContent = '';
        
        return new Promise((resolve) => {
            let i = 0;
            const interval = setInterval(() => {
                if (i < text.length) {
                    typewriterEl.textContent += text[i];
                    i++;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, 25);
        });
    },
    
    renderOptions(options) {
        const grid = document.getElementById('optionsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.setAttribute('data-index', idx + 1);
            btn.textContent = opt.text[this.lang];
            btn.onclick = () => this.selectOption(opt);
            grid.appendChild(btn);
        });
    },
    
    async selectOption(option) {
        // Add score
        this.score += option.score;
        
        // Add log
        this.addLog(option.log[this.lang], option.score === 3);
        
        // Play feedback audio
        const feedbackKey = `feedback_${option.score}`;
        if (audioSystem.hasAudio(feedbackKey)) {
            await audioSystem.playWithTranscript(feedbackKey);
        }
        
        // Next question or analysis
        if (this.currentStep < QUIZ_CONFIG.questions.length - 1) {
            this.currentStep++;
            setTimeout(() => this.loadQuestion(), 800);
        } else {
            setTimeout(() => this.runAnalysis(), 800);
        }
    },
    
    // ============================================
    // ANALYSIS
    // ============================================
    
    async runAnalysis() {
        this.stopTimer();
        this.showScreen('analysisScreen');
        
        const progressBar = document.getElementById('analysisProgress');
        const statusEl = document.getElementById('analysisStatus');
        
        const statuses = QUIZ_CONFIG.analysisMessages[this.lang];
        let progress = 0;
        let statusIdx = 0;
        
        // Update analysis title
        const analysisTitle = document.querySelector('#analysisScreen .analysis-label');
        if (analysisTitle) {
            analysisTitle.textContent = UI_TEXT.analysis.title[this.lang];
        }
        
        const interval = setInterval(async () => {
            progress += Math.random() * 8;
            
            // Update status messages
            if (progress > 25 && statusIdx === 0) {
                if (statusEl) statusEl.textContent = statuses[1];
                statusIdx = 1;
            }
            if (progress > 50 && statusIdx === 1) {
                if (statusEl) statusEl.textContent = statuses[2];
                statusIdx = 2;
            }
            if (progress > 75 && statusIdx === 2) {
                if (statusEl) statusEl.textContent = statuses[3];
                statusIdx = 3;
            }
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                // Generate verdict audio
                await audioSystem.generateVerdictAudio(this.score, this.firstName, this.lang);
                
                setTimeout(() => this.showResult(), 800);
            }
            
            if (progressBar) progressBar.style.width = progress + '%';
        }, 150);
    },
    
    // ============================================
    // RESULT
    // ============================================
    
    async showResult() {
        this.showScreen('resultScreen');
        
        // Determine verdict
        let verdictKey;
        if (this.score <= 4) {
            verdictKey = 'incompatible';
        } else if (this.score <= 8) {
            verdictKey = 'moderate';
        } else {
            verdictKey = 'match';
        }
        
        const verdict = VERDICTS_CONFIG[verdictKey];
        const container = document.getElementById('resultContainer');
        if (!container) return;
        
        // Build HTML with animated lines
        let html = `
            <div class="verdict-line verdict-label">${verdict.label}</div>
            <div class="verdict-separator"></div>
            <div class="verdict-line verdict-title ${verdictKey}">${verdict.title[this.lang]}</div>
        `;
        
        // Add verdict lines with staggered animation
        verdict.lines[this.lang].forEach((line, idx) => {
            const delay = 800 + (idx * 400);
            if (line === '—') {
                html += `<div class="verdict-line verdict-separator-text" style="animation-delay:${delay}ms;">—</div>`;
            } else {
                html += `<div class="verdict-line" style="animation-delay:${delay}ms;">${line}</div>`;
            }
        });
        
        // Add CTA if exists
        if (verdict.cta) {
            const ctaDelay = 800 + (verdict.lines[this.lang].length * 400);
            html += `
                <div class="verdict-line verdict-cta" style="animation-delay:${ctaDelay}ms;">
                    <a href="${verdict.cta.link}" class="cta-link">${verdict.cta.text[this.lang]}</a>
                </div>
            `;
        }
        
        // Add secondary CTA if exists
        if (verdict.ctaSecondary) {
            const ctaDelay = 800 + ((verdict.lines[this.lang].length + 1) * 400);
            html += `
                <div class="verdict-line" style="animation-delay:${ctaDelay}ms;">
                    <a href="${verdict.ctaSecondary.link}" target="_blank" class="cta-secondary">${verdict.ctaSecondary.text}</a>
                </div>
            `;
        }
        
        // Add score
        const scorePercent = Math.round((this.score / 12) * 100);
        const scoreDelay = 800 + ((verdict.lines[this.lang].length + 2) * 400);
        html += `
            <div class="verdict-line verdict-score" style="animation-delay:${scoreDelay}ms;">
                ${UI_TEXT.result.score[this.lang]} : ${scorePercent}%
            </div>
        `;
        
        container.innerHTML = html;
        
        this.addLog(`DIAGNOSTIC TERMINÉ - SCORE: ${scorePercent}%`, true);
        
        // Play verdict audio after a delay
        await this.sleep(1000);
        await audioSystem.playWithTranscript('verdict');
    },
    
    // ============================================
    // UTILITIES
    // ============================================
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    reset() {
        this.currentStep = 0;
        this.score = 0;
        this.firstName = '';
        this.email = '';
        this.stopTimer();
        this.startTime = null;
        audioSystem.clearCache();
        transcriptSystem.clear();
        this.isInitialized = false;
        this.init();
    }
};

// ============================================
// LANGUAGE CHANGE HANDLER
// ============================================

window.addEventListener('languageChanged', (e) => {
    if (diagnosticQuiz.isInitialized) {
        diagnosticQuiz.lang = e.detail?.lang || window.currentLang || 'fr';
    }
});

// Make available globally
window.diagnosticQuiz = diagnosticQuiz;
