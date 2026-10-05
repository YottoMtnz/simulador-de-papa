# Validación · Tierras Vivas

Fecha: 5 de octubre de 2026.

## Entorno

Chromium 153 automatizado con Playwright. WebGL mediante SwiftShader en un contenedor Linux. Apertura directa con `file://`, sin servidor ni descarga de materiales. Escritorio a 1280 × 800 y contexto táctil vertical a 390 × 844.

## Resultados

**29 comprobaciones superadas; cero errores de JavaScript o compilación de shaders registrados en las ejecuciones completadas.**

Las primeras 18 comprobaciones verifican el movimiento por teclado, distancia recorrida, salto, aterrizaje sobre pendientes, giro de cámara, pausa, carga y descarga de sectores, colisiones con calabazas, logros, recogida de la papa dorada, gravedad lunar, modo a ciegas, regreso al menú, vista limpia, ajustes alto/ligero y ausencia de desbordamiento horizontal.

Las 11 comprobaciones finales verifican la redirección desde `index.html`, los 13 mapas incorporados, selección del modo ligero en táctil, visibilidad y separación de controles, movimiento real del joystick con eventos táctiles, liberación del joystick, salto táctil, estabilidad del terreno en desierto y nieve, presencia de cactus/cocos y compilación de materiales tras cambiar a calidad alta.

Se inspeccionaron capturas reales de los menús, el juego diurno, el nocturno y la vista táctil. Se corrigió el recorte de los atlas de hojas para quitar las regiones de relleno y se sustituyeron los planos rectangulares de los helechos por hojas afiladas.

Los informes de ejecución están en `pruebas/`. El primer informe corresponde a la ronda funcional con los ocho mapas iniciales; la ronda final y las capturas utilizan los trece mapas de la versión entregada.

## Alcance

El BAT se revisó como texto ASCII, sin BOM y con finales CRLF; no se ejecutó en Windows. Las pruebas táctiles son emuladas, no realizadas en un teléfono físico. No se midieron FPS en una GTX 1050 ni se certifica una tasa de fotogramas en hardware del usuario. El nivel de gráficos puede ajustarse desde la pausa.
