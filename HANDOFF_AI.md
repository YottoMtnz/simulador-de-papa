# Continuidad · Simulador de Papa / Tierras Vivas

## Objetivo y base

Mejora estética sobre `simulador-de-papa-main.zip`: sustituir el suelo plano y árboles de conos/esferas por un entorno más natural. Base original: `juego.html` monolítico, Three.js r128. Se conserva la mecánica de papa, calabazas, combos, salto, NPC, Rocoso, logros y tres modos; la implementación ahora está separada en archivos.

## Arquitectura actual

Carga por scripts clásicos, sin módulos ni fetch, para abrir desde `file://` sin servidor. Orden: Three → texturas → Nature → game. Los mapas son datos JPEG incorporados; no volver a introducir una dependencia de CDN para iniciar.

`Nature.World` administra 25 sectores de 40 m alrededor del jugador, texturas compartidas, mallas instanciadas de vegetación, descarte por frustum y generación determinista. `Nature.height(x,z)` es la única fuente de altura para el terreno visual y la física. Mantener ambas en sincronía.

`game.js` conserva la lógica original adaptada a la altura. `ACT` referencia objetos con `kind`, `r`, `h`, `m.position`; los colliders de árboles pueden ser objetos de posición sin malla propia porque se dibujan por instancias. Las calabazas son mallas dinámicas y registran `base` para su altura sobre el suelo. La cámara tiene una altura mínima de seguridad sobre el terreno.

`world.setQuality()` cambia densidad, resolución y sombras, y reconstruye los sectores. Los materiales y geometrías de plantillas son compartidos: no disponerlos al eliminar un sector. Se liberan geometrías de terreno y cactus, y buffers de instancias. Al cambiar de modo se liberan las texturas de los rótulos de NPC y Rocoso.

Las hojas y acículas muestrean regiones concretas de los atlas de Poly Haven con UV. Si se cambia el recorte, revisar que no aparezcan las zonas de relleno del atlas. Las máscaras también se utilizan en las sombras. El viento modifica el shader de superficie y el de profundidad de manera equivalente.

## Interfaz y persistencia

La pausa incluye calidad gráfica y controles. En táctil aparecen joystick y salto mediante `pointer:coarse`. F2 cambia la visibilidad de la interfaz y deja un botón de retorno. Las clases `playing` e `is-photo` controlan los estados. No superponer los objetivos al joystick.

Se conservan `papa_ach` y `papa_quality` en localStorage. «A ciegas» conserva el antiguo modo `real` que oculta el render intencionadamente. Los logros se guardan; el recorrido y los desplazamientos de objetos no son una partida guardada completa.

## Validación y límites

Consultar VALIDACION.md. Las capturas son del render real, no arte conceptual. Las pruebas en contenedor usan WebGL por software: no son una medición de la GTX 1050 del usuario ni de un teléfono físico.

Para continuar: conservar los materiales, movimiento sobre terreno y apertura offline; revisar cualquier cambio visual en escritorio y contexto táctil. El producto sigue siendo un juego de exploración libre y humor.
