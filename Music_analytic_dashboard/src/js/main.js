// src/js/main.js

// ============================================================================
// GLOBAL STATE
// ============================================================================

const AppState = {
    allData: [],              // All songs
    selectedData: [],         // Currently selected songs
    colorMode: 'mode',        // Current color encoding
    views: {}                 // References to view instances
};

const FilterState = {
    currentSelection: null,  // Canciones seleccionadas con lasso
    modeFilter: 'both',      // Major, Minor, or both
    rangeFilter: null        // {feature, min, max} o null
};

// Mapa de colores CONSISTENTE
const FEATURE_COLORS = {
    'energy_%': '#CB181D',         // Matches interpolateReds
    'danceability_%': '#6A51A3',   // Matches interpolatePurples
    'valence_%': '#238B45',        // Matches interpolateGreens
    'acousticness_%': '#2171B5',   // Matches interpolateBlues
    'liveness_%': '#E6550D',       // Matches interpolateOranges
    'speechiness_%': '#6A5ACD'     // Matches interpolateCool (purple side)
};


function getFeatureColor(featureKey) {
    return FEATURE_COLORS[featureKey] || '#666';
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function init() {
    console.log('Initializing dashboard...');
    
    try {
        // Load data
        const data = await d3.json('data/visualization_data.json');
        
        console.log(`✓ Loaded ${data.length} songs`);
        
        // Store in global state
        AppState.allData = data;
        AppState.selectedData = data;
        
        // Initialize views
        AppState.views.universe = new UniverseView('#universe-view', data);
        AppState.views.fingerprint = new FingerprintView('#fingerprint-view', data);
        AppState.views.battleground = new BattlegroundView('#battleground-view', data);
        
        // Setup range filter
        document.getElementById('mode-filter').style.display = 'flex';
        const colorSelect = document.getElementById('color-mode');
        const rangeFilter = document.getElementById('range-filter');
        const rangeLabel = document.getElementById('range-label');
        const rangeMin = document.getElementById('range-min');
        const rangeMax = document.getElementById('range-max');
        const rangeValues = document.getElementById('range-values');
        // Mode filter setup
        const modeFilter = document.getElementById('mode-filter');
        const btnMajor = document.getElementById('btn-major');
        const btnMinor = document.getElementById('btn-minor');
        const btnBoth = document.getElementById('btn-both');

        let currentModeFilter = 'both';  // Estado global

        // Mostrar/ocultar botones según selección
        colorSelect.addEventListener('change', function() {
            const mode = this.value;
            
            if (mode === 'mode') {
                modeFilter.style.display = 'flex';  // Mostrar botones
                rangeFilter.style.display = 'none';  // Ocultar slider
            } else {
                modeFilter.style.display = 'none';   // Ocultar botones
                rangeFilter.style.display = 'flex';  // Mostrar slider
                currentModeFilter = 'both';  // Reset
                if (AppState.views.universe) {
                    AppState.views.universe.applyModeFilter('both');
                }
            }
        });

        // Funcionalidad de los botones
        function setModeFilter(mode) {
            currentModeFilter = mode;
            
            // Actualizar UI
            btnMajor.classList.remove('active');
            btnMinor.classList.remove('active');
            btnBoth.classList.remove('active');
            
            if (mode === 'Major') btnMajor.classList.add('active');
            else if (mode === 'Minor') btnMinor.classList.add('active');
            else btnBoth.classList.add('active');
            
            // Aplicar filtro
            if (AppState.views.universe) {
                AppState.views.universe.applyModeFilter(mode);
            }
        }

        btnMajor.addEventListener('click', () => setModeFilter('Major'));
        btnMinor.addEventListener('click', () => setModeFilter('Minor'));
        btnBoth.addEventListener('click', () => setModeFilter('both'));

        colorSelect.addEventListener('change', function() {
            const mode = this.value;
            
            if (mode === 'mode') {
                rangeFilter.style.display = 'none';
                if (AppState.views.universe) {
                    AppState.views.universe.clearRangeFilter();
                }
            } else {
                rangeFilter.style.display = 'flex';
                const labels = {
                    'energy_%': 'Energy:',
                    'danceability_%': 'Dance:',
                    'valence_%': 'Happy:',
                    'acousticness_%': 'Acoustic:'
                };
                rangeLabel.textContent = labels[mode] || 'Range:';
                rangeMin.value = 0;
                rangeMax.value = 100;
                rangeValues.textContent = '0 - 100';
            }
        });

        function applyAllFilters() {
            if (!AppState.views.universe) return;
            
            let filtered = AppState.allData;
            
            // 1. Filtro de lasso (base)
            if (FilterState.currentSelection) {
                filtered = FilterState.currentSelection;
            }
            
            // 2. Filtro de modo
            if (FilterState.modeFilter !== 'both') {
                filtered = filtered.filter(d => d.mode === FilterState.modeFilter);
            }
            
            // 3. Filtro de rango
            if (FilterState.rangeFilter) {
                const {feature, min, max} = FilterState.rangeFilter;
                filtered = filtered.filter(d => {
                    const value = d[feature];
                    return value >= min && value <= max;
                });
            }
            
            // Aplicar visual
            AppState.views.universe.applyFilters(filtered);
            
            // Actualizar otros paneles
            if (typeof handleSelection === 'function') {
                handleSelection(filtered);
            }
            
            console.log(`✓ Total filtered: ${filtered.length} songs`);
        }

        function updateRangeFilter() {
            let min = parseInt(rangeMin.value);
            let max = parseInt(rangeMax.value);
            
            if (min > max) {
                [min, max] = [max, min];
                rangeMin.value = min;
                rangeMax.value = max;
            }
            
            rangeValues.textContent = `${min} - ${max}`;
            
            const mode = colorSelect.value;
            if (mode !== 'mode' && AppState.views.universe) {
                AppState.views.universe.applyRangeFilter(mode, min, max);
            }
        }

        rangeMin.addEventListener('input', updateRangeFilter);
        rangeMax.addEventListener('input', updateRangeFilter);

        // Set up event listeners
        setupEventListeners();
        
        // Hide loading screen
        document.getElementById('loading').classList.add('hidden');
        
        console.log('✓ Dashboard initialized successfully');
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        alert('Error loading data. Please check console for details.');
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    // Color mode selector
    const colorSelect = document.getElementById('color-mode');
    colorSelect.addEventListener('change', (e) => {
        AppState.colorMode = e.target.value;
        AppState.views.universe.updateColorMode(AppState.colorMode);
    });
}

// ============================================================================
// SELECTION HANDLER (Called by Universe view)
// ============================================================================

function handleSelection(selectedSongs) {
    console.log(`Selection changed: ${selectedSongs.length} songs`);
    
    // Update global state
    AppState.selectedData = selectedSongs;
    
    // Update selection count
    document.getElementById('selection-count').textContent = 
        `${selectedSongs.length} song${selectedSongs.length !== 1 ? 's' : ''} selected`;
    
    // Update other views
    AppState.views.fingerprint.update(selectedSongs);
    AppState.views.battleground.update(selectedSongs);
}

// ============================================================================
// FEATURE CLICK HANDLER (Called by Fingerprint view)
// ============================================================================

function handleFeatureClick(feature) {
    console.log(`Feature clicked: ${feature}`);
    
    // Update color mode
    AppState.colorMode = feature;
    document.getElementById('color-mode').value = feature;
    
    // Update universe
    AppState.views.universe.updateColorMode(feature);
}

// ============================================================================
// PLATFORM CLICK HANDLER (Called by Battleground view)
// ============================================================================

function handlePlatformClick(platform) {
    console.log(`Platform clicked: ${platform}`);
    
    // Determine which column to use
    const platformColumn = {
        'Spotify': 'in_spotify_playlists',
        'Apple Music': 'in_apple_playlists',
        'Deezer': 'in_deezer_playlists'
    }[platform];
    
    // Get top 10% performers on this platform
    const sortedData = [...AppState.allData].sort((a, b) => 
        b[platformColumn] - a[platformColumn]
    );
    const topCount = Math.floor(sortedData.length * 0.1);
    const topPerformers = sortedData.slice(0, topCount);
    
    // Highlight in universe
    AppState.views.universe.highlightSongs(topPerformers);
}

// ============================================================================
// START APPLICATION
// ============================================================================

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);