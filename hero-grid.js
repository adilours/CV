/**
 * Hero Interactive Grid & Post-its
 * Adds a subtle interactive grid to the hero section with clickable post-it notes
 * Desktop only (>= 1024px)
 */

class HeroInteractiveGrid {
    constructor() {
        this.hero = document.getElementById('hero');
        this.grid = document.getElementById('hero-grid');
        this.postitsContainer = document.getElementById('hero-postits');
        this.glow = document.getElementById('hero-glow');
        this.counter = document.getElementById('postit-counter');

        // Early exit if elements not found or mobile
        if (!this.hero || !this.grid || !this.postitsContainer || window.innerWidth < 1024) {
            return;
        }

        this.cells = [];
        this.postItCount = 0;
        this.maxPostIts = 4;
        this.isInitialized = false;

        // Post-its content (FR/EN) - Timeline minimaliste
        this.postItsData = [
            {
                fr: 'Service Designer depuis 2016',
                en: 'Service Designer since 2016',
                rotation: -3
            },
            {
                fr: 'Product Engineer depuis 2007',
                en: 'Product Engineer since 2007',
                rotation: 2
            },
            {
                fr: 'Strategist depuis 1982',
                en: 'Strategist since 1982',
                rotation: -2
            },
            {
                fr: 'Dreamer before birth',
                en: 'Dreamer before birth',
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
        const x = e.clientX;
        const y = e.clientY;

        // Move glow
        if (this.glow) {
            this.glow.style.left = x + 'px';
            this.glow.style.top = y + 'px';
        }

        // Subtle cell repulsion effect
        const radius = 100;
        const maxMove = 5;

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
        if (this.postItCount >= this.maxPostIts) return;

        const heroRect = this.hero.getBoundingClientRect();

        // Calculate position relative to hero, with some randomness
        let x = e.clientX - heroRect.left - 90 + (Math.random() * 30 - 15);
        let y = e.clientY - heroRect.top - 20 + (Math.random() * 20 - 10);

        // Keep post-it within hero bounds
        x = Math.max(20, Math.min(x, heroRect.width - 200));
        y = Math.max(20, Math.min(y, heroRect.height - 60));

        this.createPostIt(x, y);
        this.postItCount++;
        this.updateCounter();
    }

    createPostIt(x, y) {
        const data = this.postItsData[this.postItCount];
        const lang = window.currentLang || 'fr';
        const text = data[lang] || data.fr;

        const postIt = document.createElement('div');
        postIt.classList.add('postit-note');
        postIt.style.setProperty('--rotation', data.rotation + 'deg');
        postIt.style.left = x + 'px';
        postIt.style.top = y + 'px';
        postIt.textContent = text;

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
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = element.offsetLeft;
            initialY = element.offsetTop;
            element.style.cursor = 'grabbing';
            element.style.zIndex = '15';
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

            // Update hint when all post-its are placed
            if (this.postItCount >= this.maxPostIts) {
                const hint = this.counter.closest('.interaction-hint');
                if (hint) {
                    hint.style.opacity = '0.2';
                    const hintText = hint.querySelector('[data-fr]');
                    if (hintText) {
                        const lang = window.currentLang || 'fr';
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
