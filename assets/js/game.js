
const $=id=>document.getElementById(id);
function rnd(a,b){return a+Math.random()*(b-a)}
// Color vivo: ACES apaga los colores, asi que tras el tone mapping se sube la saturacion y se calienta un poco
THREE.ShaderChunk.tonemapping_fragment=THREE.ShaderChunk.tonemapping_fragment.replace('gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );',
 'gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );\n\tgl_FragColor.rgb = max( mix( vec3( dot( gl_FragColor.rgb, vec3( .2126, .7152, .0722 ) ) ), gl_FragColor.rgb, 1.22 ) * vec3( 1.01, 1., .99 ), 0. );');
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(53,1,.12,600);
// Resolucion: nitida hasta 4K (3840x2160 como maximo) y adaptativa para no bajar de fps
let resScale=1;const MAXPX=3840*2160,COARSE=matchMedia('(pointer:coarse)').matches;
function applyPR(){const q=window.world&&world.quality==='bajo';const cap=q?1:Math.min(devicePixelRatio||1,COARSE?1.65:2);
 const fit=Math.sqrt(MAXPX/(innerWidth*innerHeight));const v=Math.round(Math.max(.5,Math.min(cap,fit)*(q?1:resScale))*20)/20;
 if(Math.abs(v-renderer.getPixelRatio())>.01)renderer.setPixelRatio(v)}
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);if(window.world)applyPR();camera.aspect=w/h;camera.fov=w/h<1?66:53;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();

const hemi=new THREE.HemisphereLight(0xffe2b0,0x4a3a22,.9);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffc27a,1.1);sun.position.set(20,25,10);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.00025;sun.shadow.normalBias=.035;sun.shadow.radius=2;Object.assign(sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35,near:1,far:125});scene.add(sun,sun.target);

const world=new Nature.World(renderer,scene,sun,hemi,camera);window.world=world;world.onQuality=applyPR;applyPR();
const ground=world.ground,skinT=world.skin;
function rockMesh(){return world.makeRock(1.3)}
const terrainHeight=Nature.height;
function biomeInfo(x,z){return Nature.biome(x,z)}
let ACT=[];
function resetWorld(){world.reset();ACT=world.props}
function updateWorld(dt){world.update(px,pz,dt);ACT=world.props}
// papa
const PR=1,potato=new THREE.Group(),body=new THREE.Group();potato.add(body);
{const g=new THREE.SphereGeometry(PR,64,48),p=g.attributes.position,v=new THREE.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const d=1+.075*Math.sin(v.x*3+1)*Math.cos(v.y*4)+.04*Math.sin(v.z*5+v.x*2)+.012*Math.sin(v.x*9)*Math.sin(v.z*8);v.multiplyScalar(d);v.x*=1.25;v.y*=.88;p.setXYZ(i,v.x,v.y,v.z)}
 g.computeVertexNormals();
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:skinT,bumpMap:skinT,bumpScale:.045,roughness:.93}));m.castShadow=true;body.add(m);
}
scene.add(potato);
const bodyMat=()=>potato.children[0].children[0].material;
function updateGoldTint(){const m=bodyMat();if(goldTime>0){m.color.set(0xffd24a);m.emissive.set(0x7a5200)}else{m.color.set(0xffffff);m.emissive.set(0x000000)}}

// ===== sistema de partículas (polvo, explosiones, confeti, estelas) =====
const PMAX=1600,pPos=new Float32Array(PMAX*3),pCol=new Float32Array(PMAX*3),parts=new Array(PMAX).fill(null);
for(let i=0;i<PMAX;i++)pPos[i*3+1]=-1000;
const pGeo=new THREE.BufferGeometry();
pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
const pMat=new THREE.PointsMaterial({size:.14,vertexColors:true,transparent:true,opacity:.95,depthWrite:false,blending:THREE.NormalBlending});
const pPoints=new THREE.Points(pGeo,pMat);pPoints.frustumCulled=false;scene.add(pPoints);
let pNext=0;
function spawnP(x,y,z,vx,vy,vz,life,hex,grav,drag){
 const i=pNext;pNext=(pNext+1)%PMAX;const c=new THREE.Color(hex);
 parts[i]={x:x,y:y,z:z,vx:vx,vy:vy,vz:vz,life:life,maxLife:life,r:c.r,g:c.g,b:c.b,grav:grav||0,drag:drag||0}}
function burst(x,y,z,hex,n,spd,life){for(let k=0;k<n;k++){const a=rnd(0,6.283),s=spd*rnd(.4,1);spawnP(x,y,z,Math.cos(a)*s,rnd(1,5),Math.sin(a)*s,life*rnd(.6,1.2),hex,-8,1.8)}}
function confetti(){const cols=[0xff5b5b,0xffd24a,0x5bff8a,0x5bb8ff,0xd95bff,0xff8a5b];for(let k=0;k<70;k++)spawnP(px+rnd(-2,2),py+3+rnd(0,2),pz+rnd(-2,2),rnd(-6,6),rnd(2,9),rnd(-6,6),rnd(1.2,2.2),cols[k%cols.length],-7,1.2)}
function updateParts(dt){
 for(let i=0;i<PMAX;i++){const p=parts[i];
  if(!p||p.life<=0){pPos[i*3+1]=-1000;continue}
  p.life-=dt;p.vy+=p.grav*dt;
  const dm=1-Math.min(p.drag*dt,.9);p.vx*=dm;p.vy*=dm;p.vz*=dm;
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
  const floor=terrainHeight(p.x,p.z)+.05;if(p.y<floor&&p.vy<0){p.y=floor;p.vy*=-.3}
  pPos[i*3]=p.x;pPos[i*3+1]=p.y;pPos[i*3+2]=p.z;
  const f=Math.max(p.life/p.maxLife,0);
  pCol[i*3]=p.r*f;pCol[i*3+1]=p.g*f;pCol[i*3+2]=p.b*f}
 pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true}

// sprites de texto (nombres NPC, pensamientos, papa dorada)
// Texto con volumen: extrusion marron, contorno oscuro y relleno degradado (mismo estilo que el combo)
function chunkyText(x,t,cx,cy,fs,fill){x.font='italic 900 '+fs+'px Georgia,"Palatino Linotype",serif';x.textAlign='center';x.lineJoin='round';x.miterLimit=2;
 const depth=Math.max(2,Math.round(fs/8));x.lineWidth=fs*.24;
 for(let i=depth;i>=1;i--){x.strokeStyle=i>depth*.66?'#5a3109':i>depth*.33?'#8f5410':'#c98a2b';x.strokeText(t,cx,cy+i)}
 x.strokeStyle='#2f1a08';x.strokeText(t,cx,cy);
 const gr=x.createLinearGradient(0,cy-fs*.8,0,cy);gr.addColorStop(0,'#fffbe0');gr.addColorStop(1,fill||'#ffd25a');x.fillStyle=gr;x.fillText(t,cx,cy)}
