/**
 * Grid Debug UI - Real-time parameter tuning for grid effects
 * Includes: Wire neon controls, Grid parameters, Post-it settings, FluxBall system
 */

// Extended configuration
window.gridConfig = {
    // Grid base
    cellSize: 28,
    radius: 143,
    maxMove: 10,
    borderOpacity: 0.06,
    elasticPower: 2.2,

    // Wire neon effect
    wire: {
        color: '#60a5fa',          // Base wire color
        secondaryColor: '#a855f7', // Secondary glow color (for dual-glow mode)
        glowIntensity: 0.5,        // Glow strength (0 - 1)
        glowRadius: 4,             // Blur radius (0 - 15)
        strokeWidth: 1.5,          // Line thickness (0.5 - 4)
        dashArray: '8 6',          // Dash pattern
        pulseSpeed: 3,             // Animation speed in seconds
        pulseType: 'glow',         // 'glow', 'flow', 'breathe', 'electric', 'heartbeat'
        enabled: true
    },

    // Post-it settings
    postIt: {
        fallDelay: 8,              // Seconds before auto-falling (3-20)
        maxVisible: 8              // Max post-its on screen
    },

    // FluxBall settings
    fluxBall: {
        enabled: false,
        effect: 'orb',             // 'orb', 'comet', 'spark', 'ghost', 'plasma'
        size: 12,                  // Ball size in pixels (6-30)
        speed: 2,                  // Travel speed (0.5-5)
        color: '#60a5fa',          // Ball color
        trailLength: 15,           // Trail length for comet/spark (5-40)
        glowRadius: 8,             // Glow radius (2-20)
        pauseAtPostIt: 1.5         // Pause duration at each post-it (0.5-4)
    }
};

/**
 * FluxBallSystem - Animated ball that travels organically between post-its
 */
class FluxBallSystem {
    constructor() {
        this.ball = null;
        this.trail = [];
        this.currentTarget = null;
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.isAnimating = false;
        this.isPaused = false;
        this.pauseTimer = null;
        this.animationId = null;
        this.hero = document.getElementById('hero');
        this.postitsContainer = document.getElementById('hero-postits');

        this.createBallElement();
    }

    createBallElement() {
        // Main ball
        this.ball = document.createElement('div');
        this.ball.className = 'flux-ball';
        this.ball.style.display = 'none';

        // Trail container
        this.trailContainer = document.createElement('div');
        this.trailContainer.className = 'flux-ball-trail';

        if (this.hero) {
            this.hero.appendChild(this.trailContainer);
            this.hero.appendChild(this.ball);
        }
    }

    start() {
        if (!window.gridConfig.fluxBall.enabled || this.isAnimating) return;

        const postIts = this.getValidPostIts();
        if (postIts.length < 2) return;

        this.isAnimating = true;
        this.ball.style.display = 'block';
        this.updateBallStyle();

        // Start at random post-it
        const startPostIt = postIts[Math.floor(Math.random() * postIts.length)];
        const startPos = this.getPostItCenter(startPostIt);
        this.position = { ...startPos };
        this.pickNewTarget();

        this.animate();
    }

