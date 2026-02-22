// src/js/battleground.js 
// "Platform Preference by Audio Features"


class BattlegroundView {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        
        
        this.margin = {top: 45, right: 15, bottom: 65, left: 95};
        
        
        // Audio features to analyze
        this.audioFeatures = [
            { key: 'energy_%', label: 'High Energy' },
            { key: 'danceability_%', label: 'Danceable' },
            { key: 'valence_%', label: 'Happy/Positive' },
            { key: 'acousticness_%', label: 'Acoustic' },
            { key: 'speechiness_%', label: 'Lyric-Heavy' },
            { key: 'liveness_%', label: 'Live' }
        ];
        
        // Platforms
        this.platforms = [
            { key: 'in_spotify_playlists', label: 'Spotify', color: '#1DB954' },
            { key: 'in_apple_playlists', label: 'Apple Music', color: '#FA243C' },
            { key: 'in_deezer_playlists', label: 'Deezer', color: '#FF0092' }
        ];
        
        this.init();
    }
    
    init() {
        const container = d3.select(this.containerId);
        // Get container dimensions
        const totalWidth = 900;  
        const totalHeight = 300; 

        // 2. Margin adjusting
        this.margin = {top: -30, right: 15, bottom: 60, left: 100};

        // Calculamos el área donde irán las cajitas de colores
        this.width = totalWidth - this.margin.left - this.margin.right;
        this.height = totalHeight - this.margin.top - this.margin.bottom;
        
        // 3. Creation of elastic SVG 
        this.svg = container.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`) 
            .attr('preserveAspectRatio', 'xMidYMid meet') 
            .style('overflow', 'visible');
        
        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
        
        // Initial render
        this.render(this.data);
        
        console.log('✓ Battleground view initialized');
    }
    
    update(selectedData) {
        // Clear previous (pero no el SVG completo)
        this.g.selectAll('*').remove();
        this.svg.selectAll('text.title').remove();
        this.svg.selectAll('defs').remove();
        
        // Render with new data
        this.render(selectedData);
    }
    

    calculateCorrelation(data, audioFeature, platformKey) {
        // Filter songs with valid values
        const validData = data.filter(d => 
            d[audioFeature] != null && 
            d[platformKey] != null &&
            d[platformKey] > 0
        );
        
        if (validData.length < 3) return 0;
        
        // calculus of Pearson correlation simplified
        const n = validData.length;
        const audioValues = validData.map(d => d[audioFeature]);
        const platformValues = validData.map(d => Math.log10(d[platformKey] + 1));
        
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
        
        // correlation calculus
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
        
        // Scales creation
        const xScale = d3.scaleBand()
            .domain(this.platforms.map(p => p.label))
            .range([0, this.width])
            .padding(0.1);
        
        const yScale = d3.scaleBand()
            .domain(this.audioFeatures.map(f => f.label))
            .range([0, this.height])
            .padding(0.1);
        
        // Color scale for correlation
        const colorScale = d3.scaleSequential()
            .domain([-1, 1])
            .interpolator(d3.interpolateRdYlGn);
        
       
        this.svg.append('text')
            .attr('class', 'title')
            .attr('x', this.margin.left + this.width / 2)
            .attr('y', -60)  
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')  
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(`Platform Preferences: ${data.length} Songs`);
        
        // subtittle
        this.svg.append('text')
            .attr('class', 'title')
            .attr('x', this.margin.left + this.width / 2)
            .attr('y', -45)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', '#666')
            .text('Correlation between audio features and platform presence');
        
        // edge 
        this.g.append('g')
            .attr('transform', `translate(0,${this.height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'rotate(0)')
            .attr('text-anchor', 'middle')
            .attr('dx', '-0.5em')
            .attr('dy', '1em')
            .style('font-size', '15px')
            .style('font-weight', 'bold');
        
        this.g.append('g')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .style('font-size', '15px');
        
       
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
        
        
        cells.transition()
            .duration(600)
            .delay((d, i) => i * 50)
            .attr('opacity', 0.85);
        
        // values for correlation
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
        
        
        this.drawLegend(colorScale);
        
        // Interacticity
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
                // convert label a key
                const featureKey = self.audioFeatures.find(f => f.label === d.feature).key;
                const featureColor = getFeatureColor(featureKey);
                
            
                self.g.selectAll('rect.cell')
                    .attr('stroke', 'white')
                    .attr('stroke-width', 2);
                
                self.g.selectAll('rect.cell')
                    .filter(cell => cell.feature === d.feature)
                    .attr('stroke', featureColor)
                    .attr('stroke-width', 4);
                
                // 1. update AppState
                AppState.colorMode = featureKey;
                
                // 2. change the  dropdown
                const colorSelect = document.getElementById('color-mode');
                if (colorSelect) {
                    colorSelect.value = featureKey;
                }
                
                // 3. Key: Update Universe directly
                if (AppState.views && AppState.views.universe) {
                    AppState.views.universe.colorMode = featureKey;
                    AppState.views.universe.updateColorMode(featureKey);
                }
                
                // 4. shot event change (to show slider)
                if (colorSelect) {
                    colorSelect.dispatchEvent(new Event('change'));
                }
                
                // 5. Set slider from correlation
                setTimeout(() => {
                    const rangeMin = document.getElementById('range-min');
                    const rangeMax = document.getElementById('range-max');
                    
                    if (rangeMin && rangeMax) {
                        const correlation = d.correlation;
                        
                        if (correlation > 0.5) {
                            rangeMin.value = 60;
                            rangeMax.value = 100;
                        } else if (correlation > 0.2) {
                            rangeMin.value = 40;
                            rangeMax.value = 80;
                        } else if (correlation < -0.5) {
                            rangeMin.value = 0;
                            rangeMax.value = 40;
                        } else if (correlation < -0.2) {
                            rangeMin.value = 20;
                            rangeMax.value = 60;
                        } else {
                            rangeMin.value = 0;
                            rangeMax.value = 100;
                        }
                        
                        rangeMin.dispatchEvent(new Event('input'));
                    }
                }, 100);
                
                console.log(`✓ Clicked: ${d.platform} × ${d.feature} (r=${d.correlation.toFixed(2)})`);
            });
    }
    
    drawLegend(colorScale) {
        const legendWidth = 200;  
        const legendHeight = 25;  
        const legendX = this.width - legendWidth - 10;  
        const legendY = -70;  
        
        // Gradient
        const defs = this.svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'correlation-gradient-' + Math.random().toString(36).substr(2, 9))
            .attr('x1', '0%')
            .attr('x2', '100%');
        
        const gradientId = gradient.attr('id');
        
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
            .style('fill', `url(#${gradientId})`)
            .attr('stroke', '#999')
            .attr('stroke-width', 1);
        
        // Legend title 
        this.g.append('text')
            .attr('x', legendX + legendWidth / 2)
            .attr('y', legendY - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text('Correlation');
        
        // Legend labels 
        this.g.append('text')
            .attr('x', legendX - 5)
            .attr('y', legendY + legendHeight / 2)
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '10px')
            .style('fill', '#666')
            .text('Negative');
        
        this.g.append('text')
            .attr('x', legendX + legendWidth + 5)
            .attr('y', legendY + legendHeight / 2)
            .attr('text-anchor', 'start')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '10px')
            .style('fill', '#666')
            .text('Positive');
        
        // Reference values
        this.g.append('text')
            .attr('x', legendX)
            .attr('y', legendY + legendHeight + 12)
            .attr('text-anchor', 'middle')
            .style('font-size', '9px')
            .style('fill', '#999')
            .text('-1.0');
        
        this.g.append('text')
            .attr('x', legendX + legendWidth / 2)
            .attr('y', legendY + legendHeight + 12)
            .attr('text-anchor', 'middle')
            .style('font-size', '9px')
            .style('fill', '#999')
            .text('0.0');
        
        this.g.append('text')
            .attr('x', legendX + legendWidth)
            .attr('y', legendY + legendHeight + 12)
            .attr('text-anchor', 'middle')
            .style('font-size', '9px')
            .style('fill', '#999')
            .text('1.0');
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
                        <span style="font-size: 0.85em; color: #ccc;">
                            💡 Click to filter by this feature
                        </span>
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
