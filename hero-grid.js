/**
 * Hero Interactive Grid & Post-its System
 * - Configurable grid with glow effect
 * - 31 autobiographical post-its FR/EN (random selection)
 * - Max 8 visible at once (FIFO)
 * - Stick & snap drag effect
 * - Auto-falling after 8 seconds
 * - Wire connections between post-its
 * - Easter egg after 10 clicks
 * Desktop only (>= 1024px)
 */

// Grid configuration
window.gridConfig = {
    cellSize: 28,
    radius: 143,
    maxMove: 10,
    borderOpacity: 0.06,
    elasticPower: 2.2
};

/**
 * WireSystem - Manages SVG wire connections between post-its
 */
class WireSystem {
    constructor(postItsArray) {
        this.svg = document.getElementById('hero-wires');
        this.postIts = postItsArray;
        this.pathCache = new Map(); // Cache paths to avoid recalculating on every frame
    }

    // Get center point of a post-it element
    getCenter(element) {
        const rect = element.getBoundingClientRect();
        const heroRect = element.parentElement.getBoundingClientRect();
        return {
            x: rect.left - heroRect.left + rect.width / 2,
            y: rect.top - heroRect.top + rect.height / 2
        };
    }

    // Calculate distance between two points
    distance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Find the 2 nearest neighbors of a post-it
    findNearestNeighbors(postIt, count = 2) {
        const center = this.getCenter(postIt);
        const validPostIts = this.postIts.filter(p => 
            p !== postIt && 
            p.parentNode && 
            !p.classList.contains('falling') &&
            !p.classList.contains('fade-out')
        );
        
        if (validPostIts.length === 0) return [];
        
        return validPostIts
            .map(p => ({ postIt: p, dist: this.distance(center, this.getCenter(p)) }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, Math.min(count, validPostIts.length))
            .map(x => x.postIt);
    }

    // Generate a path that follows grid lines and stays WITHIN bounding box of the two post-its
    // No deviation outside the zone between the two points
    generateOrthogonalPath(from, to, seed = 0) {
        const gridSize = window.gridConfig.cellSize;
        const r = 5;
        
        // Seeded random
        const seededRandom = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
        
        // Snap to grid
        const snapToGrid = (val) => Math.round(val / gridSize) * gridSize;
        
        // Bounding box (with small margin for grid alignment)
        const minX = Math.min(from.x, to.x);
        const maxX = Math.max(from.x, to.x);
        const minY = Math.min(from.y, to.y);
        const maxY = Math.max(from.y, to.y);
        
        // Clamp to bounding box
        const clampX = (x) => Math.max(snapToGrid(minX), Math.min(snapToGrid(maxX), x));
        const clampY = (y) => Math.max(snapToGrid(minY), Math.min(snapToGrid(maxY), y));
        
        // Grid-aligned start/end
        const startGridX = snapToGrid(from.x);
        const startGridY = snapToGrid(from.y);
        const endGridX = snapToGrid(to.x);
        const endGridY = snapToGrid(to.y);
        
        // Build path points
        const points = [{ x: from.x, y: from.y }];
        
        // Simple routing: pick a random intermediate Y within bounds
        // Path: from -> (startGridX, startGridY) -> (endGridX, midY) -> (endGridX, endGridY) -> to
        // Or with variation
        
        const routeType = Math.floor(seededRandom() * 3);
        
        if (routeType === 0) {
            // Route 1: Go horizontal first, then vertical
            // from -> (from.x, startGridY) -> (endGridX, startGridY) -> (endGridX, to.y) -> to
            points.push({ x: from.x, y: startGridY });
            points.push({ x: endGridX, y: startGridY });
            points.push({ x: endGridX, y: to.y });
        } else if (routeType === 1) {
            // Route 2: Go vertical first, then horizontal
            // from -> (startGridX, from.y) -> (startGridX, endGridY) -> (to.x, endGridY) -> to
            points.push({ x: startGridX, y: from.y });
            points.push({ x: startGridX, y: endGridY });
            points.push({ x: to.x, y: endGridY });
        } else {
            // Route 3: With one intermediate turn (Z-shape or S-shape)
            // Pick a midpoint on the grid within bounding box
            const midProgress = 0.3 + seededRandom() * 0.4; // 30% to 70%
            const midX = clampX(snapToGrid(from.x + (to.x - from.x) * midProgress));
            const midY = clampY(snapToGrid(from.y + (to.y - from.y) * midProgress));
            
            // Decide path shape based on seed
            if (seededRandom() > 0.5) {
                // Z-shape: horizontal -> vertical -> horizontal
                points.push({ x: from.x, y: startGridY });
                points.push({ x: midX, y: startGridY });
                points.push({ x: midX, y: endGridY });
                points.push({ x: to.x, y: endGridY });
            } else {
                // S-shape: vertical -> horizontal -> vertical
                points.push({ x: startGridX, y: from.y });
                points.push({ x: startGridX, y: midY });
                points.push({ x: endGridX, y: midY });
                points.push({ x: endGridX, y: to.y });
            }
        }
        
        points.push({ x: to.x, y: to.y });
        
        // Remove duplicates and very short segments
        const cleanPoints = [points[0]];
        for (let i = 1; i < points.length; i++) {
            const prev = cleanPoints[cleanPoints.length - 1];
            const curr = points[i];
            if (Math.abs(curr.x - prev.x) > 2 || Math.abs(curr.y - prev.y) > 2) {
                cleanPoints.push(curr);
            }
        }

        // Build SVG path with rounded corners
        let d = `M ${cleanPoints[0].x.toFixed(1)} ${cleanPoints[0].y.toFixed(1)}`;
        
        for (let i = 1; i < cleanPoints.length - 1; i++) {
            const prev = cleanPoints[i - 1];
            const curr = cleanPoints[i];
            const next = cleanPoints[i + 1];

            const dx1 = curr.x - prev.x;
            const dy1 = curr.y - prev.y;
            const dx2 = next.x - curr.x;
            const dy2 = next.y - curr.y;

            const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

            if (len1 < 2 || len2 < 2) {
                d += ` L ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
                continue;
            }

            const rr = Math.min(r, len1 / 2, len2 / 2);

            const x1 = curr.x - (dx1 / len1) * rr;
            const y1 = curr.y - (dy1 / len1) * rr;
            const x2 = curr.x + (dx2 / len2) * rr;
            const y2 = curr.y + (dy2 / len2) * rr;

            d += ` L ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
        }
        
        if (cleanPoints.length > 1) {
            const last = cleanPoints[cleanPoints.length - 1];
            d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
        }
        
        return d;
    }

    // Generate a unique key for a pair of post-its
    getPairKey(a, b) {
        const idxA = this.postIts.indexOf(a);
        const idxB = this.postIts.indexOf(b);
        return idxA < idxB ? `${idxA}-${idxB}` : `${idxB}-${idxA}`;
    }

    // Update all wire connections
    updateAllWires() {
        if (!this.svg) return;
        
        this.svg.innerHTML = '';
        
        // Need at least 2 post-its for connections
        const validPostIts = this.postIts.filter(p => 
            p.parentNode && 
            !p.classList.contains('falling') &&
            !p.classList.contains('fade-out')
        );
        
        if (validPostIts.length < 2) return;

        const drawnPairs = new Set();

        validPostIts.forEach((postIt) => {
            const neighbors = this.findNearestNeighbors(postIt, 2);
            
            neighbors.forEach((neighbor, i) => {
                const pairKey = this.getPairKey(postIt, neighbor);
                
                // Avoid duplicates
                if (drawnPairs.has(pairKey)) return;
                drawnPairs.add(pairKey);

                this.createWire(postIt, neighbor, i % 2 === 1, pairKey);
            });
        });
    }

    // Create a single wire SVG path
    createWire(from, to, reverse = false, pairKey = '') {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.classList.add('wire-path');
        if (reverse) path.classList.add('reverse');
        
        // Use pairKey as seed for consistent randomness
        const seed = pairKey.split('-').reduce((a, b) => a + parseInt(b || 0), 0) * 12345;
        
        const fromCenter = this.getCenter(from);
        const toCenter = this.getCenter(to);
        
        path.setAttribute('d', this.generateOrthogonalPath(fromCenter, toCenter, seed));
        this.svg.appendChild(path);
    }

    // Clear all wires
    clearAll() {
        if (this.svg) {
            this.svg.innerHTML = '';
        }
    }
}

/**
 * PostItSystem - Main controller for the interactive post-it grid
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
        this.fallDelay = 8000; // 8 seconds before falling

        // Initialize wire system
        this.wireSystem = new WireSystem(this.visiblePostIts);

        // Build post-its data with FR/EN
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
                    this.wireSystem.updateAllWires();
                }
            }, 250);
        });
    }

    createGrid() {
        const heroRect = this.hero.getBoundingClientRect();
        const cellSize = window.gridConfig.cellSize;
        const cols = Math.ceil(heroRect.width / cellSize);
        const rows = Math.ceil(heroRect.height / cellSize);

        this.grid.innerHTML = '';
        this.grid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        this.grid.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
        this.cells = [];

        // Apply border opacity from config
        const borderOpacity = window.gridConfig.borderOpacity;
        const isZbMode = document.body.classList.contains('zb-mode');

        for (let i = 0; i < cols * rows; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            // Dynamic border opacity
            cell.style.borderColor = isZbMode 
                ? `rgba(255, 255, 255, ${borderOpacity * 0.7})`
                : `rgba(0, 0, 0, ${borderOpacity})`;
            this.grid.appendChild(cell);
            this.cells.push(cell);
        }
    }

    attachEvents() {
        // Direct click on grid - much more responsive than per-cell listeners
        this.grid.addEventListener('click', (e) => {
            this.handleCellClick(e);
        });

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

        // Configurable cell repulsion effect
        const radius = window.gridConfig.radius;
        const maxMove = window.gridConfig.maxMove;
        const elasticPower = window.gridConfig.elasticPower;

        this.cells.forEach(cell => {
            const rect = cell.getBoundingClientRect();
            const cellX = rect.left + rect.width / 2;
            const cellY = rect.top + rect.height / 2;
            const distX = x - cellX;
            const distY = y - cellY;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance < radius) {
                // Elastic power curve for more natural deformation
                const power = Math.pow((radius - distance) / radius, elasticPower);
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
        const heroRect = this.hero.getBoundingClientRect();

        // Calculate position relative to hero (adjusted for 135px size)
        let x = e.clientX - heroRect.left - 67 + (Math.random() * 30 - 15);
        let y = e.clientY - heroRect.top - 67 + (Math.random() * 30 - 15);

        // Keep post-it within hero bounds
        x = Math.max(20, Math.min(x, heroRect.width - 155));
        y = Math.max(20, Math.min(y, heroRect.height - 155));

        // FIFO: Remove oldest if at max
        if (this.visiblePostIts.length >= this.maxVisible) {
            const oldest = this.visiblePostIts.shift();
            oldest.classList.add('fade-out');
            setTimeout(() => {
                oldest.remove();
                this.wireSystem.updateAllWires();
            }, 300);
        }

        // Create new post-it
        const postIt = this.createPostIt(x, y);
        this.visiblePostIts.push(postIt);

        // Update wires after a small delay for animation
        setTimeout(() => {
            this.wireSystem.updateAllWires();
        }, 100);

        this.totalClicks++;
        this.updateCounter();
        this.checkEasterEgg();
    }

    createPostIt(x, y) {
        // Random selection from all post-its
        const dataIndex = Math.floor(Math.random() * this.postItsData.length);
        const data = this.postItsData[dataIndex];
        const lang = window.currentLang || 'fr';
        const html = data[lang] || data.fr;
        const rotation = (Math.random() * 10 - 5);

        const postIt = document.createElement('div');
        postIt.classList.add('postit-note');
        postIt.dataset.postItIndex = dataIndex; // Store index for language switching
        postIt.style.setProperty('--rotation', rotation + 'deg');
        postIt.style.left = x + 'px';
        postIt.style.top = y + 'px';
        postIt.innerHTML = html;

        this.postitsContainer.appendChild(postIt);

        // Trigger animation
        requestAnimationFrame(() => {
            postIt.classList.add('active');
        });

        // Make draggable with stick & snap effect
        this.makePostItDraggable(postIt);

        // Schedule auto-fall after delay
        this.schedulePostItFall(postIt);

        return postIt;
    }

    // Update all visible post-its when language changes
    updatePostItsLanguage() {
        const lang = window.currentLang || 'fr';
        this.visiblePostIts.forEach(postIt => {
            if (!postIt.parentNode) return; // Skip removed post-its
            const dataIndex = parseInt(postIt.dataset.postItIndex);
            if (isNaN(dataIndex)) return;
            const data = this.postItsData[dataIndex];
            if (data) {
                postIt.innerHTML = data[lang] || data.fr;
            }
        });
    }

    schedulePostItFall(postIt) {
        setTimeout(() => {
            // Only fall if still in DOM and not being dragged
            if (postIt.parentNode && !postIt.classList.contains('dragging')) {
                postIt.classList.add('falling');
                // Update wires immediately
                this.wireSystem.updateAllWires();
                // Remove from array and DOM after animation
                setTimeout(() => {
                    const idx = this.visiblePostIts.indexOf(postIt);
                    if (idx > -1) this.visiblePostIts.splice(idx, 1);
                    postIt.remove();
                    this.wireSystem.updateAllWires();
                }, 2000);
            }
        }, this.fallDelay);
    }

    makePostItDraggable(element) {
        let isDragging = false;
        let isStuck = true;
        const stickThreshold = 15;
        let startX, startY, initialX, initialY;
        const originalRotation = element.style.getPropertyValue('--rotation');
        let lastWireUpdate = 0;

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            isStuck = true;
            element.classList.add('dragging');
            startX = e.clientX;
            startY = e.clientY;
            initialX = element.offsetLeft;
            initialY = element.offsetTop;
            element.style.cursor = 'grabbing';
            element.style.transition = 'none';
            element.style.zIndex = '60';
            e.preventDefault();
            e.stopPropagation(); // Don't trigger grid click
        });

        // Prevent click from propagating to grid
        element.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (isStuck) {
                // Stuck phase: resistance, reduced movement
                if (distance < stickThreshold) {
                    // Elastic micro-movement (1/4 of actual displacement)
                    element.style.left = (initialX + dx * 0.25) + 'px';
                    element.style.top = (initialY + dy * 0.25) + 'px';
                    // Stretch effect
                    const stretchRotation = dx * 0.3;
                    element.style.transform = `scale(1.08) rotate(${stretchRotation}deg)`;
                } else {
                    // SNAP! Detachment
                    isStuck = false;
                    element.classList.add('unstuck');
                    // Jump to actual position
                    element.style.left = (initialX + dx) + 'px';
                    element.style.top = (initialY + dy) + 'px';
                }
            } else {
                // Free movement phase
                element.style.left = (initialX + dx) + 'px';
                element.style.top = (initialY + dy) + 'px';
                // Subtle tilt based on movement direction
                const tilt = Math.max(-15, Math.min(15, dx * 0.1));
                element.style.transform = `scale(1.02) rotate(${tilt}deg)`;
            }

            // Update wires during drag (throttled to 60fps)
            const now = Date.now();
            if (now - lastWireUpdate > 16) {
                this.wireSystem.updateAllWires();
                lastWireUpdate = now;
            }
        };

        const handleMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            isStuck = true;
            element.classList.remove('dragging');
            element.classList.remove('unstuck');
            element.style.cursor = 'grab';
            element.style.zIndex = '';
            // Re-enable transition with bounce effect
            element.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease';
            element.style.transform = `scale(1) rotate(${originalRotation})`;
            // Final wire update
            this.wireSystem.updateAllWires();
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
                fr: `<div class="postit-line1">Service Designer <span class="postit-date">depuis 2016</span></div>
                     <div class="postit-line2">Strategist <span class="postit-date">depuis 1982</span></div>`,
                en: `<div class="postit-line1">Service Designer <span class="postit-date">since 2016</span></div>
                     <div class="postit-line2">Strategist <span class="postit-date">since 1982</span></div>`
            },
            {
                fr: `<div class="postit-line1">J'ai vendu ma boîte <span class="postit-date">en 2020</span></div>
                     <div class="postit-line2">Pas pour l'argent.<br>Pour revenir au terrain.</div>`,
                en: `<div class="postit-line1">Sold my company <span class="postit-date">in 2020</span></div>
                     <div class="postit-line2">Not for the money.<br>To get back to the field.</div>`
            },
            {
                fr: `<div class="postit-line1">20 ans, 5 secteurs.</div>
                     <div class="postit-line2">Même merde,<br>emballage différent.</div>`,
                en: `<div class="postit-line1">20 years, 5 industries.</div>
                     <div class="postit-line2">Same shit,<br>different packaging.</div>`
            },
            {
                fr: `<div class="postit-line1">EY → BNP → Generali<br>→ Enedis → Renault</div>
                     <div class="postit-line2">La même réunion 1000 fois.</div>`,
                en: `<div class="postit-line1">EY → BNP → Generali<br>→ Enedis → Renault</div>
                     <div class="postit-line2">The same meeting 1000 times.</div>`
            },
            {
                fr: `<div class="postit-line1">Avant je designais<br>des produits.</div>
                     <div class="postit-line2">Maintenant je designe<br>des organisations.</div>`,
                en: `<div class="postit-line1">I used to design<br>products.</div>
                     <div class="postit-line2">Now I design<br>organizations.</div>`
            },

            // === VÉRITÉS DESIGN (10) ===
            {
                fr: `<div class="postit-line1">Un bon TOM redistribue<br>le pouvoir.</div>
                     <div class="postit-line2">C'est pour ça qu'on l'évite.</div>`,
                en: `<div class="postit-line1">A good TOM redistributes<br>power.</div>
                     <div class="postit-line2">That's why it's avoided.</div>`
            },
            {
                fr: `<div class="postit-line1">Les workshops retardent<br>les décisions.</div>
                     <div class="postit-line2">C'est leur vraie fonction.</div>`,
                en: `<div class="postit-line1">Workshops delay<br>decisions.</div>
                     <div class="postit-line2">That's their real purpose.</div>`
            },
            {
                fr: `<div class="postit-line1">Ton NPS ne vaut rien.</div>
                     <div class="postit-line2">Montre-moi un user<br>qui rage-quit.</div>`,
                en: `<div class="postit-line1">Your NPS is worthless.</div>
                     <div class="postit-line2">Show me a user<br>who rage-quits.</div>`
            },
            {
                fr: `<div class="postit-line1">Design Thinking =<br>Théâtre corporate</div>
                     <div class="postit-line2">Vrai design =<br>Guerre politique</div>`,
                en: `<div class="postit-line1">Design Thinking =<br>Corporate theater</div>
                     <div class="postit-line2">Real design =<br>Political warfare</div>`
            },
            {
                fr: `<div class="postit-line1">Si ton projet manque<br>"d'alignement"...</div>
                     <div class="postit-line2">Ton projet est mort.</div>`,
                en: `<div class="postit-line1">If your project lacks<br>"alignment"...</div>
                     <div class="postit-line2">Your project is dead.</div>`
            },
            {
                fr: `<div class="postit-line1">Les beaux Figma<br>c'est cool.</div>
                     <div class="postit-line2">Les décisions en COMEX<br>c'est mieux.</div>`,
                en: `<div class="postit-line1">Pretty Figmas<br>are cool.</div>
                     <div class="postit-line2">C-suite decisions<br>are better.</div>`
            },
            {
                fr: `<div class="postit-line1">Je cartographie pas<br>des parcours.</div>
                     <div class="postit-line2">Je cartographie<br>qui bloque.</div>`,
                en: `<div class="postit-line1">I don't map<br>journeys.</div>
                     <div class="postit-line2">I map<br>who's blocking.</div>`
            },
            {
                fr: `<div class="postit-line1">30sec de vidéo user ><br>120 slides PDF</div>
                     <div class="postit-line2">Toujours.</div>`,
                en: `<div class="postit-line1">30sec user video ><br>120 slides PDF</div>
                     <div class="postit-line2">Always.</div>`
            },
            {
                fr: `<div class="postit-line1">Les problèmes ne viennent<br>jamais du manque</div>
                     <div class="postit-line2">de communication.</div>`,
                en: `<div class="postit-line1">Problems never come<br>from lack of</div>
                     <div class="postit-line2">communication.</div>`
            },
            {
                fr: `<div class="postit-line1">Un MVP gentillet<br>ne transforme rien.</div>
                     <div class="postit-line2">Efficace ou rien.</div>`,
                en: `<div class="postit-line1">A nice little MVP<br>transforms nothing.</div>
                     <div class="postit-line2">Effective or nothing.</div>`
            },

            // === MÉTHODE (5) ===
            {
                fr: `<div class="postit-line1">VerbatimExtractor :<br>analyse UX locale</div>
                     <div class="postit-line2">Zéro cloud, zéro bullshit.</div>`,
                en: `<div class="postit-line1">VerbatimExtractor:<br>local UX analysis</div>
                     <div class="postit-line2">Zero cloud, zero bullshit.</div>`
            },
            {
                fr: `<div class="postit-line1">LevelOrg :<br>organisations en 3D</div>
                     <div class="postit-line2">L'organigramme<br>ment toujours.</div>`,
                en: `<div class="postit-line1">LevelOrg:<br>orgs in 3D</div>
                     <div class="postit-line2">Org charts<br>always lie.</div>`
            },
            {
                fr: `<div class="postit-line1">Je code avec Cursor.</div>
                     <div class="postit-line2">2 jours au lieu<br>de 2 semaines.</div>`,
                en: `<div class="postit-line1">I code with Cursor.</div>
                     <div class="postit-line2">2 days instead<br>of 2 weeks.</div>`
            },
            {
                fr: `<div class="postit-line1">Mes outils ne sont pas<br>sur GitHub.</div>
                     <div class="postit-line2">Pas finis. Jamais.</div>`,
                en: `<div class="postit-line1">My tools aren't<br>on GitHub.</div>
                     <div class="postit-line2">Not finished. Never.</div>`
            },
            {
                fr: `<div class="postit-line1">Tauri + React<br>+ LLMs locaux</div>
                     <div class="postit-line2">Zéro vendor lock-in.</div>`,
                en: `<div class="postit-line1">Tauri + React<br>+ local LLMs</div>
                     <div class="postit-line2">Zero vendor lock-in.</div>`
            },

            // === PHILOSOPHIE PRO (5) ===
            {
                fr: `<div class="postit-line1">Je recrute des gens<br>qui disent non.</div>
                     <div class="postit-line2">Les yes-men tuent<br>les équipes.</div>`,
                en: `<div class="postit-line1">I hire people<br>who say no.</div>
                     <div class="postit-line2">Yes-men kill<br>teams.</div>`
            },
            {
                fr: `<div class="postit-line1">Sujets toxiques =<br>mon point de départ</div>
                     <div class="postit-line2">C'est là que l'orga crève.</div>`,
                en: `<div class="postit-line1">Toxic topics =<br>my starting point</div>
                     <div class="postit-line2">That's where the org dies.</div>`
            },
            {
                fr: `<div class="postit-line1">Je ne rassure pas<br>les COMEX.</div>
                     <div class="postit-line2">Je dis la vérité.</div>`,
                en: `<div class="postit-line1">I don't reassure<br>the C-suite.</div>
                     <div class="postit-line2">I tell the truth.</div>`
            },
            {
                fr: `<div class="postit-line1">30 designers recrutés.</div>
                     <div class="postit-line2">100% d'emmerdeurs.</div>`,
                en: `<div class="postit-line1">30 designers hired.</div>
                     <div class="postit-line2">100% troublemakers.</div>`
            },
            {
                fr: `<div class="postit-line1">On m'appelle quand<br>les slides échouent.</div>
                     <div class="postit-line2">Jamais avant.</div>`,
                en: `<div class="postit-line1">They call me when<br>slides fail.</div>
                     <div class="postit-line2">Never before.</div>`
            },

            // === PERSO (6) ===
            {
                fr: `<div class="postit-line1">Père de 2.<br>Mari d'une psy.</div>
                     <div class="postit-line2">Proprio d'un beagle<br>(Euclide).</div>`,
                en: `<div class="postit-line1">Father of 2.<br>Married to a shrink.</div>
                     <div class="postit-line2">Owner of a beagle<br>(Euclid).</div>`
            },
            {
                fr: `<div class="postit-line1">62km Istres→Marseille<br>avec mon grand</div>
                     <div class="postit-line2">14h de marche ><br>5 ans chez EY</div>`,
                en: `<div class="postit-line1">62km Istres→Marseille<br>with my eldest</div>
                     <div class="postit-line2">14h walk ><br>5 years at EY</div>`
            },
            {
                fr: `<div class="postit-line1">Je viens de Zarzis<br>en Tunisie.</div>
                     <div class="postit-line2">Méditerranée sud,<br>racines profondes.</div>`,
                en: `<div class="postit-line1">I'm from Zarzis<br>in Tunisia.</div>
                     <div class="postit-line2">Southern Mediterranean,<br>deep roots.</div>`
            },
            {
                fr: `<div class="postit-line1">Le Crocodile, Paris 5<sup>e</sup></div>
                     <div class="postit-line2">Mon bar.<br>Les meilleures idées<br>naissent là-bas.</div>`,
                en: `<div class="postit-line1">Le Crocodile, Paris 5<sup>th</sup></div>
                     <div class="postit-line2">My bar.<br>Best ideas<br>are born there.</div>`
            },
            {
                fr: `<div class="postit-line1">Ma sœur m'a appris<br>l'essentiel :</div>
                     <div class="postit-line2">La vulnérabilité<br>n'est pas une faiblesse.</div>`,
                en: `<div class="postit-line1">My sister taught me<br>the essential:</div>
                     <div class="postit-line2">Vulnerability<br>is not weakness.</div>`
            },
            {
                fr: `<div class="postit-line1">Ma femme analyse<br>les individus.</div>
                     <div class="postit-line2">Moi les organisations.</div>`,
                en: `<div class="postit-line1">My wife analyzes<br>individuals.</div>
                     <div class="postit-line2">I analyze organizations.</div>`
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
