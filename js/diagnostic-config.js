// ============================================
// CONFIGURATION API ELEVENLABS
// ============================================

const ELEVENLABS_CONFIG = {
    apiKey: 'sk_27c74c41cc10fa6213589941d70135f0473191e505582e7b',
    voiceId: 'zlPHrAwmHtWd9KRUhvlV',
    modelId: 'eleven_multilingual_v2',
    baseUrl: 'https://api.elevenlabs.io/v1'
};

// ============================================
// CONFIGURATION QUIZ
// ============================================

const QUIZ_CONFIG = {
    questions: [
        {
            text: {
                fr: "Dans votre organisation, les projets de transformation finissent généralement...",
                en: "In your organization, transformation projects usually end up..."
            },
            options: [
                { 
                    text: { fr: "En PowerPoint qui dort dans un drive", en: "As PowerPoints gathering dust in a drive" },
                    score: 0, 
                    log: { fr: "DÉTECTION > BUREAUCRATIE CIRCULAIRE", en: "DETECTION > CIRCULAR BUREAUCRACY" }
                },
                { 
                    text: { fr: "En MVP bloqué dès qu'un silo se sent menacé", en: "As MVPs blocked when a silo feels threatened" },
                    score: 1, 
                    log: { fr: "ALERTE > FRICTION POLITIQUE IDENTIFIÉE", en: "ALERT > POLITICAL FRICTION IDENTIFIED" }
                },
                { 
                    text: { fr: "En changements structurels qui font grincer des dents", en: "As structural changes that make people uncomfortable" },
                    score: 3, 
                    log: { fr: "SIGNAL > IMPACT RÉEL DÉTECTÉ", en: "SIGNAL > REAL IMPACT DETECTED" }
                }
            ]
        },
        {
            text: {
                fr: "Pourquoi voulez-vous me payer ? Soyons honnêtes.",
                en: "Why do you want to pay me? Let's be honest."
            },
            options: [
                { 
                    text: { fr: "Pour valider des acquis et ne froisser personne", en: "To validate existing plans and not upset anyone" },
                    score: 0, 
                    log: { fr: "AVIS > THÉRAPIE CORPORATE DÉTECTÉE", en: "NOTICE > CORPORATE THERAPY DETECTED" }
                },
                { 
                    text: { fr: "Pour naviguer entre les egos et trouver un compromis", en: "To navigate between egos and find compromise" },
                    score: 1, 
                    log: { fr: "ANALYSE > NAVIGATION EN ZONE TIÈDE", en: "ANALYSIS > LUKEWARM ZONE NAVIGATION" }
                },
                { 
                    text: { fr: "Pour dire la vérité et trancher dans le vif", en: "To tell the truth and make hard calls" },
                    score: 3, 
                    log: { fr: "ACTION > MANDAT DE RUPTURE IDENTIFIÉ", en: "ACTION > RUPTURE MANDATE IDENTIFIED" }
                }
            ]
        },
        {
            text: {
                fr: "D'où vient la paralysie dans votre organisation ?",
                en: "Where does paralysis come from in your organization?"
            },
            options: [
                { 
                    text: { fr: "Des process legacy qu'on n'ose pas toucher", en: "Legacy processes we don't dare touch" },
                    score: 0, 
                    log: { fr: "DIAGNOSTIC > PEUR TECHNIQUE", en: "DIAGNOSTIC > TECHNICAL FEAR" }
                },
                { 
                    text: { fr: "D'un manque d'alignement chronique", en: "Chronic lack of alignment" },
                    score: 1, 
                    log: { fr: "DÉTECTION > DÉFICIT DE LEADERSHIP", en: "DETECTION > LEADERSHIP DEFICIT" }
                },
                { 
                    text: { fr: "De gens qui ont intérêt à ce que rien ne bouge", en: "People who benefit from nothing moving" },
                    score: 3, 
                    log: { fr: "SIGNAL > CONFLIT D'INTÉRÊT POLITIQUE", en: "SIGNAL > POLITICAL CONFLICT OF INTEREST" }
                }
            ]
        },
        {
            text: {
                fr: "Votre idéal de succès à la fin de ma mission ?",
                en: "Your ideal success at the end of my mission?"
            },
            options: [
                { 
                    text: { fr: "Un PDF de 120 pages bien documenté", en: "A well-documented 120-page PDF" },
                    score: 0, 
                    log: { fr: "TRAITEMENT > ÉCHEC ANTICIPÉ", en: "PROCESSING > ANTICIPATED FAILURE" }
                },
                { 
                    text: { fr: "Des quick wins sans faire de vagues", en: "Quick wins without making waves" },
                    score: 1, 
                    log: { fr: "ANALYSE > COSMÉTIQUE STRATÉGIQUE", en: "ANALYSIS > STRATEGIC COSMETICS" }
                },
                { 
                    text: { fr: "Un arbitrage de pouvoir irréversible", en: "An irreversible power arbitrage" },
                    score: 3, 
                    log: { fr: "SIGNAL > HAUTE FIDÉLITÉ OPÉRATIONNELLE", en: "SIGNAL > HIGH OPERATIONAL FIDELITY" }
                }
            ]
        }
    ],
    
    feedbacks: {
        fr: { 0: "Classique.", 1: "Hmm. Prudent.", 3: "Là, on parle." },
        en: { 0: "Classic.", 1: "Hmm. Cautious.", 3: "Now we're talking." }
    },
    
    questionIntros: {
        fr: {
            1: [
                "{firstName}, première question. Dans votre organisation, comment finissent réellement les projets de transformation ?",
                "{firstName}, on commence. Vos projets de transformation : ils finissent comment, honnêtement ?"
            ],
            2: [
                "{firstName}, deuxième question. Pourquoi voulez-vous vraiment me payer ?",
                "Question deux, {firstName}. Soyons honnêtes : pourquoi me payer ?"
            ],
            3: [
                "{firstName}, question trois. D'où vient la paralysie, selon vous ?",
                "Troisième question, {firstName}. Votre organisation est bloquée : pourquoi ?"
            ],
            4: [
                "{firstName}, dernière question. C'est quoi le succès pour vous ?",
                "Question finale, {firstName}. Votre idéal de résultat, c'est quoi ?"
            ]
        },
        en: {
            1: [
                "{firstName}, first question. In your organization, how do transformation projects actually end?",
                "{firstName}, let's start. Your transformation projects: how do they really end?"
            ],
            2: [
                "{firstName}, second question. Why do you really want to pay me?",
                "Question two, {firstName}. Let's be honest: why hire me?"
            ],
            3: [
                "{firstName}, question three. Where does the paralysis come from?",
                "Third question, {firstName}. Your organization is stuck: why?"
            ],
            4: [
                "{firstName}, final question. What does success look like for you?",
                "Last question, {firstName}. Your ideal outcome, what is it?"
            ]
        }
    },
    
    analysisMessages: {
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
    }
};

