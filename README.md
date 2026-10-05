# Simulador de Papa · Tierras Vivas

Una renovación del juego de YottoMtnz, centrada en un paisaje natural y una presentación más cuidada. Se mantiene Three.js, la exploración libre y las mecánicas originales.

## Jugar

1. Extrae **todo el ZIP** a una carpeta.
2. En Windows, abre **JUGAR.bat**. También puedes abrir **juego.html** directamente en Chrome o Edge.
3. Pulsa **Salir al campo**.

No requiere instalar dependencias, compilar ni conectarse a Internet. El motor y los materiales están incluidos. `index.html` es la entrada para publicar la carpeta en GitHub Pages; redirige al juego. Mantén `assets/` junto a los HTML.

## Renovación visual

- Terreno continuo con colinas, desniveles y un sendero sinuoso. La papa, las calabazas, los personajes y la cámara se adaptan a su altura.
- Tierra, hierba, corteza, roca y follaje con materiales fotográficos de Poly Haven. Trece mapas incluidos: color, normales y máscaras de hojas.
- Árboles con raíces, troncos curvos, bifurcaciones y ramas. Follaje recortado, pinos con acículas, variación entre ejemplares y viento suave.
- Hierba formada por láminas curvadas, flores, helechos de hojas afiladas, pequeñas piedras y vegetación baja.
- Valla de madera, señal del sendero, tronco caído y calabazas cerca del inicio.
- Luz cálida, sombras del follaje, bruma por distancia, nubes suaves y varias capas de relieve lejano.
- Superficies áridas, cactus, cocos y zonas de nieve al explorar los biomas lejanos.
- Menú sobre el mundo en 3D, indicadores compactos, cuaderno de logros y cuatro primeros objetivos basados en los logros existentes.
- Vista limpia con F2 y dos niveles gráficos desde la pausa.

## Modos

| Modo | Comportamiento |
|---|---|
| Salir al campo | Luz de tarde, gravedad normal y exploración libre. |
| Noche lunar | Iluminación nocturna, estrellas y gravedad reducida. |
| A ciegas | Conserva el antiguo «modo realista»: pantalla sin visión y orientación por sonido. Es una modalidad intencionada, no un error de gráficos. |

## Controles

| Acción | PC |
|---|---|
| Rodar | WASD o flechas |
| Saltar | Espacio |
| Girar la cámara | Arrastrar el ratón o Q / E |
| Zoom | Rueda |
| Bailar | B |
| Logros | L o botón del trofeo |
| Pausa y calidad gráfica | P, Esc o botón de pausa |
| Mostrar / ocultar interfaz | F2 |

En una pantalla táctil aparecen el joystick y el botón **SALTO**. Arrastra la zona del paisaje para girar y pellizca para ajustar el zoom. El botón de cámara permite bloquear ese arrastre.

Embiste calabazas para crear combos. La papa dorada concede diez segundos de velocidad extra e inmunidad a choques con rocas y árboles. Rocoso sigue siendo tu compañero.

## Rendimiento

La opción **Gráficos: ligeros** reduce la densidad de vegetación, la resolución de dibujo y las sombras de las hojas. Los materiales y el relieve permanecen activos. En teléfonos se selecciona de inicio este ajuste. El modo alto ofrece follaje más abundante y sombras más detalladas. No se promete una tasa fija de fotogramas: depende del dispositivo y del navegador.

El mundo se carga por sectores alrededor del jugador y descarta los lejanos. Solo se dibujan sectores que intersectan la vista. El paisaje se genera de manera determinista para evitar cambios arbitrarios al volver a un lugar. Los objetos que hayas desplazado vuelven a su posición inicial si su sector se descarga; los logros se conservan en el almacenamiento del navegador, como en la base original.

## Archivos

- `juego.html`: interfaz y entrada principal.
- `assets/css/game.css`: diseño adaptable.
- `assets/js/game.js`: movimiento, cámara, sonido, modos, logros y colisiones.
- `assets/js/nature.js`: terreno, materiales, vegetación, iluminación y sectores.
- `assets/js/textures.js`: mapas incorporados como datos para permitir apertura local sin servidor.
- `assets/vendor/three.min.js`: Three.js r128 local.
- `capturas/`: imágenes reales del juego en Chromium.
- `VALIDACION.md`: pruebas realizadas y alcance.
- `HANDOFF_AI.md`: guía para continuar el proyecto.
- `CREDITOS.md` y `LICENSE`: licencias y procedencia de los materiales.

## Autoría

Juego original: [YottoMtnz](https://github.com/YottoMtnz). Código del proyecto bajo MIT. Materiales de Poly Haven bajo CC0; se detallan en `CREDITOS.md`.
