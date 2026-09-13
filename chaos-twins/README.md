# Chaos Twins — Isla del núcleo

Demo original 2D para navegador y móvil: doble salto, giro, compañero lanzable, seis engranajes, checkpoints y centinela final.

Esta versión está aislada en la rama `chaos-twins-railway`. La rama `main` y su publicación de Lunari no se modifican.

## Ejecutar

Requiere Node.js 22 o posterior. No necesita paquetes externos.

```sh
cd chaos-twins
node build.cjs
node server.cjs
```

Abre http://localhost:8080. El servidor usa `PORT` cuando está definida y escucha en `0.0.0.0`.

## Despliegue en Railway

Usa esta rama, el Dockerfile de la raíz y el control de salud `/health`. El contenedor solo copia la carpeta `chaos-twins`; no sirve Lunari.

El código original de `game.js` se conserva dividido en seis archivos de texto `game-src/*.js.part`. `build.cjs` los concatena y verifica su SHA-256 antes de publicar. No se transforma la lógica del juego. El icono de instalación de 512px se genera a partir del PNG original de 192px, sin dependencias externas.

SHA-256 esperado de game.js: `722d92995cd761fd5ab21c8eaae8206248d2c7fe99e843d04e73697afed35f7f`.

## Controles

A/D o flechas: mover. Espacio: saltar y doble salto. X: giro. C: lanzar a Vox. Escape: pausa. En móvil usa los botones táctiles.

El progreso se guarda en el navegador del jugador, no en una base de datos. No se solicitan permisos de cámara, micrófono ni ubicación.
