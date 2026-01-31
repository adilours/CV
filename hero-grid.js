/**
 * Hero Interactive Grid & Post-its
 * Adds a subtle interactive grid to the hero section with clickable post-it notes
 */

class HeroInteractiveGrid {
    constructor() {
        this.hero = document.getElementById('hero');
        this.grid = document.getElementById('hero-grid');
        this.postitsContainer = document.getElementById('hero-postits');
        this.glow = document.getElementById('hero-glow');
        this.counter = document.getElementById('postit-counter');

        // Early exit if elements not found or mobile
        if (!this.grid || !this.postitsContainer || window.innerWidth < 1024) {
            return;
        }

        this.cells = [];
        this.postItCount = 0;
        this.maxPostIts = 4;
        this.isInitialized = false;

        // Post-its content (FR/EN)
        this.postItsData = [
            {
                fr: {
                    label: 'Timeline',
                    content: `<span class="postit-highlight">Service Designer</span> depuis 2016<br>
                              Product Engineer depuis 2007<br>
                              Strategist depuis 1982<br>
                              <span class="postit-subtle">Dreamer before birth</span>`
                },
                en: {
                    label: 'Timeline',
                    content: `<span class="postit-highlight">Service Designer</span> since 2016<br>
                              Product Engineer since 2007<br>
                              Strategist since 1982<br>
                              <span class="postit-subtle">Dreamer before birth</span>`
                },
                rotation: -3
            },
            {
                fr: {
                    label: 'Methode',
                    content: `<span class="postit-highlight">En 3 etapes :</span><br>
                              1. Cartographier qui bloque<br>
                              2. Forcer les arbitrages<br>
                              3. Livrer avant refroidissement<br>
                              <span class="postit-subtle">(Pas de workshops therapeutiques)</span>`
                },
                en: {
                    label: 'Method',
                    content: `<span class="postit-highlight">3 steps:</span><br>
                              1. Map who's blocking<br>
                              2. Force arbitrage<br>
                              3. Ship before it cools<br>
                              <span class="postit-subtle">(No therapeutic workshops)</span>`
                },
                rotation: 2
            },
            {
                fr: {
                    label: 'Outils',
                    content: `<span class="postit-highlight">Built from scratch :</span><br>
                              → VerbatimExtractor<br>
                              → LevelOrg (3D mapping)<br>
                              → Autres prototypes<br>
                              <span class="postit-subtle">Le marche ne fait jamais ce qu'on veut.</span>`
                },
                en: {
                    label: 'Tools',
                    content: `<span class="postit-highlight">Built from scratch:</span><br>
                              → VerbatimExtractor<br>
                              → LevelOrg (3D mapping)<br>
                              → Other prototypes<br>
                              <span class="postit-subtle">Market tools never do what you need.</span>`
                },
                rotation: -2
            },
            {
                fr: {
                    label: 'IRL',
                    content: `Pere de 2 garcons<br>
                              Mari d'une psy<br>
                              Proprio d'un beagle (Euclide)<br>
                              <span class="postit-subtle">La complexite ne me fait pas peur.<br>L'incompetence, oui.</span>`
                },
                en: {
                    label: 'IRL',
                    content: `Father of 2 boys<br>
                              Husband to a psychologist<br>
                              Owner of a beagle (Euclide)<br>
                              <span class="postit-subtle">Complexity doesn't scare me.<br>Incompetence does.</span>`
                },
                rotation: 4
            }
        ];

        this.init();
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.createGrid();
        this.attachEvents();

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
        const cellSize = 80;
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

    handleMouseMove(e) {
        const heroRect = this.hero.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;

        // Move glow
        if (this.glow) {
            this.glow.style.left = x + 'px';
            this.glow.style.top = y + 'px';
        }

        // Subtle cell repulsion effect
        const radius = 120;
        const maxMove = 6;

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
                    ? `rgba(255, 255, 255, ${power * 0.03})`
                    : `rgba(0, 0, 0, ${power * 0.02})`;
                cell.style.backgroundColor = highlightColor;
            } else {
                cell.style.transform = 'translate(0, 0)';
                cell.style.backgroundColor = 'transparent';
            }
        });
    }

    handleCellClick(e) {
        if (this.postItCount >= this.maxPostIts) return;

        const heroRect = this.hero.getBoundingClientRect();

        // Calculate position relative to hero, with some randomness
        let x = e.clientX - heroRect.left - 110 + (Math.random() * 40 - 20);
        let y = e.clientY - heroRect.top - 70 + (Math.random() * 30 - 15);

        // Keep post-it within hero bounds
        x = Math.max(20, Math.min(x, heroRect.width - 240));
        y = Math.max(20, Math.min(y, heroRect.height - 180));

        this.createPostIt(x, y);
        this.postItCount++;
        this.updateCounter();

        // Play subtle sound feedback (optional, commented out)
        // this.playClickSound();
    }

    createPostIt(x, y) {
        const data = this.postItsData[this.postItCount];
        const lang = document.documentElement.lang || 'fr';
        const content = data[lang] || data.fr;

        const postIt = document.createElement('div');
        postIt.classList.add('postit-note');
        postIt.style.setProperty('--rotation', data.rotation + 'deg');
        postIt.style.left = x + 'px';
        postIt.style.top = y + 'px';

        postIt.innerHTML = `
            <div class="postit-label">${content.label}</div>
            <div class="postit-content">${content.content}</div>
        `;

        this.postitsContainer.appendChild(postIt);

        // Trigger animation
        requestAnimationFrame(() => {
            postIt.classList.add('active');
        });

        // Make draggable
        this.makePostItDraggable(postIt);
    }

    makePostItDraggable(element) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        element.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'A') return; // Don't drag when clicking links

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = element.offsetLeft;
            initialY = element.offsetTop;
            element.style.cursor = 'grabbing';
            element.style.zIndex = '15'; // Bring to front while dragging
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
            this.counter.textContent = `(${this.postItCount}/${this.maxPostIts})`;

            // Hide hint when all post-its are placed
            if (this.postItCount >= this.maxPostIts) {
                const hint = this.counter.closest('.interaction-hint');
                if (hint) {
                    hint.style.opacity = '0.15';
                    const hintText = hint.querySelector('[data-fr]');
                    if (hintText) {
                        const lang = document.documentElement.lang || 'fr';
                        hintText.textContent = lang === 'fr'
                            ? 'Parcours complet !'
                            : 'Journey complete!';
                    }
                }
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on desktop
    if (window.innerWidth >= 1024) {
        window.heroGrid = new HeroInteractiveGrid();
    }
});

// Re-check on resize in case user resizes to desktop
window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024 && !window.heroGrid) {
        window.heroGrid = new HeroInteractiveGrid();
    }
});
