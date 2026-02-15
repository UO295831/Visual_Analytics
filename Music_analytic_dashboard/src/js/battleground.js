// src/js/battleground.js - VERSIÓN COMPLETAMENTE NUEVA
// "Platform Preference by Audio Features"

/**
 * BattlegroundView - Platform Preference Analysis
 * 
 * Muestra: ¿Qué características de audio prefiere cada plataforma?
 * 
 * En lugar de comparar cantidades (donde Spotify siempre gana),
 * compara CORRELACIONES entre features y presencia en plataforma.
 * 
 * Insight: "Apple Music favorece canciones acústicas, 
 *          Spotify favorece canciones con alta energía"
 */

class BattlegroundView {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.margin = {top: 40, right: 30, bottom: 80, left: 120};
        
        // Características de audio a analizar
        this.audioFeatures = [
            { key: 'energy_%', label: 'High Energy' },
            { key: 'danceability_%', label: 'Danceable' },
            { key: 'valence_%', label: 'Happy/Positive' },
            { key: 'acousticness_%', label: 'Acoustic' },
            { key: 'speechiness_%', label: 'Lyric-Heavy' }
        ];
        
        // Plataformas
        this.platforms = [
            { key: 'in_spotify_playlists', label: 'Spotify', color: '#1DB954' },
            { key: 'in_apple_playlists', label: 'Apple Music', color: '#FA243C' },
            { key: 'in_deezer_playlists', label: 'Deezer', color: '#FF0092' }
        ];
        