    stop() {
        this.isAnimating = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.pauseTimer) clearTimeout(this.pauseTimer);
        this.ball.style.display = 'none';
        this.clearTrail();
    }

    getValidPostIts() {
        if (!window.postItSystem) return [];
        return window.postItSystem.visiblePostIts.filter(p =>
            p.parentNode &&
            !p.classList.contains('falling') &&
            !p.classList.contains('fade-out')
        );
    }

    getPostItCenter(postIt) {
        const rect = postIt.getBoundingClientRect();
        const heroRect = this.hero.getBoundingClientRect();
        return {
            x: rect.left - heroRect.left + rect.width / 2,
            y: rect.top - heroRect.top + rect.height / 2
        };
    }

    pickNewTarget() {
        const postIts = this.getValidPostIts();
        if (postIts.length === 0) {
            this.stop();
            return;
        }

        // Pick a different post-it if possible
        let candidates = postIts.filter(p => p !== this.currentTarget);
        if (candidates.length === 0) candidates = postIts;

        this.currentTarget = candidates[Math.floor(Math.random() * candidates.length)];
    }

    animate() {
        if (!this.isAnimating || !window.gridConfig.fluxBall.enabled) {
            this.stop();
            return;
        }

        if (this.isPaused) {
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }

        const config = window.gridConfig.fluxBall;
        const postIts = this.getValidPostIts();

        if (postIts.length < 1) {
            this.stop();
            return;
        }

        // Get target position
        if (!this.currentTarget || !this.currentTarget.parentNode) {
            this.pickNewTarget();
        }

        if (!this.currentTarget) {
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }

        const targetPos = this.getPostItCenter(this.currentTarget);

        // Organic movement with easing and slight wobble
        const dx = targetPos.x - this.position.x;
        const dy = targetPos.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 20) {
            // Arrived at post-it - pause then pick new target
            this.isPaused = true;
            this.ball.classList.add('at-postit');

            this.pauseTimer = setTimeout(() => {
                this.isPaused = false;
                this.ball.classList.remove('at-postit');
                this.pickNewTarget();
            }, config.pauseAtPostIt * 1000);
        } else {
            // Move towards target with organic motion
            const speed = config.speed;
            const wobble = Math.sin(Date.now() * 0.005) * 2;

            // Smooth acceleration
            const accel = 0.08 * speed;
            this.velocity.x += (dx / distance) * accel;
            this.velocity.y += (dy / distance) * accel;

            // Add perpendicular wobble
            this.velocity.x += (-dy / distance) * wobble * 0.02;
            this.velocity.y += (dx / distance) * wobble * 0.02;

            // Damping
            this.velocity.x *= 0.95;
            this.velocity.y *= 0.95;

            // Clamp speed
            const vel = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
            const maxVel = speed * 4;
            if (vel > maxVel) {
                this.velocity.x = (this.velocity.x / vel) * maxVel;
                this.velocity.y = (this.velocity.y / vel) * maxVel;
            }

            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
        }

        // Update ball position
        this.ball.style.left = this.position.x + 'px';
        this.ball.style.top = this.position.y + 'px';

        // Update trail for comet/spark effects
        if (config.effect === 'comet' || config.effect === 'spark' || config.effect === 'plasma') {
            this.updateTrail();
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    updateTrail() {
        const config = window.gridConfig.fluxBall;

        // Add current position to trail
        this.trail.unshift({ x: this.position.x, y: this.position.y, age: 0 });

        // Limit trail length
        while (this.trail.length > config.trailLength) {
            this.trail.pop();
        }

        // Update or create trail elements
        this.trail.forEach((point, i) => {
            point.age++;
            let el = this.trailContainer.children[i];

            if (!el) {
                el = document.createElement('div');
                el.className = 'flux-trail-point';
                this.trailContainer.appendChild(el);
            }

            const progress = i / config.trailLength;
            const size = config.size * (1 - progress * 0.7);
            const opacity = (1 - progress) * 0.6;

            el.style.left = point.x + 'px';
            el.style.top = point.y + 'px';
            el.style.width = size + 'px';
            el.style.height = size + 'px';
            el.style.opacity = opacity;
            el.style.background = config.color;
        });

        // Remove excess trail elements
        while (this.trailContainer.children.length > this.trail.length) {
            this.trailContainer.lastChild.remove();
        }
    }

    clearTrail() {
        this.trail = [];
        this.trailContainer.innerHTML = '';
    }

    updateBallStyle() {
        const config = window.gridConfig.fluxBall;
        this.ball.style.width = config.size + 'px';
        this.ball.style.height = config.size + 'px';
        this.ball.style.background = config.color;

        // Apply effect-specific styles
        this.ball.className = `flux-ball effect-${config.effect}`;

        // Update CSS custom properties
        this.ball.style.setProperty('--flux-color', config.color);
        this.ball.style.setProperty('--flux-glow', config.glowRadius + 'px');
        this.ball.style.setProperty('--flux-size', config.size + 'px');
    }

    toggle(enabled) {
        window.gridConfig.fluxBall.enabled = enabled;
        if (enabled) {
            this.start();
        } else {
            this.stop();
        }
    }
}

/**
 * DebugUI - Creates and manages the debug panel
 */