function textSprite(text,fs,fg){const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d');
 chunkyText(x,text,512,140,(fs||36)*1.75,fg);
 const t=new THREE.CanvasTexture(c);t.anisotropy=4;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));
 s.scale.set(3.4,.85,1);return s}
// pensamiento flotante de la papa
const thinkC=document.createElement('canvas');thinkC.width=1024;thinkC.height=256;
const thinkTex=new THREE.CanvasTexture(thinkC);
const thinkS=new THREE.Sprite(new THREE.SpriteMaterial({map:thinkTex,transparent:true,opacity:0,depthWrite:false}));
thinkS.scale.set(8,2,1);thinkS.position.set(0,3.6,0);potato.add(thinkS);
function showThought(t){const x=thinkC.getContext('2d');x.clearRect(0,0,1024,256);
 const ws=t.split(' ');let l1='',l2='';
 for(const w of ws){if((l1+' '+w).trim().length<26)l1=(l1+' '+w).trim();else l2=(l2+' '+w).trim()}
 chunkyText(x,l1,512,l2?100:150,56);
 if(l2)chunkyText(x,l2,512,196,56);
 thinkTex.needsUpdate=true;thinkOp=1.8;ach('existencia')}

// estado
let mode=null,playing=false,paused=false,px=0,pz=0,py=terrainHeight(0,0)+PR*.88,vx=0,vz=0,vy=0,dist=0,bonks=0,hue=0,G=28;
let combo=0,comboT=0,lastPumpHit=0,shake=0,dustAcc=0,trailAcc=0;
let goldMesh=null,goldT=50,goldTime=0;
let day=1,dayT=0,realT=0,thinkT=25,thinkOp=0,danceT=0;
const keys={};let jx=0,jz=0,wantJump=false;
const quotes=['¡Auch! …o eso creo 🥔','Soy una papa y estoy bien','Nadie me enseñó a esquivar','Eso fue una calabaza, creo','Mi vida es rodar','Con tanta tierra, estoy en casa','¿Eso fue un árbol o mi destino?','Papa power 💪','Me siento… almidonada'];
const Q={
 pump:['¡Calabaza al ataque! 🎃','Perdón, señora calabaza','¡Strike de calabaza!','Calabaza: 0 · Papa: 1 🥔','Esa calabaza no vio venir mi almidón'],
 coco:['¡Coco loco! 🥥','Ese coco quería ser libre','Perdón, señor coco','¡Strike de coco! 🥥'],
 rock:['¡Auch! Eso era una roca 🪨','La roca ni se disculpó','Choqué con mi primo lejano, la roca','Esa roca tiene más carácter que yo','Roca: 1 · Papa: ¿qué pasó?'],
 tree:['¡Le di un abrazo a un árbol! 🌲','El árbol ni se inmutó','Soy papa, tú eres árbol. Respeto.','¡Auch, mis raíces!','Esto es un atentado contra mi almidón'],
 jump:['¡Boing! 🦘','Las papas SÍ vuelan (un ratito)','¡Hasta la luna! …bueno, hasta el aire','Wiiiii 🥔','Tuve un momento de gloria'],
 idle:['¿Seguimos o qué? 🥔','Me estoy enfriando…','Pensando en puré…','Un día sin rodar es un día sin papa','No pienses en papas fritas, no pienses…'],
 real:['Algo me golpeó. No sé qué. No tengo ojos 🖤','Eso estuvo duro. ¿Una roca? ¿Mi destino?','Todo es oscuridad y yo ruedo','Oigo mi corazón de almidón 💓']};
Q.cactus=['¡Ay! Pica pica 🌵','Abracé un cactus. Mala idea.','Ahora soy una papa con espinas'];Q.snowman=['¡Decapité a Olaf! ⛄','El muñeco de nieve se quedó helado','Perdón, amigo de nieve'];
const THOUGHTS=['¿Soy papa o la papa es yo?','El puré es solo papa que se rindió','Si ruedo en el bosque y nadie me ve... ¿hice ruido?','Mi destino es el horno, pero hoy ruedo','¿Las papas fritas son canibalismo?','El almidón fluye a través de mí','Tal vez el suelo también sueña con ser papa','Rodar es la respuesta. ¿Cuál era la pregunta?'];
// Hitos: solo cada 1000 m (1 km, 2 km...)
const kmT=k=>k===1?'1 km':k+' km';
const MILES=[k=>'¡'+kmT(k)+' rodados! Mamá papa estaría orgullosa 🥔',k=>'¡'+kmT(k)+'! Soy un atleta del almidón',k=>kmT(k)+' y sin una sola arruga… bueno, una o dos',k=>'¡'+kmT(k)+'! Dicen que de aquí se ve el puré prometido',k=>kmT(k)+' de pura gloria patatera 🏅',k=>'¡'+kmT(k)+'! Hasta las zanahorias me respetan',k=>'Mi cáscara ya cuenta '+kmT(k)+' de historias',k=>'¡'+kmT(k)+'! Ni el horno me alcanza']; 
Q.pump.push('Calabaza, yo soy tu padre… de almidón','Esa calabaza ya no volverá a ser pastel','Cuidado, que esta papa muerde (rodando)','Fue un choque entre gigantes del huerto','Las calabazas también tienen derecho a volar','¡Pumba! Cena de halloween adelantada 🎃','Tranquila, calabaza, no es nada personal','Entrené años en el sótano para este momento');
Q.coco.push('Coco, ¿eres tú o es mi mareo?','¡Cocotazo! 🥥 Eso va para el récord','Un coco menos, una leyenda más','Agua de coco: papa 1, coco 0','Los cocos caen, las papas se levantan');
Q.rock.push('La roca y yo tenemos asuntos pendientes','Dura es la vida… y esta roca más','Roca, algún día seremos amigos','Si me parto, díganle a mi madre que rodé con honor','No es una roca, es un obstáculo con ego','Mi cáscara tiene más cicatrices que tu cantera','Choque épico: almidón contra mineral 🪨');
Q.tree.push('Árbol, tú aguantas el viento; yo, el mundo','Hasta los robles me ven pasar con respeto','Nadie olvida el día que una papa abrazó un tronco','Me quedé sin aliento… y sin tubérculo','Este árbol lleva siglos aquí; yo, minutos, y ya duele','¡Tronco traidor, ahí estabas!','Me crucé con la historia viva del bosque 🌳');
Q.jump.push('¡Hoy volaré más alto que un pájaro con sueño!','Newton, no mires esto','Me elevé tanto que vi mi propia sombra bajo mí','La gravedad perdió esta ronda','¡Salto épico de papa nivel dios!','Si tuviera alas, ya sería papa frita… voladora','Aterrizaré con estilo (o sin él)');
Q.idle.push('El silencio también rueda… en mi cabeza','Una papa descansada es una papa peligrosa','¿Y si mejor soy puré con ambiciones?','Hago una pausa épica para mirar el horizonte','Estoy planeando mi próxima hazaña. Ya casi.','Con paciencia, hasta la papa se vuelve leyenda','Se oye el viento… y mi estómago, que es todo almidón','Mi destino no se rueda solo… o tal vez sí');
Q.cactus.push('Pinchar a una papa es un delito de lesa cocina','Cactus, tú y yo no nos entendemos','Pica, pero me hace más fuerte (y más agujereada)','Ahora tengo cara de erizo 🌵');
Q.snowman.push('Muñeco, te debía una zanahoria','Frío, pero el bonk fue cálido','Se derritió mi respeto por él');
THOUGHTS.push('Si me cocinan, ¿sigo siendo yo?','Cada metro rodado es un capítulo de mi epopeya','El horizonte me llama… o quizá solo el hambre','Quizás el verdadero tesoro fue el almidón que hice en el camino','¿Y si el mundo gira para que yo ruede?','Una papa pequeña, un camino enorme','Nací bajo tierra y ahora veo el sol: eso es ascenso','Los héroes no se pelan, se hornean con gloria','Algún día escribirán canciones sobre mis tropiezos','¿Habrá otra papa soñando lo mismo que yo?');
const NPC_PHRASES=['El que rueda, perdura 🥔','No juzgues a una papa por su cáscara','Dicen que el horno es solo un rumor','Yo una vez vi el mar. Era salado como mis lágrimas','Rueda despacio y llegarás... a donde sea','La gravedad es solo una sugerencia','Soy almidón, luego existo','El secreto es no dejar de rodar','Ayer me confundieron con una piedra. Hoy con un héroe','Mi abuela decía: nunca confíes en un cuchillo','Rueda como si nadie te estuviera mirando… excepto yo','Un camino largo comienza con un solo empujón','La pereza no existe; solo papas esperando su cuesta','Llevo aquí tanto tiempo que ya me brotan ideas','Escucha al viento: dice que sigas rodando','Soy pequeña, pero mi leyenda tiene raíces profundas'];
let AC=null,muted=false,rollGain,rollFilter,hb=0,nextMile=1000,idleT=0;
function initAudio(){if(AC)return;AC=new(window.AudioContext||window.webkitAudioContext)();
 const b=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 const s=AC.createBufferSource();s.buffer=b;s.loop=true;rollFilter=AC.createBiquadFilter();rollFilter.type='lowpass';rollFilter.frequency.value=300;
 rollGain=AC.createGain();rollGain.gain.value=0;s.connect(rollFilter);rollFilter.connect(rollGain);rollGain.connect(AC.destination);s.start()}
