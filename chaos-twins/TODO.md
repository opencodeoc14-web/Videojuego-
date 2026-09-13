# TODO de mejoras — Chaos Twins

Fecha: 13 de septiembre de 2026.
Estado inicial: **0 de 74 tareas completadas; todas pendientes**.
Repositorio: `opencodeoc14-web/Videojuego-`.
Rama del juego: `chaos-twins-railway`.
Base revisada: Demo 03, commit `4c8a7e2c7c28e9294fcd92a3094bdda3a09d6c06`.

## Objetivo y alcance

Convertir la demo en un plataformas 2D más fiable, explorable y reconocible por la cooperación entre Riko y Vox. Este archivo reúne las mejoras de la investigación previa y las tareas técnicas necesarias para implementarlas, probarlas y publicarlas. Crear este TODO no significa que sus funcionalidades estén implementadas.

Primero se corrigen cámara, tutoriales, guardados y controles móviles. Después se construye una región conectada y una nueva habilidad cooperativa; finalmente se extiende el diseño al resto del mundo y se pule la experiencia. No se amplía de nuevo el ancho del mapa sin mejorar antes su contenido.

Se mantienen los personajes y recursos originales, el juego web/móvil, el salto y doble salto existentes, el giro, el lanzamiento de Vox y la posibilidad de jugar sin conexión. La conversión a 3D, las cuentas, el multijugador y las compras no forman parte de esta entrega.

## Cómo usar este TODO

**P0:** corrección crítica o requisito para publicar sin introducir regresiones. **P1:** mejora principal de jugabilidad, exploración o experiencia móvil. **P2:** ampliación y pulido posterior.

Cada casilla corresponde a una tarea. Para marcarla como completada se registra el commit, la prueba ejecutada y su resultado. Una compilación correcta no sustituye una prueba de jugabilidad. Las dependencias que se indican son de implementación; las pruebas de referencia pueden prepararse antes de las correcciones. No hay responsables ni fechas de entrega asignados.

| Área | Tareas | Estado inicial |
|---|---:|---|
| Cámara | 10 | Pendientes |
| Tutoriales | 5 | Pendientes |
| Guardados y progreso | 7 | Pendientes |
| Móvil y accesibilidad | 8 | Pendientes |
| Mundo y exploración | 12 | Pendientes |
| Cooperación Riko–Vox | 6 | Pendientes |
| Movimiento y combate | 7 | Pendientes |
| Arte, animación y sonido | 4 | Pendientes |
| Rendimiento y arquitectura | 6 | Pendientes |
| Pruebas y publicación | 9 | Pendientes |
| **Total** | **74** | **0 completadas** |

## 1. Cámara — CAM

Puntos de partida: `game-src/03.js.part`, `05.js.part`, `06.js.part`; seguimiento, `focusCamera`, transformación de dibujo y entradas. CAM-01 es la base para CAM-02 a CAM-06 y CAM-10.

