/**
 * Grid Debug UI - Real-time parameter tuning for grid effects
 * Includes: Ripple effect, Wire neon controls, Grid parameters
 */

// Extended configuration with ripple and wire settings
window.gridConfig = {
    // Grid base
    cellSize: 28,
    radius: 143,
    maxMove: 10,
    borderOpacity: 0.06,
    elasticPower: 2.2,

    // Ripple effect
    ripple: {
        enabled: true,
        speed: 0.15,           // Wave propagation speed (0.05 - 0.3)
        amplitude: 8,          // Max displacement (2 - 20)
        frequency: 0.8,        // Wave frequency (0.3 - 2)
        decay: 0.92,           // How fast waves fade (0.85 - 0.98)
        maxWaves: 3,           // Concurrent waves allowed
        color: 'rgba(96, 165, 250, 0.15)'  // Wave highlight color
    },

    // Wire neon effect
    wire: {
        color: '#60a5fa',      // Base wire color
        glowIntensity: 0.5,    // Glow strength (0 - 1)
        glowRadius: 4,         // Blur radius (0 - 15)
        strokeWidth: 1.5,      // Line thickness (0.5 - 4)
        dashArray: '8 6',      // Dash pattern
        pulseSpeed: 3,         // Animation speed in seconds
        enabled: true
    }
};

// Active ripples storage
window.activeRipples = [];

/**
 * RippleSystem - Manages liquid wave effects on grid
 */
class RippleSystem {
    constructor(cells, hero) {
        this.cells = cells;
        this.hero = hero;
        this.ripples = [];
        this.animationId = null;
        this.cellPositions = [];
        this.isAnimating = false;
    }

    // Cache cell positions for performance
    cachePositions() {
        const heroRect = this.hero.getBoundingClientRect();
        this.cellPositions = this.cells.map(cell => {
            const rect = cell.getBoundingClientRect();
            return {
                x: rect.left - heroRect.left + rect.width / 2,
                y: rect.top - heroRect.top + rect.height / 2,
                cell: cell
            };
        });
    }

    // Create a new ripple at click position
    createRipple(x, y) {
        if (!window.gridConfig.ripple.enabled) return;

        // Limit concurrent ripples
        if (this.ripples.length >= window.gridConfig.ripple.maxWaves) {
            this.ripples.shift(); // Remove oldest
        }

        this.ripples.push({
            x: x,
            y: y,
            radius: 0,
            strength: 1,
            startTime: performance.now()
        });

        if (!this.isAnimating) {
            this.startAnimation();
        }
    }

    // Main animation loop
    startAnimation() {
        this.isAnimating = true;
        this.cachePositions();
        this.animate();
    }