function tone(f,d,type,v,f2){if(!AC||muted)return;const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.type=type||'sine';o.frequency.setValueAtTime(f,t);
 if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v||.2,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d)}
const sfx={jump:()=>tone(220,.25,'sine',.25,700),land:()=>tone(110,.15,'sine',.3,50),
 pump:()=>{tone(180,.2,'triangle',.3,60);tone(90,.15,'sine',.3)},rock:()=>{tone(900,.08,'square',.1,400);tone(150,.12,'sine',.25,70)},
 tree:()=>{tone(130,.18,'triangle',.35,80);tone(70,.2,'sine',.3)},squeak:()=>tone(rnd(500,900),.12,'sine',.12,rnd(900,1400)),
 level:()=>[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.2,'triangle',.2),i*110)),
 ach:()=>[523,659,784,1046,1318].forEach((f,i)=>setTimeout(()=>tone(f,.28,'triangle',.22),i*120)),
 dance:()=>[392,523,659,784,659,523,392].forEach((f,i)=>setTimeout(()=>tone(f,.16,'triangle',.22),i*140))};
function say(a){toast(a[Math.random()*a.length|0]);sfx.squeak()}
let tt;function toast(t){const e=$('toast');e.textContent=t;e.style.opacity=1;e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop');clearTimeout(tt);tt=setTimeout(()=>e.style.opacity=0,Math.min(4800,1700+t.length*55))}

// ===== logros inútiles =====
const ACH=[
 ['metro1','🥔 Rodaste 1 metro','Toda leyenda empieza rodando'],
 ['pasto','🌱 Tocaste pasto','Literalmente. Eres una papa en pasto.'],
 ['existencia','🤔 Cuestionaste tu existencia','¿Soy papa o la papa es yo?'],
 ['calabaza1','🎃 Primera calabaza','Perdón, señora calabaza'],
 ['coco','🥥 Primer coco','El coco quería ser libre'],
 ['bonks10','💥 10 choques','La frente de almidón aguanta todo'],
 ['roca','🪨 Amigo de una roca','Las rocas también sienten (no)'],
 ['combo5','🔥 Combo x5','¡Imparable!'],
 ['dorada','🥇 Papa dorada','Brillas más que tu futuro'],
 ['baile','💃 Bailaste','La papa tiene ritmo'],
 ['npc','🧠 Charla profunda','Otra papa te iluminó'],
 ['rocoso','🪨 Rocoso confía en ti','Se perdió... y volvió. Siempre vuelve.'],
 ['dia2','📅 Día 2 como papa','Sigues siendo papa'],
 ['real30','👁️ Realista 30s','Sobreviviste sin ver nada'],
 ['milla100','🏁 100 metros','Atleta del almidón']];
let achSet=new Set();
try{achSet=new Set(JSON.parse(localStorage.getItem('papa_ach')||'[]'))}catch(e){}
function ach(id){if(achSet.has(id))return;achSet.add(id);
 try{localStorage.setItem('papa_ach',JSON.stringify(Array.from(achSet)))}catch(e){}
 const a=ACH.find(x=>x[0]===id);if(!a)return;
 toast('🏆 ¡Logro! '+a[1]+'\n'+a[2]);sfx.ach();renderAch()}
function renderAch(){$('achList').innerHTML=ACH.map(a=>achSet.has(a[0])?'<div class="ach on">'+a[1]+'<small>'+a[2]+'</small></div>':'<div class="ach">🔒 ???</div>').join('')}
function toggleAch(){$('achPanel').classList.toggle('open')}

// ===== combo =====
function showCombo(n){const e=$('comboBig');e.textContent='¡COMBO x'+n+'! 🔥';e.style.opacity=1;e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}
function pumpHit(p){const now=performance.now()/1000;
 if(now-lastPumpHit<4)combo++;else combo=1;lastPumpHit=now;comboT=4;
 if(p.q==='coco')ach('coco');else ach('calabaza1');
 if(combo>=2)showCombo(combo);if(combo>=5)ach('combo5');
 tone(300+combo*70,.12,'triangle',.25)}
function hitColor(p){return p.kind==='pump'?(p.q==='coco'?0x8a5a2b:0xe0701a):p.kind==='rock'?0x9a9aa0:0x3f8a3a}

// ===== papa dorada (power-up) =====
function spawnGold(){if(goldMesh)disposeGold();
 goldMesh=new THREE.Group();
 const m=new THREE.Mesh(new THREE.SphereGeometry(.8,24,18),new THREE.MeshStandardMaterial({color:0xffd24a,emissive:0x8a5a00,emissiveIntensity:.9,metalness:.7,roughness:.25}));
 m.castShadow=true;goldMesh.add(m);
 const l=new THREE.PointLight(0xffd24a,1.2,12);l.position.y=2;goldMesh.add(l);
 const s=textSprite('Papa dorada',34,'#ffd24a');s.position.y=2.4;goldMesh.add(s);
 const a=rnd(0,6.28),d=rnd(15,30);goldMesh.position.set(px+Math.cos(a)*d,.9,pz+Math.sin(a)*d);
 scene.add(goldMesh)}

// ===== papas NPC =====
const NPCS=[];
function spawnNPCs(){for(const n of NPCS){scene.remove(n.g);n.g.children[0].children[0].material.dispose();const t=n.g.children[1].material;t.map.dispose();t.dispose()}NPCS.length=0;
 const names=['Kevin','Puré','Señor Almidón','La Papa Sabia','Tubérculo','Papatouille'];
 for(let i=0;i<3;i++){const name=names.splice(Math.random()*names.length|0,1)[0];
  const g=new THREE.Group();const b=body.clone();b.scale.setScalar(.8);
  b.children[0].material=body.children[0].material.clone();g.add(b);
  const s=textSprite(name,32);s.position.y=2.4;g.add(s);
  const a=rnd(0,6.28),d=rnd(12,28);g.position.set(px+Math.cos(a)*d,PR*.88,pz+Math.sin(a)*d);
  scene.add(g);NPCS.push({g:g,name:name,a:rnd(0,6.28),t:rnd(2,5),cd:0})}}

// ===== Rocoso, la roca mascota =====
let rocoso=null,rocFarT=0;const ROC_R=.7,ROC_FOLLOW=4;
function spawnRocoso(){if(rocoso){scene.remove(rocoso.g);const m=rocoso.g.children[1].material;m.map.dispose();m.dispose()}
 const g=new THREE.Group();const r=rockMesh();r.scale.setScalar(.4);r.position.y=.2;g.add(r);
 const s=textSprite('Rocoso',32);s.position.y=1.5;g.add(s);
 g.position.set(px+2.5,.5,pz+2.5);scene.add(g);rocoso={g:g,vx:0,vz:0,vy:0,y:.5};rocFarT=0}

// ===== pausa y baile =====
function setPaused(v){if(!playing||paused===v)return;paused=v;
 $('pause').style.display=paused?'flex':'none';
 if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
 if(rollGain&&AC)rollGain.gain.setTargetAtTime(0,AC.currentTime,.05);
 if(paused){for(const k in keys)keys[k]=0;jx=jz=0;wantJump=false;unlockMouse()}else lockMouse()}
function togglePause(){setPaused(!paused)}
function doDance(){if(!playing||paused||danceT>0)return;danceT=3;ach('baile');sfx.dance();toast('💃 ¡A BAILAR!');confetti()}

function setMode(m){
  mode=m;playing=true;paused=false;px=pz=0;vx=vz=vy=0;py=terrainHeight(0,0)+PR*.88;dist=bonks=0;nextMile=1000;idleT=0;
  day=1;dayT=0;realT=0;combo=0;comboT=0;shake=0;goldTime=0;goldT=rnd(45,60);if(goldMesh)disposeGold();goldMesh=null;
  thinkT=rnd(20,32);thinkOp=0;danceT=0;$('comboBig').style.opacity=0;$('pause').style.display='none';
  if(goldMesh){disposeGold()}
  updateGoldTint();spawnNPCs();spawnRocoso();renderAch();
  initAudio();if(AC.state==='suspended')AC.resume();
  $('menu').style.display='none';document.body.classList.add('playing');document.body.classList.remove('is-photo');photoMode=false;$('photoExit').hidden=true;$('achPanel').classList.remove('open');camYaw=0;camPitch=.34;camD=12.6;camFocus.set(0,py,0);camera.position.set(0,py+5,13);camera.lookAt(0,py+1,0);world.configure(m);G=m==='caos'?7:28;for(const k in keys)keys[k]=0;jx=jz=0;wantJump=false;
  if(m==='real'){renderer.domElement.style.visibility='hidden';scene.background=new THREE.Color(0);toast('Modo realista: no ves nada. Las papas no tienen ojos 👁️🚫');setTimeout(()=>toast('Pero sigues rodando. Se siente… algo.'),3500)}
  else{renderer.domElement.style.visibility='visible'}
  if(m==='huerto')toast('Sigue el sendero. El campo es tuyo.');
  if(m==='caos')toast('Bajo la luna, todo pesa un poco menos.');
  resetWorld();
  lockMouse();
}
document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>setMode(b.dataset.m));
$('back').onclick=()=>{unlockMouse();playing=false;paused=false;$('pause').style.display='none';if(rollGain)rollGain.gain.value=0;$('menu').style.display='flex';document.body.classList.remove('playing','is-photo');renderer.domElement.style.visibility='visible';mode=null;world.configure('huerto');photoMode=false;$('photoExit').hidden=true;$('achPanel').classList.remove('open')};
$('mute').onclick=()=>{muted=!muted;$('mute').classList.toggle('muted',muted);$('mute').setAttribute('aria-label',muted?'Activar sonido':'Silenciar sonido');if(rollGain)rollGain.gain.value=0};
$('achBtn').onclick=()=>toggleAch();
$('pauseBtn').onclick=()=>togglePause();
$('resume').onclick=()=>setPaused(false);
$('menuBtn').onclick=()=>$('back').onclick();

