/* Banda sonora: reproduce assets/music/1.mp3 ... 20.mp3 en orden aleatorio y sin parar.
   - Solo suenan los archivos que existan; los que falten se saltan sin avisos.
   - Con una sola pista, esa pista se repite en bucle.
   - Un solo elemento <audio> reutilizado (compatible con iOS/Android WebView) y sin fetch (funciona con file://). */
(function(){
'use strict';
var MAX=20,DIR='assets/music/',BASE=.7,LEVELS=[[1,'alta'],[.6,'media'],[.3,'baja'],[0,'apagada']],KEY='papa_music';
var a=null,active=false,muted=false,ducked=false,levelIdx=0,bag=[],missing={},fails=0,last=0,waitGesture=false,timer=0,gain=0,cur=0;
try{var v=parseInt(localStorage.getItem(KEY),10);if(v>=0&&v<LEVELS.length)levelIdx=v}catch(e){}
function shuffle(l){for(var i=l.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=l[i];l[i]=l[j];l[j]=t}return l}
function want(){return active&&!muted&&LEVELS[levelIdx][0]>0&&!document.hidden}
function next(){
  if(fails>=MAX)return 0; // no hay ninguna pista: silencio
  if(!bag.length){var all=[];for(var i=1;i<=MAX;i++)if(!missing[i])all.push(i);if(!all.length)return 0;shuffle(all);if(all.length>1&&all[0]===last)all.push(all.shift());bag=all}
  return bag.shift()
}
function load(){
  var n=next();if(!n){a.removeAttribute('src');a.load();return}
  cur=n;gain=0;a.src=DIR+n+'.mp3';a.volume=0;
  play()
}
function play(){
  if(!a||!want()||!a.getAttribute('src'))return;
  var p=a.play();if(p&&p.catch)p.catch(function(e){if(e&&e.name==='NotAllowedError')waitGesture=true})
}
function ensure(){
  if(a)return;a=new Audio();a.preload='auto';a.loop=false;
  a.addEventListener('ended',function(){last=cur;load()});
  a.addEventListener('error',function(){if(!a.getAttribute('src'))return;missing[cur]=1;fails++;if(active)load()});
  a.addEventListener('playing',function(){fails=0});
  timer=setInterval(tick,100)
}
function target(){
  var t=BASE*LEVELS[levelIdx][0]*(ducked?.35:1);if(!a||!a.duration||!isFinite(a.duration))return t;
  var left=a.duration-a.currentTime,fin=Math.min(1,a.currentTime/2),fout=Math.min(1,left/2.5);return t*Math.max(0,Math.min(fin,fout))
}
function tick(){
  if(!a)return;
  if(!want()){if(!a.paused)a.pause();return}
  if(a.paused&&a.getAttribute('src')&&!waitGesture&&!a.ended)play();
  var t=target();gain+=(t-gain)*.25;if(Math.abs(t-gain)<.002)gain=t;a.volume=Math.max(0,Math.min(1,gain))
}
document.addEventListener('visibilitychange',function(){if(a&&document.hidden)a.pause();else tick()});
['pointerdown','keydown','touchstart'].forEach(function(ev){addEventListener(ev,function(){if(waitGesture){waitGesture=false;play()}},{passive:true})});
window.Music={
  start:function(){active=true;ensure();if(!a.getAttribute('src'))load();else play()},
  stop:function(){active=false;if(a)a.pause()},
  setMuted:function(m){muted=!!m;if(!muted)play();else if(a)a.pause()},
  duck:function(d){ducked=!!d},
  cycle:function(){levelIdx=(levelIdx+1)%LEVELS.length;try{localStorage.setItem(KEY,levelIdx)}catch(e){}if(LEVELS[levelIdx][0]>0)play();return this.label()},
  label:function(){return 'Música: '+LEVELS[levelIdx][1]},
  hasTracks:function(){return fails<MAX},
  state:function(){return a?{src:a.getAttribute('src'),paused:a.paused,volume:a.volume,time:a.currentTime,missing:Object.keys(missing).length}:null}
};
})();