- [ ] **CAM-01 · P0 · Mantener a Riko dentro del encuadre jugable.** Imponer límites calculados con la transformación y el zoom reales; reservar espacio para los controles superpuestos. **Aceptación:** el personaje permanece completamente visible mientras puede moverse o recibir daño en las pruebas de jefe, acantilados y portal, tanto en vertical como en horizontal.
- [ ] **CAM-02 · P1 · Separar cuatro modos de cámara.** Implementar recorrido, plataformas, combate y mirador con prioridades explícitas. **Aceptación:** cada modo tiene condiciones de entrada y salida; cambiar de modo no produce saltos de posición ni pierde al jugador.
- [ ] **CAM-03 · P1 · Añadir zona de tolerancia y anticipación estable.** Separar la suavidad horizontal y vertical; evitar que pequeñas inversiones de dirección arrastren toda la imagen. **Aceptación:** moverse dentro de la zona central no provoca oscilaciones y correr deja espacio visible por delante.
- [ ] **CAM-04 · P1 · Priorizar la zona de aterrizaje.** Ajustar el seguimiento vertical para mostrar plataformas y caídas sin perseguir cada salto pequeño. **Aceptación:** los saltos principales permiten ver su destino antes de aterrizar, sin ocultar a Riko.
- [ ] **CAM-05 · P0 · Hacer seguras y omitibles las panorámicas.** Dar prioridad al jugador; cuando no quepan jugador y destino, usar una indicación. Una toma que aparte el control solo se permite desde una zona segura y con omisión disponible. **Aceptación:** no se producen caídas o daños fuera de cámara y omitir devuelve inmediatamente el seguimiento.
- [ ] **CAM-06 · P0 · Restablecer la cámara tras cambios de estado.** Revisar muerte, checkpoint, continuación de partida, pausa, cambio de orientación y futuro viaje rápido. **Aceptación:** no quedan enfoques, sacudidas ni zoom heredados de la situación anterior; el personaje reaparece encuadrado.
- [ ] **CAM-07 · P0 · Añadir mirar alrededor en pantalla táctil.** Dar acceso a mirar hacia abajo sin quitar salto, giro ni Vox; valorar un control mantenido o una acción contextual. **Aceptación:** teclado y móvil permiten la misma observación, con retorno claro al soltar o cancelar.
- [ ] **CAM-08 · P0 · Respetar el movimiento reducido.** Desactivar panorámicas, sacudidas y zoom automáticos cuando corresponda, manteniendo el seguimiento necesario para jugar. **Aceptación:** con movimiento reducido activado no cambia el zoom al correr ni se ejecutan tomas automáticas.
- [ ] **CAM-09 · P1 · Añadir ajustes independientes de cámara.** Exponer panorámicas, zoom de velocidad y sacudidas, con valores seguros y persistencia. **Aceptación:** cada opción funciona por separado, se conserva al recargar y puede restablecerse sin borrar la partida. Depende de SAVE-05.
- [ ] **CAM-10 · P1 · Corregir límites visuales y descarte de objetos con zoom.** Usar el rectángulo visible real para dibujar plataformas, enemigos y decoraciones. **Aceptación:** no desaparecen objetos que aún están en pantalla ni aparecen bordes vacíos inesperados al cambiar zoom o relación de aspecto.

## 2. Tutoriales — TUT

Puntos de partida: `toast`, `tutorials`, `tips` y ayuda. TUT-01 precede a TUT-02 y TUT-03.

- [ ] **TUT-01 · P0 · Implementar una cola de ayudas.** Priorizar instrucciones necesarias sobre mensajes ambientales, sin duplicados. **Aceptación:** el mensaje inicial no descarta las ayudas de cajas, doble salto o Vox.
- [ ] **TUT-02 · P0 · Confirmar una ayuda solo al enseñarla o demostrarla.** Separar pendiente, visible y completada; evitar marcarla antes de mostrarla. **Aceptación:** una ayuda interrumpida reaparece y una acción ya aprendida no genera instrucciones repetitivas.
- [ ] **TUT-03 · P1 · Mostrar instrucciones según el dispositivo y contexto.** Usar botones táctiles o teclas actuales, incluidos mirar y la futura habilidad de anclaje. **Aceptación:** el texto nunca pide una entrada inexistente y cambia al modificar la asignación de controles.
- [ ] **TUT-04 · P1 · Enseñar el doble salto jugando.** Crear un reto seguro con una plataforma y recompensa visibles antes de exigirlo sobre un precipicio. **Aceptación:** se puede repetir sin castigo y completar usando el doble salto normal, sin ayudas de depuración.
- [ ] **TUT-05 · P1 · Permitir consultar y leer las ayudas con calma.** Añadir consulta desde pausa, tiempos legibles y posición que no tape peligros o controles. **Aceptación:** todas las acciones principales tienen ayuda accesible y la pausa permite leerla sin recibir daño.

## 3. Guardados y progreso — SAVE

