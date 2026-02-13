import pandas as pd
import numpy as np

#1.LIMPIEZA
    #convertir datos a numericos
    #eliminar valores nulos
    #normalizar los datos (valores con escalas muy diferentes en la base de datos)
    #verificar que limpiando la base de datos seguimos cumpliendo AS -> [10k, 50k]

df = pd.read_csv('data/Spotify-2023.csv', encoding='ISO-8859-1')
df1 = pd.read_csv('data/Spotify-2023.csv', encoding='ISO-8859-1')
        #print(df)
        #print(df.info())
features = [
    'danceability_%', 'valence_%', 'energy_%', 
    'acousticness_%', 'instrumentalness_%', 
    'liveness_%', 'speechiness_%', 'bpm'
]

    #antes de convertir
print(df1[features].dtypes)

    #transforma cualquier simbolo que no sepamos que es en Nan
for col in features:
    df[col] = pd.to_numeric(df[col], errors='coerce')

new_nul = df1[features].isna().sum()
    #print(new_nul) quedan 0 valores nulos en las features
    #print(df[features].dtypes) quedan todas las features en tipo numérico aceptado por t-SNE

#como no hay valores nulos no hace falta limpiar más la base de datos en principio pero por si acaso
df = df1.dropna(subset=features)
as_index = df.shape[0] * df.shape[1]
    #print(f"Tu índice AS actual es: {as_index}")    #22872



#2.NORMALIZACION DE LOS DATOS
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
x_scaled = scaler.fit_transform(df[features])



#3.EJECUCION DEL T-SNE
from sklearn.manifold import TSNE
tsne = TSNE(n_components=2, perplexity=30, random_state=42, init='pca', learning_rate='auto')
vis_dims = tsne.fit_transform(x_scaled)
tsne = TSNE(n_components=2, perplexity=25, random_state=33)
coord = tsne.fit_transform(x_scaled)

    #componentes a la base de datos
df['tsne_x'] = coord[:, 0]
df['tsne_y'] = coord[:, 1]
    #color según Mode
df['color_mode'] = df['mode'].map({'Major': 'orange', 'Minor': 'blue'})
    #pa guardar el archivo
df.to_csv('data/spotify_with_tsne.csv', index=False)