addEventListener('keydown',e=>{
 if(e.code==='F2'){e.preventDefault();togglePhoto();return}
 if(e.code==='Escape'){e.preventDefault();if(!paused){if(performance.now()-lockLostAt>250)setPaused(true)}else setPaused(false);return}
 if(e.code==='KeyP'){togglePause();e.preventDefault();return}
 if(e.code==='KeyM'&&playing){$('mute').onclick();return}
 if(e.code==='KeyB'){doDance();return}
 if(e.code==='KeyL'){toggleAch();return}
 if(e.code.startsWith('Arrow'))e.preventDefault();keys[e.code]=1;if(e.code==='Space'){wantJump=true;e.preventDefault()}});
addEventListener('keyup',e=>keys[e.code]=0);
$('jump').addEventListener('pointerdown',e=>{wantJump=true;e.preventDefault()});
const joy=$('joy'),knob=$('knob');let jid=null;
function jm(e){const r=joy.getBoundingClientRect();let dx=e.clientX-(r.left+65),dy=e.clientY-(r.top+65);const l=Math.hypot(dx,dy),mx=50;if(l>mx){dx*=mx/l;dy*=mx/l}
 knob.style.transform='translate('+dx+'px,'+dy+'px)';jx=dx/mx;jz=dy/mx}
joy.addEventListener('pointerdown',e=>{jid=e.pointerId;joy.setPointerCapture(jid);jm(e)});
joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)jm(e)});
const jend=e=>{if(e.pointerId===jid){jid=null;jx=jz=0;knob.style.transform=''}};
joy.addEventListener('pointerup',jend);joy.addEventListener('pointercancel',jend);