class GridDebugUI {
    constructor() {
        this.panel = null;
        this.isCollapsed = false;
        this.fluxBallSystem = null;
        this.createPanel();
        this.attachEvents();

        // Initialize FluxBall system
        setTimeout(() => {
            this.fluxBallSystem = new FluxBallSystem();
            window.fluxBallSystem = this.fluxBallSystem;
        }, 500);
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.className = 'grid-debug-ui';
        panel.innerHTML = `
            <div class="debug-header">
                <span class="debug-title">Grid Debug</span>
                <button class="debug-toggle" id="debugCollapseBtn">-</button>
            </div>

            <!-- WIRE SECTION -->
            <div class="debug-section" data-section="wire">
                <div class="section-header">
                    <span class="section-title">Wire Neon</span>
                    <span class="section-toggle">+</span>
                </div>
                <div class="section-content">
                    <div class="control-row">
                        <label class="control-label">Enabled</label>
                        <input type="checkbox" id="wireEnabled" checked />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Color</label>
                    </div>
                    <div class="color-picker-row">
                        <input type="color" id="wireColor" value="#60a5fa" />
                        <span class="color-hex" id="wireColorHex">#60a5fa</span>
                    </div>

                    <div class="control-row">
                        <label class="control-label">Secondary Glow</label>
                    </div>
                    <div class="color-picker-row">
                        <input type="color" id="wireSecondaryColor" value="#a855f7" />
                        <span class="color-hex" id="wireSecondaryColorHex">#a855f7</span>
                    </div>

                    <div class="control-row">
                        <label class="control-label">Glow Intensity</label>
                        <span class="control-value" id="wireGlowIntensityVal">0.5</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="wireGlowIntensity" min="0" max="1" step="0.05" value="0.5" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Glow Radius</label>
                        <span class="control-value" id="wireGlowRadiusVal">4px</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="wireGlowRadius" min="0" max="20" step="1" value="4" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Stroke Width</label>
                        <span class="control-value" id="wireStrokeWidthVal">1.5</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="wireStrokeWidth" min="0.5" max="5" step="0.25" value="1.5" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Pulse Speed</label>
                        <span class="control-value" id="wirePulseSpeedVal">3s</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="wirePulseSpeed" min="0.5" max="10" step="0.5" value="3" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Pulse Effect</label>
                    </div>
                    <div class="preset-row">
                        <button class="preset-btn active" data-pulse="glow">Glow</button>
                        <button class="preset-btn" data-pulse="flow">Flow</button>
                        <button class="preset-btn" data-pulse="breathe">Breathe</button>
                        <button class="preset-btn" data-pulse="electric">Electric</button>
                        <button class="preset-btn" data-pulse="heartbeat">Heartbeat</button>
                    </div>

                    <div class="control-row">
                        <label class="control-label">Dash Pattern</label>
                    </div>
                    <div class="preset-row">
                        <button class="preset-btn active" data-dash="8 6">Default</button>
                        <button class="preset-btn" data-dash="4 4">Short</button>
                        <button class="preset-btn" data-dash="12 4">Long</button>
                        <button class="preset-btn" data-dash="2 8">Dots</button>
                        <button class="preset-btn" data-dash="none">Solid</button>
                    </div>

                    <div class="preset-row" style="margin-top: 8px;">
                        <button class="preset-btn" data-wire-preset="neon">Neon</button>
                        <button class="preset-btn" data-wire-preset="subtle">Subtle</button>
                        <button class="preset-btn" data-wire-preset="laser">Laser</button>
                        <button class="preset-btn" data-wire-preset="ghost">Ghost</button>
                        <button class="preset-btn" data-wire-preset="cyber">Cyber</button>
                    </div>
                </div>
            </div>

            <!-- POST-IT SECTION -->
            <div class="debug-section" data-section="postit">
                <div class="section-header">
                    <span class="section-title">Post-its</span>
                    <span class="section-toggle">+</span>
                </div>
                <div class="section-content">
                    <div class="control-row">
                        <label class="control-label">Fall Delay</label>
                        <span class="control-value" id="postitFallDelayVal">8s</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="postitFallDelay" min="3" max="30" step="1" value="8" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Max Visible</label>
                        <span class="control-value" id="postitMaxVisibleVal">8</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="postitMaxVisible" min="3" max="15" step="1" value="8" />
                    </div>
                </div>
            </div>

            <!-- FLUX BALL SECTION -->
            <div class="debug-section" data-section="fluxball">
                <div class="section-header">
                    <span class="section-title">Flux Ball</span>
                    <span class="section-toggle">+</span>
                </div>
                <div class="section-content">
                    <div class="control-row">
                        <label class="control-label">Enabled</label>
                        <input type="checkbox" id="fluxBallEnabled" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Effect</label>
                    </div>
                    <div class="preset-row">
                        <button class="preset-btn active" data-flux-effect="orb">Orb</button>
                        <button class="preset-btn" data-flux-effect="comet">Comet</button>
                        <button class="preset-btn" data-flux-effect="spark">Spark</button>
                        <button class="preset-btn" data-flux-effect="ghost">Ghost</button>
                        <button class="preset-btn" data-flux-effect="plasma">Plasma</button>
                    </div>

                    <div class="control-row">
                        <label class="control-label">Color</label>
                    </div>
                    <div class="color-picker-row">
                        <input type="color" id="fluxBallColor" value="#60a5fa" />
                        <span class="color-hex" id="fluxBallColorHex">#60a5fa</span>
                    </div>

                    <div class="control-row">
                        <label class="control-label">Size</label>
                        <span class="control-value" id="fluxBallSizeVal">12px</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="fluxBallSize" min="6" max="30" step="2" value="12" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Speed</label>
                        <span class="control-value" id="fluxBallSpeedVal">2</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="fluxBallSpeed" min="0.5" max="5" step="0.25" value="2" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Trail Length</label>
                        <span class="control-value" id="fluxBallTrailVal">15</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="fluxBallTrail" min="5" max="40" step="5" value="15" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Glow Radius</label>
                        <span class="control-value" id="fluxBallGlowVal">8px</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="fluxBallGlow" min="2" max="25" step="1" value="8" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Pause at Post-it</label>
                        <span class="control-value" id="fluxBallPauseVal">1.5s</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="fluxBallPause" min="0.5" max="4" step="0.25" value="1.5" />
                    </div>
                </div>
            </div>

            <!-- GRID SECTION -->
            <div class="debug-section collapsed" data-section="grid">
                <div class="section-header">
                    <span class="section-title">Grid Base</span>
                    <span class="section-toggle">+</span>
                </div>
                <div class="section-content">
                    <div class="control-row">
                        <label class="control-label">Cell Size</label>
                        <span class="control-value" id="cellSizeVal">28</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="cellSize" min="15" max="60" step="1" value="28" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Hover Radius</label>
                        <span class="control-value" id="hoverRadiusVal">143</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="hoverRadius" min="50" max="300" step="5" value="143" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Max Move</label>
                        <span class="control-value" id="maxMoveVal">10</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="maxMove" min="2" max="30" step="1" value="10" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Border Opacity</label>
                        <span class="control-value" id="borderOpacityVal">0.06</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="borderOpacity" min="0.01" max="0.2" step="0.01" value="0.06" />
                    </div>
                </div>
            </div>

            <!-- ACTIONS -->
            <div class="debug-actions">
                <button class="debug-btn" id="copyConfigBtn">Copy Config</button>
                <button class="debug-btn danger" id="resetConfigBtn">Reset</button>
            </div>
        `;

        document.body.appendChild(panel);
        this.panel = panel;

        // Create collapse button
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'debug-collapse-btn';
        collapseBtn.innerHTML = '#';
        collapseBtn.onclick = () => this.toggleCollapse();
        document.body.appendChild(collapseBtn);
        this.collapseBtn = collapseBtn;
    }