Punto de partida: `game-src/01.js.part`. SAVE-01 y SAVE-02 preceden a SAVE-03 y a las nuevas funciones persistentes.

- [ ] **SAVE-01 · P0 · Dar identificadores estables al contenido.** Sustituir índices de listas por IDs permanentes para engranajes, cajas, enemigos y balizas; preparar zonas, atajos y habilidades. **Aceptación:** reordenar o ampliar listas no cambia qué objetos aparecen recogidos o desbloqueados.
- [ ] **SAVE-02 · P0 · Separar versión de guardado y versión de mundo.** Definir un esquema validado con ambas versiones y un registro de migraciones. **Aceptación:** el cargador reconoce versiones admitidas y trata una versión desconocida sin sobrescribir sus datos.
- [ ] **SAVE-03 · P0 · Migrar las partidas de Demo 02 y Demo 03.** Conservar una copia del original y el progreso verificable. Como comparten formato, no deducir una versión que no pueda identificarse: definir una política explícita para casos ambiguos y explicarla al jugador. **Aceptación:** la migración es repetible, no borra silenciosamente lo ganado ni atribuye automáticamente exploración nueva por un índice antiguo.
- [ ] **SAVE-04 · P0 · Recuperarse de datos dañados o almacenamiento no disponible.** Validar tipos, límites y posiciones; manejar errores y avisar sin bloquear el juego. **Aceptación:** JSON inválido, cuota agotada y permisos denegados permiten seguir jugando o recuperar una copia, sin afirmar que se guardó correctamente.
- [ ] **SAVE-05 · P1 · Persistir las nuevas funciones.** Guardar mapa descubierto, atajos, balizas, anclaje de Vox, ayudas y preferencias de controles/cámara. **Aceptación:** recargar restaura únicamente lo realmente desbloqueado; cambiar ajustes no elimina los otros campos.
- [ ] **SAVE-06 · P0 · Revisar reaparición y checkpoints al regresar.** Definir cómo elegir la baliza de reaparición, incluso al revisitar una zona; validar que su posición sea segura. **Aceptación:** morir o continuar nunca coloca a Riko dentro del terreno, en un hueco o en un combate fuera de cámara.
- [ ] **SAVE-07 · P1 · Evitar conflictos entre pestañas y versiones.** Añadir revisión del guardado y detección de escrituras antiguas, con recuperación o aviso. **Aceptación:** una pestaña desactualizada no sobrescribe silenciosamente una partida más reciente. Depende de SAVE-02 y SAVE-04.

## 4. Móvil y accesibilidad — UX

Puntos de partida: `public/index.html`, `styles.css` y entradas de `06.js.part`. UX-03 y UX-04 usan SAVE-05 para persistencia.

