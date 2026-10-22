import Phaser from 'phaser';
import './style.css';
import {newRun,hit,firefly,tick,SHIELD_MAX} from './rules';
import {DJAudio} from './audio';
// @ts-expect-error Procedural pixel art cached as textures at scene creation.
import {paint,paintEffect} from './art.js';
import {paintPlayer,paintSky,paintForest,paintGround,paintFerns,paintFog,paintShadow,forestLayers} from './night-art';
import {buildWorld,groundAt,regionAt,WORLD_WIDTH,WORLD_HEIGHT} from './world';
type Quality='low'|'high';
function initialQuality():Quality{try{const saved=localStorage.getItem('forest-quality');if(saved==='low'||saved==='high')return saved}catch{}return matchMedia('(pointer: coarse)').matches?'low':'high'}
const START_QUALITY=initialQuality(),RENDER_SCALE=START_QUALITY==='low'?1:2,STEP=1/60;
type Particle={x:number;y:number;vx:number;vy:number;life:number;max:number;color:number;size:number;gravity:number};
type FloatLabel={view:Phaser.GameObjects.Text;life:number};
const $=(id:string)=>document.getElementById(id)!;
type Item=Phaser.Physics.Arcade.Image & {kind?:string;baseY?:number;phase?:number;halo?:Phaser.GameObjects.Image};
class Forest extends Phaser.Scene{
 player!:Phaser.Physics.Arcade.Image;
 items!:Phaser.Physics.Arcade.Group;obstacles!:Phaser.Physics.Arcade.Group;
 run=newRun();status:'ready'|'play'|'pause'|'over'='ready';
 sky!:Phaser.GameObjects.Image;layers:Phaser.GameObjects.TileSprite[]=[];ground!:Phaser.GameObjects.TileSprite;ferns!:Phaser.GameObjects.TileSprite;
 ambient!:Phaser.GameObjects.Graphics;fx!:Phaser.GameObjects.Graphics;performer!:Phaser.GameObjects.Container;djSprite!:Phaser.GameObjects.Image;
 playerGlow!:Phaser.GameObjects.Image;djGlow!:Phaser.GameObjects.Image;goldenScene!:Phaser.GameObjects.Image;water!:Phaser.GameObjects.Image;djMotion!:Phaser.GameObjects.Graphics;
 djTime=0;best=0;shieldFlash=0;shieldBurst=0;accumulator=0;audio!:DJAudio;
 quality:Quality=START_QUALITY;particles:Particle[]=[];labels:FloatLabel[]=[];fog:Phaser.GameObjects.TileSprite[]=[];
 feedback!:Phaser.GameObjects.Graphics;beams!:Phaser.GameObjects.Graphics;playerShadow!:Phaser.GameObjects.Image;
 keys=new Set<string>();touchDirections=new Map<number,number>();
 landing=0;pickupFlash=0;entryPulse=0;trailTime=0;wasGrounded=false;
 constructor(){super('forest')}
 texture(name:string,w:number,h:number,draw:(ctx:CanvasRenderingContext2D)=>void,smooth=false){
  const texture=this.textures.createCanvas(name,w*2,h*2)!;texture.context.scale(2,2);draw(texture.context);
  texture.refresh();texture.setFilter(smooth?Phaser.Textures.FilterMode.LINEAR:Phaser.Textures.FilterMode.NEAREST);
 }
 create(){
  try{this.best=Number(localStorage.getItem('forest-best'))||0}catch{}
  this.audio=new DJAudio(()=>this.musicLabel());
  for(const [name,w,h]of [['baby',26,27],['dj',42,48],['power',34,48],['light',20,15]] as const)this.texture(name,w,h,ctx=>paint(ctx,name));
  const playerFrames=[...Array.from({length:8},(_,i)=>'run'+i),'jump','fall','land','pickup'];
  this.texture('player-atlas',48*playerFrames.length,64,ctx=>{
   playerFrames.forEach((pose,i)=>{ctx.save();ctx.translate(i*48,0);paintPlayer(ctx,pose.startsWith('run')?'run':pose,i*Math.PI/4);ctx.restore()});
  });
  playerFrames.forEach((pose,i)=>this.textures.get('player-atlas').add(pose,0,i*96,0,96,128));
  this.texture('performer0',170,100,ctx=>paint(ctx,'performer',0));
  for(const [kind,w,h]of [['golden-scene',800,360],['water',72,72],['light-aura',88,88],['dj-aura',170,170]] as const)this.texture(kind,w,h,ctx=>paintEffect(ctx,kind),true);
  this.texture('night-sky',800,360,paintSky,true);this.texture('mist',800,96,paintFog,true);this.texture('foot-shadow',64,12,paintShadow,true);
  this.sky=this.add.image(0,0,'night-sky').setDisplaySize(800,360).setOrigin(0);
  this.cameras.main.setBackgroundColor('#10152f');this.cameras.main.setZoom(RENDER_SCALE);this.cameras.main.setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT);this.cameras.main.centerOn(400,groundAt(122)-65);
  for(let l=0;l<forestLayers.length;l++){
   const width=forestLayers[l].spacing;this.texture('tree'+l,width,300,ctx=>paintForest(ctx,l,width));
   this.layers.push(this.add.tileSprite(0,0,800,300,'tree'+l).setOrigin(0).setTileScale(.5));
  }
  this.texture('ground',800,60,paintGround);this.ground=this.add.tileSprite(0,299,800,61,'ground').setOrigin(0).setTileScale(.5).setVisible(false);
  this.texture('ferns',890,20,paintFerns);this.ferns=this.add.tileSprite(0,280,800,20,'ferns').setOrigin(0).setTileScale(.5).setVisible(false);
  this.fog=[this.add.tileSprite(0,178,800,96,'mist').setOrigin(0).setTileScale(.5).setDepth(2).setAlpha(.65),this.add.tileSprite(0,244,800,70,'mist').setOrigin(0).setTileScale(.5).setDepth(3).setAlpha(.35)];
  this.goldenScene=this.add.image(0,0,'golden-scene').setOrigin(0).setDisplaySize(800,360).setDepth(14).setVisible(false);
  this.ambient=this.add.graphics().setDepth(13);
  this.items=this.physics.add.group({allowGravity:false});this.obstacles=this.physics.add.group();
  const floor=buildWorld(this);
  this.playerShadow=this.add.image(122,302,'foot-shadow').setDisplaySize(42,9).setDepth(15);

