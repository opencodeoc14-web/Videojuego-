export const CHARACTERS = [
  {
    id: 'nova', name: 'Nova', emoji: '🚀', role: 'Velocidad punta y nitro largo',
    color: 0xff5d73, accent: '#ff5d73', maxSpeed: 1.09, acceleration: 0.94,
    handling: 0.91, weight: 0.98, drift: 1.04, offRoad: 0.94, luck: 0.98,
  },
  {
    id: 'rayo', name: 'Rayo', emoji: '⚡', role: 'Salida explosiva y gran aceleración',
    color: 0xffd166, accent: '#ffd166', maxSpeed: 1.00, acceleration: 1.12,
    handling: 0.97, weight: 0.86, drift: 0.98, offRoad: 0.94, luck: 1.00,
  },
  {
    id: 'luna', name: 'Luna', emoji: '🌙', role: 'Curvas precisas y derrape estable',
    color: 0x9b5de5, accent: '#b48bff', maxSpeed: 0.97, acceleration: 1.00,
    handling: 1.13, weight: 0.82, drift: 1.12, offRoad: 0.98, luck: 1.03,
  },
  {
    id: 'byte', name: 'Byte', emoji: '🤖', role: 'Equilibrado para cualquier circuito',
    color: 0x4cc9f0, accent: '#4cc9f0', maxSpeed: 1.00, acceleration: 1.00,
    handling: 1.00, weight: 1.00, drift: 1.00, offRoad: 1.00, luck: 1.00,
  },
  {
    id: 'toro', name: 'Toro', emoji: '🐂', role: 'Pesado, estable y difícil de empujar',
    color: 0xf9844a, accent: '#ff9a62', maxSpeed: 1.05, acceleration: 0.88,
    handling: 0.88, weight: 1.20, drift: 0.91, offRoad: 1.06, luck: 0.96,
  },
  {
    id: 'menta', name: 'Menta', emoji: '🌿', role: 'Ágil y rápida al salir de pista',
    color: 0x59e39f, accent: '#59e39f', maxSpeed: 0.98, acceleration: 1.05,
    handling: 1.08, weight: 0.88, drift: 1.05, offRoad: 1.13, luck: 1.02,
  },
  {
    id: 'pixel', name: 'Pixel', emoji: '👾', role: 'Mini-turbo potente y objetos favorables',
    color: 0xf15bb5, accent: '#ff79c9', maxSpeed: 1.02, acceleration: 0.98,
    handling: 1.04, weight: 0.92, drift: 1.16, offRoad: 0.95, luck: 1.10,
  },
  {
    id: 'cometa', name: 'Cometa', emoji: '☄️', role: 'Máxima velocidad con manejo exigente',
    color: 0x577590, accent: '#8ecae6', maxSpeed: 1.12, acceleration: 0.91,
    handling: 0.85, weight: 1.06, drift: 1.02, offRoad: 0.90, luck: 0.97,
  },
];