// ============================================
// VERDICTS CONFIGURATION
// ============================================

const VERDICTS_CONFIG = {
    incompatible: {
        label: "DIAGNOSTIC",
        title: { fr: "INCOMPATIBILITÉ", en: "INCOMPATIBILITY" },
        lines: {
            fr: [
                "Vous cherchez un expert pour décorer vos PowerPoints.",
                "Et rassurer votre COMEX.",
                "—",
                "C'est exactement le genre de mission que je refuse.",
                "Je ne fais pas de théâtre corporate.",
                "—",
                "Si vous voulez un consultant qui dit oui à tout,",
                "LinkedIn en est plein.",
                "—",
                "Session terminée."
            ],
            en: [
                "You're looking for someone to decorate your PowerPoints.",
                "And reassure your C-suite.",
                "—",
                "That's exactly the kind of mission I refuse.",
                "I don't do corporate theater.",
                "—",
                "If you want a consultant who says yes to everything,",
                "LinkedIn is full of them.",
                "—",
                "Session terminated."
            ]
        },
        audio: {
            fr: "{firstName}, on va être honnête. Votre organisation cherche quelqu'un pour faire de beaux PowerPoints et ne déranger personne. C'est exactement le genre de mission que je refuse. Je ne fais pas de théâtre corporate. Je ne suis pas là pour valider vos acquis ou rassurer votre COMEX. Si vous voulez un consultant qui dit oui à tout, LinkedIn en est plein. Mais ce n'est pas moi. Session terminée.",
            en: "{firstName}, let's be honest. Your organization is looking for someone to make pretty PowerPoints and not upset anyone. That's exactly the kind of mission I refuse. I don't do corporate theater. I'm not here to validate your plans or reassure your C-suite. If you want a consultant who says yes to everything, LinkedIn is full of them. But that's not me. Session terminated."
        },
        cta: null
    },
    
    moderate: {
        label: "DIAGNOSTIC",
        title: { fr: "RISQUE MODÉRÉ", en: "MODERATE RISK" },
        lines: {
            fr: [
                "Vous voyez les problèmes.",
                "Mais vous naviguez encore dans le compromis politique.",
                "—",
                "On peut travailler ensemble, mais sous conditions.",
                "J'ai besoin d'un accès direct aux décisions.",
                "—",
                "Si vous êtes prêt à bousculer votre organisation,",
                "contactez-moi.",
                "—",
                "À vous de décider."
            ],
            en: [
                "You see the problems.",
                "But you're still navigating political compromise.",
                "—",
                "We can work together, but under conditions.",
                "I need direct access to decisions.",
                "—",
                "If you're ready to shake up your organization,",
                "contact me.",
                "—",
                "Your call."
            ]
        },
        audio: {
            fr: "{firstName}, vous voyez les problèmes. Mais vous naviguez encore dans le compromis politique. On peut travailler ensemble, mais sous conditions. J'ai besoin d'un accès direct aux décisions. Je ne vais pas passer six mois à produire des recommandations que personne ne lira. Si vous êtes prêt à bousculer votre organisation, contactez-moi. Si vous cherchez du consensus mou, on va perdre notre temps tous les deux. À vous de décider.",
            en: "{firstName}, you see the problems. But you're still navigating political compromise. We can work together, but under conditions. I need direct access to decisions. I won't spend six months producing recommendations no one will read. If you're ready to shake up your organization, contact me. If you're looking for soft consensus, we'll both waste our time. Your call."
        },
        cta: {
            text: { fr: "Demander un accès privilège", en: "Request privileged access" },
            link: "mailto:adil@studioscratch.com"
        }
    },
    
    match: {
        label: "DIAGNOSTIC",
        title: { fr: "MATCH STRATÉGIQUE", en: "STRATEGIC MATCH" },
        lines: {
            fr: [
                "Vous avez compris.",
                "La transformation n'est pas un atelier de co-création.",
                "C'est une guerre d'influence.",
                "—",
                "Vous cherchez quelqu'un qui cartographie le pouvoir.",
                "Qui force les arbitrages.",
                "Qui dit la vérité même quand elle dérange.",
                "—",
                "C'est exactement ce que je fais.",
                "—",
                "Contactez-moi maintenant."
            ],
            en: [
                "You get it.",
                "Transformation isn't a co-creation workshop.",
                "It's a power struggle.",
                "—",
                "You're looking for someone who maps power.",
                "Who forces decisions.",
                "Who tells the truth even when it's uncomfortable.",
                "—",
                "That's exactly what I do.",
                "—",
                "Contact me now."
            ]
        },
        audio: {
            fr: "{firstName}, vous avez compris. La transformation n'est pas un atelier de co-création. C'est une guerre d'influence. Vous cherchez quelqu'un qui cartographie le pouvoir et force les arbitrages. Quelqu'un qui dit la vérité même quand elle dérange. C'est exactement ce que je fais. On va parler vrai, agir vite, et casser les silos. Contactez-moi maintenant. On a du boulot.",
            en: "{firstName}, you get it. Transformation isn't a co-creation workshop. It's a power struggle. You're looking for someone who maps power and forces decisions. Someone who tells the truth even when it's uncomfortable. That's exactly what I do. We'll speak truth, act fast, and break silos. Contact me now. We have work to do."
        },
        cta: {
            text: { fr: "Initier la connexion", en: "Initiate connection" },
            link: "mailto:adil@studioscratch.com"
        },
        ctaSecondary: {
            text: "LinkedIn",
            link: "https://www.linkedin.com/in/adilmhira/"
        }
    }
};

