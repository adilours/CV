/**
 * Hero Interactive Grid & Post-its System
 * - Dense 40px grid with glow effect
 * - 31 autobiographical post-its (random selection)
 * - Max 8 visible at once (FIFO)
 * - Easter egg after 10 clicks
 * Desktop only (>= 1024px)
 */

class PostItSystem {
    constructor() {
        this.hero = document.getElementById('hero');
        this.grid = document.getElementById('hero-grid');
        this.postitsContainer = document.getElementById('hero-postits');
        this.glow = document.getElementById('hero-glow');
        this.counter = document.getElementById('postit-counter');
        this.easterEgg = document.getElementById('easterEgg');
        this.easterEggClose = document.getElementById('easterEggClose');

        // Early exit if elements not found or mobile
        if (!this.hero || !this.grid || !this.postitsContainer || window.innerWidth < 1024) {
            return;
        }

        this.cells = [];
        this.visiblePostIts = [];
        this.totalClicks = 0;
        this.maxVisible = 8;
        this.easterEggThreshold = 10;
        this.easterEggTriggered = false;
        this.isInitialized = false;

        // Build post-its data
        this.postItsData = this.buildPostItsData();

        this.init();
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.createGrid();
        this.attachEvents();
        this.attachKeyboardEvents();

        // Rebuild grid on resize (debounced)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (window.innerWidth >= 1024) {
                    this.createGrid();
                }
            }, 250);
        });
    }

    createGrid() {
        const heroRect = this.hero.getBoundingClientRect();
        const cellSize = 40;
        const cols = Math.ceil(heroRect.width / cellSize);
        const rows = Math.ceil(heroRect.height / cellSize);

        this.grid.innerHTML = '';
        this.grid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        this.grid.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
        this.cells = [];

        for (let i = 0; i < cols * rows; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.addEventListener('click', (e) => this.handleCellClick(e));
            this.grid.appendChild(cell);
            this.cells.push(cell);
        }
    }

    attachEvents() {
        // Mouse move for glow and cell repulsion effect
        this.hero.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });

        // Reset cells when leaving hero
        this.hero.addEventListener('mouseleave', () => {
            this.cells.forEach(cell => {
                cell.style.transform = 'translate(0, 0)';
                cell.style.backgroundColor = 'transparent';
            });
        });
    }

    attachKeyboardEvents() {
        // ESC to close easter egg
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.easterEgg) {
                this.easterEgg.classList.add('hidden');
            }
        });

        // Click outside easter egg content to close
        if (this.easterEgg) {
            this.easterEgg.addEventListener('click', (e) => {
                if (e.target === this.easterEgg) {
                    this.easterEgg.classList.add('hidden');
                }
            });
        }

        // Close button
        if (this.easterEggClose) {
            this.easterEggClose.addEventListener('click', () => {
                this.easterEgg.classList.add('hidden');
            });
        }
    }

    handleMouseMove(e) {
        const x = e.clientX;
        const y = e.clientY;

        // Move glow
        if (this.glow) {
            this.glow.style.left = x + 'px';
            this.glow.style.top = y + 'px';
        }

        // Subtle cell repulsion effect
        const radius = 80;
        const maxMove = 4;

        this.cells.forEach(cell => {
            const rect = cell.getBoundingClientRect();
            const cellX = rect.left + rect.width / 2;
            const cellY = rect.top + rect.height / 2;
            const distX = x - cellX;
            const distY = y - cellY;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance < radius) {
                const power = (radius - distance) / radius;
                const moveX = (distX / distance) * -maxMove * power;
                const moveY = (distY / distance) * -maxMove * power;
                cell.style.transform = `translate(${moveX}px, ${moveY}px)`;

                // Subtle highlight
                const isZbMode = document.body.classList.contains('zb-mode');
                const highlightColor = isZbMode
                    ? `rgba(255, 255, 255, ${power * 0.02})`
                    : `rgba(0, 0, 0, ${power * 0.015})`;
                cell.style.backgroundColor = highlightColor;
            } else {
                cell.style.transform = 'translate(0, 0)';
                cell.style.backgroundColor = 'transparent';
            }
        });
    }

    handleCellClick(e) {
        const heroRect = this.hero.getBoundingClientRect();

        // Calculate position relative to hero, with some randomness
        let x = e.clientX - heroRect.left - 90 + (Math.random() * 40 - 20);
        let y = e.clientY - heroRect.top - 90 + (Math.random() * 40 - 20);

        // Keep post-it within hero bounds
        x = Math.max(20, Math.min(x, heroRect.width - 200));
        y = Math.max(20, Math.min(y, heroRect.height - 200));

        // FIFO: Remove oldest if at max
        if (this.visiblePostIts.length >= this.maxVisible) {
            const oldest = this.visiblePostIts.shift();
            oldest.classList.add('fade-out');
            setTimeout(() => oldest.remove(), 300);
        }

        // Create new post-it
        const postIt = this.createPostIt(x, y);
        this.visiblePostIts.push(postIt);

        this.totalClicks++;
        this.updateCounter();
        this.checkEasterEgg();
    }

    createPostIt(x, y) {
        // Random selection from all post-its
        const data = this.postItsData[Math.floor(Math.random() * this.postItsData.length)];
        const rotation = (Math.random() * 10 - 5);

        const postIt = document.createElement('div');
        postIt.classList.add('postit-note');
        postIt.style.setProperty('--rotation', rotation + 'deg');
        postIt.style.left = x + 'px';
        postIt.style.top = y + 'px';
        postIt.innerHTML = data.html;

        this.postitsContainer.appendChild(postIt);

        // Trigger animation
        requestAnimationFrame(() => {
            postIt.classList.add('active');
        });

        // Make draggable
        this.makePostItDraggable(postIt);

        return postIt;
    }

    makePostItDraggable(element) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = element.offsetLeft;
            initialY = element.offsetTop;
            element.style.cursor = 'grabbing';
            element.style.zIndex = '12';
            e.preventDefault();
        });

        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            element.style.left = (initialX + dx) + 'px';
            element.style.top = (initialY + dy) + 'px';
        };

        const handleMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            element.style.cursor = 'grab';
            element.style.zIndex = '10';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    updateCounter() {
        if (this.counter) {
            this.counter.textContent = `(${this.totalClicks})`;
        }
    }

    checkEasterEgg() {
        if (this.totalClicks >= this.easterEggThreshold && !this.easterEggTriggered) {
            this.triggerEasterEgg();
        }
    }

    triggerEasterEgg() {
        this.easterEggTriggered = true;
        if (this.easterEgg) {
            setTimeout(() => {
                this.easterEgg.classList.remove('hidden');
            }, 600);
        }
    }

    buildPostItsData() {
        return [
            // === PARCOURS (5) ===
            {
                html: `<div class="postit-line1">Service Designer <span class="postit-date">depuis 2016</span></div>
                       <div class="postit-line2">Strategist <span class="postit-date">depuis 1982</span></div>`
            },
            {
                html: `<div class="postit-line1">J'ai vendu ma boîte <span class="postit-date">en 2020</span></div>
                       <div class="postit-line2">Pas pour l'argent.<br>Pour revenir au terrain.</div>`
            },
            {
                html: `<div class="postit-line1">20 ans, 5 secteurs.</div>
                       <div class="postit-line2">Même merde,<br>emballage différent.</div>`
            },
            {
                html: `<div class="postit-line1">EY → BNP → Generali<br>→ Enedis → Renault</div>
                       <div class="postit-line2">La même réunion 1000 fois.</div>`
            },
            {
                html: `<div class="postit-line1">Avant je designais<br>des produits.</div>
                       <div class="postit-line2">Maintenant je designe<br>des organisations.</div>`
            },

            // === VÉRITÉS DESIGN (10) ===
            {
                html: `<div class="postit-line1">Un bon TOM redistribue<br>le pouvoir.</div>
                       <div class="postit-line2">C'est pour ça qu'on l'évite.</div>`
            },
            {
                html: `<div class="postit-line1">Les workshops retardent<br>les décisions.</div>
                       <div class="postit-line2">C'est leur vraie fonction.</div>`
            },
            {
                html: `<div class="postit-line1">Ton NPS ne vaut rien.</div>
                       <div class="postit-line2">Montre-moi un user<br>qui rage-quit.</div>`
            },
            {
                html: `<div class="postit-line1">Design Thinking =<br>Théâtre corporate</div>
                       <div class="postit-line2">Vrai design =<br>Guerre politique</div>`
            },
            {
                html: `<div class="postit-line1">Si ton projet manque<br>"d'alignement"...</div>
                       <div class="postit-line2">Ton projet est mort.</div>`
            },
            {
                html: `<div class="postit-line1">Les beaux Figma<br>c'est cool.</div>
                       <div class="postit-line2">Les décisions en COMEX<br>c'est mieux.</div>`
            },
            {
                html: `<div class="postit-line1">Je cartographie pas<br>des parcours.</div>
                       <div class="postit-line2">Je cartographie<br>qui bloque.</div>`
            },
            {
                html: `<div class="postit-line1">30sec de vidéo user ><br>120 slides PDF</div>
                       <div class="postit-line2">Toujours.</div>`
            },
            {
                html: `<div class="postit-line1">Les problèmes ne viennent<br>jamais du manque</div>
                       <div class="postit-line2">de communication.</div>`
            },
            {
                html: `<div class="postit-line1">Un MVP gentillet<br>ne transforme rien.</div>
                       <div class="postit-line2">Efficace ou rien.</div>`
            },

            // === MÉTHODE (5) ===
            {
                html: `<div class="postit-line1">VerbatimExtractor :<br>analyse UX locale</div>
                       <div class="postit-line2">Zéro cloud, zéro bullshit.</div>`
            },
            {
                html: `<div class="postit-line1">LevelOrg :<br>organisations en 3D</div>
                       <div class="postit-line2">L'organigramme<br>ment toujours.</div>`
            },
            {
                html: `<div class="postit-line1">Je code avec Cursor.</div>
                       <div class="postit-line2">2 jours au lieu<br>de 2 semaines.</div>`
            },
            {
                html: `<div class="postit-line1">Mes outils ne sont pas<br>sur GitHub.</div>
                       <div class="postit-line2">Pas finis. Jamais.</div>`
            },
            {
                html: `<div class="postit-line1">Tauri + React<br>+ LLMs locaux</div>
                       <div class="postit-line2">Zéro vendor lock-in.</div>`
            },

            // === PHILOSOPHIE PRO (5) ===
            {
                html: `<div class="postit-line1">Je recrute des gens<br>qui disent non.</div>
                       <div class="postit-line2">Les yes-men tuent<br>les équipes.</div>`
            },
            {
                html: `<div class="postit-line1">Sujets toxiques =<br>mon point de départ</div>
                       <div class="postit-line2">C'est là que l'orga crève.</div>`
            },
            {
                html: `<div class="postit-line1">Je ne rassure pas<br>les COMEX.</div>
                       <div class="postit-line2">Je dis la vérité.</div>`
            },
            {
                html: `<div class="postit-line1">30 designers recrutés.</div>
                       <div class="postit-line2">100% d'emmerdeurs.</div>`
            },
            {
                html: `<div class="postit-line1">On m'appelle quand<br>les slides échouent.</div>
                       <div class="postit-line2">Jamais avant.</div>`
            },

            // === PERSO (6) ===
            {
                html: `<div class="postit-line1">Père de 2.<br>Mari d'une psy.</div>
                       <div class="postit-line2">Proprio d'un beagle<br>(Euclide).</div>`
            },
            {
                html: `<div class="postit-line1">62km Istres→Marseille<br>avec mon grand</div>
                       <div class="postit-line2">14h de marche ><br>5 ans chez EY</div>`
            },
            {
                html: `<div class="postit-line1">Je viens de Zarzis<br>en Tunisie.</div>
                       <div class="postit-line2">Méditerranée sud,<br>racines profondes.</div>`
            },
            {
                html: `<div class="postit-line1">Le Crocodile, Paris 5<sup>e</sup></div>
                       <div class="postit-line2">Mon bar.<br>Les meilleures idées<br>naissent là-bas.</div>`
            },
            {
                html: `<div class="postit-line1">Ma sœur m'a appris<br>l'essentiel :</div>
                       <div class="postit-line2">La vulnérabilité<br>n'est pas une faiblesse.</div>`
            },
            {
                html: `<div class="postit-line1">Ma femme analyse<br>les individus.</div>
                       <div class="postit-line2">Moi les organisations.</div>`
            }
        ];
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on desktop
    if (window.innerWidth >= 1024) {
        window.postItSystem = new PostItSystem();
    }
});

// Re-check on resize in case user resizes to desktop
window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024 && !window.postItSystem) {
        window.postItSystem = new PostItSystem();
    }
});