- [ ] **UX-01 · P0 · Ampliar pausa, ayuda y ajustes.** Adoptar como objetivo de diseño un área táctil mínima de 44 × 44 píxeles CSS y comprobar la separación. **Aceptación:** los controles necesarios están accesibles en los tamaños de prueba sin solaparse; no se presenta esto como certificación de accesibilidad.
- [ ] **UX-02 · P0 · Mejorar la lectura del objetivo y los indicadores.** Aumentar textos, contraste y adaptación a pantallas pequeñas; priorizar información necesaria para jugar. **Aceptación:** no hay texto cortado ni desplazamiento horizontal y objetivos/avisos pueden leerse en la prueba con teléfono físico.
- [ ] **UX-03 · P1 · Personalizar los controles táctiles.** Permitir tamaño, posición, separación y opacidad dentro de límites utilizables, con disposición para zurdos y restablecimiento. **Aceptación:** ningún botón puede quedar fuera de la zona segura y las preferencias sobreviven a una recarga.
- [ ] **UX-04 · P1 · Permitir reasignar teclas.** Conservar el esquema actual como predeterminado, detectar conflictos y actualizar las ayudas. **Aceptación:** movimiento, salto, giro, Vox, cámara y pausa siguen accesibles tras reasignar o restablecer.
- [ ] **UX-05 · P0 · Robustecer las entradas simultáneas.** Verificar movimiento más salto/ataque, captura de puntero, cancelación, pérdida de foco y cambio de orientación. **Aceptación:** no quedan botones atascados y dos dedos pueden ejecutar acciones simultáneas sin desplazar la página.
- [ ] **UX-06 · P1 · No depender solo del color o del sonido.** Diferenciar salud, balizas, peligros y escudo del jefe mediante formas, texto o animación además del color. **Aceptación:** se entiende cuándo atacar y cuándo esquivar con el sonido desactivado.
- [ ] **UX-07 · P1 · Revisar navegación y zonas seguras.** Mantener foco visible, recorrido por teclado en menús, salida de diálogos y espacio para muescas/barras del sistema. **Aceptación:** pausa y ajustes se pueden abrir, operar y cerrar con teclado o tacto sin perder el foco ni ocultar acciones.
- [ ] **UX-08 · P1 · Ofrecer alternativas a acciones incómodas.** Evaluar mantener/pulsar para mirar y simplificar combinaciones de la nueva cooperación, sin aumentar innecesariamente el número de botones. **Aceptación:** las acciones esenciales pueden ejecutarse sin gestos precisos o combinaciones obligatorias de tres dedos.

## 5. Mundo y exploración — WORLD

Punto de partida: datos de plataformas, objetos y regiones de `01.js.part`. Probar WORLD-01 antes de extenderlo al mapa. Las funciones persistentes requieren SAVE-01 y SAVE-05.

- [ ] **WORLD-01 · P1 · Diseñar un tramo conectado de referencia.** Construir primero con geometría sencilla un camino principal, una bifurcación, un secreto y un regreso al recorrido. **Aceptación:** existe una ruta completa sin callejones involuntarios y el desvío tiene recompensa y salida propias.
- [ ] **WORLD-02 · P1 · Añadir atajos que permanezcan abiertos.** Integrar puertas, puentes o ascensores que conecten rutas ya recorridas. **Aceptación:** desbloquear un atajo reduce un regreso repetitivo y su estado persiste al continuar.
- [ ] **WORLD-03 · P1 · Recompensar la exploración de distintas maneras.** Repartir objetos, miradores, pequeñas escenas y accesos útiles, sin convertir todo secreto en requisito del final. **Aceptación:** cada desvío del tramo de referencia ofrece una recompensa reconocible y se distingue lo obligatorio de lo opcional.
- [ ] **WORLD-04 · P1 · Añadir mapa de zonas descubiertas.** Mostrar ubicación aproximada, conexiones, balizas y recompensas encontradas; ocultar ubicaciones exactas de secretos no descubiertos. **Aceptación:** el jugador puede orientarse y saber dónde queda contenido sin recibir todas sus soluciones.
- [ ] **WORLD-05 · P1 · Separar avance de recorrido y exploración.** Renombrar la barra horizontal y añadir contadores basados en zonas/objetos descubiertos. **Aceptación:** llegar cerca del portal no muestra falsamente que se exploró todo el mundo.
- [ ] **WORLD-06 · P1 · Permitir viajar entre balizas activadas.** Limitarlo a destinos conocidos y situaciones seguras; explicar destinos bloqueados. **Aceptación:** el viaje no evita un combate obligatorio ni deja a Riko fuera de cámara; restaura una posición válida. Depende de CAM-06, SAVE-05 y SAVE-06.
- [ ] **WORLD-07 · P2 · Diferenciar el Bosque suspendido.** Añadir rutas entre copas, troncos huecos o plataformas vegetales y un refugio conectado. **Aceptación:** su recorrido ofrece una interacción propia, no solo otra decoración.
- [ ] **WORLD-08 · P2 · Diferenciar las Ruinas del relámpago.** Integrar circuitos que Vox active y plataformas/puertas con estados visibles. **Aceptación:** al menos un circuito abre una ruta y una cámara opcional sin bloquear permanentemente la partida.
- [ ] **WORLD-09 · P2 · Diferenciar los Acantilados del viento.** Introducir corrientes visibles, saltos con trayectorias distintas y un mirador seguro. **Aceptación:** la dirección del viento se entiende antes del salto y todas las rutas tienen aterrizajes alcanzables.
- [ ] **WORLD-10 · P2 · Diferenciar el Observatorio roto.** Incorporar ascensores y mecanismos que combinen las acciones aprendidas. **Aceptación:** hay un reto combinado y una salida clara hacia el tramo final, sin exigir una habilidad no obtenida.
- [ ] **WORLD-11 · P2 · Integrar Jardines, núcleo y camino del portal.** Darles función dentro del recorrido: descanso/exploración, combate y cierre de la aventura, con conexiones entre regiones. **Aceptación:** ninguna región queda como relleno desconectado y el final reconoce los objetivos completados.
- [ ] **WORLD-12 · P1 · Equilibrar distancias, secretos y retornos.** Recorrer el mapa en ambos sentidos y revisar checkpoints, huecos, rutas altas y recuperación de engranajes olvidados. **Aceptación:** todos los objetivos son alcanzables con controles normales y ningún regreso obligatorio consiste únicamente en repetir un tramo largo sin decisiones.