// ============================================
// UI TEXT CONFIGURATION
// ============================================

const UI_TEXT = {
    leadCapture: {
        title: { 
            fr: "> ACCÈS RESTREINT AU DIAGNOSTIC STRATÉGIQUE", 
            en: "> RESTRICTED ACCESS TO STRATEGIC DIAGNOSTIC" 
        },
        subtitle: { 
            fr: "> IDENTIFICATION REQUISE", 
            en: "> IDENTIFICATION REQUIRED" 
        },
        firstNameLabel: { fr: "PRÉNOM", en: "FIRST NAME" },
        firstNamePlaceholder: { fr: "Marc", en: "John" },
        emailLabel: { fr: "EMAIL PROFESSIONNEL", en: "PROFESSIONAL EMAIL" },
        emailPlaceholder: { fr: "marc.durand@company.com", en: "john.smith@company.com" },
        consent: { 
            fr: "J'accepte qu'Adil me contacte si compatibilité détectée", 
            en: "I agree that Adil may contact me if compatibility is detected" 
        },
        submit: { fr: "INITIALISER MON DIAGNOSTIC →", en: "INITIALIZE MY DIAGNOSTIC →" },
        privacy: { 
            fr: "Vos données ne seront jamais partagées. Pas de spam.", 
            en: "Your data will never be shared. No spam." 
        }
    },
    welcome: {
        connected: { fr: "> CONNEXION ÉTABLIE", en: "> CONNECTION ESTABLISHED" },
        identity: { fr: "> IDENTITÉ CONFIRMÉE", en: "> IDENTITY CONFIRMED" },
        greeting: { 
            fr: "Bienvenue dans le diagnostic, <strong>{firstName}</strong>.", 
            en: "Welcome to the diagnostic, <strong>{firstName}</strong>." 
        },
        intro1: { 
            fr: "La plupart des organisations mentent sur leur maturité.", 
            en: "Most organizations lie about their maturity." 
        },
        intro2: { 
            fr: "Ce test ne ment pas.", 
            en: "This test doesn't lie." 
        },
        protocol: { 
            fr: "Je vais générer un protocole vocal personnalisé avec ma propre voix.", 
            en: "I will generate a personalized voice protocol with my own voice." 
        },
        briefing: { 
            fr: "Quatre questions. Pas de langue de bois.", 
            en: "Four questions. No corporate speak." 
        },
        generating: { fr: "GÉNÉRATION DU PROTOCOLE VOCAL...", en: "GENERATING VOICE PROTOCOL..." }
    },
    quiz: {
        parameter: { fr: "PARAMÈTRE", en: "PARAMETER" },
        session: "SESSION"
    },
    analysis: {
        title: { fr: "ANALYSE DU NIVEAU DE BULLSHIT", en: "BULLSHIT LEVEL ANALYSIS" },
        init: { fr: "INITIALISATION...", en: "INITIALIZING..." }
    },
    result: {
        score: { fr: "Score de compatibilité", en: "Compatibility score" }
    },
    transcript: {
        label: "VOICE TRANSCRIPT",
        waiting: { fr: "> EN ATTENTE...", en: "> WAITING..." },
        audioOff: { fr: "> AUDIO NON DISPONIBLE", en: "> AUDIO NOT AVAILABLE" },
        transcriptMode: { fr: "> MODE TRANSCRIPT ACTIVÉ", en: "> TRANSCRIPT MODE ACTIVATED" }
    }
};
