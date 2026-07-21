import * as THREE from 'three';

const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.48,metalness:.12,...extra});
const mesh=(geometry,material,parent,pos=[0,0,0],rot=[0,0,0])=>{const m=new THREE.Mesh(geometry,material);m.position.set(...pos);m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
const box=(p,s,m,pos,rot)=>mesh(new THREE.BoxGeometry(...s),m,p,pos,rot);
const sphere=(p,r,m,pos)=>mesh(new THREE.SphereGeometry(r,16,12),m,p,pos);
const cyl=(p,r1,r2,h,m,pos,rot)=>mesh(new THREE.CylinderGeometry(r1,r2,h,16),m,p,pos,rot);

function wheel(parent,r,w,material,pos,glow){
  const g=new THREE.Group();g.position.set(...pos);parent.add(g);
  cyl(g,r,r,w,material,[0,0,0],[0,0,Math.PI/2]);
  cyl(g,r*.5,r*.5,w+.02,glow||mat(0x77808c,{metalness:.7}),[0,0,0],[0,0,Math.PI/2]);
  return g;
}
function eyes(parent,y,z,scale=1,color=0x75dcff){
  for(const x of[-.17,.17]){sphere(parent,.12*scale,mat(0xffffff),[x*scale,y,z]);sphere(parent,.055*scale,mat(color,{emissive:color,emissiveIntensity:.7}),[x*scale,y,z+.095*scale]);}
}
function human(parent,r,opts={}){
  const [a,b,c,d]=r.colors.map(v=>parseInt(v.slice(1),16)), p=mat(a), s=mat(b), accent=mat(c,{emissive:c,emissiveIntensity:.25}), dark=mat(d), skin=mat(0xffc69e);
  const body=new THREE.Group();body.position.set(0,.35,-.28);parent.add(body);
  box(body,[.72,.82,.48],p,[0,1.1,0]);sphere(body,.34,skin,[0,1.82,.05]);
  if(opts.hat==='helmet'){sphere(body,.4,p,[0,1.93,.02]);box(body,[.62,.16,.12],accent,[0,1.82,.32]);}
  if(opts.hat==='cap'){cyl(body,.36,.36,.18,p,[0,2.08,0]);box(body,[.45,.08,.3],p,[0,2.07,.2]);}
  if(opts.hat==='top'){cyl(body,.28,.34,.65,p,[0,2.26,0]);cyl(body,.48,.48,.08,dark,[0,1.96,0]);}
  if(opts.goggles){for(const x of[-.16,.16])mesh(new THREE.TorusGeometry(.13,.035,8,16),dark,body,[x,1.84,.32],[Math.PI/2,0,0]);}
  if(opts.pony){const q=cyl(body,.08,.28,.9,p,[.35,2.02,-.25],[0,0,-1.05]);q.rotation.x=.5;}
  if(opts.mustache){for(const x of[-.25,.25]){const q=cyl(body,.04,.11,.55,mat(0xf08a23),[x,1.68,.33],[0,0,x<0?-1.25:1.25]);q.rotation.x=Math.PI/2;}}
  for(const x of[-.46,.46]){cyl(body,.1,.12,.65,p,[x,1.13,0],[0,0,x<0?-.35:.35]);cyl(body,.11,.13,.7,dark,[x,.5,0]);}
  eyes(body,1.84,.31,1,opts.eye||0x48b6ff);
  return body;
}
function animal(parent,r,kind){
  const [a,b,c,d]=r.colors.map(v=>parseInt(v.slice(1),16)), p=mat(a), s=mat(b), accent=mat(c,{emissive:c,emissiveIntensity:.55}), dark=mat(d);
  const body=new THREE.Group();body.position.set(0,.38,-.25);parent.add(body);
  if(kind==='nebulo'){
    sphere(body,.56,p,[0,1.75,0]);cyl(body,.5,.12,1.2,p,[0,1.03,0]);eyes(body,1.82,.48,1.25,0x9b5dff);for(const x of[-.6,.6])sphere(body,.18,accent,[x,1.35,.1]);return body;
  }
  const heavy=kind==='glacior'||kind==='gorak';
  sphere(body,heavy?.65:.43,p,[0,1.75,.05]);box(body,[heavy?1.15:.72,heavy?1.15:.8,.65],p,[0,1.02,0]);
  eyes(body,1.84,heavy?.55:.4,heavy?1.25:1,0x3cbdff);
  if(kind==='glacior'){box(body,[.65,.32,.65],p,[0,1.63,.48]);for(let i=0;i<6;i++)mesh(new THREE.ConeGeometry(.13+i*.025,.55+i*.05,7),accent,body,[0,1.7+i*.06,-.42-i*.19],[-.35,0,0]);box(body,[1.1,.25,.45],dark,[0,.55,0]);}
  if(kind==='gorak'){for(const x of[-.72,.72]){cyl(body,.24,.32,1.05,p,[x,1.05,0],[0,0,x<0?-.35:.35]);cyl(body,.34,.34,.25,dark,[x,.75,0]);}box(body,[1.05,.18,.55],s,[0,.55,0]);}
  if(kind==='riff'){cyl(body,.12,.34,1.25,p,[0,.95,-.55],[1.2,0,0]);for(let i=0;i<5;i++)mesh(new THREE.ConeGeometry(.07,.3,6),accent,body,[0,1.3-i*.12,-.42-i*.18],[1.2,0,0]);box(body,[.8,.14,.48],accent,[0,1.45,.12]);}
  return body;
}
function vehicle(parent,r){
  const [a,b,c,d]=r.colors.map(v=>parseInt(v.slice(1),16)), p=mat(a), s=mat(b), accent=mat(c,{emissive:c,emissiveIntensity:.7}), dark=mat(d), metal=mat(0x7f8998,{metalness:.65});
  const bike=r.kind==='mara'||r.kind==='nebulo'||r.kind==='baron';
  const heavy=r.kind==='glacior'||r.kind==='gorak';
  const wheels=[];
  if(bike){box(parent,[.7,.35,2.6],p,[0,.55,0]);box(parent,[.9,.5,.9],s,[0,.82,.25]);wheels.push(wheel(parent,.65,.25,dark,[0,.56,1.55],accent),wheel(parent,.75,.28,dark,[0,.6,-1.35],accent));box(parent,[.9,.08,.12],metal,[0,1.25,.8]);if(r.kind==='baron')box(parent,[.15,.15,2.0],metal,[0,1.0,1.5],[.5,0,0]);}
  else{box(parent,[heavy?2.5:2.0,.5,heavy?3.2:2.8],p,[0,.62,0]);box(parent,[heavy?1.7:1.35,.5,1.0],s,[0,.9,.65]);for(const [x,z]of[[-1.05,1.05],[1.05,1.05],[-1.05,-1.05],[1.05,-1.05]])wheels.push(wheel(parent,heavy?.62:.46,heavy?.42:.34,dark,[x*(heavy?1.25:1),heavy?.62:.46,z],metal));}
  box(parent,[bike?.55:1.25,.12,.12],accent,[0,.63,bike?1.28:1.48]);
  return wheels;
}
export function createRacerModel(r,isPlayer=false){
  const group=new THREE.Group(), vehicleRoot=new THREE.Group();group.add(vehicleRoot);const wheels=vehicle(vehicleRoot,r);
  if(['astra','mara','bujia','baron'].includes(r.kind))human(vehicleRoot,r,{hat:r.kind==='astra'?'helmet':r.kind==='bujia'?'cap':r.kind==='baron'?'top':null,goggles:r.kind==='mara'||r.kind==='bujia',pony:r.kind==='mara',mustache:r.kind==='baron'});
  else animal(vehicleRoot,r,r.kind);
  if(isPlayer){const ring=mesh(new THREE.TorusGeometry(1.8,.055,8,36),mat(0xffffff,{emissive:0x59e8ff,emissiveIntensity:1}),group,[0,.06,0],[Math.PI/2,0,0]);ring.userData.playerRing=true;}
  group.scale.setScalar(r.kind==='glacior'?1.05:r.kind==='gorak'?1.02:.92);group.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
  return{group,wheels,update(speed,time,drift=false){for(const w of wheels)w.rotation.x-=speed*.035;vehicleRoot.rotation.z=THREE.MathUtils.lerp(vehicleRoot.rotation.z,drift?Math.sin(time*10)*.06:0,.12);vehicleRoot.position.y=Math.sin(time*3+speed)*.025;}};
}
