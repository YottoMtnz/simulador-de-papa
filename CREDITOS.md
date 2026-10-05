# Créditos y procedencia

## Juego

Simulador de Papa, de YottoMtnz. Código del juego bajo licencia MIT.

## Motor

Three.js r128 — Copyright © 2010–2021 Three.js Authors. Licencia MIT. Copia local procedente de:
https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js

Sitio del proyecto: https://threejs.org/

## Materiales de Poly Haven — CC0

Se distribuyen mapas a 1024 píxeles, recomprimidos e incorporados en `textures.js`. Las máscaras se utilizan para recortar el follaje; no se distribuyen los modelos completos de Poly Haven.

| Material original | Mapas utilizados | Fuente |
|---|---|---|
| Forest Ground 04 | Diffuse, Normal GL | https://polyhaven.com/a/forest_ground_04 |
| Aerial Grass Rock | Diffuse, Normal GL | https://polyhaven.com/a/aerial_grass_rock |
| Bark Brown 01 | Diffuse, Normal GL | https://polyhaven.com/a/bark_brown_01 |
| Rock Boulder Dry | Diffuse, Normal GL | https://polyhaven.com/a/rock_boulder_dry |
| Tree Small 02 | Leaves Diffuse, Leaves Alpha, Leaves Normal GL | https://polyhaven.com/a/tree_small_02 |
| Pine Tree 01 | Twig Diffuse, Twig Alpha | https://polyhaven.com/a/pine_tree_01 |

Créditos de los conjuntos: Rob Tuytel, Rico Cilliers y Dimitrios Savva, según las fichas enlazadas. Licencia de la biblioteca de materiales: https://polyhaven.com/license — CC0 1.0: https://creativecommons.org/publicdomain/zero/1.0/

La piel de la papa (`forest_ground_04`), las calabazas (`rock_boulder_dry`) los cactus y el tablero del cartel (`bark_brown_01`) mezclan la luminancia y las normales de esos mapas con una base de color procedural (`photoOverlay` en `nature.js`).

Las montañas del horizonte (`Nature.buildMountains`) usan `rock_boulder_dry` y `aerial_grass_rock` de la tabla anterior.

## Geometría y recursos propios

Terreno, raíces, ramas, hierba, helechos, flores, señal, valla, interfaz y generadores de superficies de papa y calabaza: generados por el código del proyecto. Sonido por Web Audio, como en la base original. No se incluyen pistas musicales de terceros.
