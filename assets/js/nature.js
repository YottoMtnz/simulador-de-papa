/* Simulador de Papa · Tierras Vivas. World, vegetation and surface rendering. */
(function(){
'use strict';
const T=THREE, TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{v=clamp((v-a)/(b-a),0,1);return v*v*(3-2*v)};
function rng(seed){let a=seed|0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash(x,z){let h=Math.imul(x,374761393)^Math.imul(z,668265263);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296}
function noise(x,z){const a=Math.floor(x),b=Math.floor(z),u=smooth(0,1,x-a),v=smooth(0,1,z-b);return T.MathUtils.lerp(T.MathUtils.lerp(hash(a,b),hash(a+1,b),u),T.MathUtils.lerp(hash(a,b+1),hash(a+1,b+1),u),v)}
function fbm(x,z){return noise(x,z)*.58+noise(x*2.03+27,z*2.03-19)*.28+noise(x*4.11-6,z*4.11+13)*.14}
function pathCenter(z){return 5*Math.sin(z*.027)+3*Math.sin(z*.059)}
function pathDist(x,z){return Math.abs(x-pathCenter(z))}
function rawHeight(x,z){return (fbm(x*.016,z*.016)-.5)*18+Math.sin(x*.025+z*.013)*1.7+(noise(x*.09,z*.09)-.5)*.55}
const spawnHeight=rawHeight(0,0);
function height(x,z){const raw=rawHeight(x,z)-spawnHeight;const h=raw*(.5+.5*smooth(4,27,Math.hypot(x,z)));return h-.16*(1-smooth(1.4,3.8,pathDist(x,z)))}
function biome(x,z){const d=Math.hypot(x,z);if(d<100)return{id:noise(x*.013+9,z*.013+7)>.59?'bosque':'pradera',n:noise(x*.013+9,z*.013+7)>.59?'Bosque de los robles':'Pradera del sendero'};const n=noise(x*.004-12,z*.004+4);return n<.3?{id:'desierto',n:'Tierras de arena'}:n>.72?{id:'nieve',n:'Laderas del norte'}:n>.48?{id:'bosque',n:'Bosque de los robles'}:{id:'pradera',n:'Pradera abierta'}}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;return t}
function repeated(t,n=1){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(n,n);return t}
function merge(geos){const a={position:[],normal:[],uv:[],color:[]};let hasColor=false;for(let g of geos){g=g.index?g.toNonIndexed():g;for(const k of ['position','normal','uv']){const at=g.getAttribute(k);if(at)for(const n of at.array)a[k].push(n)}const co=g.getAttribute('color');hasColor||=!!co;for(let i=0;i<g.attributes.position.count;i++)a.color.push(co?co.getX(i):1,co?co.getY(i):1,co?co.getZ(i):1)}const g=new T.BufferGeometry();for(const k of ['position','normal','uv'])if(a[k].length)g.setAttribute(k,new T.Float32BufferAttribute(a[k],k==='uv'?2:3));if(hasColor)g.setAttribute('color',new T.Float32BufferAttribute(a.color,3));g.computeBoundingSphere();return g}
function branch(points,r0,r1,segments=7){const c=new T.CatmullRomCurve3(points),g=new T.TubeGeometry(c,segments,1,7,false),p=g.attributes.position;for(let i=0;i<=segments;i++){const center=c.getPointAt(i/segments),r=T.MathUtils.lerp(r0,r1,i/segments);for(let j=0;j<=7;j++){const k=i*8+j;p.setXYZ(k,center.x+(p.getX(k)-center.x)*r,center.y+(p.getY(k)-center.y)*r,center.z+(p.getZ(k)-center.z)*r)}}g.computeVertexNormals();return g}
function pointedLeaf(l,w){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-l/2,0,0,-l*.2,w,0,l*.32,w*.55,.01,l/2,0,0,l*.2,-w*.6,.01,-l*.2,-w,0,0,0,.012],3));g.setAttribute('uv',new T.Float32BufferAttribute([0,.5,.3,1,.8,.8,1,.5,.7,.2,.3,0,.5,.5],2));g.setIndex([6,0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0]);g.computeVertexNormals();return g}
function colorGeo(g,fn){const a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<g.attributes.position.count;i++){const c=fn(i);a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b}g.setAttribute('color',new T.BufferAttribute(a,3));return g}
class World{
 constructor(renderer,scene,sun,hemi,camera){
 this.camera=camera;this.frustum=new T.Frustum();this.viewMatrix=new T.Matrix4();this.chunkSphere=new T.Sphere();
 this.renderer=renderer;this.scene=scene;this.sun=sun;this.hemi=hemi;this.time={value:0};this.chunks=new Map();this.props=[];this.quality=localStorageSafe('papa_quality')||((matchMedia('(pointer:coarse)').matches)?'bajo':'alto');this.cx=1e9;this.cz=1e9;this.pending=0;this.textureTotal=0;this.textureFailures=[];this.loader=new T.TextureLoader();
 this.textures={};this.initMaterials();this.initTrees();this.initSky();this.initProps();this.landmarks();
 this.ground={material:{color:new T.Color(0xffffff)}};
 this.configure('huerto');
 }
 texture(key,repeat=1,normal=false){const fallback=this.detail;const src=(window.PAPA_TEXTURES||{})[key];if(!src)return fallback;this.pending++;this.textureTotal++;const t=this.loader.load(src,()=>this.pending--,undefined,()=>{this.pending--;this.textureFailures.push(key)});t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat,repeat);t.encoding=normal?T.LinearEncoding:T.sRGBEncoding;t.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());return t}
 initMaterials(){
 const rr=rng(18);
 this.detail=repeated(canvasTex(256,256,(c,w,h)=>{c.fillStyle='#84765b';c.fillRect(0,0,w,h);for(let i=0;i<18000;i++){const b=85+rr()*90;c.fillStyle=`rgb(${b+7},${b},${b-16})`;c.fillRect(rr()*w,rr()*h,.5+rr()*2,.5+rr()*2)}}));
 this.skin=canvasTex(512,512,(c,w,h)=>{c.fillStyle='#9d7747';c.fillRect(0,0,w,h);for(let i=0;i<24000;i++){const v=rr(),s=v<.008?4+rr()*6:.3+rr()*1.5;c.fillStyle=`rgba(${85+rr()*100},${56+rr()*85},${27+rr()*65},${.1+rr()*.4})`;c.beginPath();c.ellipse(rr()*w,rr()*h,s,s*.55,rr()*TAU,0,TAU);c.fill()}for(let i=0;i<22;i++){const x=rr()*w,y=rr()*h;const g=c.createRadialGradient(x,y,0,x,y,7);g.addColorStop(0,'#47301ecc');g.addColorStop(.25,'#72502fbb');g.addColorStop(1,'#c6a57400');c.fillStyle=g;c.fillRect(x-7,y-7,14,14)}});
 this.bark=this.texture('bark_brown_01_diff');this.barkN=this.texture('bark_brown_01_nor_gl',1,true);
 this.trunkMat=new T.MeshStandardMaterial({map:this.bark,normalMap:this.barkN,normalScale:new T.Vector2(.55,.55),color:0xb1a89a,roughness:.98});
 this.rockMap=this.texture('rock_boulder_dry_diff');this.rockN=this.texture('rock_boulder_dry_nor_gl',1,true);
 this.rockMat=new T.MeshStandardMaterial({map:this.rockMap,normalMap:this.rockN,normalScale:new T.Vector2(.65,.65),roughness:.97,color:0xaaa99a});
 this.leafMap=this.texture('tree_small_02_leaves_diff');this.leafAlpha=this.texture('tree_small_02_leaves_alpha',1,true);this.leafNormal=this.texture('tree_small_02_leaves_nor_gl',1,true);
 this.leafMat=new T.MeshStandardMaterial({map:this.leafMap,alphaMap:this.leafAlpha,normalMap:this.leafNormal,normalScale:new T.Vector2(.22,.22),alphaTest:.48,side:T.DoubleSide,roughness:.98,vertexColors:true});this.wind(this.leafMat,.13,'leaf');
 this.leafDepth=new T.MeshDepthMaterial({map:this.leafMap,alphaMap:this.leafAlpha,alphaTest:.48,depthPacking:T.RGBADepthPacking,side:T.DoubleSide});this.wind(this.leafDepth,.13,'leaf');
 const pineMap=this.texture('pine_tree_01_twig_diff'),pineAlpha=this.texture('pine_tree_01_twig_alpha',1,true);
 this.pineMat=new T.MeshStandardMaterial({map:pineMap,alphaMap:pineAlpha,alphaTest:.4,side:T.DoubleSide,roughness:1,vertexColors:true});this.wind(this.pineMat,.13,'leaf');
 this.pineDepth=new T.MeshDepthMaterial({map:pineMap,alphaMap:pineAlpha,alphaTest:.4,depthPacking:T.RGBADepthPacking,side:T.DoubleSide});this.wind(this.pineDepth,.13,'leaf');
 this.grassMat=new T.MeshStandardMaterial({color:0x7fa046,roughness:1,side:T.DoubleSide,vertexColors:true});this.wind(this.grassMat,.22,'grass');
 this.grassDepth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,side:T.DoubleSide});this.wind(this.grassDepth,.22,'grass');
 this.flowerMat=new T.MeshStandardMaterial({color:0xe6dbae,roughness:.95,side:T.DoubleSide,vertexColors:true});this.wind(this.flowerMat,.15,'grass');
 const dirt=this.texture('forest_ground_04_diff'),dirtN=this.texture('forest_ground_04_nor_gl',1,true),grass=this.texture('aerial_grass_rock_diff'),grassN=this.texture('aerial_grass_rock_nor_gl',1,true);
 this.terrainMat=new T.MeshStandardMaterial({map:dirt,normalMap:dirtN,normalScale:new T.Vector2(.65,.65),roughness:1,vertexColors:true});
 this.terrainMat.onBeforeCompile=s=>{s.uniforms.naturalGrass={value:grass};s.uniforms.naturalGrassNormal={value:grassN};s.vertexShader='attribute float meadow; attribute vec2 climate; varying float vMeadow; varying vec2 vClimate;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMeadow=meadow;vClimate=climate;');s.fragmentShader='uniform sampler2D naturalGrass; uniform sampler2D naturalGrassNormal; varying float vMeadow;varying vec2 vClimate;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec4 soil=mapTexelToLinear(texture2D(map,vUv));vec4 sod=mapTexelToLinear(texture2D(naturalGrass,vUv*0.77));diffuseColor*=mix(soil,sod,clamp(vMeadow,0.,1.));diffuseColor.rgb*=mix(vec3(1.),vec3(.76,1.16,1.04),clamp(vMeadow,0.,1.)*(1.-vClimate.y));diffuseColor.rgb=mix(diffuseColor.rgb,soil.rgb*vec3(1.32,1.14,.82)+vec3(.08,.055,.027),vClimate.y);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.68,.75,.79)*(.86+soil.r*.15),vClimate.x);`);s.fragmentShader=s.fragmentShader.replace('vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;','vec3 mapN = mix(texture2D(normalMap,vUv).xyz,texture2D(naturalGrassNormal,vUv*0.77).xyz,clamp(vMeadow,0.,1.))*2.0-1.0;')};
 this.terrainMat.customProgramCacheKey=()=> 'tierras-vivas-terrain-v2';
 }
 wind(mat,amount,kind){mat.onBeforeCompile=s=>{s.uniforms.windTime=this.time;s.vertexShader='uniform float windTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nvec3 wp=position;\n#ifdef USE_INSTANCING\nwp=(instanceMatrix*vec4(position,1.0)).xyz;\n#endif\nfloat flex=${kind==='grass'?'pow(clamp(position.y,0.,1.5),1.6)':'clamp(position.y*.12,0.,1.)'};transformed.x+=sin(windTime*1.35+wp.x*.48+wp.z*.28)*flex*${amount};transformed.z+=cos(windTime*.85+wp.z*.38)*flex*${amount*.6};`)};mat.customProgramCacheKey=()=> 'wind-'+kind+amount}
 treeTemplate(type,variant){const rr=rng(137+variant*719+type*83),trunks=[],leaves=[];const tall=type===1?11:8.5;const lean=(rr()-.5)*1.1;
 trunks.push(branch([new T.Vector3(),new T.Vector3(lean*.25,tall*.25,.12),new T.Vector3(lean,tall*.6,-.18),new T.Vector3(lean*.7,tall,0)],type===2?.25:.45,.035,12));
 // Flaring, asymmetrical exposed roots.
 for(let i=0;i<6;i++){const a=TAU*i/6+rr()*.3;trunks.push(branch([new T.Vector3(Math.cos(a)*(1+rr()*.45),-.06,Math.sin(a)*(1+rr()*.45)),new T.Vector3(Math.cos(a)*.5,.18,Math.sin(a)*.5),new T.Vector3(0,.9,0)],.035,.19,4))}
 const branches=type===1?30:19;
 const addLeaves=(end,scale,num)=>{for(let k=0;k<num;k++){const g=new T.PlaneGeometry(scale*(type===1?.45:.47),scale*(.9+rr()*.25),1,2);const uv=g.attributes.uv;for(let v=0;v<uv.count;v++){const u=uv.getX(v),w=uv.getY(v);uv.setXY(v,type===1?.025+u*.20:.54+u*.302,type===1?.60+w*.37:.45+w*.51)}const gp=g.attributes.position;for(let v=0;v<gp.count;v++){gp.setZ(v,Math.sin(gp.getX(v)/scale*3)*.09)}g.computeVertexNormals();g.rotateX((rr()-.5)*2.6);g.rotateY(rr()*TAU);g.rotateZ(rr()*TAU);g.translate(end.x+(rr()-.5)*scale*.85,end.y+(rr()-.5)*scale*.72,end.z+(rr()-.5)*scale*.85);const c=new T.Color().setHSL(type===2?.22:.215,.28+rr()*.2,.78+rr()*.15);colorGeo(g,()=>c);leaves.push(g)}};
 for(let k=0;k<branches;k++){const a=k*2.399+rr()*.6,t=.25+k/branches*.65,start=new T.Vector3(lean*t,t*tall,0),spread=type===1?(1-t)*4.4:2.1+rr()*1.9,end=new T.Vector3(start.x+Math.cos(a)*spread,start.y+(type===1?.35:1.3+rr()*1.8),Math.sin(a)*spread),mid=start.clone().lerp(end,.55);mid.y-=.25;
 trunks.push(branch([start,mid,end],type===1?.085:.16*(1-t)+.055,.013,5));
 if(type===1)addLeaves(end,2.1*(1-t)+.7,4);else{for(let b=0;b<3;b++){const angle=a+(b-1)*.62,tip=end.clone().add(new T.Vector3(Math.cos(angle)*.85,.5+rr()*.8,Math.sin(angle)*.85));trunks.push(branch([mid,end,tip],.04,.005,3));addLeaves(tip,type===2?1.85:2.3,4)}}
 }addLeaves(new T.Vector3(lean,tall,.1),type===1?1.1:2.5,5);
 return{trunk:merge(trunks),leaf:merge(leaves)}
 }
 initTrees(){this.templates=[];for(let i=0;i<3;i++)for(let j=0;j<2;j++)this.templates.push(this.treeTemplate(i,j));this.grassGeo=this.makeGrass();this.flowerGeo=this.makeFlowers();this.fernGeo=this.makeFern();}
 makeGrass(){const rr=rng(327),gs=[];for(let i=0;i<8;i++){const h=.27+rr()*.57,w=.015+rr()*.025,a=rr()*TAU,bend=.12+rr()*.2,x=(rr()-.5)*.4,z=(rr()-.5)*.4;const pos=[],uv=[],col=[],idx=[];for(let j=0;j<4;j++){const t=j/3,wd=w*(1-t*.94);for(let k=0;k<2;k++){const s=k?1:-1;pos.push(x+Math.cos(a)*wd*s+Math.sin(a)*bend*t*t,h*t,z+Math.sin(a)*wd*s+Math.cos(a)*bend*t*t);uv.push(k,t);const c=new T.Color().setHSL(.2+rr()*.04,.36,.24+t*.32);col.push(c.r,c.g,c.b)}}for(let j=0;j<3;j++){let n=j*2;idx.push(n,n+1,n+2,n+1,n+3,n+2)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();gs.push(g)}return merge(gs)}
 makeFlowers(){const gs=[],rr=rng(66);for(let j=0;j<3;j++){const x=(rr()-.5)*.3,z=(rr()-.5)*.3,h=.45+rr()*.4;const stalk=new T.CylinderGeometry(.008,.015,h,3);stalk.translate(x,h/2,z);colorGeo(stalk,()=>new T.Color(0x677947));gs.push(stalk);for(let k=0;k<5;k++){const a=k/5*TAU,g=new T.SphereGeometry(.06,5,3);g.scale(.6,.16,1.1);g.rotateY(a);g.translate(x+Math.sin(a)*.065,h,z+Math.cos(a)*.065);colorGeo(g,()=>new T.Color(0xe5ddc1));gs.push(g)}const c=new T.SphereGeometry(.027,5,3);c.translate(x,h+.01,z);colorGeo(c,()=>new T.Color(0xc4a23b));gs.push(c)}return merge(gs)}
 makeFern(){const gs=[];for(let f=0;f<7;f++){const a=f/7*TAU;for(let k=1;k<9;k++){const t=k/9;for(let side of [-1,1]){const g=pointedLeaf(.29*(1-t)+.05,.04*(1-t)+.01);g.rotateX(-Math.PI/2);g.rotateY(a+side*.65);g.translate(Math.sin(a)*t*.68+Math.cos(a)*side*.09,Math.sin(t*Math.PI)*.45+.03,Math.cos(a)*t*.68-Math.sin(a)*side*.09);colorGeo(g,()=>new T.Color().setHSL(.25,.34,.33+t*.2));gs.push(g)}}}return merge(gs)}
 makeRock(s=1){const g=this.rockGeo||this.createRockGeo(),o=new T.Mesh(g,this.rockMat);o.scale.setScalar(s);o.castShadow=true;o.receiveShadow=true;return o}
 createRockGeo(){const g=new T.IcosahedronGeometry(1,3),p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const d=.95+.16*Math.sin(x*5.1+z*3)+.095*Math.cos(y*8+x*4);p.setXYZ(i,x*d*1.28,y*d*.78,z*d)}g.computeVertexNormals();this.rockGeo=g;return g}
 initProps(){this.createRockGeo();const p=new T.SphereGeometry(.88,32,24),a=p.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),angle=Math.atan2(z,x),r=1+.13*Math.cos(angle*10);a.setXYZ(i,x*r,y*.76,z*r)}p.computeVertexNormals();this.pumpGeo=p;const rr=rng(781);this.pumpTex=canvasTex(256,256,(c,w,h)=>{c.fillStyle='#bc681e';c.fillRect(0,0,w,h);for(let i=0;i<6000;i++){c.strokeStyle=`rgba(${130+rr()*75},${65+rr()*55},16,${rr()*.25})`;let x=rr()*w,y=rr()*h;c.beginPath();c.moveTo(x,y);c.lineTo(x+rr()*2,y+5+rr()*18);c.stroke()}});this.cocoMat=new T.MeshStandardMaterial({map:this.bark,color:0x765130,roughness:1,bumpMap:this.bark,bumpScale:.07});this.cactusMat=new T.MeshStandardMaterial({color:0x63795b,roughness:1,bumpMap:this.detail,bumpScale:.045});this.pumpMat=new T.MeshStandardMaterial({map:this.pumpTex,roughness:.87,bumpMap:this.pumpTex,bumpScale:.035});this.stemGeo=branch([new T.Vector3(0,.6,0),new T.Vector3(.05,.88,.03),new T.Vector3(.17,.96,.04)],.11,.047,5);}
 makeCactus(){const arms=[branch([new T.Vector3(),new T.Vector3(.06,1.3,0),new T.Vector3(-.03,3.3,.05)],.28,.11,14),branch([new T.Vector3(0,1.1,0),new T.Vector3(.7,1.2,0),new T.Vector3(.8,2.5,.07)],.17,.075,10),branch([new T.Vector3(0,1.65,0),new T.Vector3(-.55,1.7,.1),new T.Vector3(-.65,2.2,.12)],.15,.065,10)];const g=merge(arms),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),r=1+.055*Math.cos(Math.atan2(z,x)*13);p.setXYZ(i,x*r,p.getY(i),z*r)}g.computeVertexNormals();const m=new T.Mesh(g,this.cactusMat);m.castShadow=true;return m}
 makePump(){const p=new T.Mesh(this.pumpGeo,this.pumpMat);p.add(new T.Mesh(this.stemGeo,this.trunkMat));p.castShadow=true;p.receiveShadow=true;return p}
 terrain(cx,cz){const size=40,n=32,g=new T.PlaneGeometry(size,size,n,n);g.rotateX(-Math.PI/2);const p=g.attributes.position,uv=g.attributes.uv,colors=[],meadow=[],climate=[];for(let i=0;i<p.count;i++){const x=p.getX(i)+cx*size+size/2,z=p.getZ(i)+cz*size+size/2,y=height(x,z);p.setXYZ(i,x,y,z);uv.setXY(i,x/4,z/4);const b=biome(x,z).id,pd=pathDist(x,z);let m=smooth(1.55,3.8+noise(x*.5,z*.5)*1.4,pd);m*=.55+noise(x*.19,z*.19)*.45;if(b==='desierto'||b==='nieve')m=0;const c=new T.Color(b==='nieve'?0xe5e2d8:b==='desierto'?0xf1d6a3:0xffffff);if(b==='bosque')c.multiplyScalar(.84);colors.push(c.r,c.g,c.b);meadow.push(m);const cn=noise(x*.004-12,z*.004+4),far=smooth(90,140,Math.hypot(x,z));climate.push(smooth(.65,.75,cn)*far*(.6+.4*smooth(1.5,4,pd)),(1-smooth(.25,.34,cn))*far)}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('meadow',new T.Float32BufferAttribute(meadow,1));g.setAttribute('climate',new T.Float32BufferAttribute(climate,2));g.computeVertexNormals();const m=new T.Mesh(g,this.terrainMat);m.receiveShadow=true;return m}
 inst(group,geo,mat,list,shadow=false,depth=null){if(!list.length)return;const mesh=new T.InstancedMesh(geo,mat,list.length),o=new T.Object3D();for(let i=0;i<list.length;i++){let v=list[i];o.position.set(v.x,v.y,v.z);o.rotation.set(v.rx||0,v.a||0,v.rz||0);o.scale.set(v.s,v.sy||v.s,v.s);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);if(v.color)mesh.setColorAt(i,new T.Color(v.color))}mesh.castShadow=shadow;mesh.receiveShadow=true;if(depth)mesh.customDepthMaterial=depth;group.add(mesh);return mesh}
 build(cx,cz){const group=new T.Group(),rr=rng((hash(cx+412,cz-801)*2147483647)|0),b=biome(cx*40+20,cz*40+20).id,props=[],trees=Array.from({length:6},()=>[]);group.add(this.terrain(cx,cz));let count=b==='bosque'?16:b==='pradera'?7:b==='nieve'?10:0;
 for(let i=0;i<count;i++){const x=cx*40+rr()*40,z=cz*40+rr()*40;if(pathDist(x,z)<5||Math.hypot(x,z)<9||Math.hypot(x+15,z+23)<8)continue;const type=b==='nieve'?1:rr()<.18?1:rr()<.2?2:0,variant=type*2+(rr()<.5?1:0),scale=.72+rr()*.68;trees[variant].push({x,y:height(x,z)-.05,z,s:scale,a:rr()*TAU});props.push({m:{position:new T.Vector3(x,height(x,z),z)},r:.44*scale,kind:'tree',h:8*scale,vx:0,vz:0})}
 trees.forEach((list,i)=>{if(list.length){this.inst(group,this.templates[i].trunk,this.trunkMat,list,true);this.inst(group,this.templates[i].leaf,i===2||i===3?this.pineMat:this.leafMat,list,this.quality==='alto',i===2||i===3?this.pineDepth:this.leafDepth)}});
 if(b==='desierto')for(let i=0;i<5;i++){const x=cx*40+rr()*40,z=cz*40+rr()*40;if(pathDist(x,z)<3)continue;const o=this.makeCactus();o.position.set(x,height(x,z),z);o.rotation.y=rr()*TAU;group.add(o);props.push({m:o,r:.35,kind:'tree',q:'cactus',h:3.5,vx:0,vz:0})}
 const tuft=[],flower=[],ferns=[],stones=[];const attempts=this.quality==='bajo'?230:600;
 for(let i=0;i<attempts;i++){let x=cx*40+rr()*40,z=cz*40+rr()*40,d=pathDist(x,z),bi=biome(x,z).id;if(d<2.2+rr()*1.2||Math.hypot(x+15,z+23)<5.3)continue;const s=.65+rr()*.8;if(bi!=='desierto'&&bi!=='nieve')tuft.push({x,y:height(x,z)-.025,z,s,a:rr()*TAU});if(i%11===0&&bi==='pradera')flower.push({x,y:height(x,z),z,s:s*.8,a:rr()*TAU});if(i%15===0&&bi==='bosque')ferns.push({x,y:height(x,z),z,s:s*1.35,a:rr()*TAU});if(i%13===0)stones.push({x,y:height(x,z),z,s:.05+rr()*.13,sy:.05+rr()*.05,a:rr()*TAU})}
 this.inst(group,this.grassGeo,this.grassMat,tuft,false,this.grassDepth);this.inst(group,this.flowerGeo,this.flowerMat,flower);this.inst(group,this.fernGeo,this.grassMat,ferns);this.inst(group,this.rockGeo,this.rockMat,stones);
 for(let i=0;i<4;i++){const x=cx*40+rr()*40,z=cz*40+rr()*40;if(Math.hypot(x,z)<7||pathDist(x,z)<3)continue;const s=.45+rr()*1.15,o=this.makeRock(s);o.position.set(x,height(x,z)+s*.35,z);o.rotation.set(rr()*.25,rr()*TAU,rr()*.16);group.add(o);props.push({m:o,r:s*1.1,kind:'rock',h:s*1.45,vx:0,vz:0,base:s*.35})}
 if(b!=='nieve')for(let i=0;i<(b==='pradera'?4:2);i++){const z=cz*40+rr()*40,x=cx*40+rr()*40;if(Math.hypot(x,z)<5)continue;const coco=b==='desierto',o=coco?new T.Mesh(this.rockGeo,this.cocoMat):this.makePump();if(coco){o.scale.set(.45,.65,.48);o.castShadow=true}o.position.set(x,height(x,z)+.67,z);o.rotation.y=rr()*TAU;group.add(o);props.push({m:o,r:coco?.65:.9,kind:'pump',q:coco?'coco':undefined,h:1.2,vx:0,vz:0,base:.67})}
 // A guaranteed small pumpkin patch close to the starting trail.
 if(cx===0&&cz===-1)for(let i=0;i<4;i++){const x=3+i%2*1.6,z=-8-Math.floor(i/2)*2.4,o=this.makePump();o.position.set(x,height(x,z)+.67,z);group.add(o);props.push({m:o,r:.9,kind:'pump',h:1.2,vx:0,vz:0,base:.67})}
 this.scene.add(group);return{group,props,cx,cz};
 }
 disposeChunk(c){this.scene.remove(c.group);c.group.children.forEach(m=>{if(m.isInstancedMesh&&m.dispose)m.dispose();if(m.material===this.terrainMat||m.material===this.cactusMat)m.geometry.dispose()})}
 reset(){for(const c of this.chunks.values())this.disposeChunk(c);this.chunks.clear();this.cx=this.cz=1e9;this.update(0,0,0)}
 update(x,z,dt){this.time.value+=dt||0;const cx=Math.floor(x/40),cz=Math.floor(z/40);if(cx!==this.cx||cz!==this.cz){this.cx=cx;this.cz=cz;for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const k=(cx+i)+','+(cz+j);if(!this.chunks.has(k))this.chunks.set(k,this.build(cx+i,cz+j))}for(const [k,c]of this.chunks)if(Math.abs(c.cx-cx)>2||Math.abs(c.cz-cz)>2){this.disposeChunk(c);this.chunks.delete(k)}this.props=[];for(const c of this.chunks.values())this.props.push(...c.props);this.props.push(...this.fixedProps)}
 if(this.camera){this.camera.updateMatrixWorld();this.frustum.setFromProjectionMatrix(this.viewMatrix.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse));for(const c of this.chunks.values()){const mx=c.cx*40+20,mz=c.cz*40+20;this.chunkSphere.center.set(mx,height(mx,mz)+5,mz);this.chunkSphere.radius=34;c.group.visible=this.frustum.intersectsSphere(this.chunkSphere)&&Math.hypot(mx-x,mz-z)<110}}
 const y=height(x,z);this.sun.position.set(x+38,y+34,z-32);this.sun.target.position.set(x,y,z);this.sky.position.set(x,y,z);this.ridges.position.set(x,0,z);this.stars.position.set(x,y,z);
 }
 initSky(){
 this.skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color(0x2c78c8)},horizon:{value:new T.Color(0xeee3c0)},night:{value:0},time:this.time,sunDir:{value:new T.Vector3(38,34,-32).normalize()}},vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vDir;uniform vec3 top;uniform vec3 horizon;uniform float night;uniform float time;uniform vec3 sunDir;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float hash3(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}
 vec3 hash33(vec3 p){return vec3(hash3(p),hash3(p+19.19),hash3(p+47.7));}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fb(vec2 p){return noise(p)*.53+noise(p*2.02)*.27+noise(p*4.1)*.13+noise(p*8.2)*.07;}
 vec3 starLayer(vec3 d,float sc,float thr,float r,float bright,float seed){
  vec3 p=d*sc,id=floor(p),f=fract(p);float h=hash3(id+seed);
  if(h<thr)return vec3(0.);
  vec3 sp=.2+.6*hash33(id+seed*3.1);float dd=length(f-sp);
  float tw=.78+.22*sin(time*(1.2+h*3.)+h*60.);
  float m=smoothstep(r,0.,dd)*(.35+.65*hash3(id+seed*7.))*bright*tw;
  vec3 col=mix(vec3(.62,.76,1.),vec3(1.,.9,.74),hash3(id.zxy+seed));
  return col*m;}
 void main(){
  vec3 d=normalize(vDir);float s=dot(d,sunDir);float sp=max(s,0.);
  float up=clamp(d.y,0.,1.);
  vec3 c=mix(horizon,top,pow(up,.42));
  // nubes (cobertura moderada, borde iluminado hacia el sol, deriva lenta)
  float cov=0.,lit=0.;
  if(d.y>.02){
   vec2 uv=d.xz/(d.y+.25)*1.7+vec2(time*.004,time*.0016);
   float nn=fb(uv),n2=fb(uv+normalize(sunDir.xz+1e-4)*.07);
   cov=smoothstep(.54,.78,nn)*smoothstep(.02,.2,d.y);
   lit=clamp(.55+(nn-n2)*5.,0.,1.);}
  if(night<.5){
   // DIA: halo calido, disco solar y calidez en el horizonte del lado del sol
   c+=vec3(1.,.74,.42)*pow(sp,6.)*.20;
   c+=vec3(1.,.82,.52)*pow(sp,48.)*.35;
   c+=vec3(.28,.13,.02)*exp(-d.y*7.)*pow(sp,2.5);
   c+=vec3(1.,.96,.82)*pow(sp,420.)*.7;
   c=mix(c,vec3(1.,.97,.86)*1.6,smoothstep(.99982,.99988,s));
   vec3 cc=mix(vec3(.60,.67,.80),vec3(1.,.97,.91),lit);
   cc+=vec3(1.,.72,.42)*pow(sp,5.)*.28*lit;
   c=mix(c,cc,cov*.78);
  }else{
   // NOCHE: estrellas de varios brillos, via lactea suave y luna con maria
   float horizonFade=smoothstep(.0,.28,d.y);
   float moonNear=1.-smoothstep(.97,.9985,s)*.92;
   vec3 st=starLayer(d,46.,.87,.25,1.9,1.)+starLayer(d,105.,.87,.23,1.3,2.)+starLayer(d,230.,.90,.21,1.0,3.);
   vec3 gn=normalize(vec3(.35,.82,.45));float gd=abs(dot(d,gn));
   float band=exp(-gd*gd*22.);
   float mwTex=.35+.65*fb(vec2(atan(d.z,d.x)*3.,dot(d,gn)*9.)+4.);
   vec3 mw=mix(vec3(.10,.12,.26),vec3(.40,.34,.42),mwTex)*band*mwTex*.5;
   st+=starLayer(d,420.,.80,.24,.9,5.)*band*1.6;
   float veil=1.-cov*.8;
   c+=(st+mw)*horizonFade*moonNear*veil;
   // luna
   vec3 tg=normalize(cross(sunDir,vec3(0.,1.,0.))),bt=cross(tg,sunDir);
   vec2 mu=vec2(dot(d,tg),dot(d,bt))/.036;float r2=length(mu);
   float disc=smoothstep(1.02,.97,r2)*step(0.,s);
   float zz=sqrt(max(0.,1.-r2*r2));
   float maria=mix(.74,1.,smoothstep(.38,.62,fb(mu*1.7+vec2(4.,2.))));
   float crater=.94+.06*noise(mu*14.);
   vec3 moon=vec3(.94,.95,.9)*maria*crater*(.62+.38*zz)*1.15;
   c+=vec3(.35,.5,.95)*pow(sp,70.)*.28+vec3(.25,.35,.7)*pow(sp,9.)*.07;
   c=mix(c,moon,disc);
   vec3 cn=vec3(.10,.13,.24)+vec3(.35,.4,.55)*pow(sp,18.)*lit;
   c=mix(c,cn,cov*.45);
  }
  c+=(hash(gl_FragCoord.xy)-.5)/255.;
  gl_FragColor=vec4(c,1.);}`});this.sky=new T.Mesh(new T.SphereGeometry(420,48,24),this.skyMat);this.sky.frustumCulled=false;this.scene.add(this.sky);
 this.buildMountains();this.scene.add(this.ridges);
 this.stars=new T.Group();this.scene.add(this.stars);
 }
 buildMountains(){
  // Montanas 3D con relieve real (malla polar + normales) y texturas fotograficas de Poly Haven. La bruma usa el color de la niebla de la escena.
  this.ridges=new T.Group();
  const bands=[{r0:165,r1:245,peak:50,seed:3,rows:14,sc:34},{r0:250,r1:345,peak:92,seed:9,rows:14,sc:48},{r0:350,r1:450,peak:128,seed:17,rows:14,sc:64}];
  const COLS=320,FLOOR=-26,sm=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x)};
  const rock=this.texture('rock_boulder_dry_diff'),rockN=this.texture('rock_boulder_dry_nor_gl',1,true),grass=this.texture('aerial_grass_rock_diff');
  const fbm=(x,z,o)=>{let a=.5,f=1,s=0,n=0;for(let q=0;q<5;q++){s+=a*noise(x*f+o+q*17.3,z*f-o*1.7+q*9.1);n+=a;a*=.5;f*=2.07}return s/n};
  bands.forEach((b,j)=>{
    const pos=[],uv=[],mixv=[],haze=[],idx=[],ROWS=b.rows,hs=[];
    const cols=[];
    for(let r=0;r<=ROWS;r++){const t=r/ROWS,rad=b.r0+(b.r1-b.r0)*t;
      for(let k=0;k<=COLS;k++){const a=k/COLS*TAU,x=Math.sin(a)*rad,z=Math.cos(a)*rad;
        const nx=x*.0105,nz=z*.0105,base=fbm(nx,nz,b.seed),rid=1-Math.abs(2*fbm(nx*1.7+3.1,nz*1.7-1.3,b.seed+5)-1);
        const mass=Math.pow(Math.max(0,base*1.25-.12),1.25),ridge=Math.pow(rid,2.1);
        const env=Math.pow(Math.sin(Math.PI*Math.min(1,t*1.04)),.85);
        const detail=(fbm(x*.045,z*.045,b.seed+11)-.5)*7;
        let h=FLOOR+env*(b.peak*(.2+.5*mass+.55*ridge*mass)+detail*env+30)+(t<.04?-8:0);
        h=Math.max(FLOOR,h);
        pos.push(x,h,z);hs.push(h);
        uv.push(a*rad/b.sc,(rad+h*.9)/b.sc);
        haze.push(0);mixv.push(0);
      }}
    for(let r=0;r<ROWS;r++)for(let k=0;k<COLS;k++){const n=r*(COLS+1)+k,m=n+COLS+1;idx.push(n,m,n+1,n+1,m,m+1)}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
    const nrm=g.attributes.normal;for(let r=0;r<=ROWS;r++){const a=r*(COLS+1),c=a+COLS;const nx=nrm.getX(a)+nrm.getX(c),ny=nrm.getY(a)+nrm.getY(c),nz=nrm.getZ(a)+nrm.getZ(c),l=Math.hypot(nx,ny,nz)||1;nrm.setXYZ(a,nx/l,ny/l,nz/l);nrm.setXYZ(c,nx/l,ny/l,nz/l)}
    for(let q=0;q<hs.length;q++){const h=hs[q],ny=nrm.getY(q),alt=(h-FLOOR)/(b.peak+30);const rocky=sm(.55,.95,alt*1.1+(1-ny)*1.5);mixv[q]=rocky;
      const rad=Math.hypot(pos[q*3],pos[q*3+2]);haze[q]=Math.min(.9,.16+.6*sm(165,450,rad)+.07*j-.2*sm(.3,1,alt))}
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('aRock',new T.Float32BufferAttribute(mixv,1));g.setAttribute('aHaze',new T.Float32BufferAttribute(haze,1));
    const mat=new T.MeshStandardMaterial({map:rock,normalMap:rockN,normalScale:new T.Vector2(1.4,1.4),roughness:1,metalness:0,fog:true,side:T.FrontSide});
    mat.onBeforeCompile=sh=>{sh.uniforms.map2={value:grass};
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aRock;attribute float aHaze;varying float vRock;varying float vHaze;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRock=aRock;vHaze=aHaze;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D map2;varying float vRock;varying float vHaze;')
        .replace('#include <map_fragment>',`vec4 tA=texture2D(map,vUv),tB=texture2D(map2,vUv),tM=texture2D(map,vUv*.173+vec2(.37,.11));
         vec4 texelColor=mix(tB*vec4(.62,.86,.44,1.),tA,vRock);texelColor.rgb*=.5+.85*dot(tM.rgb,vec3(.333));texelColor=mapTexelToLinear(texelColor);diffuseColor*=texelColor;`)
        .replace('#include <fog_fragment>','#ifdef USE_FOG\ngl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,vHaze);\n#endif');};
    const mesh=new T.Mesh(g,mat);mesh.frustumCulled=false;mesh.renderOrder=-1;this.ridges.add(mesh);
  });
 }
 configure(mode){const night=mode==='caos';this.scene.background=new T.Color(night?0x0b1430:0xeadfbb);this.scene.fog=new T.Fog(night?0x16264d:0xeadfbb,night?38:46,night?105:125);this.skyMat.uniforms.top.value.set(night?0x040a22:0x2c78c8);this.skyMat.uniforms.horizon.value.set(night?0x1d3366:0xeee3c0);this.skyMat.uniforms.night.value=night?1:0;this.stars.visible=false;this.sun.color.set(night?0xa9c4ff:0xffe4bd);this.sun.intensity=night?.7:1.9;this.hemi.color.set(night?0x6a8fe0:0xe6e4c8);this.hemi.groundColor.set(night?0x3a3350:0x7a6a45);this.hemi.intensity=night?.62:.85;this.ridges.children.forEach(m=>m.material.color.set(night?0x9fb4e6:0xffffff));this.renderer.toneMappingExposure=night?1.1:1.12;}
 landmarks(){this.fixedProps=[];const g=new T.Group(),wood=this.trunkMat;const h=height(-15,-23);
 // Weathered orchard fence follows the terrain; every post is collidable.
 for(let k=0;k<9;k++){const x=-8-k*2.6,z=-13-k*.2,y=height(x,z),p=new T.Mesh(new T.BoxGeometry(.17,1.5,.18),wood);p.position.set(x,y+.63,z);p.rotation.z=Math.sin(k*12)*.06;p.castShadow=true;g.add(p);this.fixedProps.push({m:p,r:.18,kind:'tree',h:1.5,vx:0,vz:0});if(k<8)for(let j=0;j<2;j++){const bar=new T.Mesh(new T.BoxGeometry(2.7,.1,.09),wood);bar.position.set(x-1.3,y+.35+j*.57,z-.09);bar.rotation.z=.035;bar.castShadow=true;g.add(bar)}}
 // Fallen tree, cut ends, and a timber trail sign.
 const log=new T.Mesh(new T.CylinderGeometry(.36,.47,4.5,12),wood);log.rotation.z=Math.PI*.49;log.rotation.y=.45;log.position.set(11,height(11,-18)+.45,-18);log.castShadow=true;g.add(log);for(let k=0;k<3;k++)this.fixedProps.push({m:{position:new T.Vector3(9+k*1.5,height(11,-18),-18)},r:.6,kind:'rock',h:1,vx:0,vz:0});
 const signTex=canvasTex(512,128,(c,w,h)=>{c.fillStyle='#80704c';c.fillRect(0,0,w,h);for(let i=0;i<38;i++){c.strokeStyle=i%2?'#6b5a4266':'#a08c6266';c.beginPath();c.moveTo(0,i*4);c.lineTo(w,i*4+Math.sin(i)*5);c.stroke()}c.fillStyle='#e9dec0';c.font='24px Georgia';c.fillText('BOSQUE DE LOS ROBLES',28,53);c.font='18px Georgia';c.fillText('Sigue el sendero    →',28,92)});
 const post=new T.Mesh(new T.BoxGeometry(.16,2.4,.17),wood);post.position.set(-4,height(-4,-5)+1.1,-5);post.castShadow=true;g.add(post);const sign=new T.Mesh(new T.BoxGeometry(2.7,.7,.1),[wood,wood,wood,wood,new T.MeshStandardMaterial({map:signTex,roughness:1}),wood]);sign.position.set(-4,height(-4,-5)+1.95,-5);sign.rotation.y=.12;sign.castShadow=true;g.add(sign);this.fixedProps.push({m:post,r:.2,kind:'tree',h:2.5,vx:0,vz:0});
 this.scene.add(g);this.landmarkGroup=g;
 }
 setQuality(q){this.quality=q;try{localStorage.setItem('papa_quality',q)}catch(e){}const big=matchMedia('(pointer:fine)').matches&&Math.max(screen.width,screen.height)*(devicePixelRatio||1)>=2500,sm=q==='bajo'?1024:big?4096:2048;if(this.onQuality)this.onQuality(q);this.sun.shadow.mapSize.set(sm,sm);if(this.sun.shadow.map){this.sun.shadow.map.dispose();this.sun.shadow.map=null}this.reset()}
}
function localStorageSafe(k){try{return localStorage.getItem(k)}catch(e){return null}}
window.Nature={World,height,biome,pathDist,rng,noise,merge};
})();
