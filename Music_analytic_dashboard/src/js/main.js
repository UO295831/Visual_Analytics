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
        const colorSelect = document.getElementById('color-mode');
        const rangeFilter = document.getElementById('range-filter');
        const rangeLabel = document.getElementById('range-label');
        const rangeMin = document.getElementById('range-min');
        const rangeMax = document.getElementById('range-max');
        const rangeValues = document.getElementById('range-values');

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