let camYaw=0,camPitch=.34,camD=12.6,camMode=true,pd=0;const ptrs=new Map(),cv=renderer.domElement;
const camFocus=new THREE.Vector3(0,py,0);
// ===== cámara con ratón bloqueado (estilo juego normal: sin clic, sin arrastrar) =====
const FINE=matchMedia('(hover:hover) and (pointer:fine)').matches,LOCK_EL=document.body;
const SENS_LEVELS=[['baja',.0012],['media',.0022],['alta',.0036]];
let sensIdx=1;try{const v=parseInt(localStorage.getItem('papa_sens'),10);if(v>=0&&v<=2)sensIdx=v}catch(e){}
let lockLostAt=0,lockHinted=false;
const lockActive=()=>document.pointerLockElement===LOCK_EL;
function lockMouse(){if(!FINE||!playing||paused||lockActive()||!LOCK_EL.requestPointerLock)return;
 try{const r=LOCK_EL.requestPointerLock({unadjustedMovement:true});
  if(r&&r.catch)r.catch(()=>{try{const r2=LOCK_EL.requestPointerLock();if(r2&&r2.catch)r2.catch(()=>{})}catch(e){}})}
 catch(e){try{LOCK_EL.requestPointerLock()}catch(e2){}}}
function unlockMouse(){if(lockActive())document.exitPointerLock()}
document.addEventListener('pointerlockchange',()=>{
 if(lockActive()){document.body.classList.add('mouse-look');return}
 document.body.classList.remove('mouse-look');lockLostAt=performance.now();
 if(playing&&!paused)setPaused(true)});
document.addEventListener('pointerlockerror',()=>{if(playing&&!paused&&!lockHinted){lockHinted=true;toast('Haz clic en el juego para controlar la cámara con el ratón')}});
document.addEventListener('mousemove',e=>{if(!lockActive()||!playing||paused)return;
 const k=SENS_LEVELS[sensIdx][1],mx=Math.max(-250,Math.min(250,e.movementX||0)),my=Math.max(-250,Math.min(250,e.movementY||0));
 camYaw-=mx*k;camPitch=Math.max(.06,Math.min(1.35,camPitch+my*k))});
function updateSensLabel(){$('sens').textContent='Sensibilidad: '+SENS_LEVELS[sensIdx][0]}
$('sens').onclick=()=>{sensIdx=(sensIdx+1)%3;try{localStorage.setItem('papa_sens',sensIdx)}catch(e){}updateSensLabel()};updateSensLabel();
if(!FINE)$('sens').style.display='none';
$('cam').onclick=()=>{camMode=!camMode;$('cam').classList.toggle('on',camMode);toast(camMode?'🎥 Arrastra para girar la cámara · pellizca para zoom':'🎥 Cámara bloqueada')};
cv.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&playing&&!paused&&!lockActive())lockMouse();ptrs.set(e.pointerId,[e.clientX,e.clientY]);cv.setPointerCapture(e.pointerId);pd=0});
cv.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;
 if(e.pointerType==='mouse'&&lockActive()){p[0]=e.clientX;p[1]=e.clientY;return}
 if(e.pointerType!=='mouse'&&!camMode){p[0]=e.clientX;p[1]=e.clientY;return}
 if(ptrs.size===2){const q=[...ptrs.values()];p[0]=e.clientX;p[1]=e.clientY;const d=Math.hypot(q[0][0]-q[1][0],q[0][1]-q[1][1]);if(pd)camD=Math.max(5,Math.min(30,camD*pd/d));pd=d;return}
 camYaw-=(e.clientX-p[0])*.006;camPitch=Math.max(.12,Math.min(1.3,camPitch+(e.clientY-p[1])*.005));p[0]=e.clientX;p[1]=e.clientY});
const pup=e=>{ptrs.delete(e.pointerId);pd=0};cv.addEventListener('pointerup',pup);cv.addEventListener('pointercancel',pup);
// Rueda del raton = pellizco de 2 dedos (acerca / aleja). Va en window porque con Pointer Lock el evento no llega al canvas.
addEventListener('wheel',e=>{if(!playing||paused||e.ctrlKey)return;if(e.target.closest&&e.target.closest('#achPanel,#help'))return;
 e.preventDefault();const dy=e.deltaY*(e.deltaMode===1?33:e.deltaMode===2?400:1);camD=Math.max(5,Math.min(30,camD*Math.exp(Math.max(-300,Math.min(300,dy))*.0015)))},{passive:false});
let last=performance.now(),fpsMin=0,gateT=0,fpsFrames=0,fpsClock=performance.now();
// Limitador de fotogramas: devuelve true si se debe saltar este fotograma.
function fpsGate(now){if(!fpsMin)return false;if(!gateT)gateT=now;
 if(now<gateT+fpsMin*.92-.2)return true;
 gateT+=fpsMin;if(now-gateT>fpsMin*2)gateT=now;return false}
// Resolucion dinamica: si los fotogramas tardan mas de lo esperable baja la escala; si sobra potencia, la sube
let drPrev=0,drAcc=0,drN=0,drT=0,drMin=1e9,drGood=0;
function dynRes(now){const ft=now-drPrev;drPrev=now;if(!playing||paused||ft<=0||ft>250||world.quality==='bajo'){drAcc=0;drN=0;drT=0;return}
 if(ft>3)drMin=Math.min(drMin,ft);drAcc+=ft;drN++;if(!drT)drT=now;if(now-drT<1500)return;
 const avg=drAcc/drN,target=fpsMin||Math.min(drMin,16.7);drAcc=0;drN=0;drT=now;
 if(avg>target*1.4&&resScale>.55){resScale=Math.max(.55,resScale-.1);drGood=0;applyPR()}
 else if(avg<target*1.12&&resScale<1){if(++drGood>=3){resScale=Math.min(1,resScale+.05);drGood=0;applyPR()}}else drGood=0}