## 6. Cooperación Riko–Vox — COOP

Introducir una sola habilidad nueva primero. COOP-01 precede a COOP-02, COOP-03 y COOP-04; integrar cámara y guardado antes de publicar.

- [ ] **COOP-01 · P1 · Prototipar el anclaje de Vox.** Permitir que se fije a puntos válidos y ayude a cruzar mediante impulso o balanceo; elegir una variante consistente tras probarla. **Aceptación:** se puede cruzar un hueco de prueba con la habilidad usando una acción contextual comprensible.
- [ ] **COOP-02 · P1 · Desbloquear la habilidad tras el centinela.** Mostrar qué se ganó y habilitar inmediatamente un uso seguro en la segunda mitad. **Aceptación:** una partida nueva no tiene la habilidad antes del combate y conserva el desbloqueo al continuar.
- [ ] **COOP-03 · P1 · Enseñar la cooperación en tres pasos.** Preparar práctica segura, combinación con doble salto y desafío opcional. **Aceptación:** la secuencia completa es jugable y no depende de leer un mensaje fugaz. Depende de TUT-01 y TUT-03.
- [ ] **COOP-04 · P1 · Hacer legibles alcance, trayectoria y cancelación.** Resaltar anclajes utilizables, diferenciar anclar de lanzar y permitir soltarse. **Aceptación:** Vox no atraviesa barreras no permitidas, el cable no rompe colisiones y cancelar devuelve un estado válido.
- [ ] **COOP-05 · P2 · Dar nuevos usos a zonas visitadas.** Añadir secretos o accesos opcionales visibles antes del desbloqueo y alcanzables después. **Aceptación:** volver con la habilidad abre posibilidades nuevas sin invalidar el recorrido original. Depende de WORLD-02 y COOP-02.
- [ ] **COOP-06 · P1 · Cubrir fallos y persistencia del dúo.** Manejar muerte, pausa, cambio de zona, lanzamiento fallido y restauración mientras Vox está fuera. **Aceptación:** el compañero siempre puede regresar y ningún estado deja la partida sin salto, ataque o control.

## 7. Movimiento y combate — PLAY

Conservar y probar las ayudas de salto ya existentes; no contarlas como nuevas funciones pendientes de crear.

