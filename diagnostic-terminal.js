/**
 * DIAGNOSTIC TERMINAL - Strategic Compatibility Quiz
 * Cyberpunk terminal aesthetic quiz to qualify recruiters
 */

const DiagnosticQuiz = {
    // ============================================
    // STATE
    // ============================================
    currentStep: -1, // -1 = intro, 0-3 = questions
    score: 0,
    startTime: null,
    timerInterval: null,
    isTyping: false,
    
    // ============================================
    // DOM ELEMENTS
    // ============================================
    elements: {},
    
    // ============================================
    // CONTENT - QUESTIONS (FR & EN)
    // ============================================
    questions: {
        fr: [
            {
                text: "Dans votre organisation, les projets de transformation finissent généralement...",
                options: [
                    { label: "En PowerPoint qui dort dans un drive", score: 0, log: "DÉTECTION > BUREAUCRATIE CIRCULAIRE" },
                    { label: "En MVP bloqué dès qu'un silo se sent menacé", score: 1, log: "ALERTE > FRICTION POLITIQUE IDENTIFIÉE" },
                    { label: "En changements structurels qui font grincer des dents", score: 3, log: "SIGNAL > IMPACT RÉEL DÉTECTÉ" }
                ]
            },
            {
                text: "Pourquoi voulez-vous me payer ? Soyons honnêtes.",
                options: [
                    { label: "Pour valider des acquis et ne froisser personne", score: 0, log: "AVIS > THÉRAPIE CORPORATE DÉTECTÉE" },
                    { label: "Pour naviguer entre les egos et trouver un compromis", score: 1, log: "ANALYSE > NAVIGATION EN ZONE TIÈDE" },
                    { label: "Pour dire la vérité et trancher dans le vif", score: 3, log: "ACTION > MANDAT DE RUPTURE IDENTIFIÉ" }
                ]
            },
            {
                text: "D'où vient la paralysie dans votre organisation ?",
                options: [
                    { label: "Des process legacy qu'on n'ose pas toucher", score: 0, log: "DIAGNOSTIC > PEUR TECHNIQUE" },
                    { label: "D'un manque d'alignement chronique", score: 1, log: "DÉTECTION > DÉFICIT DE LEADERSHIP" },
                    { label: "De gens qui ont intérêt à ce que rien ne bouge", score: 3, log: "SIGNAL > CONFLIT D'INTÉRÊT POLITIQUE" }
                ]
            },
            {
                text: "Votre idéal de succès à la fin de ma mission ?",
                options: [
                    { label: "Un PDF de 120 pages bien documenté", score: 0, log: "TRAITEMENT > ÉCHEC ANTICIPÉ" },
                    { label: "Des quick wins sans faire de vagues", score: 1, log: "ANALYSE > COSMÉTIQUE STRATÉGIQUE" },
                    { label: "Un arbitrage de pouvoir irréversible", score: 3, log: "SIGNAL > HAUTE FIDÉLITÉ OPÉRATIONNELLE" }
                ]
            }
        ],
        en: [
            {
                text: "In your organization, transformation projects usually end up...",
                options: [
                    { label: "As PowerPoints gathering dust in a drive", score: 0, log: "DETECTION > CIRCULAR BUREAUCRACY" },
                    { label: "As MVPs blocked when a silo feels threatened", score: 1, log: "ALERT > POLITICAL FRICTION IDENTIFIED" },
                    { label: "As structural changes that make people uncomfortable", score: 3, log: "SIGNAL > REAL IMPACT DETECTED" }
                ]
            },
            {
                text: "Why do you want to pay me? Let's be honest.",
                options: [
                    { label: "To validate existing plans and not upset anyone", score: 0, log: "NOTICE > CORPORATE THERAPY DETECTED" },
                    { label: "To navigate between egos and find compromise", score: 1, log: "ANALYSIS > LUKEWARM ZONE NAVIGATION" },
                    { label: "To tell the truth and make hard calls", score: 3, log: "ACTION > RUPTURE MANDATE IDENTIFIED" }
                ]
            },
            {
                text: "Where does paralysis come from in your organization?",
                options: [
                    { label: "Legacy processes we don't dare touch", score: 0, log: "DIAGNOSTIC > TECHNICAL FEAR" },
                    { label: "Chronic lack of alignment", score: 1, log: "DETECTION > LEADERSHIP DEFICIT" },
                    { label: "People who benefit from nothing moving", score: 3, log: "SIGNAL > POLITICAL CONFLICT OF INTEREST" }
                ]
            },
            {
                text: "Your ideal success at the end of my mission?",
                options: [
                    { label: "A well-documented 120-page PDF", score: 0, log: "PROCESSING > ANTICIPATED FAILURE" },
                    { label: "Quick wins without making waves", score: 1, log: "ANALYSIS > STRATEGIC COSMETICS" },
                    { label: "An irreversible power arbitrage", score: 3, log: "SIGNAL > HIGH OPERATIONAL FIDELITY" }
                ]
            }
        ]
    },
    
    // ============================================
    // CONTENT - INTRO TEXT
    // ============================================
    introText: {
        fr: "Avant d'ouvrir mon agenda, je dois diagnostiquer votre niveau de bullshit organisationnel.",
        en: "Before I open my calendar, I need to diagnose your organizational bullshit level."
    },
    
    startButtonText: {
        fr: "Lancer le diagnostic",
        en: "Start diagnostic"
    },
    
    // ============================================
    // CONTENT - LOADING MESSAGES
    // ============================================
    loadingMessages: {
        fr: [
            "EXTRACTION DES NON-DITS...",
            "CORRÉLATION DES RISQUES POLITIQUES...",
            "FILTRAGE DES ÉLÉMENTS DE LANGAGE...",
            "SYNTHÈSE DU MANDAT RÉEL..."
        ],
        en: [
            "EXTRACTING UNSPOKEN TRUTHS...",
            "CORRELATING POLITICAL RISKS...",
            "FILTERING CORPORATE SPEAK...",
            "SYNTHESIZING REAL MANDATE..."
        ]
    },
    
    // ============================================
    // CONTENT - RESULTS
    // ============================================
    results: {
        fr: {
            incompatible: {
                title: "INCOMPATIBILITÉ",
                body: `<p>Vous cherchez un expert pour décorer vos PowerPoints et rassurer votre COMEX.</p>
                       <p>C'est une perte de temps pour vous, et une agonie pour moi.</p>
                       <p><strong>Je ne fais pas de Social Corporate.</strong> Session terminée.</p>`,
                cta: { text: "Rebooter (avec plus d'ambition)", action: "reload" }
            },
            moderate: {
                title: "RISQUE MODÉRÉ",
                body: `<p>Vous voyez les problèmes, mais vous naviguez encore dans le compromis tiède.</p>
                       <p>On peut travailler ensemble <strong>uniquement si</strong> vous me garantissez un accès ROOT aux décisions. Sinon, on va stagner.</p>
                       <p><strong>Avant de me contacter :</strong></p>`,
                checklist: [
                    "Avez-vous le mandat pour bousculer ?",
                    "Êtes-vous prêt à affronter la friction politique ?",
                    "Pouvez-vous trancher contre l'avis des silos ?"
                ],
                checklistFooter: "Si oui aux trois, on peut parler.",
                cta: { text: "Demander un accès privilège", action: "mailto" }
            },
            match: {
                title: "MATCH STRATÉGIQUE",
                body: `<p>Vous avez compris que la transformation est une guerre d'influence.</p>
                       <p>Vous ne craignez pas la friction et vous cherchez l'arbitrage.</p>
                       <p><strong>On va parler vrai, agir vite et casser les silos.</strong></p>
                       <p>Contactez-moi immédiatement.</p>`,
                cta: { text: "Initier la connexion", action: "mailto" },
                ctaSecondary: { text: "LinkedIn", action: "linkedin" }
            }
        },
        en: {
            incompatible: {
                title: "INCOMPATIBILITY",
                body: `<p>You're looking for someone to decorate your PowerPoints and reassure your C-suite.</p>
                       <p>This is a waste of your time, and torture for me.</p>
                       <p><strong>I don't do Corporate Social.</strong> Session terminated.</p>`,
                cta: { text: "Reboot (with more ambition)", action: "reload" }
            },
            moderate: {
                title: "MODERATE RISK",
                body: `<p>You see the problems, but you're still navigating lukewarm compromises.</p>
                       <p>We can work together <strong>only if</strong> you guarantee me ROOT access to decisions. Otherwise, we'll stagnate.</p>
                       <p><strong>Before contacting me:</strong></p>`,
                checklist: [
                    "Do you have the mandate to challenge?",
                    "Are you ready to face political friction?",
                    "Can you decide against silo opinions?"
                ],
                checklistFooter: "If yes to all three, let's talk.",
                cta: { text: "Request privileged access", action: "mailto" }
            },
            match: {
                title: "STRATEGIC MATCH",
                body: `<p>You understand that transformation is a power struggle.</p>
                       <p>You don't fear friction and you seek arbitrage.</p>
                       <p><strong>We'll speak truth, act fast, and break silos.</strong></p>
                       <p>Contact me immediately.</p>`,
                cta: { text: "Initiate connection", action: "mailto" },
                ctaSecondary: { text: "LinkedIn", action: "linkedin" }
            }
        }
    },
    
    // ============================================
    // INITIALIZATION
    // ============================================
    init() {
        // Cache DOM elements
        this.elements = {
            terminal: document.getElementById('diagnostic-terminal'),
            logStream: document.getElementById('logStream'),
            paramCounter: document.getElementById('paramCounter'),
            sessionTimer: document.getElementById('sessionTimer'),
            typewriterText: document.getElementById('typewriterText'),
            optionsContainer: document.getElementById('optionsContainer'),
            quizInterface: document.getElementById('quiz-interface'),
            introScreen: document.getElementById('introScreen'),
            analysisScreen: document.getElementById('analysisScreen'),
            resultsScreen: document.getElementById('resultsScreen'),
            progressBar: document.getElementById('progressBar'),
            statusText: document.getElementById('statusText'),
            verdictTitle: document.getElementById('verdictTitle'),
            verdictSubtitle: document.getElementById('verdictSubtitle'),
            verdictText: document.getElementById('verdictText'),
            verdictCTA: document.getElementById('verdictCTA'),
            startBtn: document.getElementById('startDiagnostic')
        };
        
        // Bind start button
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => this.startQuiz());
        }
        
        // Show intro
        this.showIntro();
        
        console.log('[DiagnosticQuiz] Initialized');
    },
    
    // ============================================
    // LANGUAGE HELPER
    // ============================================
    getLang() {
        // Use the global currentLang variable from the main site
        return window.currentLang || 'fr';
    },
    
    // ============================================
    // INTRO SCREEN
    // ============================================
    showIntro() {
        const lang = this.getLang();
        
        // Update intro text
        const introTextEl = document.getElementById('introText');
        if (introTextEl) {
            introTextEl.textContent = this.introText[lang];
        }
        
        // Update button text
        if (this.elements.startBtn) {
            this.elements.startBtn.textContent = this.startButtonText[lang];
        }
        
        // Show intro, hide others
        if (this.elements.introScreen) this.elements.introScreen.classList.remove('hidden');
        if (this.elements.quizInterface) this.elements.quizInterface.classList.add('hidden');
        if (this.elements.analysisScreen) this.elements.analysisScreen.classList.add('hidden');
        if (this.elements.resultsScreen) this.elements.resultsScreen.classList.add('hidden');
        
        // Initial log
        this.clearLogs();
        this.addLog('> SYSTÈME INITIALISÉ', 'system');
        this.addLog('> EN ATTENTE DE PARAMÈTRES...', 'system');
    },
    
    // ============================================
    // START QUIZ
    // ============================================
    startQuiz() {
        this.currentStep = 0;
        this.score = 0;
        this.startTime = Date.now();
        
        // Hide intro, show quiz
        if (this.elements.introScreen) this.elements.introScreen.classList.add('hidden');
        if (this.elements.quizInterface) this.elements.quizInterface.classList.remove('hidden');
        
        // Start timer
        this.startTimer();
        
        // Add starting log
        this.addLog('> DIAGNOSTIC LANCÉ', 'system');
        
        // Load first question
        this.loadQuestion();
    },
    
    // ============================================
    // TIMER
    // ============================================
    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const seconds = Math.floor(elapsed / 1000) % 60;
            const minutes = Math.floor(elapsed / 60000) % 60;
            const hours = Math.floor(elapsed / 3600000);
            
            if (this.elements.sessionTimer) {
                this.elements.sessionTimer.textContent = `SESSION: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
    // LOAD QUESTION
    // ============================================
    loadQuestion() {
        const lang = this.getLang();
        const q = this.questions[lang][this.currentStep];
        
        // Update counter
        if (this.elements.paramCounter) {
            this.elements.paramCounter.textContent = `PARAMÈTRE ${String(this.currentStep + 1).padStart(2, '0')}/04`;
        }
        
        // Clear options while typing
        if (this.elements.optionsContainer) {
            this.elements.optionsContainer.innerHTML = '';
        }
        
        // Typewriter effect for question
        this.typewriterEffect(q.text, () => {
            // Render options after typing completes
            this.renderOptions(q.options);
        });
    },
    
    // ============================================
    // TYPEWRITER EFFECT
    // ============================================
    typewriterEffect(text, callback) {
        if (this.isTyping) return;
        this.isTyping = true;
        
        const el = this.elements.typewriterText;
        if (!el) {
            this.isTyping = false;
            if (callback) callback();
            return;
        }
        
        el.textContent = '';
        let i = 0;
        const speed = 25; // ms per character
        
        const type = () => {
            if (i < text.length) {
                el.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                this.isTyping = false;
                if (callback) callback();
            }
        };
        
        type();
    },
    
    // ============================================
    // RENDER OPTIONS
    // ============================================
    renderOptions(options) {
        const container = this.elements.optionsContainer;
        if (!container) return;
        
        container.innerHTML = '';
        
        options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn fade-in';
            btn.style.animationDelay = `${index * 0.1}s`;
            btn.textContent = opt.label;
            btn.addEventListener('click', () => this.selectOption(opt));
            container.appendChild(btn);
        });
    },
    
    // ============================================
    // SELECT OPTION
    // ============================================
    selectOption(option) {
        if (this.isTyping) return;
        
        // Add score
        this.score += option.score;
        
        // Add log
        this.addLog(`> ${option.log}`, this.getLogType(option.score));
        
        // Next question or analysis
        if (this.currentStep < this.questions[this.getLang()].length - 1) {
            this.currentStep++;
            this.loadQuestion();
        } else {
            this.runAnalysis();
        }
    },
    
    getLogType(score) {
        if (score === 0) return 'alert';
        if (score === 1) return 'detection';
        return 'signal';
    },
    
    // ============================================
    // LOG MANAGEMENT
    // ============================================
    addLog(message, type = 'system') {
        const container = this.elements.logStream;
        if (!container) return;
        
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        
        // Insert at the top (reverse order display)
        container.insertBefore(entry, container.firstChild);
        
        // Limit to 20 entries
        while (container.children.length > 20) {
            container.removeChild(container.lastChild);
        }
    },
    
    clearLogs() {
        const container = this.elements.logStream;
        if (container) {
            container.innerHTML = '';
        }
    },
    
    // ============================================
    // RUN ANALYSIS
    // ============================================
    runAnalysis() {
        this.stopTimer();
        
        // Hide quiz, show analysis
        if (this.elements.quizInterface) this.elements.quizInterface.classList.add('hidden');
        if (this.elements.analysisScreen) this.elements.analysisScreen.classList.remove('hidden');
        
        const lang = this.getLang();
        const messages = this.loadingMessages[lang];
        let progress = 0;
        let messageIndex = 0;
        
        // Animate progress bar
        const progressInterval = setInterval(() => {
            progress += 2;
            if (this.elements.progressBar) {
                this.elements.progressBar.style.width = `${progress}%`;
            }
            
            // Update status message
            if (progress % 25 === 0 && messageIndex < messages.length) {
                if (this.elements.statusText) {
                    this.elements.statusText.textContent = messages[messageIndex];
                }
                this.addLog(`> ${messages[messageIndex]}`, 'system');
                messageIndex++;
            }
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                setTimeout(() => this.showResult(), 500);
            }
        }, 50);
    },
    
    // ============================================
    // SHOW RESULT
    // ============================================
    showResult() {
        // Hide analysis, show results
        if (this.elements.analysisScreen) this.elements.analysisScreen.classList.add('hidden');
        if (this.elements.resultsScreen) this.elements.resultsScreen.classList.remove('hidden');
        
        const lang = this.getLang();
        const verdict = this.getVerdict();
        const result = this.results[lang][verdict];
        
        // Add result class for styling
        if (this.elements.resultsScreen) {
            this.elements.resultsScreen.className = `overlay-screen result-${verdict === 'incompatible' ? 'incompatible' : verdict === 'moderate' ? 'moderate' : 'match'}`;
        }
        
        // Update verdict title
        if (this.elements.verdictTitle) {
            this.elements.verdictTitle.textContent = 'DIAGNOSTIC';
        }
        
        // Update verdict subtitle
        if (this.elements.verdictSubtitle) {
            this.elements.verdictSubtitle.textContent = result.title;
        }
        
        // Update verdict body
        if (this.elements.verdictText) {
            let bodyHtml = result.body;
            
            // Add checklist if present
            if (result.checklist) {
                bodyHtml += '<ul class="verdict-checklist">';
                result.checklist.forEach(item => {
                    bodyHtml += `<li>• ${item}</li>`;
                });
                bodyHtml += '</ul>';
                if (result.checklistFooter) {
                    bodyHtml += `<p>${result.checklistFooter}</p>`;
                }
            }
            
            this.elements.verdictText.innerHTML = bodyHtml;
        }
        
        // Update CTAs
        if (this.elements.verdictCTA) {
            let ctaHtml = '';
            
            // Primary CTA
            if (result.cta) {
                if (result.cta.action === 'reload') {
                    ctaHtml += `<button class="cta-primary" onclick="location.reload()">${result.cta.text}</button>`;
                } else if (result.cta.action === 'mailto') {
                    ctaHtml += `<a href="mailto:adil@studioscratch.com" class="cta-primary">${result.cta.text}</a>`;
                }
            }
            
            // Secondary CTA
            if (result.ctaSecondary) {
                if (result.ctaSecondary.action === 'linkedin') {
                    ctaHtml += `<a href="https://www.linkedin.com/in/adilmhira/" target="_blank" class="cta-secondary">${result.ctaSecondary.text}</a>`;
                }
            }
            
            // Compatibility score
            const percentage = Math.round((this.score / 12) * 100);
            ctaHtml += `<div class="compatibility-score">${lang === 'fr' ? 'Score de compatibilité' : 'Compatibility score'}: ${percentage}%</div>`;
            
            this.elements.verdictCTA.innerHTML = ctaHtml;
        }
        
        // Final log
        this.addLog(`> DIAGNOSTIC TERMINÉ: ${result.title}`, verdict === 'match' ? 'signal' : verdict === 'moderate' ? 'detection' : 'alert');
    },
    
    getVerdict() {
        if (this.score <= 4) return 'incompatible';
        if (this.score <= 8) return 'moderate';
        return 'match';
    },
    
    // ============================================
    // RESET
    // ============================================
    reset() {
        this.currentStep = -1;
        this.score = 0;
        this.startTime = null;
        this.stopTimer();
        this.showIntro();
    }
};

// ============================================
// AUTO-INIT when terminal becomes visible
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize when terminal section exists
    const terminal = document.getElementById('diagnostic-terminal');
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/86f688f9-a472-48e4-9a37-f10ef76ffe42',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'diagnostic-terminal.js:DOMContentLoaded',message:'DOMContentLoaded fired',data:{terminalFound:!!terminal,terminalClasses:terminal?.className},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    if (terminal) {
        // Use MutationObserver to detect when terminal becomes visible
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    // #region agent log
                    fetch('http://127.0.0.1:7248/ingest/86f688f9-a472-48e4-9a37-f10ef76ffe42',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'diagnostic-terminal.js:MutationObserver',message:'Class changed on terminal',data:{newClasses:terminal.className,isHidden:terminal.classList.contains('hidden')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
                    // #endregion
                    if (!terminal.classList.contains('hidden')) {
                        DiagnosticQuiz.init();
                    }
                }
            });
        });
        
        observer.observe(terminal, { attributes: true });
        
        // Also init immediately if already visible
        // #region agent log
        fetch('http://127.0.0.1:7248/ingest/86f688f9-a472-48e4-9a37-f10ef76ffe42',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'diagnostic-terminal.js:immediateCheck',message:'Checking if terminal already visible',data:{isHidden:terminal.classList.contains('hidden')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        if (!terminal.classList.contains('hidden')) {
            DiagnosticQuiz.init();
        }
    }
});

// Re-init when language changes
window.addEventListener('languageChanged', () => {
    if (DiagnosticQuiz.currentStep === -1) {
        DiagnosticQuiz.showIntro();
    }
});
