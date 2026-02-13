// js/main.js

const spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "Vista A: Mapa t-SNE con interactividad avanzada",
  "data": { "url": "data/spotify_with_tsne_final.csv" },
  "width": 800,
  "height": 600,
  
  // Capas (Layers) para combinar puntos y anotaciones automáticas
  "layer": [
    {
      // --- CAPA 1: BUBBLE CHART (Los Puntos) ---
      "params": [
        {
          "name": "brush",
          "select": {"type": "interval", "resolve": "global"} 
          // Requisito: Lasso Selection (Selección por intervalo)
        }
      ],
      "mark": {"type": "circle", "tooltip": true}, // Tooltip nativo activado
      "encoding": {
        // Ejes X e Y mapeados a las dimensiones t-SNE
        "x": {"field": "tsne_x", "type": "quantitative", "title": "Dimensión t-SNE 1"},
        "y": {"field": "tsne_y", "type": "quantitative", "title": "Dimensión t-SNE 2"},
        
        // Tamaño: Más streams = Burbuja más grande
        "size": {
          "field": "streams",
          "type": "quantitative",
          "scale": {"range": [20, 1000]}, // Ajuste visual de burbujas
          "title": "Popularidad (Streams)"
        },
        
        // Color: Mapeo específico Naranja/Azul
        "color": {
          "field": "mode",
          "type": "nominal",
          "scale": {
            "domain": ["Major", "Minor"],
            "range": ["orange", "blue"] 
          },
          "legend": {"title": "Modo Musical"} // Evita penalización de 2 ptos [cite: 187]
        },
        
        // Requisito: Ghost Effect
        // Si no está seleccionado (y hay selección activa), opacidad baja a 0.1
        "opacity": {
          "condition": {"param": "brush", "value": 0.8},
          "value": 0.1 
        },
        
        // Tooltip: Información detallada al pasar el mouse
        "tooltip": [
          {"field": "track_name", "title": "Canción"},
          {"field": "artist(s)_name", "title": "Artista"},
          {"field": "streams", "title": "Streams", "format": ","}
          // Nota: Para mostrar la imagen del álbum en Vega-Lite se requiere una técnica avanzada,
          // por ahora mostramos el texto para cumplir la funcionalidad básica.
        ]
      }
    },
    {
      // --- CAPA 2: AUTOMATIC ANNOTATION (La etiqueta) ---
      // Requisito: Marcar automáticamente canciones importantes
      "transform": [
        {
          "window": [{"op": "rank", "as": "ranking"}],
          "sort": [{"field": "streams", "order": "descending"}]
        },
        {"filter": "datum.ranking == 1"} // Filtramos solo la #1
      ],
      "mark": {
        "type": "text",
        "align": "left",
        "dx": 15,
        "dy": -15,
        "fontSize": 12,
        "fontWeight": "bold",
        "color": "black"
      },
      "encoding": {
        "x": {"field": "tsne_x", "type": "quantitative"},
        "y": {"field": "tsne_y", "type": "quantitative"},
        "text": {"value": "👑 Top 1 Streamed"} // Texto fijo o dinámico
      }
    }
  ]
};

// Renderizar el gráfico
vegaEmbed('#vis-a', spec).then(result => {
    // Aquí añadiremos la lógica para conectar con la Vista B más adelante
    // Listener para capturar los datos seleccionados por el "Lasso"
    result.view.addSignalListener('brush', (name, value) => {
        console.log("Selección de usuario:", value);
        // TODO: Llamar a la función de cálculo de centroide
    });
}).catch(console.warn);