- [ ] **PLAY-01 · P0 · Proteger las mecánicas de salto existentes.** Añadir regresiones para doble salto, altura variable, tolerancia al borde y salto anticipado. **Aceptación:** pasan en distintas tasas de dibujo y con teclado/tacto, manteniendo alcanzables las plataformas del mapa.
- [ ] **PLAY-02 · P1 · Mejorar la respuesta al aterrizar.** Añadir reacción breve, sonido y partículas discretas sin mover visualmente los pies fuera de la colisión. **Aceptación:** se reconoce un aterrizaje correcto sin sacudir obligatoriamente la cámara ni retrasar el siguiente salto.
- [ ] **PLAY-03 · P1 · Evaluar tolerancia para giro y lanzamiento.** Guardar brevemente una pulsación cercana al final de recuperación y ajustar jugando. **Aceptación:** una pulsación válida no se pierde por un desfase mínimo, pero tampoco ejecuta una acción inesperada mucho después.
- [ ] **PLAY-04 · P2 · Incorporar pocos enemigos con funciones distintas.** Preparar patrullero, atacante que requiera cobertura y defensor resoluble con Vox. **Aceptación:** cada uno avisa antes de atacar y requiere una respuesta distinguible, con una prueba segura de aprendizaje.
- [ ] **PLAY-05 · P1 · Mejorar lectura y estados del centinela.** Clarificar preparación, onda, vulnerabilidad y recuperación; revisar alejarse y volver al combate. **Aceptación:** no mantiene ataques o indicadores fuera de contexto y la derrota permite acceder a la recompensa cooperativa.
- [ ] **PLAY-06 · P1 · Explicar y suavizar el daño.** Revisar colisiones, retroceso, invulnerabilidad y reintentos para que cada golpe tenga una causa visible. **Aceptación:** un único contacto no vacía toda la salud y se puede recuperar el control tras recibir daño.
- [ ] **PLAY-07 · P2 · Alinear la puntuación con explorar.** Separar recompensas de descubrimiento del reto opcional de velocidad y revisar las penalizaciones. **Aceptación:** tomarse tiempo para descubrir rutas no invalida el objetivo principal; las reglas de puntos se explican al finalizar.

## 8. Arte, animación y sonido — ART

El pulido sigue al diseño validado de regiones y mecánicas, sin sustituirlo.

- [ ] **ART-01 · P2 · Dar identidad visual a cada región.** Usar siluetas, materiales, vegetación y puntos de referencia reconocibles, manteniendo peligros y superficies legibles. **Aceptación:** las regiones se distinguen sin depender únicamente del rótulo o de un cambio de color.
- [ ] **ART-02 · P2 · Diferenciar señales sonoras y ambiente.** Revisar salto, aterrizaje, giro, Vox, balizas, recompensas y peligro; añadir ambiente original y controles de volumen. **Aceptación:** el audio no satura con acciones repetidas y silenciarlo no elimina información necesaria.
- [ ] **ART-03 · P2 · Añadir humor del dúo sin interrumpir.** Crear reacciones breves y comentarios contextuales, con límite de repetición y texto disponible. **Aceptación:** los chistes no bloquean el control ni desplazan una instrucción urgente.
- [ ] **ART-04 · P2 · Pulir las animaciones expresivas.** Mejorar impulso, caída, aterrizaje, giro y regreso de Vox; respetar movimiento reducido. **Aceptación:** las animaciones comunican el estado jugable y no confunden la posición de las colisiones.

## 9. Rendimiento y arquitectura — PERF

Medir antes y después. Una reducción de operaciones no demuestra por sí sola más fluidez en un teléfono.

