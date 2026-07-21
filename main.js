import {TurboLegendsGame} from './game.js';
const canvas=document.querySelector('#game-canvas'),root=document.querySelector('#ui-root');
if(!canvas||!root)throw new Error('No se pudo iniciar Turbo Legends.');
try{new TurboLegendsGame(canvas,root)}catch(error){console.error(error);root.innerHTML=`<section class="screen overlay"><div><h2>No pudo iniciar</h2><p>${error instanceof Error?error.message:'Error desconocido'}</p><button onclick="location.reload()">Recargar</button></div></section>`}