function loop(now){
  requestAnimationFrame(loop);
  if(fpsGate(now))return;
  dynRes(now);
  fpsFrames++;if(now-fpsClock>=500){const f=Math.round(fpsFrames*1000/(now-fpsClock));fpsFrames=0;fpsClock=now;if(!$('fpsMeter').hidden)$('fpsMeter').textContent=f+' FPS'}
  const dt=Math.min((now-last)/1000,.05);last=now;
  if(paused){if(mode!=='real')renderer.render(scene,camera);else renderer.clear();return}
  if(playing){
    let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+jx;
    let iz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+jz;
    const il=Math.hypot(ix,iz);if(il>1){ix/=il;iz/=il}
    const floorBefore=terrainHeight(px,pz)+PR*.88,grounded=py<=floorBefore+.06,acc=(grounded?30:10)*(goldTime>0?1.5:1);
    camYaw+=((keys.KeyE?1:0)-(keys.KeyQ?1:0))*dt*1.8;const cs=Math.cos(camYaw),sn=Math.sin(camYaw);vx+=(ix*cs+iz*sn)*acc*dt;vz+=(-ix*sn+iz*cs)*acc*dt;
    const fr=grounded?Math.pow(.2,dt):Math.pow(.8,dt);vx*=fr;vz*=fr;
    if(grounded){vx-=(terrainHeight(px+.25,pz)-terrainHeight(px-.25,pz))*.8*dt;vz-=(terrainHeight(px,pz+.25)-terrainHeight(px,pz-.25))*.8*dt}
    if(wantJump&&grounded){vy=mode==='caos'?9:9.5;sfx.jump();if(mode!=='real'&&Math.random()<.3)say(Q.jump)}wantJump=false;
    vy-=G*dt;py+=vy*dt;
    if(danceT>0){danceT-=dt;body.rotateY(dt*12);if(grounded)vy=Math.max(vy,4.5)}
    px+=vx*dt;pz+=vz*dt;
    const floorAfter=terrainHeight(px,pz)+PR*.88;
    if(py<floorAfter||(grounded&&vy<=0&&py<floorAfter+.25)){if(vy<-4)sfx.land();py=floorAfter;vy=mode==='caos'&&vy<-3?-vy*.7:0}
    const sp=Math.hypot(vx,vz);dist+=sp*dt;
    if(rollGain){rollGain.gain.setTargetAtTime(muted||py>floorAfter+.09?0:Math.min(sp/14,1)*.07,AC.currentTime,.05);rollFilter.frequency.value=200+sp*50}
    dayT+=dt;if(dayT>=120){dayT=0;day++;toast('Día '+day+': sigues siendo papa 🥔');sfx.level();ach('dia2')}
    // papa dorada: temporizadores, aparición y recogida
    if(goldTime>0){goldTime-=dt;
      goldTrailAcc+=dt;while(goldTrailAcc>.025){goldTrailAcc-=.025;spawnP(px+rnd(-.7,.7),py+rnd(-.4,.5),pz+rnd(-.7,.7),rnd(-1,1),rnd(1,3),rnd(-1,1),rnd(.5,.9),0xffd24a,-1,1.5)}
      if(goldTime<=0){goldTime=0;updateGoldTint();toast('Se acabó lo dorado 🥔')}}
    else{if(!goldMesh){goldT-=dt;if(goldT<=0)spawnGold()}
     else{const gp=goldMesh.position;goldMesh.rotation.y+=dt*2;gp.y=terrainHeight(gp.x,gp.z)+.9+Math.sin(now/300)*.25;
      const gd=Math.hypot(px-gp.x,pz-gp.z);
      if(gd>90){const a=rnd(0,6.28),d2=rnd(15,30);gp.set(px+Math.cos(a)*d2,.9,pz+Math.sin(a)*d2)}
      if(gd<2.6&&Math.abs(py-gp.y)<1.8){disposeGold();goldMesh=null;goldTime=10;goldT=rnd(45,60);updateGoldTint();ach('dorada');sfx.level();toast('🥇 ¡PAPA DORADA! +50% velocidad, invencible 10s');confetti()}}}
    // pensamientos existenciales
    thinkT-=dt;if(thinkT<=0){thinkT=rnd(25,45);showThought(THOUGHTS[Math.random()*THOUGHTS.length|0])}
    if(thinkOp>0){thinkOp=Math.max(0,thinkOp-dt/4);thinkS.material.opacity=Math.min(thinkOp,1)}
    if(dist>nextMile){{const km=nextMile/1000;say(MILES.map(f=>f(km)));sfx.level();confetti();nextMile+=1000}}
    if(sp<.3){idleT+=dt;if(idleT>8){say(mode==='real'?Q.real:Q.idle);idleT=0}}else idleT=0;
    if(mode==='real'){hb+=dt;if(hb>1.1){hb=0;tone(60,.15,'sine',.5,40);setTimeout(()=>tone(55,.12,'sine',.4,35),180)}realT+=dt;if(realT>=30)ach('real30')}
    if(dist>=1)ach('metro1');if(dist>=2&&grounded)ach('pasto');if(dist>=100)ach('milla100');if(bonks>=10)ach('bonks10');
    updateWorld(dt);
    // polvo al rodar rápido + estela de velocidad
    if(grounded&&sp>11){dustAcc+=dt;while(dustAcc>.03){dustAcc-=.03;
      const bx=px-vx/sp*1.6,bz=pz-vz/sp*1.6;
      spawnP(bx+rnd(-.4,.4),terrainHeight(bx,bz)+.2,bz+rnd(-.4,.4),rnd(-1,1),rnd(1,3),rnd(-1,1),rnd(.4,.8),0xc9a06a,-2,2.5)}}
    if(false&&sp>9&&goldTime<=0){trailAcc+=dt;while(trailAcc>.05){trailAcc-=.05;
      spawnP(px+rnd(-.5,.5),py+rnd(-.3,.3),pz+rnd(-.5,.5),-vx*.08,rnd(0,1),-vz*.08,.5,0xbfd9ff,0,1)}}
    // papas NPC
    for(const n of NPCS){n.t-=dt;if(n.t<=0){n.t=rnd(2,6);n.a=rnd(0,6.28)}
     const nx=n.g.position.x+Math.cos(n.a)*3*dt,nz=n.g.position.z+Math.sin(n.a)*3*dt;
     const dd=Math.hypot(nx-px,nz-pz);
     if(dd>55){const a=rnd(0,6.28),d2=rnd(12,28);n.g.position.set(px+Math.cos(a)*d2,PR*.88,pz+Math.sin(a)*d2)}
     else{n.g.position.x=nx;n.g.position.z=nz}
     {const q=n.g.position,ox=q.x-px,oz=q.z-pz,od=Math.hypot(ox,oz),md=PR*1.2+PR*1.05;
      if(od<md&&py-PR*.88<q.y+.6){const nx2=od>1e-4?ox/od:1,nz2=od>1e-4?oz/od:0;q.x=px+nx2*md;q.z=pz+nz2*md}
      for(const o of ACT){if(o.kind==='pump')continue;const t=o.m.position,tx=q.x-t.x,tz=q.z-t.z,m2=o.r+PR*.95;if(Math.abs(tx)>m2||Math.abs(tz)>m2)continue;const td=Math.hypot(tx,tz);
       if(td<m2){const ux=td>1e-4?tx/td:1,uz=td>1e-4?tz/td:0;q.x=t.x+ux*m2;q.z=t.z+uz*m2;n.a=Math.atan2(uz,ux)}}}
     n.g.position.y=terrainHeight(n.g.position.x,n.g.position.z)+PR*.72;n.g.children[0].rotateZ(-dt*2);n.cd-=dt;n.g.children[1].material.opacity=1-Math.min(1,Math.max(0,dd-7)/6);
     if(dd<2.6&&n.cd<=0){n.cd=10;toast('🥔 '+n.name+': "'+NPC_PHRASES[Math.random()*NPC_PHRASES.length|0]+'"');sfx.squeak();ach('npc')}}
    // Rocoso, la roca mascota (con colisión: ya no se mete dentro de la papa)
    if(rocoso){const rp=rocoso.g.position;let rdx=px-rp.x,rdz=pz-rp.z,rd=Math.hypot(rdx,rdz);
     if(rd>70){const a=rnd(0,6.28);rp.x=px+Math.cos(a)*6;rp.z=pz+Math.sin(a)*6;rocoso.vx=rocoso.vz=0;rdx=px-rp.x;rdz=pz-rp.z;rd=Math.hypot(rdx,rdz)}
     const rspd=rd>25?16:8;
     if(rd>ROC_FOLLOW){rocoso.vx+=(rdx/rd*rspd-rocoso.vx)*Math.min(1,dt*4);rocoso.vz+=(rdz/rd*rspd-rocoso.vz)*Math.min(1,dt*4)}
     else{rocoso.vx*=Math.pow(.05,dt);rocoso.vz*=Math.pow(.05,dt)}
     rp.x+=rocoso.vx*dt;rp.z+=rocoso.vz*dt;
     const rmv=Math.hypot(rocoso.vx,rocoso.vz)>1;
     rocoso.vy-=28*dt;rocoso.y+=rocoso.vy*dt;
     const rf=terrainHeight(rp.x,rp.z)+.25;if(rocoso.y<=rf){rocoso.y=rf;rocoso.vy=(rmv&&rocoso.vy<-2)?3.5:0}
     // separación con la papa (salvo que la papa salte por encima)
     if(!(py-PR*.88>rocoso.y+.5)){const ox=rp.x-px,oz=rp.z-pz,od=Math.hypot(ox,oz),md=PR*1.2+ROC_R;
      if(od<md){const nx=od>1e-4?ox/od:1,nz=od>1e-4?oz/od:0;rp.x=px+nx*md;rp.z=pz+nz*md;
       const into=rocoso.vx*-nx+rocoso.vz*-nz;if(into>0){rocoso.vx+=nx*into;rocoso.vz+=nz*into}
       const shove=Math.min(sp*.5,6);rocoso.vx+=nx*shove*dt*8;rocoso.vz+=nz*shove*dt*8}}
     // y con árboles, rocas, calabazas, vallas y demás obstáculos
     for(const o of ACT){const q=o.m.position,ox=rp.x-q.x,oz=rp.z-q.z,md=o.r+ROC_R;if(Math.abs(ox)>md||Math.abs(oz)>md)continue;const od=Math.hypot(ox,oz);
      if(od<md){const nx=od>1e-4?ox/od:1,nz=od>1e-4?oz/od:0;rp.x=q.x+nx*md;rp.z=q.z+nz*md}}
     rp.y=rocoso.y;rocoso.g.children[1].material.opacity=1-Math.min(1,Math.max(0,rd-6)/6);rocoso.g.rotation.y+=Math.hypot(rocoso.vx,rocoso.vz)*dt*2;
     if(rd>25)rocFarT+=dt;else{if(rocFarT>3&&rd<6)ach('rocoso');rocFarT=0}}
    // colisiones
    for(const p of ACT){
      if(goldTime>0&&p.kind!=='pump')continue;
      const q=p.m.position;
      if(p.kind==='pump'){q.x+=p.vx*dt;q.z+=p.vz*dt;q.y=terrainHeight(q.x,q.z)+(p.base||.67);p.vx*=Math.pow(.3,dt);p.vz*=Math.pow(.3,dt);
        const a=Math.atan2(p.vz,p.vx);p.m.rotation.y+=Math.hypot(p.vx,p.vz)*dt*.5}
      const dx=px-q.x,dz=pz-q.z,d=Math.hypot(dx,dz),min=p.r+PR*1.0;
      if(d<min&&py<terrainHeight(q.x,q.z)+p.h+.5){const nx=dx/(d||1),nz=dz/(d||1),ov=min-d;
        if(p.kind==='pump'){p.vx-=nx*(sp*1.2+2);p.vz-=nz*(sp*1.2+2);px+=nx*ov*.5;pz+=nz*ov*.5;q.x-=nx*ov*.5;q.z-=nz*ov*.5}
        else{px+=nx*ov;pz+=nz*ov;const dot=vx*nx+vz*nz;if(dot<0){vx-=1.6*dot*nx;vz-=1.6*dot*nz}}
        if(sp>2.5&&!p.cd){p.cd=1;setTimeout(()=>p.cd=0,450);bonks++;
          burst(q.x,terrainHeight(q.x,q.z)+1.2,q.z,hitColor(p),16,5,.7);
          if(sp>6)shake=Math.min(shake+.6,1.4);
          if(p.kind==='pump')pumpHit(p);
          if(p.kind==='rock')ach('roca');
          sfx[p.kind]();if(Math.random()<.7)say(mode==='real'?Q.real:Q[p.q||p.kind])}
        if(mode==='caos'&&p.kind!=='tree')vy=Math.max(vy,6)}}
    if(comboT>0){comboT-=dt;if(comboT<=0){combo=0;$('comboBig').style.opacity=0}}
    // rodar
    if(sp>.01){_axis.set(vz,0,-vx).normalize();body.quaternion.premultiply(_q.setFromAxisAngle(_axis,sp*dt/PR))}
    updateParts(dt);
    py=Math.max(py,terrainHeight(px,pz)+PR*.88);potato.position.set(px,py,pz);
    camFocus.lerp(potato.position,1-Math.pow(.0005,dt));
    const cp=Math.cos(camPitch),tx=camFocus.x+Math.sin(camYaw)*cp*camD,tz=camFocus.z+Math.cos(camYaw)*cp*camD;
    let ty=Math.max(.8,camFocus.y+Math.sin(camPitch)*camD+1);ty=Math.max(ty,terrainHeight(tx,tz)+1.2);
    camera.position.set(tx,ty,tz);
    if(shake>0){camera.position.x+=(Math.random()-.5)*shake*.9;camera.position.y+=(Math.random()-.5)*shake*.7;shake=Math.max(0,shake-dt*2.2)}
    camera.lookAt(px,py+1,pz);
    if(mode==='caos'){hue=(hue+dt*.1)%1;if(goldTime<=0)bodyMat().color.setHSL(.08+Math.sin(now/600)*.06,.35,.85)}
    updateHUD(sp,dt);

  }
  if(!playing){world.update(px,pz,dt);camera.position.set(px+Math.sin(now*.00003)*1.1+1.6,terrainHeight(px,pz)+5.6,pz+15);camera.lookAt(px,terrainHeight(px,pz)+1.5,pz-8);potato.position.set(px,terrainHeight(px,pz)+PR*.88,pz)}
  if(mode!=='real')renderer.render(scene,camera);else renderer.clear();
}
let goldTrailAcc=0;const _axis=new THREE.Vector3(),_q=new THREE.Quaternion();
camera.position.set(5,5.6,15);camera.lookAt(0,1.5,-8);resetWorld();world.setQuality(world.quality);
let photoMode=false,hudClock=0;
function togglePhoto(){if(!playing||mode==='real')return;photoMode=!photoMode;document.body.classList.toggle('is-photo',photoMode);$('photoExit').hidden=!photoMode;toast(photoMode?'Vista limpia · F2 para volver':'Interfaz visible')}
$('photoExit').onclick=togglePhoto;
function updateHUD(speed,dt){hudClock+=dt;if(hudClock<.15)return;hudClock=0;
 $('region').textContent=biomeInfo(px,pz).n;
 $('dayLabel').textContent=(mode==='caos'?'Noche lunar':'Luz de la tarde')+' / Día '+day;
 $('statSpeed').textContent=Math.round(speed*3.6);$('statDistance').textContent=dist|0;$('statBonks').textContent=bonks;
 $('power').textContent=goldTime>0?'Papa dorada · '+Math.ceil(goldTime)+' s':combo>=2?'Combo ×'+combo:'';
 const objectives=[['metro1','Sal del huerto'],['calabaza1','Empuja una calabaza'],['milla100','Explora 100 metros'],['npc','Encuentra otra papa']];
 const jk=objectives.map(([k])=>achSet.has(k)?1:0).join('');
 if(jk!==updateHUD.jk){updateHUD.jk=jk;$('journeyItems').innerHTML=objectives.map(([k,t])=>'<li class="'+(achSet.has(k)?'done':'')+'"><span></span>'+t+'</li>').join('');
 $('journeyCount').textContent=objectives.filter(([k])=>achSet.has(k)).length+' / 4'}
}
function updateQualityLabel(){$('quality').textContent=world.quality==='alto'?'Gráficos: altos':'Gráficos: ligeros'}
$('quality').onclick=()=>{world.setQuality(world.quality==='alto'?'bajo':'alto');ACT=world.props;updateQualityLabel();toast(world.quality==='alto'?'Detalle alto activado':'Detalle ligero activado')};updateQualityLabel();
$('helpBtn').onclick=()=>$('help').classList.toggle('open');$('closeHelp').onclick=()=>$('help').classList.remove('open');
addEventListener('blur',()=>{for(const k in keys)keys[k]=0;jx=jz=0;wantJump=false;if(playing&&!paused)setPaused(true)});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing&&!paused)setPaused(true)});
function disposeGold(){if(!goldMesh)return;scene.remove(goldMesh);goldMesh.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose()}});goldMesh=null}
// Explicit diagnostics for regression and visual smoke tests, read-only during normal play.