export const TRACKS = [
  {
    id: 'aurora', name: 'Costa Aurora', emoji: '🌅', difficulty: 'Fluido',
    description: 'Curvas amplias, palmeras y saltos frente al mar.',
    width: 15.5,
    points: [
      [-37, 7], [-40, -20], [-21, -41], [8, -45], [36, -33],
      [47, -8], [39, 20], [15, 39], [-15, 37], [-37, 24],
    ],
    theme: {
      sky: 0x8fd7ff, fog: 0x8fd7ff, ground: 0x1f6a4a, road: 0x303843,
      shoulder: 0xe8edf3, curbA: 0xff5d73, curbB: 0xf7fbff,
      sun: 0xfff2d5, hemisphereSky: 0xd8f5ff, hemisphereGround: 0x204b32,
      scenery: 'coast', night: false,
    },
    boostPads: [{ progress: 0.13, lateral: -3.7 }, { progress: 0.53, lateral: 3.5 }, { progress: 0.82, lateral: 0 }],
    jumpPads: [{ progress: 0.34, lateral: 0 }, { progress: 0.69, lateral: -2.5 }],
    coinLines: [0.065, 0.19, 0.285, 0.425, 0.59, 0.745, 0.91],
  },
  {
    id: 'neon', name: 'Puerto Neón', emoji: '🌃', difficulty: 'Técnico',
    description: 'Puerto nocturno con chicanas, luces y atajos arriesgados.',
    width: 14.2,
    points: [
      [-39, 3], [-43, -18], [-28, -37], [-4, -33], [8, -48],
      [34, -39], [47, -17], [38, 3], [48, 23], [25, 39],
      [2, 31], [-17, 43], [-38, 27], [-28, 12],
    ],
    theme: {
      sky: 0x07132d, fog: 0x0b1b38, ground: 0x101a2c, road: 0x242b3c,
      shoulder: 0x59647a, curbA: 0x26f7fd, curbB: 0xff4fd8,
      sun: 0x8ecaff, hemisphereSky: 0x3d5e9e, hemisphereGround: 0x11182c,
      scenery: 'city', night: true,
    },
    boostPads: [{ progress: 0.085, lateral: 3.2 }, { progress: 0.39, lateral: -3.0 }, { progress: 0.71, lateral: 3.1 }, { progress: 0.91, lateral: -2.2 }],
    jumpPads: [{ progress: 0.245, lateral: 0 }, { progress: 0.60, lateral: 1.7 }],
    coinLines: [0.045, 0.145, 0.305, 0.46, 0.565, 0.78, 0.865],
  },
  {
    id: 'canyon', name: 'Cañón Solar', emoji: '🏜️', difficulty: 'Rápido',
    description: 'Rectas veloces, curvas peraltadas y grandes rampas.',
    width: 16.4,
    points: [
      [-43, 7], [-48, -22], [-25, -45], [8, -48], [42, -36],
      [53, -8], [43, 18], [25, 43], [-3, 47], [-32, 38], [-48, 21],
    ],
    theme: {
      sky: 0xffc66f, fog: 0xe9a85d, ground: 0x9c5637, road: 0x3d3736,
      shoulder: 0xd8b184, curbA: 0xffe066, curbB: 0xef476f,
      sun: 0xfff0be, hemisphereSky: 0xffddb0, hemisphereGround: 0x6d3829,
      scenery: 'canyon', night: false,
    },
    boostPads: [{ progress: 0.17, lateral: 0 }, { progress: 0.48, lateral: -3.8 }, { progress: 0.79, lateral: 3.8 }],
    jumpPads: [{ progress: 0.30, lateral: 0 }, { progress: 0.63, lateral: 0 }, { progress: 0.94, lateral: -1.8 }],
    coinLines: [0.075, 0.225, 0.37, 0.55, 0.68, 0.84, 0.975],
  },
];

export const DIFFICULTIES = [
  { id: 'rookie', name: 'Novato', emoji: '🙂', description: 'Rivales tranquilos y ayudas fuertes.', aiSkill: 0.89, rubberBand: 0.13, aggression: 0.48, reward: 1 },
  { id: 'turbo', name: 'Turbo', emoji: '🔥', description: 'Competencia equilibrada y agresiva.', aiSkill: 0.99, rubberBand: 0.17, aggression: 0.72, reward: 1.25 },
  { id: 'legend', name: 'Leyenda', emoji: '👑', description: 'IA veloz, precisa y sin concesiones.', aiSkill: 1.07, rubberBand: 0.20, aggression: 0.92, reward: 1.6 },
];

export const ITEM_ICONS = {
  nitro: '⚡', rocket: '🚀', shield: '🛡️', trap: '🍌', pulse: '💫',
};

export const ITEM_NAMES = {
  nitro: 'Nitro', rocket: 'Cohete', shield: 'Escudo', trap: 'Trampa', pulse: 'Pulso',
};

export function getCharacter(id) {
  return CHARACTERS.find((character) => character.id === id) ?? CHARACTERS[3];
}

export function getTrack(id) {
  return TRACKS.find((track) => track.id === id) ?? TRACKS[0];
}

export function getDifficulty(id) {
  return DIFFICULTIES.find((difficulty) => difficulty.id === id) ?? DIFFICULTIES[1];
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

export function damp(current, target, lambda, delta) {
  return lerp(current, target, 1 - Math.exp(-lambda * delta));
}

export function wrap01(value) {
  return ((value % 1) + 1) % 1;
}

export function shortestAngle(from, to) {
  let difference = (to - from + Math.PI) % (Math.PI * 2) - Math.PI;
  if (difference < -Math.PI) difference += Math.PI * 2;
  return difference;
}

export function progressPassed(previous, current, target) {
  const delta = wrap01(current - previous);
  if (delta <= 0 || delta > 0.22) return false;
  return wrap01(target - previous) <= delta;
}

export function ordinal(position) {
  return `${position}.º`;
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  return `${minutes}:${remainder.toFixed(2).padStart(5, '0')}`;
}

export function safeLocalStorage() {
  try {
    const storage = window.localStorage;
    const testKey = '__turbo_test__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}
