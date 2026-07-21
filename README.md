# Turbo Circuit 3D · Grand Prix 3.2

Videojuego de carreras arcade 3D para navegador y móvil, con pilotos y diseño originales.

## Novedades de la edición Grand Prix

- Tres circuitos seleccionables: Costa Aurora, Puerto Neón y Cañón Solar.
- Ocho pilotos con velocidad, aceleración, manejo, derrape, peso y agarre distintos.
- Tres dificultades de inteligencia artificial.
- Monedas que aumentan progresivamente la velocidad máxima.
- Rampas, saltos, zonas turbo y partículas dinámicas.
- Derrape por niveles con mini-turbo azul, naranja y púrpura.
- Cinco objetos: nitro, cohete, escudo, trampa y pulso de impacto.
- Minimap, tabla de posiciones, cronómetro y récord por pista/dificultad.
- Sonido de motor sintetizado, efectos, vibración y control de silencio.
- Controles táctiles, teclado y mando mediante Gamepad API.
- Resolución gráfica adaptativa para mantener el rendimiento en móvil.
- Aplicación web instalable y caché sin conexión mediante Service Worker.

## Tecnología de producción

- JavaScript moderno con módulos ES.
- Three.js y WebGL.
- Web Audio API, Gamepad API, Canvas 2D y Service Worker.
- Despliegue estático automatizado con GitHub Actions y GitHub Pages.

La carpeta `web/` contiene el motor que ejecuta el navegador. `src/styles.css` contiene la interfaz responsive. El proyecto conserva también la base TypeScript previa como referencia de desarrollo.

## Controles

### Móvil

- Flechas: dirección.
- `〰`: derrape.
- `◼`: freno/reversa.
- `🎁`: objeto.
- La aceleración es automática.

### Teclado

- WASD o flechas: conducir.
- Shift: derrape.
- Espacio: objeto.
- Escape o P: pausa.

### Mando

- Stick izquierdo: dirección.
- Gatillo derecho o A: acelerar.
- Gatillo izquierdo: frenar.
- B/LB: derrape.
- X/RB: objeto.
- Start: pausa.

## Construcción estática

```bash
node scripts/build-static.mjs
```

El resultado se genera en `dist/` y no requiere instalar dependencias para desplegarse.