        this.init();
    }
    
    init() {
        // Get container dimensions
        const container = d3.select(this.containerId);
        const bbox = container.node().getBoundingClientRect();
        
        this.width = bbox.width - this.margin.left - this.margin.right;
        this.height = bbox.height - this.margin.top - this.margin.bottom;
        
        // Create SVG
        this.svg = container.append('svg')
            .attr('width', bbox.width)
            .attr('height', bbox.height);
        
        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
        
        // Initial render
        this.render(this.data);
        
        console.log('✓ Battleground view initialized');
    }
    
    update(selectedData) {
        // Clear previous
        this.g.selectAll('*').remove();
        
        // Render with new data
        this.render(selectedData);
    }
    
    /**
     * Calcula la correlación entre una feature de audio y presencia en plataforma
     */
    calculateCorrelation(data, audioFeature, platformKey) {
        // Filtrar canciones con valores válidos
        const validData = data.filter(d => 
            d[audioFeature] != null && 
            d[platformKey] != null &&
            d[platformKey] > 0  // Solo canciones que están en la plataforma
        );
        
        if (validData.length < 3) return 0;
        
        // Calcular correlación de Pearson simplificada
        const n = validData.length;
        const audioValues = validData.map(d => d[audioFeature]);
        const platformValues = validData.map(d => Math.log10(d[platformKey] + 1)); // Log para normalizar
        
        const audioMean = d3.mean(audioValues);
        const platformMean = d3.mean(platformValues);
        
        let numerator = 0;
        let audioDenom = 0;
        let platformDenom = 0;
        
        for (let i = 0; i < n; i++) {
            const audioDiff = audioValues[i] - audioMean;
            const platformDiff = platformValues[i] - platformMean;
            numerator += audioDiff * platformDiff;
            audioDenom += audioDiff * audioDiff;
            platformDenom += platformDiff * platformDiff;
        }
        
        const correlation = numerator / Math.sqrt(audioDenom * platformDenom);
        return isNaN(correlation) ? 0 : correlation;
    }
    
    render(data) {
        const self = this;
        
        // Calcular correlaciones para cada combinación
        const heatmapData = [];
        
        this.audioFeatures.forEach(feature => {
            this.platforms.forEach(platform => {
                const correlation = this.calculateCorrelation(
                    data,
                    feature.key,
                    platform.key
                );
                
                heatmapData.push({
                    feature: feature.label,
                    platform: platform.label,
                    correlation: correlation,
                    color: platform.color
                });
            });
        });
        
        // Crear escalas
        const xScale = d3.scaleBand()
            .domain(this.platforms.map(p => p.label))
            .range([0, this.width])
            .padding(0.1);
        
        const yScale = d3.scaleBand()
            .domain(this.audioFeatures.map(f => f.label))
            .range([0, this.height])
            .padding(0.1);
        
        // Color scale para correlación
        const colorScale = d3.scaleSequential()
            .domain([-1, 1])
            .interpolator(d3.interpolateRdYlGn);
        
        // Dibujar título
        this.svg.append('text')
            .attr('x', this.margin.left + this.width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text(`Platform Preferences: ${data.length} Songs`);
        
        // Dibujar axes
        this.g.append('g')
            .attr('transform', `translate(0,${this.height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .attr('text-anchor', 'end')
            .attr('dx', '-0.5em')
            .attr('dy', '0.5em')
            .style('font-size', '11px')
            .style('font-weight', 'bold');
        
        this.g.append('g')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .style('font-size', '11px');
        
        // Dibujar celdas del heatmap
        const cells = this.g.selectAll('rect.cell')
            .data(heatmapData)
            .enter()
            .append('rect')
            .attr('class', 'cell')
            .attr('x', d => xScale(d.platform))
            .attr('y', d => yScale(d.feature))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('fill', d => colorScale(d.correlation))
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .attr('opacity', 0)
            .style('cursor', 'pointer');
        
        // Animar entrada
        cells.transition()
            .duration(600)
            .delay((d, i) => i * 50)
            .attr('opacity', 0.85);
        
        // Agregar valores de correlación
        this.g.selectAll('text.cell-value')
            .data(heatmapData)
            .enter()
            .append('text')
            .attr('class', 'cell-value')
            .attr('x', d => xScale(d.platform) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.feature) + yScale.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', d => Math.abs(d.correlation) > 0.5 ? 'white' : '#333')
            .style('pointer-events', 'none')
            .attr('opacity', 0)
            .text(d => d.correlation.toFixed(2))
            .transition()
            .duration(600)
            .delay((d, i) => i * 50 + 300)
            .attr('opacity', 1);
        
        // Agregar leyenda
        this.drawLegend(colorScale);
        
        // Interactividad
        cells
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 1)
                    .attr('stroke-width', 3);
                
                self.showTooltip(event, d);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.85)
                    .attr('stroke-width', 2);
                
                self.hideTooltip();
            })
            .on('click', function(event, d) {
                // Trigger filter in Universe based on this feature
                if (typeof handleFeatureClick === 'function') {
                    // Convertir label a key
                    const featureKey = self.audioFeatures.find(f => f.label === d.feature).key;
                    handleFeatureClick(featureKey);
                }
            });
    }
    
    drawLegend(colorScale) {
        const legendWidth = 200;
        const legendHeight = 15;
        const legendX = this.width - legendWidth - 10;
        const legendY = -30;
        
        // Gradient
        const defs = this.svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'correlation-gradient')
            .attr('x1', '0%')
            .attr('x2', '100%');
        
        gradient.selectAll('stop')
            .data([
                { offset: '0%', color: colorScale(-1) },
                { offset: '50%', color: colorScale(0) },
                { offset: '100%', color: colorScale(1) }
            ])
            .enter()
            .append('stop')
            .attr('offset', d => d.offset)
            .attr('stop-color', d => d.color);
        
        // Legend rect
        this.g.append('rect')
            .attr('x', legendX)
            .attr('y', legendY)
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#correlation-gradient)')
            .attr('stroke', '#ccc');
        
        // Legend labels
        this.g.append('text')
            .attr('x', legendX - 5)
            .attr('y', legendY + legendHeight / 2)
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '10px')
            .text('Negative');
        
        this.g.append('text')
            .attr('x', legendX + legendWidth + 5)
            .attr('y', legendY + legendHeight / 2)
            .attr('text-anchor', 'start')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '10px')
            .text('Positive');
        
        this.g.append('text')
            .attr('x', legendX + legendWidth / 2)
            .attr('y', legendY - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .text('Correlation');
    }
    
    showTooltip(event, d) {
        if (!this.tooltip) {
            this.tooltip = d3.select('body')
                .append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0);
        }
        
        const interpretation = this.interpretCorrelation(d.correlation);
        
        this.tooltip
            .transition()
            .duration(200)
            .style('opacity', 1);
        
        this.tooltip
            .html(`
                <strong>${d.platform} × ${d.feature}</strong><br>
                Correlation: <strong>${d.correlation.toFixed(3)}</strong><br>
                <em style="font-size: 0.9em; color: #ffd700;">${interpretation}</em><br>
                <span style="font-size: 0.85em; color: #ccc;">Click to filter by this feature</span>
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip
                .transition()
                .duration(200)
                .style('opacity', 0);
        }
    }
    
    interpretCorrelation(r) {
        const absR = Math.abs(r);
        if (absR > 0.7) {
            return r > 0 ? '🔥 Strong positive preference' : '❄️ Strong negative preference';
        } else if (absR > 0.4) {
            return r > 0 ? '✓ Moderate positive preference' : '✗ Moderate negative preference';
        } else if (absR > 0.2) {
            return r > 0 ? 'Slight positive preference' : 'Slight negative preference';
        } else {
            return 'No clear preference';
        }
    }
}
