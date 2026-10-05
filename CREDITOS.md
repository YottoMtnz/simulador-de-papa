# Créditos y procedencia · v13

## Juego

**Creado por Fraudy Martinez Madruga (YottoMtnz).** Código bajo MIT; ver `LICENSE`.

## Motor

Three.js r128 — Copyright © 2010–2021 Three.js Authors, MIT. La copia local está en `assets/vendor/three.min.js`. Proyecto: https://threejs.org/ ; origen de la copia: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js

## Recursos de Poly Haven · CC0

Las texturas y mallas usadas están incluidas en el ZIP. Las direcciones de esta tabla documentan la procedencia; el juego no las consulta durante una partida.

| Recurso | Uso y adaptación | Fuente |
|---|---|---|
| Sweet Potato | Malla y mapas de piel; proporciones y color adaptados para Papa y variantes de NPC. | https://polyhaven.com/a/sweet_potato |
| Tree Small 02 | Tronco y ramas simplificados; copa reconstruida con hojas fotográficas en posiciones del modelo. | https://polyhaven.com/a/tree_small_02 |
| Grass Medium 01 | Modelo de hierba; atlas fotográfico usado también en briznas y hojas de palmera de geometría propia. | https://polyhaven.com/a/grass_medium_01 |
| Namaqualand Boulder 02 | Roca de la playa, malla simplificada y mapas. | https://polyhaven.com/a/namaqualand_boulder_02 |
| Coast Sand 01 | Arena costera. | https://polyhaven.com/a/coast_sand_01 |
| Snow 02 | Suelo nevado. | https://polyhaven.com/a/snow_02 |
| Leafy Grass | Suelo de praderas y bosques. | https://polyhaven.com/a/leafy_grass |
| Weathered Planks | Sillas, vallas y madera. | https://polyhaven.com/a/weathered_planks |
| Palm Tree Bark | Troncos de palmeras. | https://polyhaven.com/a/palm_tree_bark |
| Forest Ground 04 | Tierra y senderos; material conservado de la versión anterior. | https://polyhaven.com/a/forest_ground_04 |
| Aerial Grass Rock | Montañas; material conservado. | https://polyhaven.com/a/aerial_grass_rock |
| Bark Brown 01 | Corteza y algunos objetos de madera; material conservado. | https://polyhaven.com/a/bark_brown_01 |
| Rock Boulder Dry | Rocas distribuidas por el mundo y montañas; material conservado. | https://polyhaven.com/a/rock_boulder_dry |
| Pine Tree 01 | Atlas de acículas de los pinos; material conservado. | https://polyhaven.com/a/pine_tree_01 |

Mapas de color, normales OpenGL, rugosidad/ARM y máscaras según cada recurso. Resolución local: 1024 píxeles. Las 13 imágenes incorporadas en v12 también están extraídas como archivos en `assets/textures/original/`. En total, v13 incorpora 47 mapas independientes.

Los modelos conservan sus texturas en `assets/models/<nombre>/textures/`. `assets/models/optimized/` guarda las mallas compactas que utiliza el juego; `models.js` contiene esos mismos datos. Para Tree Small 02 se distribuye la adaptación optimizada, no el archivo de geometría original de alta densidad. No se necesita el original para jugar ni para regenerar los paquetes locales.

Licencia de recursos de Poly Haven: https://polyhaven.com/license

CC0 1.0 Universal: https://creativecommons.org/publicdomain/zero/1.0/

Las fichas originales identifican a los autores de cada recurso. No se distribuyen renders de muestra, marcas ni textos del sitio como recursos del juego.

## Elementos propios

El relieve continuo, las montañas, la forma de las palmeras, pinos y abedules, las sillas, señalización, vallas, calabazas, cocos, cactus, flores, accesorios y ojos se generan mediante código. Algunos utilizan los materiales fotográficos indicados arriba; otros usan superficies procedurales, como la fibra del coco, la piel de las calabazas, la corteza del abedul y la tela de las sillas.

El cielo, las estrellas, las nubes, el agua y sus reflejos aproximados son shaders. No se utilizan HDRI descargados ni trazado de rayos. La interfaz y las capturas corresponden al propio juego; las capturas no son imágenes generadas ni renders externos.

Sonido mediante Web Audio. La música está reservada a los MP3 del creador; no se incluyen canciones de terceros ni se sustituyen los archivos pendientes por otra banda sonora.