    attachEvents() {
        // Collapse toggle
        document.getElementById('debugCollapseBtn').onclick = () => this.toggleCollapse();

        // Section toggles
        this.panel.querySelectorAll('.section-header').forEach(header => {
            header.onclick = () => {
                header.parentElement.classList.toggle('collapsed');
            };
        });

        // Wire controls
        this.bindControl('wireEnabled', 'checkbox', v => {
            window.gridConfig.wire.enabled = v;
            this.updateWireStyles();
        });
        this.bindControl('wireColor', 'color', v => {
            window.gridConfig.wire.color = v;
            document.getElementById('wireColorHex').textContent = v;
            this.updateWireStyles();
        });
        this.bindControl('wireSecondaryColor', 'color', v => {
            window.gridConfig.wire.secondaryColor = v;
            document.getElementById('wireSecondaryColorHex').textContent = v;
            this.updateWireStyles();
        });
        this.bindControl('wireGlowIntensity', 'range', v => {
            window.gridConfig.wire.glowIntensity = parseFloat(v);
            this.updateWireStyles();
        }, 'wireGlowIntensityVal');
        this.bindControl('wireGlowRadius', 'range', v => {
            window.gridConfig.wire.glowRadius = parseFloat(v);
            this.updateWireStyles();
        }, 'wireGlowRadiusVal', 'px');
        this.bindControl('wireStrokeWidth', 'range', v => {
            window.gridConfig.wire.strokeWidth = parseFloat(v);
            this.updateWireStyles();
        }, 'wireStrokeWidthVal');
        this.bindControl('wirePulseSpeed', 'range', v => {
            window.gridConfig.wire.pulseSpeed = parseFloat(v);
            this.updateWireStyles();
        }, 'wirePulseSpeedVal', 's');

        // Pulse type buttons
        this.panel.querySelectorAll('[data-pulse]').forEach(btn => {
            btn.onclick = () => {
                window.gridConfig.wire.pulseType = btn.dataset.pulse;
                this.updateWireStyles();
                this.panel.querySelectorAll('[data-pulse]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        // Dash pattern buttons
        this.panel.querySelectorAll('[data-dash]').forEach(btn => {
            btn.onclick = () => {
                window.gridConfig.wire.dashArray = btn.dataset.dash;
                this.updateWireStyles();
                this.panel.querySelectorAll('[data-dash]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        // Wire presets
        this.panel.querySelectorAll('[data-wire-preset]').forEach(btn => {
            btn.onclick = () => this.applyWirePreset(btn.dataset.wirePreset);
        });

        // Post-it controls
        this.bindControl('postitFallDelay', 'range', v => {
            window.gridConfig.postIt.fallDelay = parseInt(v);
            if (window.postItSystem) {
                window.postItSystem.fallDelay = parseInt(v) * 1000;
            }
        }, 'postitFallDelayVal', 's');

        this.bindControl('postitMaxVisible', 'range', v => {
            window.gridConfig.postIt.maxVisible = parseInt(v);
            if (window.postItSystem) {
                window.postItSystem.maxVisible = parseInt(v);
            }
        }, 'postitMaxVisibleVal');

        // Flux Ball controls
        this.bindControl('fluxBallEnabled', 'checkbox', v => {
            if (this.fluxBallSystem) {
                this.fluxBallSystem.toggle(v);
            }
        });

        this.bindControl('fluxBallColor', 'color', v => {
            window.gridConfig.fluxBall.color = v;
            document.getElementById('fluxBallColorHex').textContent = v;
            if (this.fluxBallSystem) this.fluxBallSystem.updateBallStyle();
        });

        this.bindControl('fluxBallSize', 'range', v => {
            window.gridConfig.fluxBall.size = parseInt(v);
            if (this.fluxBallSystem) this.fluxBallSystem.updateBallStyle();
        }, 'fluxBallSizeVal', 'px');

        this.bindControl('fluxBallSpeed', 'range', v => {
            window.gridConfig.fluxBall.speed = parseFloat(v);
        }, 'fluxBallSpeedVal');

        this.bindControl('fluxBallTrail', 'range', v => {
            window.gridConfig.fluxBall.trailLength = parseInt(v);
        }, 'fluxBallTrailVal');

        this.bindControl('fluxBallGlow', 'range', v => {
            window.gridConfig.fluxBall.glowRadius = parseInt(v);
            if (this.fluxBallSystem) this.fluxBallSystem.updateBallStyle();
        }, 'fluxBallGlowVal', 'px');

        this.bindControl('fluxBallPause', 'range', v => {
            window.gridConfig.fluxBall.pauseAtPostIt = parseFloat(v);
        }, 'fluxBallPauseVal', 's');

        // Flux Ball effect buttons
        this.panel.querySelectorAll('[data-flux-effect]').forEach(btn => {
            btn.onclick = () => {
                window.gridConfig.fluxBall.effect = btn.dataset.fluxEffect;
                if (this.fluxBallSystem) this.fluxBallSystem.updateBallStyle();
                this.panel.querySelectorAll('[data-flux-effect]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        // Grid controls
        this.bindControl('cellSize', 'range', v => {
            window.gridConfig.cellSize = parseInt(v);
            if (window.postItSystem) window.postItSystem.createGrid();
        }, 'cellSizeVal');
        this.bindControl('hoverRadius', 'range', v => window.gridConfig.radius = parseInt(v), 'hoverRadiusVal');
        this.bindControl('maxMove', 'range', v => window.gridConfig.maxMove = parseInt(v), 'maxMoveVal');
        this.bindControl('borderOpacity', 'range', v => {
            window.gridConfig.borderOpacity = parseFloat(v);
            if (window.postItSystem) window.postItSystem.createGrid();
        }, 'borderOpacityVal');

        // Actions
        document.getElementById('copyConfigBtn').onclick = () => this.copyConfig();
        document.getElementById('resetConfigBtn').onclick = () => this.resetConfig();
    }

    bindControl(id, type, callback, valueId = null, suffix = '') {
        const el = document.getElementById(id);
        if (!el) return;

        const handler = () => {
            const value = type === 'checkbox' ? el.checked : el.value;
            callback(value);
            if (valueId) {
                document.getElementById(valueId).textContent = value + suffix;
            }
        };

        el.addEventListener(type === 'checkbox' ? 'change' : 'input', handler);
    }

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        this.panel.classList.toggle('collapsed', this.isCollapsed);
    }

    applyWirePreset(preset) {
        const presets = {
            neon: { color: '#60a5fa', secondaryColor: '#a855f7', glowIntensity: 0.8, glowRadius: 8, strokeWidth: 2, pulseSpeed: 2, pulseType: 'glow' },
            subtle: { color: '#94a3b8', secondaryColor: '#64748b', glowIntensity: 0.2, glowRadius: 2, strokeWidth: 1, pulseSpeed: 5, pulseType: 'breathe' },
            laser: { color: '#ef4444', secondaryColor: '#f97316', glowIntensity: 1, glowRadius: 12, strokeWidth: 1.5, pulseSpeed: 1.5, pulseType: 'electric' },
            ghost: { color: '#a78bfa', secondaryColor: '#818cf8', glowIntensity: 0.4, glowRadius: 6, strokeWidth: 1, pulseSpeed: 4, pulseType: 'breathe' },
            cyber: { color: '#22d3d8', secondaryColor: '#f0abfc', glowIntensity: 0.7, glowRadius: 10, strokeWidth: 1.5, pulseSpeed: 2.5, pulseType: 'flow' }
        };

        const p = presets[preset];
        if (!p) return;

        Object.assign(window.gridConfig.wire, p);
        this.updateWireStyles();

        // Update UI
        document.getElementById('wireColor').value = p.color;
        document.getElementById('wireColorHex').textContent = p.color;
        document.getElementById('wireSecondaryColor').value = p.secondaryColor;
        document.getElementById('wireSecondaryColorHex').textContent = p.secondaryColor;
        document.getElementById('wireGlowIntensity').value = p.glowIntensity;
        document.getElementById('wireGlowIntensityVal').textContent = p.glowIntensity;
        document.getElementById('wireGlowRadius').value = p.glowRadius;
        document.getElementById('wireGlowRadiusVal').textContent = p.glowRadius + 'px';
        document.getElementById('wireStrokeWidth').value = p.strokeWidth;
        document.getElementById('wireStrokeWidthVal').textContent = p.strokeWidth;
        document.getElementById('wirePulseSpeed').value = p.pulseSpeed;
        document.getElementById('wirePulseSpeedVal').textContent = p.pulseSpeed + 's';

        // Update pulse type button
        this.panel.querySelectorAll('[data-pulse]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.pulse === p.pulseType);
        });
    }

    updateWireStyles() {
        const w = window.gridConfig.wire;
        const svg = document.getElementById('hero-wires');
        if (!svg) return;

        // Create or update style element
        let style = document.getElementById('wire-dynamic-styles');
        if (!style) {
            style = document.createElement('style');
            style.id = 'wire-dynamic-styles';
            document.head.appendChild(style);
        }

        const glowColor = this.hexToRgba(w.color, w.glowIntensity);
        const secondaryGlow = this.hexToRgba(w.secondaryColor, w.glowIntensity * 0.6);

        // Generate animation based on pulse type
        let animation = '';
        switch (w.pulseType) {
            case 'glow':
                animation = `
                    @keyframes wirePulse {
                        0%, 100% {
                            stroke-dashoffset: 0;
                            filter: drop-shadow(0 0 ${w.glowRadius * 0.5}px ${this.hexToRgba(w.color, w.glowIntensity * 0.5)});
                        }
                        50% {
                            stroke-dashoffset: -14;
                            filter: drop-shadow(0 0 ${w.glowRadius * 1.5}px ${glowColor}) drop-shadow(0 0 ${w.glowRadius * 2}px ${secondaryGlow});
                        }
                    }`;
                break;
            case 'flow':
                animation = `
                    @keyframes wirePulse {
                        0% { stroke-dashoffset: 0; }
                        100% { stroke-dashoffset: -28; }
                    }`;
                break;
            case 'breathe':
                animation = `
                    @keyframes wirePulse {
                        0%, 100% {
                            opacity: 0.4;
                            filter: drop-shadow(0 0 ${w.glowRadius * 0.3}px ${this.hexToRgba(w.color, w.glowIntensity * 0.3)});
                        }
                        50% {
                            opacity: 1;
                            filter: drop-shadow(0 0 ${w.glowRadius}px ${glowColor}) drop-shadow(0 0 ${w.glowRadius * 1.5}px ${secondaryGlow});
                        }
                    }`;
                break;
            case 'electric':
                animation = `
                    @keyframes wirePulse {
                        0%, 90%, 100% {
                            opacity: 0.6;
                            filter: drop-shadow(0 0 ${w.glowRadius * 0.5}px ${glowColor});
                        }
                        92%, 96% {
                            opacity: 1;
                            filter: drop-shadow(0 0 ${w.glowRadius * 2}px ${glowColor}) drop-shadow(0 0 ${w.glowRadius * 3}px ${secondaryGlow});
                        }
                        94% {
                            opacity: 0.3;
                            filter: drop-shadow(0 0 ${w.glowRadius}px ${glowColor});
                        }
                    }`;
                break;
            case 'heartbeat':
                animation = `
                    @keyframes wirePulse {
                        0%, 100% {
                            transform: scale(1);
                            filter: drop-shadow(0 0 ${w.glowRadius * 0.5}px ${glowColor});
                        }
                        14% {
                            transform: scale(1.02);
                            filter: drop-shadow(0 0 ${w.glowRadius}px ${glowColor});
                        }
                        28% {
                            transform: scale(1);
                            filter: drop-shadow(0 0 ${w.glowRadius * 0.5}px ${glowColor});
                        }
                        42% {
                            transform: scale(1.03);
                            filter: drop-shadow(0 0 ${w.glowRadius * 1.5}px ${glowColor}) drop-shadow(0 0 ${w.glowRadius * 2}px ${secondaryGlow});
                        }
                        56% {
                            transform: scale(1);
                            filter: drop-shadow(0 0 ${w.glowRadius * 0.5}px ${glowColor});
                        }
                    }`;
                break;
        }

        const dashArray = w.dashArray === 'none' ? 'none' : w.dashArray;

        style.textContent = `
            ${animation}
            .wire-path {
                stroke: ${w.color} !important;
                stroke-width: ${w.strokeWidth}px !important;
                stroke-dasharray: ${dashArray} !important;
                filter: drop-shadow(0 0 ${w.glowRadius}px ${glowColor}) !important;
                opacity: ${w.enabled ? 1 : 0};
                animation: wirePulse ${w.pulseSpeed}s ease-in-out infinite !important;
            }
        `;
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    copyConfig() {
        const config = JSON.stringify(window.gridConfig, null, 2);
        navigator.clipboard.writeText(config).then(() => {
            const btn = document.getElementById('copyConfigBtn');
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = 'Copy Config', 1500);
        });
    }

    resetConfig() {
        location.reload();
    }
}

// Initialize debug UI on desktop
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth >= 1024) {
        window.gridDebugUI = new GridDebugUI();
    }
});