// ===== pantalla completa y límite de FPS =====
const DESK=window.papaDesktop||null;
const CAPN=(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform())?((Capacitor.Plugins||{}).PapaNative||null):null;
const ANDROID=!!CAPN||(!DESK&&matchMedia('(pointer:coarse)').matches);
if(CAPN)document.body.classList.add('native-android');
const FPS_PC=[['vsync','V-Sync (pantalla)',0],['30','30 FPS',30],['60','60 FPS',60],['120','120 FPS',120],['240','240 FPS',240],['max','Sin límite',0]];
const FPS_MOB=[['auto','Automático (pantalla)',0],['60','60 Hz',60],['90','90 Hz',90],['120','120 Hz',120]];
const FPS_LIST=ANDROID?FPS_MOB:FPS_PC,FPS_KEY=ANDROID?'papa_fps_mob':'papa_fps_pc';
let fpsIdx=0;try{const v=FPS_LIST.findIndex(x=>x[0]===localStorage.getItem(FPS_KEY));if(v>=0)fpsIdx=v}catch(e){}
function applyFps(notify){const m=FPS_LIST[fpsIdx];fpsMin=m[2]?1000/m[2]:0;gateT=0;
 document.querySelectorAll('.js-fps').forEach(b=>b.textContent=(ANDROID?'Frecuencia: ':'Fotogramas: ')+m[1]);
 if(CAPN){try{CAPN.setRefreshRate({hz:m[2]||0}).catch(()=>{})}catch(e){}}
 if(DESK){DESK.setFps(m[0]).then(r=>{if(r&&r.relaunching)toast('Reiniciando para aplicar el límite…')}).catch(()=>{})}
 if(notify){toast(m[1]);if(!ANDROID&&!DESK&&(m[0]==='max'||m[2]>60))toast(m[1]+'\nEn el navegador no se supera la frecuencia del monitor. Usa la versión .exe para ello.')}}