- [ ] **PERF-01 · P0 · Evitar escrituras repetidas del HUD.** Actualizar texto, anchuras y clases solo si cambian sus valores. **Aceptación:** en reposo no se reescriben 120 veces por segundo las etiquetas de zona, progreso o jefe; registrar el conteo antes/después con el mismo escenario.
- [ ] **PERF-02 · P1 · Separar física, dibujo e interfaz.** Mantener el paso fijo probado, limitar actualizaciones visuales innecesarias y revisar pausa/pestaña oculta. **Aceptación:** el juego no cambia de velocidad con la frecuencia de pantalla y no intenta recuperar indefinidamente pasos atrasados.
- [ ] **PERF-03 · P1 · Prerenderizar elementos repetidos cuando compense.** Evaluar fondos, vegetación y adornos en superficies intermedias, cuidando resolución y memoria. **Aceptación:** se documenta la comparación de tiempo de dibujo y memoria; solo se conserva el cambio si aporta una mejora sin degradación visible.
- [ ] **PERF-04 · P1 · Limitar trabajo fuera de la zona activa.** Revisar descarte de dibujo, partículas y actualizaciones de elementos lejanos sin cambiar su estado persistente. **Aceptación:** ampliar contenido no multiplica innecesariamente el coste por cuadro y volver a una zona conserva su comportamiento.
- [ ] **PERF-05 · P1 · Instrumentar rendimiento sin seguimiento personal.** Registrar localmente tiempo por cuadro, percentiles, pausas largas y recursos disponibles para comparar escenarios. **Aceptación:** los informes indican dispositivo, navegador y condiciones; 60 imágenes por segundo es un objetivo, no un resultado asumido.
- [ ] **PERF-06 · P1 · Separar responsabilidades del código.** Organizar cámara, entradas, mundo, guardado, tutoriales y HUD en módulos o unidades claras, manteniendo una compilación verificable. **Aceptación:** el resultado conserva las mecánicas y permite probar cada sistema sin editar fragmentos arbitrarios de una función.

## 10. Pruebas y publicación — QA

Estas tareas acompañan cada etapa. Preparar QA-01, QA-02 y QA-08 antes de integrar correcciones. QA-09 se ejecuta para cada publicación candidata.

- [ ] **QA-01 · P0 · Automatizar las regresiones de la auditoría.** Cubrir cámara del jefe/acantilados/portal, ayudas descartadas, mirar abajo, movimiento reducido y HUD. **Aceptación:** hay escenarios repetibles en 390 × 844, 844 × 390 y escritorio; se comprueba el encuadre en cada paso, no solo en la captura final.
- [ ] **QA-02 · P0 · Crear una matriz de pruebas de guardado.** Cubrir partida nueva, progreso parcial/completo antiguo, datos ambiguos, corrupción y nuevas versiones. **Aceptación:** cada caso tiene un resultado esperado explícito y la misma migración ejecutada dos veces no duplica ni elimina progreso.
- [ ] **QA-03 · P1 · Completar recorridos reales de principio a fin.** Probar obtención de engranajes, baliza, jefe, nueva habilidad, regreso por secretos y portal. **Aceptación:** al menos un recorrido completo usa controles normales sin teletransportes; los cambios de posición de pruebas solo preparan escenarios aislados y se documentan.
- [ ] **QA-04 · P1 · Publicar paquetes de recursos coherentes.** Versionar recursos y caché juntos y gestionar la actualización del service worker sin mezclar versiones. **Aceptación:** una página nunca combina HTML, JavaScript y datos de mundo incompatibles; no basta con volver a añadir la política de red primero que ya existe.
- [ ] **QA-05 · P1 · Probar instalación, actualización y juego sin conexión.** Usar un origen real, almacenamiento real, varias pestañas y conexión interrumpida; avisar de nueva versión sin recargar en mitad de un salto. **Aceptación:** tras una primera carga completa se puede reabrir sin conexión y actualizar conservando el progreso. Depende de QA-04 y SAVE-07.
- [ ] **QA-06 · P1 · Validar en dispositivos físicos.** Probar Android de prestaciones modestas, Android de gama media e iPhone disponible, en vertical y horizontal. **Aceptación:** registrar modelo, navegador, controles, legibilidad y estabilidad durante una sesión; cualquier dispositivo no disponible queda declarado como no probado.
- [ ] **QA-07 · P1 · Hacer una prueba inicial con jugadores.** Preparar sesiones de 10–15 minutos con 6–10 personas, con su consentimiento, para observar salto, Vox, orientación y comprensión de las caídas. **Aceptación:** comparar observaciones con la versión corregida y crear tareas para los problemas repetidos, sin presentar la muestra como concluyente estadísticamente.
- [ ] **QA-08 · P0 · Integrar pruebas y comprobaciones de compilación.** Mantener la verificación de integridad del código generado, añadir pruebas ejecutables y limitar la automatización a la rama del juego. **Aceptación:** un error de sintaxis, integridad o regresión bloquea la versión candidata; no se alteran `main` ni la publicación de Lunari.
- [ ] **QA-09 · P0 · Verificar y documentar cada publicación en Railway.** Desplegar el commit probado, comprobar estado terminal correcto, versión, recursos y acceso al dominio; mantener una referencia de recuperación. **Aceptación:** identificar el commit activo y verificar el juego por HTTP y navegador cuando sea posible; declarar cualquier comprobación pendiente sin confundir un contenedor iniciado con una partida jugable.

