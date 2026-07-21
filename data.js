export const RACERS = [
  {id:'astra',name:'Astra',vehicle:'Fénix X',icon:'⭐',kind:'astra',className:'Medio',skill:'Pulso carmesí',ability:'Los mini-turbos duran más.',colors:['#e5222e','#f4f6f8','#54e8ff','#141a24'],stats:[4,4,4,3,3]},
  {id:'mara',name:'Mara Volt',vehicle:'Cometa Rosa',icon:'⚡',kind:'mara',className:'Ligero',skill:'Derrape eléctrico',ability:'Carga el derrape con mayor rapidez.',colors:['#ff3d9e','#751b6f','#f6e3f2','#171522'],stats:[4,5,5,1,3]},
  {id:'glacior',name:'Glacior',vehicle:'Rompehielo',icon:'🧊',kind:'glacior',className:'Pesado',skill:'Tracción glacial',ability:'Pierde menos velocidad fuera del asfalto.',colors:['#578b43','#20252a','#25d8ff','#f58220'],stats:[4,3,2,5,3]},
  {id:'nebulo',name:'Nébulo',vehicle:'Espectra',icon:'👻',kind:'nebulo',className:'Ligero',skill:'Fase espectral',ability:'Ignora empujones consecutivos.',colors:['#f3f6f7','#222233','#58f0ff','#8b4cff'],stats:[4,4,5,1,4]},
  {id:'bujia',name:'Profesor Bujía',vehicle:'Chispa 7',icon:'🔧',kind:'bujia',className:'Medio',skill:'Manitas',ability:'Sus impulsos de pista duran más.',colors:['#52783d','#d48a30','#b7a36a','#1b1f25'],stats:[3,4,4,2,5]},
  {id:'riff',name:'Riff Colmillo',vehicle:'Garra ATV',icon:'🦎',kind:'riff',className:'Ligero',skill:'Salto salvaje',ability:'Recibe un turbo al aterrizar.',colors:['#d8b323','#687d32','#5a3bc2','#202329'],stats:[3,5,5,2,3]},
  {id:'gorak',name:'Gorak',vehicle:'Martillo',icon:'🦍',kind:'gorak',className:'Pesado',skill:'Masa bruta',ability:'Empuja más y pierde menos velocidad.',colors:['#7d4529','#b67945','#d8a331','#252323'],stats:[5,2,2,5,3]},
  {id:'baron',name:'Barón Vórtice',vehicle:'Vórtice Real',icon:'🎩',kind:'baron',className:'Medio',skill:'Malas artes',ability:'Empieza cada vuelta con turbo.',colors:['#6b2eb5','#f0a22b','#e3c441','#1a1325'],stats:[5,3,3,2,5]},
];
export const STAT_NAMES=['Velocidad','Aceleración','Manejo','Peso','Objetos'];
export const TRACK_NAMES=['Metrópolis Turbo','Cañón de Cristal','Costa Volt','Bosque Mecánico','Castillo Vórtice'];
export function racerPortrait(r){
  const [a,b,c,d]=r.colors;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 460"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${d}"/></linearGradient></defs><rect width="400" height="460" rx="36" fill="url(#g)"/><circle cx="200" cy="150" r="92" fill="${b}" opacity=".95"/><text x="200" y="186" text-anchor="middle" font-size="112">${r.icon}</text><path d="M82 405c14-112 70-166 118-166s104 54 118 166" fill="${a}" stroke="${c}" stroke-width="12"/><text x="200" y="425" text-anchor="middle" font-family="Arial" font-weight="900" font-size="30" fill="white">${r.name}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