function cycleFps(){fpsIdx=(fpsIdx+1)%FPS_LIST.length;try{localStorage.setItem(FPS_KEY,FPS_LIST[fpsIdx][0])}catch(e){}applyFps(true)}
document.querySelectorAll('.js-fps').forEach(b=>b.onclick=cycleFps);
let isFull=false;
function fsLabel(){document.querySelectorAll('.js-fs').forEach(b=>b.textContent=isFull?'⛶ Salir de pantalla completa':'⛶ Pantalla completa')}
function toggleFull(){if(CAPN)return;
 if(DESK){DESK.setFullscreen(!isFull);return}
 if(document.fullscreenElement){document.exitFullscreen&&document.exitFullscreen()}
 else{const el=document.documentElement;(el.requestFullscreen||el.webkitRequestFullscreen||(()=>Promise.reject())).call(el).catch(()=>toast('Tu navegador no permite pantalla completa aquí'))}}
document.addEventListener('fullscreenchange',()=>{isFull=!!document.fullscreenElement;fsLabel()});
if(DESK){DESK.onFullscreen(v=>{isFull=v;fsLabel()});DESK.getState().then(st=>{isFull=!!st.fullscreen;fsLabel()}).catch(()=>{})}
document.querySelectorAll('.js-fs').forEach(b=>b.onclick=toggleFull);
addEventListener('keydown',e=>{if(e.code==='KeyF'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!CAPN){toggleFull();e.preventDefault()}
 if(e.code==='F3'){e.preventDefault();$('fpsMeter').hidden=!$('fpsMeter').hidden}});
fsLabel();applyFps(false);
window.PapaDiagnostics={fpsGate,snapshot:()=>({camYaw,camPitch,locked:lockActive(),rocoso:rocoso?{x:rocoso.g.position.x,y:rocoso.g.position.y,z:rocoso.g.position.z}:null,mode,playing,paused,position:{x:px,y:py,z:pz},floor:terrainHeight(px,pz),chunks:world.chunks.size,props:ACT.length,quality:world.quality,textureFailures:world.textureFailures,loadedTextures:world.textureTotal-world.pending,renderer:renderer.info.render,memory:renderer.info.memory}),height:terrainHeight,teleport:(x,z,ax,az)=>{px=x;pz=z;vx=ax||0;vz=az||0;py=terrainHeight(x,z)+PR*.88;vy=0}};
renderAch();requestAnimationFrame(loop);
const loadStart=performance.now();function ready(){if(world.pending&&performance.now()-loadStart<15000){$('loadMsg').textContent='Preparando materiales y paisaje…';setTimeout(ready,100);return}const l=$('load');l.classList.add('ready');setTimeout(()=>l.remove(),700);if(world.textureFailures.length)toast('Algunos materiales no se cargaron. Vuelve a abrir el juego.')}ready();
