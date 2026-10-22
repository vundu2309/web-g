import Phaser from 'phaser';
import './style.css';
import {initFirebase} from './firebase';
import {buildWorld,groundAt,regionAt,waters,waterAt,resourceNodes,WORLD_WIDTH,WORLD_HEIGHT} from './world';
import {gear,slots,fishSpecies,newSave,decodeSave,equip,rollFish,storeFish,craft,recipes,SAVE_KEY,type Save,type Slot,type BuildingKind} from './camping';
import {paintCamper,paintBuilding} from './camp-art';
const $=(id:string)=>document.getElementById(id)!;
type Quality='low'|'high';
const qualityStart=():Quality=>{try{const q=localStorage.getItem('forest-quality');if(q==='low'||q==='high')return q}catch{}return matchMedia('(pointer:coarse)').matches?'low':'high'};
const START_QUALITY=qualityStart(),SCALE=START_QUALITY==='high'?2:1,STEP=1/60;
type Fishing={phase:'waiting'|'bite';remaining:number;waterId:string};
class Forest extends Phaser.Scene{
 player!:Phaser.Physics.Arcade.Image;fx!:Phaser.GameObjects.Graphics;preview!:Phaser.GameObjects.Image;fishLabel!:Phaser.GameObjects.Text;
 state:Save=newSave();status:'ready'|'play'|'pause'='ready';quality:Quality=START_QUALITY;
 keys=new Set<string>();touchDirections=new Map<number,number>();fishing:Fishing|null=null;selected:BuildingKind|null=null;
 clock=0;accumulator=0;saveTime=0;lastHud='';nodes=new Map<string,Phaser.GameObjects.Image>();structures:Phaser.GameObjects.Image[]=[];storageWarning=false;toastTimer=0;
 constructor(){super('forest')}
 create(){
  try{this.state=decodeSave(localStorage.getItem(SAVE_KEY))}catch{}
  this.cameras.main.setBackgroundColor('#afc1b0').setZoom(SCALE).setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT);
  const floor=buildWorld(this);
  for(const kind of Object.keys(recipes) as BuildingKind[]){const t=this.textures.createCanvas('build-'+kind,220,148)!;t.context.scale(2,2);paintBuilding(t.context,kind);t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST)}
  for(const kind of ['wood','stone'] as const){const t=this.textures.createCanvas('resource-'+kind,64,48)!,c=t.context;c.scale(2,2);
   if(kind==='wood'){c.fillStyle='#6d533a';c.fillRect(2,13,28,8);c.fillStyle='#b89b68';c.fillRect(2,13,5,8);c.fillStyle='#967144';c.fillRect(7,8,24,6);c.fillStyle='#ddc292';c.fillRect(7,8,4,6);c.fillStyle='#617d51';c.fillRect(17,6,9,3)}else{c.fillStyle='#637b77';c.beginPath();c.moveTo(1,22);c.lineTo(5,7);c.lineTo(19,3);c.lineTo(30,15);c.lineTo(27,23);c.closePath();c.fill();c.fillStyle='#a3b1a0';c.fillRect(7,7,12,3);c.fillStyle='#435d58';c.fillRect(20,15,8,6)}t.refresh();t.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  for(const n of resourceNodes){const image=this.add.image(n.x,groundAt(n.x),'resource-'+n.kind).setOrigin(.5,1).setDisplaySize(32,24).setDepth(12);this.nodes.set(n.id,image)}
  this.player=this.physics.add.image(this.state.x,groundAt(this.state.x)-1,'__WHITE').setOrigin(.5,1).setDepth(20);
  this.refreshAppearance();this.physics.world.setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT);this.player.setCollideWorldBounds(true).setGravityY(2088).setMaxVelocity(240,900);
  const body=this.player.body as Phaser.Physics.Arcade.Body;body.setSize(48,88);body.setOffset(24,40);this.physics.add.collider(this.player,floor);
  this.fx=this.add.graphics().setDepth(24);this.preview=this.add.image(0,0,'build-tent').setOrigin(.5,1).setDisplaySize(110,74).setDepth(22).setVisible(false);
  this.fishLabel=this.add.text(0,0,'',{fontFamily:'monospace',fontSize:'11px',color:'#fff3bf',backgroundColor:'#254b42e8',padding:{x:6,y:4}}).setOrigin(.5,1).setDepth(25).setVisible(false);
  this.restoreWorld();this.applyQuality(this.quality,false);this.centerCamera();this.bindControls();this.physics.pause();this.refreshHUD();
  if(import.meta.env.DEV)(window as unknown as {forest:Forest}).forest=this;
 }
 refreshAppearance(){
  const key='camper-'+Object.values(this.state.equipped).join('-');
  if(!this.textures.exists(key)){const texture=this.textures.createCanvas(key,96*8,128)!,c=texture.context;c.scale(2,2);for(let i=0;i<8;i++){c.save();c.translate(i*48,0);paintCamper(c,this.state,i);c.restore()}texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);for(let i=0;i<8;i++)texture.add('run'+i,0,i*96,0,96,128)}
  this.player.setTexture(key,'run0').setDisplaySize(48,64);
 }
 restoreWorld(){for(const n of resourceNodes)this.nodes.get(n.id)?.setVisible(!this.state.harvested.includes(n.id));this.structures.forEach(s=>s.destroy());this.structures=this.state.buildings.map(b=>this.add.image(b.x,groundAt(b.x)+1,'build-'+b.kind).setOrigin(.5,1).setDisplaySize(110,74).setDepth(16))}
 get pauseMenu(){return $('pause-menu') as HTMLDialogElement}
 get settingsMenu(){return $('settings-menu') as HTMLDialogElement}
 get inventoryMenu(){return $('inventory-menu') as HTMLDialogElement}
 get buildMenu(){return $('build-menu') as HTMLDialogElement}
 get modalOpen(){return this.pauseMenu.open||this.settingsMenu.open||this.inventoryMenu.open||this.buildMenu.open}
 bindControls(){
  const keyboard=(event:KeyboardEvent)=>{
   if(this.modalOpen){if(event.code==='KeyP'&&this.pauseMenu.open){event.preventDefault();this.togglePause()}return}
   if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(event.code)){event.preventDefault();if(this.status==='play')this.keys.add(event.code);this.syncControlButtons();return}
   if(event.repeat)return;
   const actions:Record<string,()=>void>={Space:()=>this.jump(),ArrowUp:()=>this.jump(),KeyW:()=>this.jump(),KeyP:()=>this.togglePause(),KeyE:()=>this.interact(),KeyI:()=>this.openPanel('inventory'),KeyB:()=>this.openPanel('build'),Escape:()=>this.cancelAction()};
   if(actions[event.code]){event.preventDefault();actions[event.code]()}
  };
  const keyup=(event:KeyboardEvent)=>{this.keys.delete(event.code);this.syncControlButtons()};
  const blur=()=>{this.clearControls();this.persist()};const visibility=()=>{if(document.hidden&&this.status==='play')this.togglePause()};
  document.addEventListener('keydown',keyboard);document.addEventListener('keyup',keyup);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
  for(const [id,direction] of [['left',-1],['right',1]] as const){const button=$(id);button.onpointerdown=e=>{e.preventDefault();if(this.status!=='play'||this.modalOpen)return;button.setPointerCapture(e.pointerId);this.touchDirections.set(e.pointerId,direction);this.syncControlButtons()};const release=(e:PointerEvent)=>{this.touchDirections.delete(e.pointerId);this.syncControlButtons()};button.onpointerup=release;button.onpointercancel=release;button.onlostpointercapture=release;}
  $('jump').onpointerdown=e=>{e.preventDefault();this.jump()};$('jump').onclick=e=>{if(e.detail===0)this.jump()};
  $('start').onclick=()=>this.start();$('pause').onclick=()=>this.togglePause();$('resume').onclick=()=>this.togglePause();$('restart').onclick=()=>{this.closeAll();this.cancelAction();this.player.setPosition(120,groundAt(120)-1).setVelocity(0);this.resume();this.persist()};
  for(const id of ['settings','welcome-settings','pause-settings'])$(id).onclick=()=>this.openPanel('settings');
  $('inventory').onclick=()=>this.openPanel('inventory');$('build').onclick=()=>this.openPanel('build');$('action').onclick=()=>this.interact();$('cancel-action').onclick=()=>this.cancelAction();
  for(const panel of ['settings','inventory','build'] as const){for(const id of ['close-'+panel,'done-'+panel])$(id).onclick=()=>this.closePanel(panel);($(panel+'-menu') as HTMLDialogElement).addEventListener('cancel',e=>{e.preventDefault();this.closePanel(panel)})}
  this.pauseMenu.addEventListener('cancel',e=>{e.preventDefault();this.togglePause()});
  $('quality-low').onclick=()=>this.applyQuality('low');$('quality-high').onclick=()=>this.applyQuality('high');
  $('fullscreen').onclick=()=>{if(this.scale.isFullscreen)this.scale.stopFullscreen();else this.scale.startFullscreen()};
  this.inventoryMenu.addEventListener('click',e=>{const button=(e.target as Element).closest<HTMLButtonElement>('[data-gear]');if(button&&equip(this.state,button.dataset.gear!)){this.refreshAppearance();this.renderInventory();this.persist()}});
  this.buildMenu.addEventListener('click',e=>{const button=(e.target as Element).closest<HTMLButtonElement>('[data-build]');if(button){this.selected=button.dataset.build as BuildingKind;this.buildMenu.close();this.resume();this.toast('Chọn vị trí, nhấn E hoặc nút Đặt. Esc để hủy.');this.refreshHUD()}});
  this.events.once('shutdown',()=>{document.removeEventListener('keydown',keyboard);document.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);this.persist()});
 }
 syncControlButtons(){for(const [id,codes] of [['left',['ArrowLeft','KeyA']],['right',['ArrowRight','KeyD']]] as const)$(id).classList.toggle('held',codes.some(c=>this.keys.has(c))||[...this.touchDirections.values()].includes(id==='left'?-1:1))}
 clearControls(){this.keys.clear();this.touchDirections.clear();this.player?.setVelocityX(0);this.syncControlButtons()}
 closeAll(){for(const id of ['pause','settings','inventory','build'])($(id+'-menu') as HTMLDialogElement).close()}
 pause(){if(this.status==='play'){this.status='pause';this.clearControls();this.physics.pause();this.persist()}}
 resume(){if(this.status==='ready')return;this.status='play';this.accumulator=0;this.physics.resume();this.pauseMenu.close();this.refreshHUD()}
 start(){this.closeAll();this.status='play';this.physics.resume();$('welcome').hidden=true;void initFirebase().catch(()=>{});this.toast('I: kho đồ · B: dựng trại · E: thu thập hoặc câu cá');this.refreshHUD()}
 togglePause(){if(this.status==='ready')return;if(this.status==='play'){this.pause();this.pauseMenu.showModal()}else if(this.pauseMenu.open)this.resume();this.refreshHUD()}
 openPanel(panel:'settings'|'inventory'|'build'){
  if(this.selected||this.fishing)this.cancelAction();this.pause();this.closeAll();if(panel==='inventory')this.renderInventory();if(panel==='build')this.renderRecipes();($(panel+'-menu') as HTMLDialogElement).showModal();this.refreshHUD();
 }
 closePanel(panel:string){($(panel+'-menu') as HTMLDialogElement).close();if(this.status!=='ready'){this.pauseMenu.showModal();this.refreshHUD()}}
 jump(){if(this.status==='ready'){this.start();return}if(this.status==='play'&&!this.modalOpen&&(this.player.body as Phaser.Physics.Arcade.Body).blocked.down){this.cancelAction();this.player.setVelocityY(-720)}}
 applyQuality(q:Quality,save=true){this.quality=q;const s=q==='high'?2:1;this.scale.resize(800*s,360*s);this.cameras.main.setSize(800*s,360*s).setZoom(s);this.centerCamera();$('quality-low').setAttribute('aria-pressed',String(q==='low'));$('quality-high').setAttribute('aria-pressed',String(q==='high'));document.body.dataset.quality=q;if(save)try{localStorage.setItem('forest-quality',q)}catch{}}
 centerCamera(){if(this.player){this.cameras.main.centerOn(this.player.x,this.player.y-65);this.cameras.main.preRender()}}
 persist(){if(!this.player)return;this.state.x=Math.round(this.player.x);try{localStorage.setItem(SAVE_KEY,JSON.stringify(this.state));this.storageWarning=false}catch{if(!this.storageWarning){this.storageWarning=true;this.toast('Không lưu được trên thiết bị này. Tiến trình hiện chỉ giữ trong lượt chơi.')}}}
 toast(message:string){$('toast').textContent=message;$('toast').hidden=false;window.clearTimeout(this.toastTimer);this.toastTimer=window.setTimeout(()=>$('toast').hidden=true,4200)}
 nearbyNode(){return resourceNodes.find(n=>!this.state.harvested.includes(n.id)&&Math.abs(n.x-this.player.x)<75)}
 placementX(){return Math.round((this.player.x+(this.player.flipX?-80:80))/32)*32}
 placementError(x:number){if(x<65||x>WORLD_WIDTH-65)return 'Quá gần biên bản đồ';if(waterAt(x)||waterAt(x-55)||waterAt(x+55))return 'Chọn đất khô, cách xa bờ nước';if(groundAt(x-52)!==groundAt(x+52))return 'Cần một khoảng đất bằng';if(this.state.buildings.some(b=>Math.abs(b.x-x)<112))return 'Quá gần công trình khác';if(resourceNodes.some(n=>!this.state.harvested.includes(n.id)&&Math.abs(n.x-x)<58))return 'Thu thập vật liệu ở đây trước';return ''}
 interact(){
  if(this.status!=='play'||this.modalOpen)return;
  const grounded=(this.player.body as Phaser.Physics.Arcade.Body).blocked.down;
  if(!grounded){this.toast('Đứng vững trên mặt đất trước nhé.');return}
  if(this.selected){const x=this.placementX(),error=this.placementError(x);if(error){this.toast(error);return}if(!craft(this.state,this.selected,x)){this.toast('Chưa đủ gỗ/đá hoặc trại đã đủ 80 công trình.');return}const name=recipes[this.selected].name;this.selected=null;this.preview.setVisible(false);this.restoreWorld();this.persist();this.toast('Đã dựng '+name.toLowerCase()+'.');this.refreshHUD();return}
  if(this.fishing){if(this.fishing.phase==='waiting'){this.toast('Phao chưa chìm. Chờ cá cắn câu!');return}const lake=waters.find(w=>w.id===this.fishing!.waterId)!;const caught=rollFish(lake.habitat);storeFish(this.state,caught.species.id,caught.length);this.fishing=null;this.persist();this.toast('Câu được '+caught.species.name+' · '+caught.length+' cm · '+caught.species.rarity+'. Đã cho vào kho đồ.');this.refreshHUD();return}
  const node=this.nearbyNode();if(node){this.state.harvested.push(node.id);this.state[node.kind]+=node.kind==='wood'?5:4;this.nodes.get(node.id)?.setVisible(false);this.persist();this.toast(node.kind==='wood'?'+5 gỗ khô':'+4 đá');this.refreshHUD();return}
  const lake=waterAt(this.player.x);if(lake){this.clearControls();this.fishing={phase:'waiting',remaining:2.5+Math.random()*2.5,waterId:lake.id};this.toast('Đã thả câu tại '+lake.name+'. Nhấn E khi phao chìm!');this.refreshHUD();return}
  this.toast('Đến gần gỗ/đá để thu thập, hoặc tới Ao Sen phía bên phải để câu cá.');
 }
 cancelAction(){this.fishing=null;this.selected=null;this.preview?.setVisible(false);this.fishLabel?.setVisible(false);this.refreshHUD()}
 renderInventory(){
  const source=this.textures.get(this.player.texture.key).getSourceImage() as HTMLCanvasElement,canvas=document.createElement('canvas');canvas.width=96;canvas.height=128;canvas.getContext('2d')!.drawImage(source,0,0,96,128,0,0,96,128);($('camper-preview') as HTMLImageElement).src=canvas.toDataURL();
  $('inventory-summary').textContent=this.state.wood+' gỗ · '+this.state.stone+' đá · Cần câu & bộ dụng cụ cắm trại';
  $('gear-list').innerHTML=(Object.keys(slots) as Slot[]).map(slot=>'<section class="gear-slot"><h3>'+slots[slot]+'</h3><div class="gear-options">'+gear.filter(g=>g.slot===slot).map(g=>'<button data-gear="'+g.id+'" aria-pressed="'+(this.state.equipped[slot]===g.id)+'"><i style="--swatch:'+g.color+'"></i><span>'+g.name+'</span><small>'+(this.state.equipped[slot]===g.id?'Đang mặc':'Trang bị')+'</small></button>').join('')+'</div></section>').join('');
  $('fish-list').innerHTML=fishSpecies.map(f=>{const own=this.state.fish[f.id];return '<div class="fish-entry '+(own?'caught':'')+'"><span class="fish-icon" style="--fish:'+f.color+'">◀●</span><div><strong>'+(own?f.name:'???')+'</strong><small>'+f.rarity+(own?' · Lớn nhất '+own.largest+' cm':' · Chưa khám phá')+'</small></div><b>×'+(own?.count??0)+'</b></div>'}).join('');
  const counts=Object.values(this.state.fish).reduce((n,f)=>n+(f?.count??0),0);$('fish-summary').textContent=counts+' cá · '+Object.keys(this.state.fish).length+'/'+fishSpecies.length+' loài';
 }
 renderRecipes(){$('build-resources').textContent='Bạn có '+this.state.wood+' gỗ · '+this.state.stone+' đá';$('recipe-list').innerHTML=(Object.keys(recipes) as BuildingKind[]).map(kind=>{const r=recipes[kind],enough=this.state.wood>=r.wood&&this.state.stone>=r.stone;const texture=this.textures.get('build-'+kind).getSourceImage() as HTMLCanvasElement;return '<button class="recipe" data-build="'+kind+'" '+(enough?'':'disabled')+'><img src="'+texture.toDataURL()+'" alt=""><div><strong>'+r.name+'</strong><p>'+r.description+'</p><small>'+r.wood+' gỗ · '+r.stone+' đá</small></div><span>'+(enough?'Đặt →':'Thiếu')+'</span></button>'}).join('')}
 refreshHUD(){
  if(!this.player)return;
  const total=Object.values(this.state.fish).reduce((n,f)=>n+(f?.count??0),0);$('score').textContent='GỖ '+this.state.wood+' · ĐÁ '+this.state.stone;$('effects').textContent=this.status==='pause'?'TẠM DỪNG':total+' CÁ · '+this.state.buildings.length+' CÔNG TRÌNH';
  $('chapter').querySelector('span')!.textContent=waterAt(this.player.x)?.name??regionAt(this.player.x).name;
  ($('pause') as HTMLButtonElement).disabled=this.status==='ready';$('pause').innerHTML='<span aria-hidden="true">'+(this.status==='pause'?'▶':'Ⅱ')+'</span>';$('pause').setAttribute('aria-label',this.status==='pause'?'Tiếp tục game':'Tạm dừng game');
  const node=this.nearbyNode(),lake=waterAt(this.player.x);$('action-label').textContent=this.selected?'ĐẶT '+recipes[this.selected].name.toUpperCase():this.fishing?.phase==='bite'?'GIẬT CẦN!':this.fishing?'CHỜ CÁ…':node?node.kind==='wood'?'NHẶT GỖ':'NHẶT ĐÁ':lake?'CÂU CÁ':'TƯƠNG TÁC';
  $('action').classList.toggle('bite',this.fishing?.phase==='bite');$('cancel-action').hidden=!this.selected&&!this.fishing;
 }
 update(_time:number,delta:number){if(this.status!=='play')return;this.accumulator+=Math.min(delta/1000,.1);while(this.accumulator>=STEP&&this.status==='play'){this.simulate(STEP);this.physics.world.update(this.clock*1000,1000/60);this.physics.world.postUpdate();this.centerCamera();this.accumulator-=STEP}this.drawWorldEffects();this.refreshHUD()}
 simulate(dt:number){
  this.clock+=dt;this.saveTime+=dt;if(this.saveTime>=10){this.saveTime=0;this.persist()}
  const direction=Math.sign(Number(this.keys.has('ArrowRight')||this.keys.has('KeyD'))-Number(this.keys.has('ArrowLeft')||this.keys.has('KeyA'))+[...this.touchDirections.values()].reduce((a,b)=>a+b,0));
  if(direction&&this.fishing){this.fishing=null;this.toast('Đã thu cần để di chuyển.')}
  const body=this.player.body as Phaser.Physics.Arcade.Body;
  if(direction&&body.blocked.down&&body.velocity.y>=0){const next=groundAt(this.player.x+direction*18),rise=this.player.y-next;if(rise>0&&rise<=32){this.player.setY(next-.5);body.updateFromGameObject()}}
  this.player.setVelocityX(this.fishing?0:direction*220);if(direction)this.player.setFlipX(direction<0);this.player.setFrame('run'+(direction&&body.blocked.down?Math.floor(this.clock*12)%8:0));
  if(this.fishing){this.fishing.remaining-=dt;if(this.fishing.remaining<=0){if(this.fishing.phase==='waiting'){this.fishing.phase='bite';this.fishing.remaining=2;this.toast('Cá cắn câu! Nhấn E / GIẬT CẦN!')}else{this.fishing=null;this.toast('Cá đã thoát. Thử thả câu lần nữa nhé.')}}}
 }
 drawWorldEffects(){const f=this.fx;f.clear();this.preview.setVisible(Boolean(this.selected));if(this.selected){const x=this.placementX(),error=this.placementError(x);this.preview.setTexture('build-'+this.selected).setPosition(x,groundAt(x)+1).setAlpha(.6).setTint(error?0xffa69b:0xc4f3b3);f.lineStyle(1,error?0xe59e82:0xc9e4a2,.9);f.strokeEllipse(x,groundAt(x),115,8)}
  this.fishLabel.setVisible(Boolean(this.fishing));if(this.fishing){const lake=waters.find(w=>w.id===this.fishing!.waterId)!,x=Phaser.Math.Clamp(this.player.x+55,lake.x+12,lake.x+lake.width-12),y=groundAt(lake.x)+12,px=this.player.x+13,py=this.player.y-30;f.lineStyle(2,0x927650);f.lineBetween(px,py,px+30,py-40);f.lineStyle(.7,0xeff4d9,.8);f.lineBetween(px+30,py-40,x,y);f.fillStyle(this.fishing.phase==='bite'?0xdd8b58:0xe1d6a0);f.fillCircle(x,y+Math.sin(this.clock*5)*2,this.fishing.phase==='bite'?3:2);this.fishLabel.setPosition(this.player.x,this.player.y-78).setText(this.fishing.phase==='bite'?'! GIẬT CẦN [E]':'Đang chờ cá…');}
  const view=this.cameras.main.worldView;for(const lake of waters)if(lake.x<view.right&&lake.x+lake.width>view.x){f.lineStyle(1,0xd5e3c1,.5);for(let i=0;i<(this.quality==='high'?8:3);i++){const x=lake.x+30+(i*91+this.clock*5)%(lake.width-50),y=groundAt(lake.x)+14+(i%4)*10;f.strokeEllipse(x,y,12+Math.sin(this.clock*2+i)*4,2)}}
  for(const b of this.state.buildings)if(b.kind==='fire'&&Math.abs(b.x-this.player.x)<650){const y=groundAt(b.x)-15;f.fillStyle(0xffc66d,.07);f.fillCircle(b.x,y,34+Math.sin(this.clock*4)*3);f.fillStyle(0xffdda0,.9);for(let i=0;i<3;i++)f.fillRect(b.x-7+i*7,y-((this.clock*20+i*9)%25),1,2)}
 }
}
const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:800*SCALE,height:360*SCALE,backgroundColor:'#afc1b0',roundPixels:true,antialias:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{x:0,y:0},fps:60,fixedStep:true,customUpdate:true}},scene:Forest});
export default game;
if(import.meta.env.PROD&&'serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{})});