    animate() {
        if (this.ripples.length === 0) {
            this.isAnimating = false;
            this.resetCells();
            return;
        }

        const config = window.gridConfig.ripple;
        const now = performance.now();

        // Update each ripple
        this.ripples = this.ripples.filter(ripple => {
            const elapsed = now - ripple.startTime;
            ripple.radius = elapsed * config.speed;
            ripple.strength *= config.decay;
            return ripple.strength > 0.01;
        });

        // Apply combined effect to cells
        this.cellPositions.forEach(({ x, y, cell }) => {
            let totalDx = 0;
            let totalDy = 0;
            let totalHighlight = 0;

            this.ripples.forEach(ripple => {
                const dx = x - ripple.x;
                const dy = y - ripple.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Wave function
                const wavePosition = distance - ripple.radius;
                const waveWidth = 80; // Width of the wave band

                if (Math.abs(wavePosition) < waveWidth) {
                    // Sine wave displacement
                    const wave = Math.sin(wavePosition * config.frequency * 0.1) *
                                 ripple.strength *
                                 config.amplitude;

                    // Direction from ripple center
                    const angle = Math.atan2(dy, dx);
                    totalDx += Math.cos(angle) * wave;
                    totalDy += Math.sin(angle) * wave;

                    // Highlight intensity
                    const proximity = 1 - Math.abs(wavePosition) / waveWidth;
                    totalHighlight += proximity * ripple.strength;
                }
            });

            // Apply transforms
            if (Math.abs(totalDx) > 0.1 || Math.abs(totalDy) > 0.1) {
                cell.style.transform = `translate(${totalDx.toFixed(2)}px, ${totalDy.toFixed(2)}px)`;
            } else {
                cell.style.transform = '';
            }

            // Apply highlight
            if (totalHighlight > 0.01) {
                const alpha = Math.min(totalHighlight * 0.15, 0.3);
                const isZb = document.body.classList.contains('zb-mode');
                cell.style.backgroundColor = isZb
                    ? `rgba(96, 165, 250, ${alpha})`
                    : `rgba(59, 130, 246, ${alpha * 0.7})`;
            } else {
                cell.style.backgroundColor = '';
            }
        });

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    resetCells() {
        this.cells.forEach(cell => {
            cell.style.transform = '';
            cell.style.backgroundColor = '';
        });
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.resetCells();
    }
}

/**
 * DebugUI - Creates and manages the debug panel
 */
class GridDebugUI {
    constructor() {
        this.panel = null;
        this.isCollapsed = false;
        this.createPanel();
        this.attachEvents();
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.className = 'grid-debug-ui';
        panel.innerHTML = `
            <div class="debug-header">
                <span class="debug-title">Grid Debug</span>
                <button class="debug-toggle" id="debugCollapseBtn">−</button>
            </div>

            <!-- RIPPLE SECTION -->
            <div class="debug-section" data-section="ripple">
                <div class="section-header">
                    <span class="section-title">Ripple Effect</span>
                    <span class="section-toggle">▼</span>
                </div>
                <div class="section-content">
                    <div class="control-row">
                        <label class="control-label">Enabled</label>
                        <input type="checkbox" id="rippleEnabled" checked />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Speed</label>
                        <span class="control-value" id="rippleSpeedVal">0.15</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="rippleSpeed" min="0.05" max="0.4" step="0.01" value="0.15" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Amplitude</label>
                        <span class="control-value" id="rippleAmplitudeVal">8</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="rippleAmplitude" min="2" max="25" step="1" value="8" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Frequency</label>
                        <span class="control-value" id="rippleFrequencyVal">0.8</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="rippleFrequency" min="0.2" max="2" step="0.1" value="0.8" />
                    </div>

                    <div class="control-row">
                        <label class="control-label">Decay</label>
                        <span class="control-value" id="rippleDecayVal">0.92</span>
                    </div>
                    <div class="control-slider">
                        <input type="range" id="rippleDecay" min="0.8" max="0.99" step="0.01" value="0.92" />
                    </div>

                    <div class="preset-row">
                        <button class="preset-btn" data-preset="subtle">Subtle</button>
                        <button class="preset-btn" data-preset="water">Water</button>
                        <button class="preset-btn" data-preset="elastic">Elastic</button>
                        <button class="preset-btn" data-preset="chaos">Chaos</button>
                    </div>
                </div>
            </div>

            <!-- WIRE SECTION -->
            <div class="debug-section" data-section="wire">
                <div class="section-header">
                    <span class="section-title">Wire Neon</span>
                    <span class="section-toggle">▼</span>
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
                        <input type="range" id="wirePulseSpeed" min="1" max="8" step="0.5" value="3" />
                    </div>

                    <div class="preset-row">
                        <button class="preset-btn" data-wire-preset="neon">Neon</button>
                        <button class="preset-btn" data-wire-preset="subtle">Subtle</button>
                        <button class="preset-btn" data-wire-preset="laser">Laser</button>
                        <button class="preset-btn" data-wire-preset="ghost">Ghost</button>
                    </div>
                </div>
            </div>

            <!-- GRID SECTION -->
            <div class="debug-section" data-section="grid">
                <div class="section-header">
                    <span class="section-title">Grid Base</span>
                    <span class="section-toggle">▼</span>
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
        collapseBtn.innerHTML = '⚙';
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

        // Ripple controls
        this.bindControl('rippleEnabled', 'checkbox', v => window.gridConfig.ripple.enabled = v);
        this.bindControl('rippleSpeed', 'range', v => window.gridConfig.ripple.speed = parseFloat(v), 'rippleSpeedVal');
        this.bindControl('rippleAmplitude', 'range', v => window.gridConfig.ripple.amplitude = parseFloat(v), 'rippleAmplitudeVal');
        this.bindControl('rippleFrequency', 'range', v => window.gridConfig.ripple.frequency = parseFloat(v), 'rippleFrequencyVal');
        this.bindControl('rippleDecay', 'range', v => window.gridConfig.ripple.decay = parseFloat(v), 'rippleDecayVal');

        // Ripple presets
        this.panel.querySelectorAll('[data-preset]').forEach(btn => {
            btn.onclick = () => this.applyRipplePreset(btn.dataset.preset);
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

        // Wire presets
        this.panel.querySelectorAll('[data-wire-preset]').forEach(btn => {
            btn.onclick = () => this.applyWirePreset(btn.dataset.wirePreset);
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

    applyRipplePreset(preset) {
        const presets = {
            subtle: { speed: 0.08, amplitude: 4, frequency: 0.5, decay: 0.95 },
            water: { speed: 0.15, amplitude: 8, frequency: 0.8, decay: 0.92 },
            elastic: { speed: 0.25, amplitude: 15, frequency: 1.2, decay: 0.88 },
            chaos: { speed: 0.35, amplitude: 20, frequency: 1.8, decay: 0.85 }
        };

        const p = presets[preset];
        if (!p) return;

        Object.assign(window.gridConfig.ripple, p);

        // Update UI
        document.getElementById('rippleSpeed').value = p.speed;
        document.getElementById('rippleSpeedVal').textContent = p.speed;
        document.getElementById('rippleAmplitude').value = p.amplitude;
        document.getElementById('rippleAmplitudeVal').textContent = p.amplitude;
        document.getElementById('rippleFrequency').value = p.frequency;
        document.getElementById('rippleFrequencyVal').textContent = p.frequency;
        document.getElementById('rippleDecay').value = p.decay;
        document.getElementById('rippleDecayVal').textContent = p.decay;

        // Visual feedback
        this.panel.querySelectorAll('[data-preset]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === preset);
        });
    }

    applyWirePreset(preset) {
        const presets = {
            neon: { color: '#60a5fa', glowIntensity: 0.8, glowRadius: 8, strokeWidth: 2, pulseSpeed: 2 },
            subtle: { color: '#94a3b8', glowIntensity: 0.2, glowRadius: 2, strokeWidth: 1, pulseSpeed: 5 },
            laser: { color: '#ef4444', glowIntensity: 1, glowRadius: 12, strokeWidth: 1.5, pulseSpeed: 1.5 },
            ghost: { color: '#a78bfa', glowIntensity: 0.4, glowRadius: 6, strokeWidth: 1, pulseSpeed: 4 }
        };

        const p = presets[preset];
        if (!p) return;

        Object.assign(window.gridConfig.wire, p);
        this.updateWireStyles();

        // Update UI
        document.getElementById('wireColor').value = p.color;
        document.getElementById('wireColorHex').textContent = p.color;
        document.getElementById('wireGlowIntensity').value = p.glowIntensity;
        document.getElementById('wireGlowIntensityVal').textContent = p.glowIntensity;
        document.getElementById('wireGlowRadius').value = p.glowRadius;
        document.getElementById('wireGlowRadiusVal').textContent = p.glowRadius + 'px';
        document.getElementById('wireStrokeWidth').value = p.strokeWidth;
        document.getElementById('wireStrokeWidthVal').textContent = p.strokeWidth;
        document.getElementById('wirePulseSpeed').value = p.pulseSpeed;
        document.getElementById('wirePulseSpeedVal').textContent = p.pulseSpeed + 's';

        // Visual feedback
        this.panel.querySelectorAll('[data-wire-preset]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.wirePreset === preset);
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

        style.textContent = `
            .wire-path {
                stroke: ${w.color} !important;
                stroke-width: ${w.strokeWidth}px !important;
                filter: drop-shadow(0 0 ${w.glowRadius}px ${glowColor}) !important;
                opacity: ${w.enabled ? 1 : 0};
            }
            @keyframes wirePulse {
                0%, 100% {
                    stroke-dashoffset: 0;
                    filter: drop-shadow(0 0 ${w.glowRadius * 0.5}px ${this.hexToRgba(w.color, w.glowIntensity * 0.5)});
                }
                50% {
                    stroke-dashoffset: -14;
                    filter: drop-shadow(0 0 ${w.glowRadius * 1.5}px ${this.hexToRgba(w.color, w.glowIntensity)});
                }
            }
            .wire-path {
                animation-duration: ${w.pulseSpeed}s !important;
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
        // Reset to defaults
        window.gridConfig = {
            cellSize: 28, radius: 143, maxMove: 10, borderOpacity: 0.06, elasticPower: 2.2,
            ripple: { enabled: true, speed: 0.15, amplitude: 8, frequency: 0.8, decay: 0.92, maxWaves: 3 },
            wire: { color: '#60a5fa', glowIntensity: 0.5, glowRadius: 4, strokeWidth: 1.5, dashArray: '8 6', pulseSpeed: 3, enabled: true }
        };

        // Rebuild grid
        if (window.postItSystem) window.postItSystem.createGrid();
        this.updateWireStyles();

        // Reset UI (reload page is simplest)
        location.reload();
    }
}

// Initialize debug UI on desktop
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth >= 1024) {
        window.gridDebugUI = new GridDebugUI();

        // Initialize ripple system after PostItSystem is ready
        const initRipple = setInterval(() => {
            if (window.postItSystem && window.postItSystem.cells.length > 0) {
                clearInterval(initRipple);
                window.rippleSystem = new RippleSystem(
                    window.postItSystem.cells,
                    window.postItSystem.hero
                );

                // Hook into grid clicks
                const grid = document.getElementById('hero-grid');
                if (grid) {
                    grid.addEventListener('click', (e) => {
                        const heroRect = document.getElementById('hero').getBoundingClientRect();
                        const x = e.clientX - heroRect.left;
                        const y = e.clientY - heroRect.top;
                        window.rippleSystem.createRipple(x, y);
                    });
                }
            }
        }, 100);
    }
});
