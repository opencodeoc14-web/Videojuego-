export const CHARACTERS = [
  { id: 'nova', name: 'Nova', emoji: '🚀', role: 'Velocidad máxima y nitro potente', color: 0xff5d73, accent: '#ff5d73', maxSpeed: 1.08, acceleration: 0.94, handling: 0.90, weight: 0.98 },
  { id: 'rayo', name: 'Rayo', emoji: '⚡', role: 'Aceleración explosiva', color: 0xffd166, accent: '#ffd166', maxSpeed: 1.00, acceleration: 1.10, handling: 0.96, weight: 0.86 },
  { id: 'luna', name: 'Luna', emoji: '🌙', role: 'Control suave en curvas', color: 0x9b5de5, accent: '#9b5de5', maxSpeed: 0.96, acceleration: 1.00, handling: 1.12, weight: 0.82 },
  { id: 'byte', name: 'Byte', emoji: '🤖', role: 'Equilibrio para cualquier pista', color: 0x4cc9f0, accent: '#4cc9f0', maxSpeed: 1.00, acceleration: 1.00, handling: 1.00, weight: 1.00 },
  { id: 'toro', name: 'Toro', emoji: '🐂', role: 'Pesado, estable y difícil de empujar', color: 0xf9844a, accent: '#f9844a', maxSpeed: 1.04, acceleration: 0.88, handling: 0.88, weight: 1.18 },
  { id: 'menta', name: 'Menta', emoji: '🌿', role: 'Ágil y rápida al salir de pista', color: 0x59e39f, accent: '#59e39f', maxSpeed: 0.97, acceleration: 1.04, handling: 1.08, weight: 0.88 },
  { id: 'pixel', name: 'Pixel', emoji: '👾', role: 'Derrape largo y recarga veloz', color: 0xf15bb5, accent: '#f15bb5', maxSpeed: 1.02, acceleration: 0.98, handling: 1.04, weight: 0.92 },
  { id: 'cometa', name: 'Cometa', emoji: '☄️', role: 'Alta velocidad con manejo exigente', color: 0x577590, accent: '#8ecae6', maxSpeed: 1.11, acceleration: 0.91, handling: 0.85, weight: 1.05 },
];

export const ITEM_ICONS = { nitro: '⚡', rocket: '🚀', shield: '🛡️', trap: '🍌' };

export function getCharacter(id) {
  return CHARACTERS.find((character) => character.id === id) ?? CHARACTERS[3];
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function damp(current, target, lambda, delta) {
  return current + (target - current) * (1 - Math.exp(-lambda * delta));
}

export function wrap01(value) {
  return ((value % 1) + 1) % 1;
}

export function shortestAngle(from, to) {
  let difference = (to - from + Math.PI) % (Math.PI * 2) - Math.PI;
  if (difference < -Math.PI) difference += Math.PI * 2;
  return difference;
}

export function ordinal(position) {
  return `${position}.º`;
}

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  return `${minutes}:${remainder.toFixed(2).padStart(5, '0')}`;
}
