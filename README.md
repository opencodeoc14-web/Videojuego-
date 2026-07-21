# Turbo Circuit 3D

Juego de carreras arcade 3D para navegador, inspirado en el género de karts pero con personajes y diseño originales.

## Características

- Ocho personajes con estadísticas diferentes.
- Un jugador contra siete rivales controlados por IA.
- Circuito 3D de tres vueltas, clasificación en tiempo real y cámara de persecución.
- Derrapes con mini-turbo.
- Cajas de objetos: nitro, cohete, escudo y trampa.
- Controles táctiles para móvil y controles de teclado.
- Gráficos low-poly generados por código, sin recursos externos de arte.
- Despliegue automático en GitHub Pages.

## Tecnología

- TypeScript 7
- Three.js 0.185
- Vite 8.1
- WebGL y módulos ES
- GitHub Actions + GitHub Pages

## Desarrollo local

```bash
npm install
npm run dev
```

## Validación y producción

```bash
npm run typecheck
npm run build
npm run preview
```

### Controles

- Móvil: dirección, derrape y objeto en pantalla; aceleración automática.
- Escritorio: WASD o flechas, `Shift` para derrapar, `Espacio` para usar el objeto y `Esc/P` para pausar.