  this.beams=this.add.graphics().setDepth(16);
  this.playerGlow=this.add.image(122,276,'light-aura').setDisplaySize(88,88).setDepth(18).setVisible(false);
  this.player=this.physics.add.image(122,groundAt(122)-1,'player-atlas','run0').setDisplaySize(48,64).setOrigin(.5,1).setDepth(20);
  this.physics.world.setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT);this.player.setCollideWorldBounds(true).setGravityY(2088).setMaxVelocity(240,900);const body=this.player.body as Phaser.Physics.Arcade.Body;body.setSize(48,88);body.setOffset(24,40);
  this.physics.add.collider(this.player,floor);
  this.physics.add.overlap(this.player,this.items,(_p,o)=>this.pickup(o as Item));

  this.water=this.add.image(122,276,'water').setDisplaySize(72,72).setDepth(24).setVisible(false);
  this.fx=this.add.graphics().setDepth(25);
  this.djGlow=this.add.image(570,-160,'dj-aura').setDisplaySize(170,170).setDepth(23).setVisible(false);
  this.djSprite=this.add.image(0,-8,'performer0').setDisplaySize(170,100).setOrigin(.5,0);
  this.djMotion=this.add.graphics();
  this.performer=this.add.container(572,-115,[this.djSprite,this.djMotion]).setDepth(30).setVisible(false);
  this.feedback=this.add.graphics().setDepth(36);
  this.applyQuality(this.quality,false);
  const keyboard=(event:KeyboardEvent)=>{
   if(this.settingsMenu.open||this.pauseMenu.open){if(event.code!=='KeyP')return}
   if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(event.code)){event.preventDefault();if(this.status==='play')this.keys.add(event.code);return}
   if(event.repeat||this.settingsMenu.open)return;
   if(event.code==='KeyP'){event.preventDefault();this.togglePause();return}
   if(this.pauseMenu.open)return;
   if(event.code==='Space'||event.code==='ArrowUp'||event.code==='KeyW'){event.preventDefault();this.jump()}
  };
  document.addEventListener('keydown',keyboard);
  const keyup=(event:KeyboardEvent)=>this.keys.delete(event.code);
  const clearControls=()=>this.clearControls();
  document.addEventListener('keyup',keyup);window.addEventListener('blur',clearControls);
  for(const [id,direction] of [['left',-1],['right',1]] as const){
   const button=$(id);
   button.onpointerdown=event=>{event.preventDefault();if(this.status!=='play')return;button.setPointerCapture(event.pointerId);this.touchDirections.set(event.pointerId,direction)};
   const release=(event:PointerEvent)=>this.touchDirections.delete(event.pointerId);
   button.onpointerup=release;button.onpointercancel=release;button.onlostpointercapture=release;
  }
  $('start').onclick=()=>this.start();$('jump').onpointerdown=event=>{event.preventDefault();this.jump()};$('jump').onclick=event=>{if(event.detail===0)this.jump()};$('pause').onclick=()=>this.togglePause();
  $('god').onclick=()=>{this.run.god=!this.run.god;this.refreshHUD()};
  $('music').onclick=()=>this.audio.toggle();
  $('quality-low').onclick=()=>this.applyQuality('low');$('quality-high').onclick=()=>this.applyQuality('high');
  $('settings').onclick=()=>this.openSettings();$('welcome-settings').onclick=()=>this.openSettings();$('pause-settings').onclick=()=>this.openSettings();
  $('close-settings').onclick=()=>this.closeSettings();$('done-settings').onclick=()=>this.closeSettings();
  $('resume').onclick=()=>this.togglePause();$('restart').onclick=()=>this.start();
  this.pauseMenu.addEventListener('cancel',event=>{event.preventDefault();if(!this.settingsMenu.open)this.togglePause()});
  this.settingsMenu.addEventListener('cancel',event=>{event.preventDefault();event.stopPropagation();this.closeSettings()});
  $('fullscreen').onclick=()=>{try{if(this.scale.isFullscreen)this.scale.stopFullscreen();else this.scale.startFullscreen()}catch{$('fullscreen').textContent='⛶ Không hỗ trợ'}};
  this.scale.on('enterfullscreen',()=>{$('fullscreen').textContent='⛶ Thu nhỏ'});this.scale.on('leavefullscreen',()=>{$('fullscreen').textContent='⛶ Mở'});
  const visibility=()=>{if(document.hidden&&this.status==='play')this.togglePause()};document.addEventListener('visibilitychange',visibility);
  this.events.once('shutdown',()=>{document.removeEventListener('visibilitychange',visibility);document.removeEventListener('keydown',keyboard);document.removeEventListener('keyup',keyup);window.removeEventListener('blur',clearControls);this.audio.sync(false)});
  this.centerCamera();this.physics.pause();this.drawEffects();this.refreshHUD();
  if(import.meta.env.DEV)(window as unknown as {forest:Forest}).forest=this;
 }
 applyQuality(quality:Quality,save=true){
  this.quality=quality;
  const scale=quality==='high'?2:1;
  if(this.scale.width!==800*scale){this.scale.resize(800*scale,360*scale);this.cameras.main.setSize(800*scale,360*scale);this.cameras.main.setZoom(scale);this.centerCamera()}
  this.fog.forEach(fog=>fog.setVisible(quality==='high'));
  this.particles=this.particles.slice(-(quality==='high'?96:32));
  $('quality-low').setAttribute('aria-pressed',String(quality==='low'));$('quality-high').setAttribute('aria-pressed',String(quality==='high'));
  document.body.dataset.quality=quality;
  if(save)try{localStorage.setItem('forest-quality',quality)}catch{}
  if(this.status!=='play')this.drawEffects();
 }
 clearFeedback(){this.particles=[];this.labels.forEach(label=>label.view.destroy());this.labels=[];this.feedback?.clear();this.beams?.clear()}
 emit(x:number,y:number,color:number,count:number,speed:number,gravity=40){
  const cap=this.quality==='high'?96:32,n=this.quality==='high'?count:Math.max(2,Math.floor(count/3));
  for(let i=0;i<n;i++){
   const angle=Math.random()*Math.PI*2,life=.3+Math.random()*.4;
   this.particles.push({x,y,vx:Math.cos(angle)*speed*(.3+Math.random()*.7),vy:Math.sin(angle)*speed*.6-15,life,max:life,color,size:1+Math.random()*1.5,gravity});
  }
  this.particles=this.particles.slice(-cap);
 }
 floatText(x:number,y:number,message:string,color:number){
  if(this.labels.length>=6)this.labels.shift()?.view.destroy();
  const view=this.add.text(x,y,message,{fontFamily:'monospace',fontSize:'10px',color:'#'+color.toString(16).padStart(6,'0'),stroke:'#11152b',strokeThickness:3}).setOrigin(.5).setDepth(40).setResolution(2);
  this.labels.push({view,life:1});
 }
 updateFeedback(dt:number){
  this.landing=Math.max(0,this.landing-dt);this.pickupFlash=Math.max(0,this.pickupFlash-dt);this.entryPulse=Math.max(0,this.entryPulse-dt);
  for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt}
  this.particles=this.particles.filter(p=>p.life>0);
  for(const label of this.labels){label.life-=dt;label.view.y-=18*dt;label.view.setAlpha(Math.min(1,label.life*2));if(label.life<=0)label.view.destroy()}
  this.labels=this.labels.filter(label=>label.life>0);
  this.trailTime-=dt;
  if(this.run.boost>0&&this.trailTime<=0){this.trailTime=this.quality==='high'?.05:.14;this.emit(this.player.x-10,this.player.y-20,0xffd98b,2,16,0)}
 }
 afterPhysics(_dt:number){
  this.run.distance=Math.max(this.run.distance,Math.max(0,this.player.x-122));
  this.layers.forEach((layer,i)=>layer.tilePositionX=this.cameras.main.scrollX*forestLayers[i].speed*2);
  this.playerShadow.setPosition(this.player.x,groundAt(this.player.x)+2);this.centerCamera();
  $('chapter').querySelector('span')!.textContent=regionAt(this.player.x).name+' · '+Math.round(this.player.x/100)+' / 160';
  const grounded=(this.player.body as Phaser.Physics.Arcade.Body).blocked.down;
  if(grounded&&!this.wasGrounded){this.landing=.14;this.emit(this.player.x,groundAt(this.player.x),0x94aaa3,8,45,45)}
  this.wasGrounded=grounded;
  for(const object of this.items.getChildren() as Item[]){object.halo?.setPosition(object.x,object.y).setAlpha(.4+Math.sin(this.run.time*3+(object.phase||0))*.15)}
 }
 drawUpgradeFx(){
  const f=this.feedback,beam=this.beams;f.clear();beam.clear();const t=this.run.time,x=this.player.x,y=this.player.y-32;
  const altitude=Math.max(0,groundAt(this.player.x)-this.player.y);this.playerShadow.setAlpha(.8-altitude/300).setDisplaySize(Math.max(15,42-altitude*.15),8);
  for(const p of this.particles){f.fillStyle(p.color,Math.max(0,p.life/p.max));f.fillRect(p.x,p.y,p.size,p.size)}
  if(this.run.shield>0){
   const reveal=Math.min(1,this.djTime/1.2),px=this.performer.x,py=this.performer.y;
   const beamCount=this.quality==='high'?3:1;
   for(let i=0;i<beamCount;i++){
    const sourceX=px+(i-1)*90+Math.sin(t*.6+i)*24;
    beam.fillStyle(i%2?0x9fd4f5:0xf3d695,(.025+.035*reveal)*(i===1?1:.6));
    beam.fillTriangle(sourceX,-20,px-50-i*12,py+85,px+50+i*12,py+85);
   }
   if(this.djTime<1.2){
    beam.lineStyle(1,0xffe8a9,.5*(1-reveal));beam.lineBetween(px,0,px,py+80);
    for(let i=0;i<8;i++){const ny=(t*140+i*31)%Math.max(10,py+90);f.fillStyle(0xffe3aa,.7);f.fillRect(px-8+(i*7)%16,ny,1,4)}
   }
   // Moving specular reflection and travelling water ripple.
   f.lineStyle(1,0xebfcff,.6);f.beginPath();f.arc(x,y+6,31,Math.PI*.35+Math.sin(t)*.1,Math.PI*.8+Math.sin(t)*.1);f.strokePath();
   f.fillStyle(0xffffff,.65);f.fillEllipse(x-15+Math.sin(t*.7)*2,y-19,3,7);
   if(this.shieldFlash>0){const progress=1-this.shieldFlash/.35;f.lineStyle(1.5,0xc8f6ff,1-progress);f.strokeCircle(x,y,35+progress*14);f.lineStyle(1,0x86dbed,(1-progress)*.5);f.strokeCircle(x,y,30+progress*9)}
  }
  if(this.entryPulse>0){const p=1-this.entryPulse/.9;f.lineStyle(1.5,0xffe2a2,1-p);f.strokeEllipse(x,groundAt(x),20+p*110,4+p*18)}
  // LED pads and a small equalizer turn the hovering deck into a live stage.
  if(this.run.shield>0){const px=this.performer.x,py=this.performer.y;for(let i=0;i<5;i++){f.fillStyle(i%2?0x9be4e8:0xffdc87,.8);f.fillRect(px-7+i*3,py+68-Math.abs(Math.sin(this.djTime*7+i))*5,1,2+Math.abs(Math.sin(this.djTime*7+i))*5)}}
 }
 get pauseMenu(){return $('pause-menu') as HTMLDialogElement}
 get settingsMenu(){return $('settings-menu') as HTMLDialogElement}
 openSettings(){
  if(this.status==='play')this.togglePause();
  this.pauseMenu.close();
  if(!this.settingsMenu.open)this.settingsMenu.showModal();
 }
 closeSettings(){this.settingsMenu.close();this.syncPauseMenu()}
 syncPauseMenu(){
  if(this.status==='pause'){
   $('pause-score').textContent='✦ '+(Math.floor(this.run.distance/8)+this.run.bonus)+' ĐIỂM';
   if(!this.pauseMenu.open)this.pauseMenu.showModal();
  }else if(this.pauseMenu.open)this.pauseMenu.close();
 }
 musicLabel(){const audio=this.audio;$('music').textContent=audio.failed?'Thử lại':audio.blocked&&audio.enabled?'Chạm để phát':audio.enabled?'Bật':'Tắt';$('music').setAttribute('aria-pressed',String(audio.enabled))}
 syncAudio(){if(this.status==='pause'){this.audio.pause();return}this.audio.sync(this.status==='play'&&this.run.shield>0)}
 clearControls(){this.keys.clear();this.touchDirections.clear();this.player?.setVelocityX(0)}
 start(){
  this.clearControls();
  this.settingsMenu.close();this.pauseMenu.close();this.clearFeedback();this.audio.unlock();this.run=newRun(this.run.god);this.accumulator=0;this.djTime=0;this.shieldFlash=this.shieldBurst=0;this.landing=this.pickupFlash=this.entryPulse=this.trailTime=0;this.wasGrounded=false;
  this.items.clear(true,true);this.obstacles.clear(true,true);this.player.setPosition(122,groundAt(122)-1).setVelocity(0).setFrame('run0');
  this.performer.setPosition(572,-115).setVisible(false);this.djGlow.setVisible(false);this.fx.clear();
  this.status='play';this.centerCamera();this.populateMap();this.physics.resume();$('welcome').hidden=true;$('pause').textContent='Ⅱ Tạm dừng';this.syncAudio();this.drawEffects();this.refreshHUD();
 }
 jump(){if(this.status==='ready'||this.status==='over'){this.start();return}if(this.status==='play'&&(this.player.body as Phaser.Physics.Arcade.Body).blocked.down)this.player.setVelocityY(-720)}
 togglePause(){
  if(this.status==='play'){this.clearControls();this.status='pause';this.physics.pause();$('pause').textContent='▶ Tiếp tục'}
  else if(this.status==='pause'){this.status='play';this.accumulator=0;this.physics.resume();$('pause').textContent='Ⅱ Tạm dừng'}
  this.syncAudio();this.syncPauseMenu();this.refreshHUD();
 }
 pickup(item:Item){
  if(this.status!=='play'||!item.active)return;
  const px=item.x,py=item.y;this.pickupFlash=.22;
  if(item.kind==='light'){const points=this.run.boost>0?100:50;firefly(this.run);this.floatText(px,py,'+'+points,0xffe6a2);this.emit(px,py,0xffe6a2,8,40)}
  if(item.kind==='power'){this.run.boost=10;this.floatText(this.player.x,this.player.y-65,'✦ x2 · 10s',0xffe6a2);this.emit(this.player.x,this.player.y-28,0xffd77e,18,90)}
  if(item.kind==='dj'){
   if(this.run.shield===0){this.djTime=0;this.performer.setPosition(this.player.x+150,this.player.y-415).setVisible(true)}
   this.entryPulse=.9;this.emit(this.player.x,this.player.y-28,0x9fefff,22,100);this.floatText(this.player.x,this.player.y-68,'♫ KHIÊN DJ',0xa5eaf5);
   this.run.shield=SHIELD_MAX;this.shieldFlash=this.shieldBurst=0;this.syncAudio();
  }
  item.destroy();this.refreshHUD();
 }
 collide(item:Item){
  if(this.status!=='play'||!item.active)return;item.destroy();
  const hadShield=this.run.shield>0,lose=hit(this.run);
  if(hadShield){this.shieldFlash=.35;this.emit(this.player.x,this.player.y-28,0xb5efff,14,100);if(this.run.shield===0){this.shieldBurst=.65;this.floatText(this.player.x,this.player.y-65,'KHIÊN ĐÃ VỠ',0xc6eaff)}}
  if(this.run.shield===0){this.performer.setVisible(false);this.djGlow.setVisible(false);this.syncAudio()}
  if(lose)this.end();else this.refreshHUD();
 }
 end(){
  this.status='over';this.physics.pause();this.run.shield=0;this.run.boost=0;this.performer.setVisible(false);this.djGlow.setVisible(false);this.shieldBurst=this.shieldFlash=0;this.syncAudio();
  const score=Math.floor(this.run.distance/8)+this.run.bonus;this.best=Math.max(this.best,score);
  try{localStorage.setItem('forest-best',String(this.best))}catch{}
  $('welcome').hidden=false;$('intro-title').textContent='Một bước nghỉ chân.';$('intro-message').textContent='Bạn đạt '+score+' điểm. Rừng vẫn còn nhiều điều để khám phá!';$('start').textContent='Chơi lại →';this.drawEffects();this.refreshHUD();
 }
 centerCamera(){
  if(!this.player)return;
  const camera=this.cameras.main;camera.centerOn(this.player.x,this.player.y-65);camera.preRender();
  const {x,y}=camera.worldView;
  this.sky.setPosition(x,y);this.layers.forEach(layer=>layer.setPosition(x,y));
  this.fog.forEach((fog,i)=>fog.setPosition(x,y+(i===0?178:244)));
  this.goldenScene.setPosition(x,y);this.ambient.setPosition(x,y);
 }
 populateMap(){
  for(let x=300,i=0;x<WORLD_WIDTH-100;x+=180,i++){
   const kind=i%13===6?'dj':i%13===11?'power':'light';
   this.spawnItem(kind,x,groundAt(x)-(kind==='light'?70:30));
  }
 }
 spawnItem(kind:'light'|'dj'|'power',x=this.player.x+120,y=groundAt(x)-(kind==='light'?70:30)){
  const o=this.items.create(x,y,kind) as Item;o.kind=kind;o.baseY=o.y;o.phase=this.run.time;
  o.setDisplaySize(kind==='light'?20:34,kind==='light'?15:38).setDepth(19);
  o.halo=this.add.image(o.x,o.y,kind==='light'?'light-aura':'dj-aura').setDisplaySize(kind==='light'?34:62,kind==='light'?34:62).setTint(kind==='dj'?0x99dfff:0xffe6a2).setAlpha(.6).setDepth(17).setBlendMode(Phaser.BlendModes.ADD);
  o.once('destroy',()=>o.halo?.destroy());
  if(kind==='light')(o.body as Phaser.Physics.Arcade.Body).setSize(32,24);
  return o;
 }
 update(_time:number,delta:number){
  if(this.status!=='play')return;
  this.accumulator+=Math.min(delta/1000,.1);
  while(this.accumulator>=STEP&&this.status==='play'){
   this.simulate(STEP);this.physics.world.update(this.run.time*1000,1000/60);this.physics.world.postUpdate();this.afterPhysics(STEP);this.accumulator-=STEP;
  }
  if(this.status==='play'){this.drawEffects();this.refreshHUD()}
 }
 simulate(dt:number){
  const keyboardDirection=Number(this.keys.has('ArrowRight')||this.keys.has('KeyD'))-Number(this.keys.has('ArrowLeft')||this.keys.has('KeyA'));
  const touchDirection=[...this.touchDirections.values()].reduce((sum,value)=>sum+value,0);
  const direction=Math.sign(keyboardDirection+touchDirection);
  const speed=direction*240;
  const movingBody=this.player.body as Phaser.Physics.Arcade.Body;
  if(direction&&movingBody.blocked.down&&movingBody.velocity.y>=0){
   const nextGround=groundAt(this.player.x+direction*18),rise=this.player.y-nextGround;
   if(rise>0&&rise<=32){this.player.setY(nextGround-.5);movingBody.updateFromGameObject()}
  }
  this.player.setVelocityX(speed);if(direction)this.player.setFlipX(direction<0);
  tick(this.run,dt,0);
  if(this.run.shield>0)this.djTime+=dt;
  this.updateFeedback(dt);
  this.shieldFlash=Math.max(0,this.shieldFlash-dt);this.shieldBurst=Math.max(0,this.shieldBurst-dt);

  this.fog.forEach((fog,i)=>fog.tilePositionX=this.run.time*(i+1)*5);

  const body=this.player.body as Phaser.Physics.Arcade.Body,onGround=body.blocked.down&&body.velocity.y>=0;
  this.player.setFrame(!onGround?(body.velocity.y<0?'jump':'fall'):this.landing>0?'land':this.pickupFlash>0?'pickup':speed===0?'run0':'run'+Math.floor(this.run.time*14)%8);
  if(this.run.shield>0){
   const progress=Math.min(1,this.djTime/1.2),ease=1-(1-progress)**3;
   this.performer.setPosition(this.player.x+150,this.player.y-415+ease*197+Math.sin(this.djTime*2.5)*3*progress);
   this.animateDJ();
  }
 }
 refreshHUD(){
  $('score').textContent='✦ '+(Math.floor(this.run.distance/8)+this.run.bonus)+' ĐIỂM';$('best').textContent='KỶ LỤC '+this.best;
  $('effects').textContent=this.status==='pause'?'TẠM DỪNG':this.status==='over'?'KẾT THÚC':this.status==='ready'?'SẴN SÀNG':this.run.god?'GOD MODE':'ĐANG KHÁM PHÁ';
  $('god').textContent=this.run.god?'Bật':'Tắt';$('god').setAttribute('aria-pressed',String(this.run.god));
  ($('pause') as HTMLButtonElement).disabled=this.status==='ready'||this.status==='over';
  $('buff-card').hidden=this.run.boost<=0;$('buff-label').textContent='✦ HÀO QUANG x2 · '+Math.ceil(this.run.boost)+'s';($('buff-meter') as HTMLProgressElement).value=this.run.boost;
  $('shield-card').hidden=this.run.shield<=0;$('shield-label').textContent='♫ KHIÊN NƯỚC · '+this.run.shield+'/3';($('shield-meter') as HTMLProgressElement).value=this.run.shield;
 }
 animateDJ(){
  const f=this.djMotion,t=this.djTime;f.clear();
  for(const side of [-1,1]){
   f.fillStyle(0x96b2ca);f.fillRect(side<0?-18:12,39,7,12);
   f.fillStyle(0xacc3d7);f.fillRect(side<0?-20:13,48,8,5);
   f.fillStyle(0xefbd9b);f.fillRect(side<0?-18:11,51+Math.sin(t*7+side)*2,7,4);
   const cx=side*23,angle=t*4+side;f.fillStyle(0xb4d8e8);f.fillRect(cx+Math.cos(angle)*8,65+Math.sin(angle)*3,2,1);
  }
 }
 drawEffects(){
  const f=this.fx,a=this.ambient;f.clear();a.clear();const x=this.player.x,y=this.player.y-32,t=this.run.time;
  for(let i=0;i<(this.quality==='high'?24:9);i++){a.fillStyle(0xc9d6d5,.7);a.fillRect(((i*113-t*15)%800+800)%800,70+(i*43)%210+Math.sin(t*2+i)*6,3,3)}
  this.playerGlow.setVisible(this.run.boost>0).setPosition(x,y).setAlpha(1);
  this.goldenScene.setVisible(this.run.shield>0).setAlpha(Math.min(1,this.djTime/.6));this.water.setVisible(this.run.shield>0).setPosition(x,y);
  if(this.run.boost>0)for(let i=0;i<(this.quality==='high'?14:7);i++){
   const phase=10-this.run.boost,angle=i*Math.PI/7+phase*1.5,r=23+i%3*5,px=x+Math.cos(angle)*r,py=y+Math.sin(angle)*r;
   f.fillStyle(i%2?0xffe29a:0xfff9dc);f.fillRect(px,py,2,2);
   if(i%3===0){f.fillStyle(0xffe29a);f.fillRect(px-2,py+1,6,1);f.fillRect(px+1,py-2,1,6)}
  }
  if(this.run.shield>0){
   for(let i=0;i<(this.quality==='high'?28:10);i++){
    const px=(i*83+this.run.distance*.15)%800,py=((i*37-t*21)%290+290)%290;
    a.fillStyle(0xffe9a3);a.fillRect(px,py,2,2);if(i%5===0){a.fillStyle(0xfff2c7);a.fillRect(px-1,py+1,4,1)}
   }
   f.lineStyle(this.shieldFlash>0?3:1.5,this.shieldFlash>0?0xffffff:0x9deaff);f.strokeCircle(x,y,35);
   f.lineStyle(2,0xefffff);f.beginPath();f.arc(x,y,29,3.65,4.6);f.strokePath();
   for(let i=0;i<3-this.run.shield;i++){f.lineStyle(1,0xa7f4ff);f.beginPath();f.moveTo(x+17-i*23,y-24);f.lineTo(x+12-i*19,y-12);f.lineTo(x+18-i*19,y-7);f.lineTo(x+10-i*18,y+4);f.strokePath()}
   const px=this.performer.x,top=this.performer.y,py=top+32,pulse=1+Math.sin(this.djTime*4)*.06;
   this.djGlow.setVisible(true).setPosition(px,py).setDisplaySize(170*pulse,170*pulse);
   for(let ring=0;ring<2;ring++){f.lineStyle(ring?1:1.5,ring?0xffe49a:0xfff2b8,ring?.44:.63);f.strokeCircle(px,py,(58+ring*10)*pulse)}
   for(let i=0;i<(this.quality==='high'?18:8);i++){
    const angle=i*Math.PI/9+this.djTime*(i%2?.55:-.4),r=(63+i%3*3)*pulse,nx=px+Math.cos(angle)*r,ny=py+Math.sin(angle)*r;
    const alpha=.4+(.5+.5*Math.sin(this.djTime*5+i*2))*.6;
    f.fillStyle(0xfff6ce,alpha);f.fillRect(nx,ny,2,2);
    if(i%3===0){f.fillStyle(0xffdd80,alpha);f.fillRect(nx-2,ny+.5,6,1);f.fillRect(nx+.5,ny-2,1,6)}
   }
   // Original moving stage shadow and musical notes, aligned with the console.
   f.fillStyle(0xffe39b,.35);f.fillEllipse(px,top+85,(44+Math.sin(this.djTime*7)*2)*2,8);
   for(let i=0;i<3;i++){
    const progress=(this.djTime*.45+i/3)%1,nx=px-48+i*42+Math.sin(progress*5+i)*5,ny=top+38-progress*45;
    f.lineStyle(1,0xfff0a8,1-progress);f.lineBetween(nx,ny,nx,ny-7);f.lineBetween(nx,ny-7,nx+4,ny-6);f.fillStyle(0xfff0a8,1-progress);f.fillEllipse(nx-1,ny,4,2);
    if(i%2===0){f.lineBetween(nx+4,ny-6,nx+4,ny+1);f.fillEllipse(nx+3,ny+1,4,2)}
   }
  }else this.djGlow.setVisible(false);
  if(this.shieldBurst>0){const alpha=this.shieldBurst/.65;for(let i=0;i<16;i++){const angle=i*Math.PI/8,r=32+(1-alpha)*28;f.fillStyle(0xb7f4ff,alpha);f.fillRect(x+Math.cos(angle)*r,y+Math.sin(angle)*r,2+i%2,3)}}
  this.drawUpgradeFx();
 }

}
const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:800*RENDER_SCALE,height:360*RENDER_SCALE,backgroundColor:'#102b2b',pixelArt:false,roundPixels:true,antialias:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{x:0,y:0},fps:60,fixedStep:true,customUpdate:true}},scene:Forest});
export default game;
if(import.meta.env.PROD&&'serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(console.warn)});
