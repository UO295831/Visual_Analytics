# SpotifyVA: Interactive Visual Analytics Dashboard

**Cross-Platform Audio Feature Exploration**

An interactive Visual Analytics dashboard for exploring the acoustic landscape of Spotify's 2023 top-streamed songs. Built for the Visual Analytics course (Fall 2025) at Sapienza University of Rome.

**Authors:** Carlos Fernández Fernández, Alberto Rivas Casal  
**Course:** Visual Analytics — Prof. Giuseppe Santucci  
**Institution:** Sapienza University of Rome, Engineering in Computer Science

---

## 🎵 Live Demo

👉 **[View Live Dashboard](https://YOUR_USERNAME.github.io/spotify-dashboard/)**

*(Replace with your actual GitHub Pages URL after deployment)*

---

## 📊 Project Overview

SpotifyVA is a fully interactive Visual Analytics system designed to help music analysts, A&R professionals, and curious listeners explore patterns in popular music through:

- **t-SNE dimensionality reduction** of 8 audio features (danceability, energy, valence, acousticness, speechiness, liveness, instrumentalness, BPM)
- **Lasso brush selection** that triggers on-demand statistical analytics
- **Coordinated views** (scatter plot, radar chart, heatmap) linked bidirectionally
- **Real-time filtering** by mode (Major/Minor), artist, and feature ranges

**Dataset:** 953 songs from Spotify's 2023 most-streamed tracks  
**AS Index:** 953 × 24 = 22,872 (within course-specified range 10,000–50,000)

---

## 🗂️ Project Structure

```
spotify-dashboard/
│
├── index.html                      # Main entry point
│
├── css/
│   └── styles.css                  # Dashboard styles (purple gradient theme)
│
├── js/
│   ├── main.js                     # Application bootstrap, filter orchestration
│   ├── universe.js                 # t-SNE scatter plot with zoom/pan/lasso
│   ├── fingerprint.js              # Radar chart (average audio profile)
│   └── battleground.js             # Heatmap (platform correlation)
│
├── lib/
│   └── d3.v7.min.js                # D3.js v7 (local fallback)
│
├── data/
│   ├── spotify-2023.csv            # Raw dataset (953 songs, 24 features)
│   ├── cleaned_data.csv            # After preprocessing (see EDA/)
│   ├── data_with_tsne.csv          # With t-SNE coordinates appended
│   └── visualization_data.json     # Final dataset consumed by dashboard
│
└── EDA/                            # Data processing pipeline (Jupyter notebooks)
    ├── data_cleaning/
    │   ├── cleaning-EDA.ipynb      # Main cleaning: type coercion, missing values, normalization
    │   └── missing_values.ipynb    # Detailed missing value analysis
    │
    ├── Dimensionality_reduction/
    │   └── dimensionality-reduction.ipynb  # t-SNE on 8 audio features
    │
    └── Viz/
        └── visualization.json      # Export script (CSV → JSON for D3.js)
```

---

## 🚀 Quick Start

### Option 1: View Online
Simply visit the [live demo](https://YOUR_USERNAME.github.io/spotify-dashboard/) — no installation required.

### Option 2: Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/spotify-dashboard.git
   cd spotify-dashboard
   ```

2. **Start a local server:**
   
   **Python 3:**
   ```bash
   python -m http.server 8000
   ```
   
   **Python 2:**
   ```bash
   python -m SimpleHTTPServer 8000
   ```
   
   **Node.js:**
   ```bash
   npx http-server
   ```

3. **Open in browser:**
   ```
   http://localhost:8000
   ```

> **Why a server?** Modern browsers block `file://` requests to JSON files for security (CORS). A local server fixes this.

---

## 📈 Data Processing Pipeline

The dashboard consumes preprocessed data. To reproduce the full pipeline:

### Step 1: Data Cleaning
```bash
cd EDA/data_cleaning
jupyter notebook cleaning-EDA.ipynb
```

**What it does:**
- Fixes type coercion errors (`streams` column had non-numeric values)
- Handles missing values (fills `key` with "Unknown", `in_shazam_charts` with 0)
- Removes comma separators in numeric columns (`in_deezer_playlists`)
- Standardizes audio features (zero mean, unit variance) for t-SNE
- **Output:** `../../data/cleaned_data.csv`

### Step 2: Dimensionality Reduction
```bash
cd EDA/Dimensionality_reduction
jupyter notebook dimensionality-reduction.ipynb
```

**What it does:**
- Selects 8 audio features: `danceability_%`, `energy_%`, `valence_%`, `acousticness_%`, `speechiness_%`, `liveness_%`, `instrumentalness_%`, `bpm`
- Applies t-SNE (perplexity=30, 1000 iterations, random_state=42)
- Appends `tsne_1`, `tsne_2` coordinates to dataset
- **Output:** `../../data/data_with_tsne.csv`, `../../data/visualization_data.json`

### Step 3: Open Dashboard
The `visualization_data.json` file is automatically loaded by `index.html`.

---

## 🎨 Features

### Primary View: The Universe (t-SNE Scatter Plot)
- **Visual Encoding:**
  - Position (x, y): t-SNE coordinates (acoustic similarity)
  - Color: Musical mode (Orange = Major, Purple = Minor)
  - Size: Stream count (sqrt-scale)
  - Opacity: 0.9 (active), 0.05 (filtered out)

- **Interactions:**
  - **Lasso brush:** Draw rectangle to select cluster → triggers analytics
  - **Zoom/Pan:** Scroll to zoom, drag to pan, double-click to reset
  - **Hover:** Tooltip with track name, artist, streams, audio features

### Secondary Views
1. **The Fingerprint** (Radar Chart)
   - Shows average audio profile of current selection
   - Updates in real-time when lasso/filters change

2. **The Battleground** (Heatmap)
   - Platform correlation matrix (Spotify, Apple Music, Deezer)
   - Shows which audio features predict chart presence

### Filters
- **Mode Filter:** Major / Minor / Both
- **Artist Search:** Autocomplete dropdown
- **Range Sliders:** Per-feature min/max bounds
- **Active Filters Badge:** Shows count, click to open panel

---

## 📐 Visual Analytics Cycle

The system follows the VA cycle defined by Keim et al. (2008):

```
Raw Data → Transformation → Models → Visualization → Knowledge
   ↑                                                      ↓
   └──────────────────── User Interaction ───────────────┘
```

**Our implementation:**
1. **Data:** Spotify 2023 CSV (953 songs × 24 features)
2. **Transformation:** Cleaning, normalization, t-SNE
3. **Model:** 2D embedding + statistical summaries
4. **Visualization:** Scatter plot + radar + heatmap
5. **Interaction:** Lasso selection, filters, zoom
6. **Knowledge:** Insights about acoustic clusters, mode differences, platform preferences

---

## 🛠️ Technologies

- **Frontend:** Vanilla JavaScript (ES6), D3.js v7
- **Data Processing:** Python 3.10, Pandas, NumPy, Scikit-learn
- **Notebooks:** Jupyter Lab
- **Deployment:** GitHub Pages (static hosting)

**No frameworks, no build step** — just open `index.html` in a modern browser.

---

## 📝 Course Requirements Checklist

✅ **AS Index:** 22,872 (within 10,000–50,000)  
✅ **Dimensionality Reduction:** t-SNE integrated into analysis flow  
✅ **2+ Coordinated Views:** Universe ↔ Fingerprint ↔ Battleground (bidirectional)  
✅ **Analytics Triggered by Interaction:** Lasso selection computes statistics  
✅ **Related Work:** See `report/` folder for scientific paper with citations  
✅ **GitHub Repository:** This repo  
✅ **1-Page Draft Approval:** Submitted and approved (Group VA25_XX)

---

## 📄 Documentation

- **Scientific Paper:** See `report/visual_analytics_paper.pdf` (5-6 pages, ACM format)
- **Presentation Slides:** See `slides/` folder (PowerPoint)
- **Data Notebooks:** See `EDA/` folder (fully documented)

---

## 🔍 Discovered Insights

*(To be completed after systematic exploration sessions)*

### Preliminary Findings:
1. **Mode Clustering:** Major and Minor songs do NOT cluster separately in t-SNE space — suggesting mode alone does not determine overall acoustic similarity.

2. **High-Stream Outliers:** Songs with >1B streams are distributed across the embedding, not concentrated in one "hit formula" region.

3. **Platform Preferences:** Apple Music correlates more strongly with Acousticness than Spotify does (see Battleground heatmap).

4. **Energy-Danceability Decoupling:** High-energy songs are not always high-danceability — two distinct clusters emerge in the top-right quadrant.

---

## 🙏 Acknowledgments

- **Course:** Visual Analytics (Fall 2025), Sapienza University of Rome
- **Instructor:** Prof. Giuseppe Santucci
- **TAs:** Dr. Graziano Blasilli, Dr. Simone Lenti
- **Dataset:** [Spotify Top Songs 2023](https://www.kaggle.com/datasets/nelgiriyewithana/top-spotify-songs-2023) (Kaggle)
- **Inspiration:** The course modules on Number Visualization, Information Visualization, and Visual Analytics

---

## 📧 Contact

**Carlos Fernández Fernández**  
Email: fernandezfernandez@students.uniroma1.it

**Alberto Rivas Casal**  
Email: rivascasal@students.uniroma1.it

---

## 📜 License

This project is developed for educational purposes as part of the Visual Analytics course at Sapienza University of Rome. The dataset is publicly available on Kaggle under its original license. Code is provided as-is for academic review.

---

**⭐ If you found this project useful, please star the repository!**
