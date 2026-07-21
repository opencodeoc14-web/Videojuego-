import {RACERS,STAT_NAMES,TRACK_NAMES,racerPortrait} from './data.js';

export class GameUI{
  constructor(root,events){this.root=root;this.events=events;this.selected=0;this.messageTimer=0;root.innerHTML=this.template();this.bind();this.select(0);this.showMenu();}
  el(id){const e=this.root.querySelector('#'+id);if(!e)throw new Error('Falta #'+id);return e}
  portraitStyle(r){return `background-image:url("${racerPortrait(r)}")`}
  template(){const cards=RACERS.map((r,i)=>`<button class="racer-card" data-racer="${i}" style="--accent:${r.colors[2]}"><div class="portrait" style='${this.portraitStyle(r)}'></div><span><b>${r.name}</b><small>${r.vehicle}</small></span></button>`).join('');return `
  <section id="menu" class="screen menu"><div class="menu-shell">
    <header><span>Prototipo funcional · fase de jugadores</span><h1><i>TURBO</i> LEGENDS</h1><p>Elige una leyenda y compite contra los otros siete corredores en un circuito temporal de pruebas.</p></header>
    <div class="menu-layout"><div class="selection"><h2>Elige tu jugador</h2><div class="racer-grid">${cards}</div></div>
      <aside class="selected-card"><div id="selected-portrait" class="selected-portrait"></div><div class="selected-copy"><span id="selected-class" class="badge"></span><h2 id="selected-name"></h2><h3 id="selected-vehicle"></h3><strong id="selected-skill"></strong><p id="selected-ability"></p><div id="selected-stats" class="stats"></div><button id="start">INICIAR CARRERA DE PRUEBA</button></div></aside>
    </div>
    <div class="locked"><h2>5 pistas del juego</h2><div>${TRACK_NAMES.map((t,i)=>`<article><b>🔒 Pista ${i+1}</b><span>${t}</span><small>Se construirá en la siguiente fase</small></article>`).join('')}</div></div>
  </div></section>
  <section id="race" class="hidden race-ui">
    <div class="top-hud"><div class="player-hud"><div id="hud-portrait" class="mini-portrait"></div><span><small>Jugador</small><b id="hud-name"></b></span></div><div><small>Vuelta</small><b id="lap">1/3</b></div><button id="pause">Ⅱ</button><div><small>Posición</small><b id="position">1.º</b></div><div><small>Velocidad</small><b id="speed">0 km/h</b></div></div>
    <div id="standings" class="standings"></div><div class="clock"><small>Tiempo</small><b id="time">0:00.00</b></div><div class="drift"><span>Derrape</span><i><b id="drift-fill"></b></i></div><div id="countdown" class="countdown"></div><div id="message" class="message"></div>
    <div class="touch"><div><button id="left">◀</button><button id="right">▶</button></div><div><button id="drift">〰</button><button id="turbo">⚡</button></div></div>
  </section>
  <section id="pause-screen" class="screen hidden overlay"><div><h2>Pausa</h2><button id="resume">Continuar</button><button id="restart">Reiniciar</button><button id="menu-button">Cambiar jugador</button></div></section>
  <section id="finish" class="screen hidden overlay"><div class="finish-card"><span>Resultado final</span><h2 id="finish-position"></h2><p id="finish-time"></p><div id="podium" class="podium"></div><button id="again">Correr de nuevo</button><button id="finish-menu">Jugadores</button></div></section>`}
  bind(){this.root.querySelectorAll('[data-racer]').forEach(b=>b.addEventListener('click',()=>this.select(+b.dataset.racer)));this.el('start').onclick=()=>this.events.start(this.selected);this.el('pause').onclick=()=>this.events.pause();this.el('resume').onclick=()=>this.events.resume();this.el('restart').onclick=()=>this.events.start(this.selected);this.el('again').onclick=()=>this.events.start(this.selected);this.el('menu-button').onclick=()=>this.events.menu();this.el('finish-menu').onclick=()=>this.events.menu();}
  select(i){this.selected=(i+RACERS.length)%RACERS.length;const r=RACERS[this.selected];this.root.querySelectorAll('[data-racer]').forEach((e,n)=>e.classList.toggle('selected',n===this.selected));this.el('selected-portrait').setAttribute('style',this.portraitStyle(r));this.el('selected-name').textContent=r.name;this.el('selected-vehicle').textContent=r.vehicle;this.el('selected-class').textContent=r.className;this.el('selected-skill').textContent=r.skill;this.el('selected-ability').textContent=r.ability;this.el('selected-stats').innerHTML=STAT_NAMES.map((n,k)=>`<div><span>${n}</span><i><b style="width:${r.stats[k]*20}%"></b></i><em>${r.stats[k]}/5</em></div>`).join('');}
  hideScreens(){this.root.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'))}
  showMenu(){this.hideScreens();this.el('menu').classList.remove('hidden');this.el('race').classList.add('hidden')}
  showRace(index){this.hideScreens();this.el('race').classList.remove('hidden');const r=RACERS[index];this.el('hud-name').textContent=r.name;this.el('hud-portrait').setAttribute('style',this.portraitStyle(r));}
  showPause(){this.el('pause-screen').classList.remove('hidden')}
  hidePause(){this.el('pause-screen').classList.add('hidden')}
  setCountdown(v){this.el('countdown').textContent=v}
  message(v,d=1.4){const e=this.el('message');e.textContent=v;e.classList.add('show');clearTimeout(this.messageTimer);this.messageTimer=setTimeout(()=>e.classList.remove('show'),d*1000)}
  update({lap,position,speed,time,drift,standings}){this.el('lap').textContent=`${Math.min(3,lap+1)}/3`;this.el('position').textContent=`${position}.º`;this.el('speed').textContent=`${Math.round(speed)} km/h`;this.el('time').textContent=this.format(time);this.el('drift-fill').style.width=`${Math.min(100,drift*100)}%`;this.el('standings').innerHTML=standings.map((x,i)=>`<div class="${x.player?'player':''}"><b>${i+1}</b><span>${x.r.icon}</span><em>${x.r.name}</em></div>`).join('')}
  showFinish(position,time,standings){this.hideScreens();this.el('race').classList.add('hidden');this.el('finish').classList.remove('hidden');this.el('finish-position').textContent=`${position}.º lugar`;this.el('finish-time').textContent=`Tiempo: ${this.format(time)}`;this.el('podium').innerHTML=standings.slice(0,3).map((x,i)=>`<article><span>${i+1}</span><div class="podium-pic" style='${this.portraitStyle(x.r)}'></div><b>${x.r.name}</b></article>`).join('')}
  format(t){const m=Math.floor(t/60),s=t-m*60;return `${m}:${s.toFixed(2).padStart(5,'0')}`}
}

export class Input{
  constructor(root){this.root=root;this.left=false;this.right=false;this.drifting=false;this.turbo=false;this.bindHold('left','left');this.bindHold('right','right');this.bindHold('drift','drifting');this.bindTap('turbo');addEventListener('keydown',e=>{if(['ArrowLeft','a','A'].includes(e.key))this.left=true;if(['ArrowRight','d','D'].includes(e.key))this.right=true;if(e.key==='Shift')this.drifting=true;if(e.key===' ')this.turbo=true});addEventListener('keyup',e=>{if(['ArrowLeft','a','A'].includes(e.key))this.left=false;if(['ArrowRight','d','D'].includes(e.key))this.right=false;if(e.key==='Shift')this.drifting=false});}
  bindHold(id,key){const e=this.root.querySelector('#'+id);const down=x=>{x.preventDefault();this[key]=true;e.classList.add('active')},up=x=>{x.preventDefault();this[key]=false;e.classList.remove('active')};e.addEventListener('pointerdown',down);e.addEventListener('pointerup',up);e.addEventListener('pointercancel',up);}
  bindTap(id){const e=this.root.querySelector('#'+id);e.addEventListener('pointerdown',x=>{x.preventDefault();this.turbo=true;e.classList.add('active')});const up=()=>e.classList.remove('active');e.addEventListener('pointerup',up);e.addEventListener('pointercancel',up)}
  sample(){const out={steer:this.left===this.right?0:this.left?-1:1,drift:this.drifting,turbo:this.turbo};this.turbo=false;return out}
  reset(){this.left=this.right=this.drifting=this.turbo=false;this.root.querySelectorAll('.active').forEach(e=>e.classList.remove('active'))}
}