## Orden de ejecución y entregas

**Etapa 1 — Fiabilidad / candidata a Demo 04.** Preparar QA-01, QA-02 y QA-08; cerrar las tareas P0 de cámara, tutoriales, guardados, móvil, salto y HUD. Añadir comprobación de actualización coherente QA-04/QA-05 y prueba física básica QA-06 antes de publicar mediante QA-09. No añadir regiones nuevas en esta etapa.

**Etapa 2 — Exploración conectada.** Completar WORLD-01 a WORLD-06, cámara contextual y ayudas; validar el tramo de referencia antes de modificar el resto del mapa. Incorporar SAVE-05 y SAVE-07. Realizar una primera ronda de QA-07.

**Etapa 3 — Identidad cooperativa.** Completar COOP-01 a COOP-04 y COOP-06, integrar la recompensa tras el centinela y revisar PLAY-02, PLAY-03, PLAY-05 y PLAY-06. Añadir los accesos opcionales de COOP-05 una vez validada la habilidad.

**Etapa 4 — Extensión y pulido.** Desarrollar WORLD-07 a WORLD-12, variedad de enemigos, arte y sonido. Aplicar optimizaciones medidas, personalización restante y repetir QA-03, QA-05, QA-06 y QA-07 antes de publicar.

Las etapas ordenan trabajo; no prometen fechas ni dan por implementadas las tareas. QA-09 se repite en cada versión y se mantiene evidencia de cada ejecución.

## Regla para cerrar una tarea

Una tarea solo pasa a `[x]` cuando su criterio de aceptación está satisfecho y se adjunta evidencia reproducible. Para cambios de código: compilación, pruebas pertinentes, ausencia de nuevas regresiones y revisión en el tamaño de pantalla afectado. Para pruebas físicas o con personas: se requiere ejecución real, no simulación ni una captura sustitutiva.

Registro sugerido por tarea: `ID | estado | commit | prueba/dispositivo | resultado | limitaciones | fecha`. Si solo existe código sin pruebas, la tarea continúa pendiente o se anota expresamente como implementada y pendiente de validar, sin marcar la casilla final.

## Trazabilidad y límites de la evidencia

La base es la investigación previa de esta conversación, el código del commit indicado y `audit-results.json`, adjunto en la conversación. Las pruebas de esa auditoría fueron locales en Chromium, con almacenamiento simulado y sin teléfono físico; no equivalen a una validación del servicio público ni de una PWA instalada.

Archivos iniciales: `game-src/01.js.part` (datos y guardados), `02.js.part` (entradas de juego, físicas y compañero), `03.js.part` (cámara, HUD y ayudas), `04.js.part`/`05.js.part` (dibujo), `06.js.part` (eventos y bucle), `public/index.html`, `public/styles.css`, `public/sw.js`, `build.cjs` y `server.cjs`.

Los tamaños táctiles, metas de rendimiento y diseño de regiones son objetivos de implementación y evaluación, no garantías de rendimiento ni afirmaciones de cumplimiento de una norma. Las tareas de mejora se mantienen separadas de las capacidades ya existentes.
