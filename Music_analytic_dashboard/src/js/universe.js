// src/js/universe.js - VERSION MEJORADA CON BRUSH Y ZOOM

/**
 * UniverseView - Enhanced t-SNE Scatter Plot
 * 
 * Features:
 * - Brush selection (rectangular and lasso-like)
 * - Zoom and pan (mouse wheel + drag)
 * - Reset zoom button
 * - Smooth transitions
 * - Ghost effect on selection
 */

class UniverseView {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.colorMode = 'mode';
        this.margin = {top: 20, right: 120, bottom: 60, left: 60};
        
        // Zoom state
        this.currentTransform = d3.zoomIdentity;
        
        this.init();
    }
    
    init() {
        // Get container
        const container = d3.select(this.containerId);
        const bbox = container.node().getBoundingClientRect();
        
        this.width = bbox.width - this.margin.left - this.margin.right;
        this.height = bbox.height - this.margin.top - this.margin.bottom;
        
        // Create SVG
        this.svg = container.append('svg')
            .attr('width', bbox.width)
            .attr('height', bbox.height);
        
        // Create main group
        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Create legend container
        this.legendContainer = this.g.append('g')
            .attr('class', 'legend-container')
            .attr('transform', `translate(${this.width + 20}, 20)`)
        
        // Create zoom group (this will be transformed)
        this.zoomGroup = this.g.append('g')
            .attr('class', 'zoom-group');
        
        // Create scales
        this.createScales();
        
        // Draw components
        this.drawAxes();
        this.drawPoints();
        this.setupZoom();
        this.setupBrush();
        this.createTooltip();
        this.addResetButton();
        
        console.log('✓ Universe view initialized with zoom and brush');
    }
    
    createScales() {
        // X scale
        this.xScale = d3.scaleLinear()
            .domain(d3.extent(this.data, d => d.tsne_1))
            .range([0, this.width])
            .nice();
        
        // Y scale
        this.yScale = d3.scaleLinear()
            .domain(d3.extent(this.data, d => d.tsne_2))
            .range([this.height, 0])
            .nice();
        
        // Size scale (by streams)
        this.sizeScale = d3.scaleSqrt()
            .domain(d3.extent(this.data, d => d.streams))
            .range([3, 20]);
        
        // Color scales
        this.colorScales = {
            'mode': d3.scaleOrdinal()
                .domain(['Major', 'Minor'])
                .range(['#FF8C00', '#4169E1']),  // Orange, Blue
            
            'energy_%': d3.scaleSequential(d3.interpolateViridis)
                .domain([0, 100]),
            
            'danceability_%': d3.scaleSequential(d3.interpolatePlasma)
                .domain([0, 100]),
            
            'valence_%': d3.scaleSequential(d3.interpolateRdYlGn)
                .domain([0, 100]),
            
            'acousticness_%': d3.scaleSequential(d3.interpolateYlGnBu)
                .domain([0, 100])
        };
    }
    
    drawAxes() {
        // X axis
        this.xAxisGroup = this.g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xScale).ticks(8));
        
        this.xAxisGroup.append('text')
            .attr('class', 'axis-label')
            .attr('x', this.width / 2)
            .attr('y', 40)
            .attr('fill', 'black')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('t-SNE Dimension 1');
        
        // Y axis
        this.yAxisGroup = this.g.append('g')
            .attr('class', 'axis y-axis')
            .call(d3.axisLeft(this.yScale).ticks(8));
        
        this.yAxisGroup.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.height / 2)
            .attr('y', -40)
            .attr('fill', 'black')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('t-SNE Dimension 2');
        
        // Grid
        this.g.append('g')
            .attr('class', 'grid')
            .attr('opacity', 0.1)
            .call(d3.axisLeft(this.yScale)
                .tickSize(-this.width)
                .tickFormat('')
            );
        
        this.g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${this.height})`)
            .attr('opacity', 0.1)
            .call(d3.axisBottom(this.xScale)
                .tickSize(-this.height)
                .tickFormat('')
            );
    }
    
    drawPoints() {
        const self = this;
        
        this.circles = this.zoomGroup.selectAll('circle.song-point')
            .data(this.data)
            .enter()
            .append('circle')
            .attr('class', 'song-point')
            .attr('cx', d => this.xScale(d.tsne_1))
            .attr('cy', d => this.yScale(d.tsne_2))
            .attr('r', d => this.sizeScale(d.streams))
            .attr('fill', d => this.getColor(d))
            .attr('opacity', 0.7)
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 1)
                    .attr('stroke-width', 2)
                    .attr('r', self.sizeScale(d.streams) * 1.2);
                
                self.showTooltip(event, d);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.7)
                    .attr('stroke-width', 1)
                    .attr('r', self.sizeScale(d.streams));
                
                self.hideTooltip();
            });
    }
    
    getColor(d) {
        if (this.colorMode === 'mode') {
            return this.colorScales.mode(d.mode);
        } else {
            return this.colorScales[this.colorMode](d[this.colorMode]);
        }
    }
    
    setupZoom() {
        const self = this;
        
        this.zoom = d3.zoom()
            .scaleExtent([0.5, 10])
            .translateExtent([[-100, -100], [this.width + 100, this.height + 100]])
            .filter(function(event) {
                // Zoom con scroll: SIEMPRE
                if (event.type === 'wheel') {
                    return true;
                }
                
                // Pan: SOLO con Shift presionado
                if (event.type === 'mousedown' || event.type === 'mousemove') {
                    return event.shiftKey;  // ← LA CLAVE
                }
                
                return false;
            })
            .on('zoom', function(event) {
                self.zoomed(event);
            });
        
        this.svg.call(this.zoom);
        this.svg.on('dblclick.zoom', null);
        this.svg.on('dblclick', () => this.resetZoom());
        
        console.log('✓ Zoom: Scroll=zoom, Shift+Drag=pan');
    }
    
    zoomed(event) {
        // Save current transform
        this.currentTransform = event.transform;
        
        // Apply transform to zoom group (points)
        this.zoomGroup.attr('transform', event.transform);
        
        // Update axes to match zoom level
        this.xAxisGroup.call(
            d3.axisBottom(event.transform.rescaleX(this.xScale)).ticks(8)
        );
        
        this.yAxisGroup.call(
            d3.axisLeft(event.transform.rescaleY(this.yScale)).ticks(8)
        );
        
        // Update brush extent if needed
        if (this.brushGroup) {
            this.updateBrushExtent(event.transform);
        }
    }
    
    resetZoom() {
        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity);
        
        console.log('✓ Zoom reset');
    }
    
    setupBrush() {
        const self = this;
        
        // Create brush behavior
        this.brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on('start', function(event) {
                // Clear previous selection styling
                if (!event.sourceEvent || !event.sourceEvent.shiftKey) {
                    // Normal brush - will replace selection
                }
            })
            .on('brush', function(event) {
                // Visual feedback during brushing
                self.highlightBrushedPoints(event.selection, true);
            })
            .on('end', function(event) {
                self.onBrushEnd(event);
            });
        
        // Add brush to a separate layer (above zoom group)
        this.brushGroup = this.g.append('g')
            .attr('class', 'brush')
            .call(this.brush);
        
        // Style brush
        this.brushGroup.select('.overlay')
            .style('cursor', 'crosshair');
        
        this.brushGroup.select('.selection')
            .style('fill', '#667eea')
            .style('fill-opacity', 0.2)
            .style('stroke', '#667eea')
            .style('stroke-width', 2);
    }
    
    updateBrushExtent(transform) {
        // Update brush extent to match zoom
        // This keeps brush selection accurate during zoom
        this.brush.extent([
            [0, 0],
            [this.width, this.height]
        ]);
        
        this.brushGroup.call(this.brush);
    }
    
    highlightBrushedPoints(selection, temporary = false) {
        if (!selection) {
            // No selection - show all
            this.circles.attr('opacity', 0.7);
            return;
        }
        
        const [[x0, y0], [x1, y1]] = selection;
        const transform = this.currentTransform;
        
        this.circles.attr('opacity', d => {
            // Transform point coordinates according to current zoom
            const x = transform.applyX(this.xScale(d.tsne_1));
            const y = transform.applyY(this.yScale(d.tsne_2));
            
            const isSelected = x >= x0 && x <= x1 && y >= y0 && y <= y1;
            return isSelected ? 0.9 : (temporary ? 0.3 : 0.1);
        });
    }
    
    onBrushEnd(event) {
        if (!event.selection) {
            // No selection - reset
            this.circles.attr('opacity', 0.7);
            if (typeof handleSelection === 'function') {
                handleSelection(this.data);
            }
            return;
        }
        
        const [[x0, y0], [x1, y1]] = event.selection;
        const transform = this.currentTransform;
        
        // Find selected points
        const selected = [];
        
        this.circles.each((d) => {
            const x = transform.applyX(this.xScale(d.tsne_1));
            const y = transform.applyY(this.yScale(d.tsne_2));
            
            if (x >= x0 && x <= x1 && y >= y0 && y <= y1) {
                selected.push(d);
            }
        });
        
        // Apply ghost effect
        this.highlightBrushedPoints(event.selection, false);
        
        // Notify other views
        if (typeof handleSelection === 'function') {
            handleSelection(selected);
        }
        
        console.log(`✓ Selected ${selected.length} songs`);
    }
    
    addResetButton() {
        const self = this;
        
        // Add reset zoom button
        const buttonGroup = this.svg.append('g')
            .attr('class', 'reset-button')
            .attr('transform', `translate(${this.margin.left + 10}, ${this.margin.top + 10})`)
            .style('cursor', 'pointer')
            .on('click', () => this.resetZoom())
            .on('mouseover', function() {
                d3.select(this).select('rect')
                    .transition()
                    .duration(200)
                    .attr('fill', '#5566d9');
            })
            .on('mouseout', function() {
                d3.select(this).select('rect')
                    .transition()
                    .duration(200)
                    .attr('fill', '#667eea');
            });
        
        buttonGroup.append('rect')
            .attr('width', 80)
            .attr('height', 30)
            .attr('rx', 5)
            .attr('fill', '#667eea')
            .attr('opacity', 0.9);
        
        buttonGroup.append('text')
            .attr('x', 40)
            .attr('y', 19)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text('Reset Zoom');
        
        // Add clear selection button
        const clearButtonGroup = this.svg.append('g')
            .attr('class', 'clear-button')
            .attr('transform', `translate(${this.margin.left + 100}, ${this.margin.top + 10})`)
            .style('cursor', 'pointer')
            .on('click', () => this.clearSelection())
            .on('mouseover', function() {
                d3.select(this).select('rect')
                    .transition()
                    .duration(200)
                    .attr('fill', '#d95566');
            })
            .on('mouseout', function() {
                d3.select(this).select('rect')
                    .transition()
                    .duration(200)
                    .attr('fill', '#ea6677');
            });
        
        clearButtonGroup.append('rect')
            .attr('width', 100)
            .attr('height', 30)
            .attr('rx', 5)
            .attr('fill', '#ea6677')
            .attr('opacity', 0.9);
        
        clearButtonGroup.append('text')
            .attr('x', 50)
            .attr('y', 19)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text('Clear Selection');
    }
    
    clearSelection() {
        // Clear brush
        this.brushGroup.call(this.brush.move, null);
        
        // Reset opacity
        this.circles.transition()
            .duration(300)
            .attr('opacity', 0.7);
        
        // Notify other views
        if (typeof handleSelection === 'function') {
            handleSelection(this.data);
        }
        
        console.log('✓ Selection cleared');
    }
    
    updateLegend() {
        if (!this.legendContainer) return;

        this.legendContainer.selectAll('*').remove();
    
        const mode = this.colorMode;
        const scale = this.colorScales[mode]; 

        this.legendContainer.append('text')
            .attr('x', 0)
            .attr('y', -10)
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .attr('fill', 'white') 
            .text(mode.replace('_', ' ').toUpperCase());

        if (mode === 'mode') {
            const categories = scale.domain();
        
            categories.forEach((cat, i) => {
                const row = this.legendContainer.append('g') 
                    .attr('transform', `translate(0, ${i * 20})`);
            
                row.append('rect')
                .attr('width', 12)
                .attr('height', 12)
                .attr('fill', scale(cat));

                row.append('text')
                .attr('x', 20)
                .attr('y', 10)
                .style('font-size', '11px')
                .attr('fill', 'white')
                .text(cat);
            });
        } else {
            const barWidth = 15; 
            const barHeight = 80;

            this.svg.selectAll("defs").remove();
        
            const gradientId = "legend-gradient-" + mode.replace('%', '');
            const defs = this.svg.append("defs");
            const linearGradient = defs.append("linearGradient")
                .attr("id", gradientId)
                .attr("x1", "0%").attr("y1", "100%") 
                .attr("x2", "0%").attr("y2", "0%");  

            [0, 0.5, 1].forEach(t => {
                linearGradient.append("stop")
                    .attr("offset", `${t * 100}%`)
                    .attr("stop-color", scale(t * 100));
            });

            this.legendContainer.append("rect")
                .attr("width", barWidth)
                .attr("height", barHeight)
                .style("fill", `url(#${gradientId})`);

            this.legendContainer.append("text")
                .attr("x", 20)
                .attr("y", barHeight)
                .style("font-size", "10px")
                .attr('fill', 'white')
                .text("0%");
            
            this.legendContainer.append("text")
                .attr("x", 20)
                .attr("y", 10)
                .style("font-size", "10px")
                .attr('fill', 'white')
                .text("100%");
        }
    }

    updateColorMode(mode) {
        this.colorMode = mode;
        
        this.circles
            .transition()
            .duration(750)
            .attr('fill', d => this.getColor(d));

            this.updateLegend();
    }
    
    highlightSongs(songs) {
        const songIds = new Set(songs.map(s => s.track_name));
        
        this.circles
            .transition()
            .duration(500)
            .attr('opacity', d => songIds.has(d.track_name) ? 0.9 : 0.1);
    }
    
    createTooltip() {
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
    }
    
    showTooltip(event, d) {
        this.tooltip
            .transition()
            .duration(200)
            .style('opacity', 1);
        
        this.tooltip
            .html(`
                <strong>${d.track_name}</strong>
                <div class="tooltip-row">
                    <span>Artist:</span>
                    <span>${d['artist(s)_name']}</span>
                </div>
                <div class="tooltip-row">
                    <span>Streams:</span>
                    <span>${d.streams.toLocaleString()}</span>
                </div>
                <div class="tooltip-row">
                    <span>Mode:</span>
                    <span>${d.mode}</span>
                </div>
                <div class="tooltip-row">
                    <span>Energy:</span>
                    <span>${d['energy_%']}%</span>
                </div>
                <div class="tooltip-row">
                    <span>Danceability:</span>
                    <span>${d['danceability_%']}%</span>
                </div>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 0.85em; color: #ffd700;">
                    💡 Scroll to zoom | Drag to pan | Double-click to reset
                </div>
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }
    
    hideTooltip() {
        this.tooltip
            .transition()
            .duration(200)
            .style('opacity', 0);
    }
}
