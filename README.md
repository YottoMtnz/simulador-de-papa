# Simulador de Papa · Tierras Vivas · v13

Una pequeña aventura entre bosques, caminos y playas. Creado por **Fraudy Martinez Madruga (YottoMtnz)**.

## Jugar

Extrae el ZIP completo y abre **`JUGAR.bat`** en Windows, o **`juego.html`** en un navegador con WebGL. No hace falta instalar Node ni ejecutar un servidor para jugar. `index.html` es la portada local.

**Los gráficos ya están incluidos.** El juego no descarga modelos, texturas, fuentes ni el motor al iniciarse. Conserva la carpeta completa; no abras el HTML dentro del ZIP.

## Novedades de esta versión

- Papa con geometría y piel procedentes del modelo Sweet Potato de Poly Haven, adaptado a las proporciones del personaje.
- Árboles y hierba basados en modelos reales, materiales fotográficos de tierra, pasto, arena, nieve, corteza, madera y roca; normales, sombras y luz ajustadas.
- Costa con mar animado, islotes, palmeras, sillas de playa y sus habitantes.
- Seis personajes con nombres, proporciones y accesorios diferentes.
- Menú más sencillo, diálogos dentro del juego y seguimiento del recorrido entre sesiones.

Los mapas fotográficos son de 1K. El render admite hasta 3840 × 2160, con resolución dinámica según rendimiento; esto no convierte las texturas en mapas de 4K. El mundo combina recursos de Poly Haven con geometría y materiales generados por el juego. Consulta `CREDITOS.md` para saber qué procede de cada fuente.

## Modos y controles

| Modo | Experiencia |
|---|---|
| Salir al campo | Exploración diurna y gravedad normal. |
| Noche lunar | Cielo estrellado y gravedad reducida. |
| A ciegas | Confía en tus sentidos. |

| Acción | PC | Móvil |
|---|---|---|
| Rodar | WASD / flechas | Joystick |
| Saltar | Espacio | SALTO |
| Girar cámara | Ratón o Q / E | Arrastrar |
| Acercar / alejar | Rueda | Pellizcar |
| Pausa | P / Esc | Botón de pausa |
| Bailar | B | — |
| Logros | L | Trofeo |
| Silenciar | M | Sonido |
| Pantalla completa | F | Botón del navegador; inmersiva en APK |
| Vista limpia / FPS | F2 / F3 | — |

La pausa permite ajustar gráficos, música, sensibilidad y fotogramas. La calidad ligera reduce vegetación y sombras; se selecciona inicialmente en dispositivos táctiles.

## Guardado

Se conserva la posición y la distancia por modo, además del recorrido acumulado, los encuentros y los logros. Se guarda periódicamente y al salir al menú. Los objetos empujados y la posición de los NPC se regeneran.

El guardado pertenece al navegador o aplicación que uses. Borrar sus datos lo elimina; mover el HTML, cambiar de navegador o pasar del navegador al EXE/APK puede crear una partida distinta. Las pruebas de esta entrega no incluyen progreso de prueba en tu juego.

## Música propia

Coloca tus canciones en `assets/music/1.mp3` … `20.mp3`. **Estos MP3 no venían en el proyecto y no están incluidos.** El reproductor aleatorio y los controles de volumen están preparados; el juego funciona aunque la carpeta no contenga canciones. Ver `assets/music/LEEME.txt`.

## Recursos guardados y edición

| Carpeta o archivo | Contenido |
|---|---|
| `assets/textures/` | Mapas fotográficos independientes, incluidos los extraídos de la versión anterior. |
| `assets/models/` | Modelos, sus mapas y las mallas optimizadas utilizadas por el juego. |
| `assets/js/textures.js` | Copia incorporada de los mapas para abrir con `file://`. |
| `assets/js/models.js` | Copia incorporada de las mallas optimizadas. |
| `assets/sources.json` | Procedencia, licencia y archivos de cada recurso. |
| `capturas/*_v13.png` | Capturas del juego de esta versión. |

Si cambias los mapas o las mallas optimizadas, ejecuta **`node tools/pack-assets.js`** para actualizar los dos paquetes. Este paso utiliza los archivos locales y no descarga nada.

## Compilar Windows y Android

`CONSTRUIR_TODO.bat` prepara las herramientas y genera las salidas en `dist/`. También admite `windows` o `android` como argumento. El EXE utiliza `Data/resources/app.asar`; Android utiliza Capacitor. Los recursos gráficos y los MP3 que hayas añadido se incluyen al compilar.

La primera preparación del compilador requiere Internet para sus herramientas y dependencias. Es independiente de jugar sin conexión. En esta entrega se verificó `node tools/prepare.js` y el contenido copiado para ambas plataformas; no se compiló ni probó un EXE/APK en dispositivos físicos. Los registros de errores de Android quedan en `dist/android-error.log` y `dist/android-gradle.log`.

## Documentación y licencias

`PUNTOS.md` registra el estado de los pedidos. `VALIDACION.md` resume las pruebas de v13. `HANDOFF_AI.md` contiene información técnica de continuidad y detalles de la historia.

Código del juego y Three.js bajo MIT. Recursos de Poly Haven bajo CC0. Procedencia completa en `CREDITOS.md`.
