/** Small procedural sprite atlases and cached scenery. No runtime art downloads. */
type C=CanvasRenderingContext2D;
function box(c:C,x:number,y:number,w:number,h:number,color:string){c.fillStyle=color;c.fillRect(Math.round(x*2)/2,Math.round(y*2)/2,w,h)}
function poly(c:C,points:number[][],fill:string){c.fillStyle=fill;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
export const forestLayers=[
 {spacing:106,height:112,trunkWidth:6,canopyWidth:62,speed:.07},
 {spacing:154,height:172,trunkWidth:10,canopyWidth:92,speed:.14},
 {spacing:216,height:235,trunkWidth:16,canopyWidth:126,speed:.26},
 {spacing:298,height:289,trunkWidth:25,canopyWidth:168,speed:.4}
];
export function paintForest(c:C,layer:number,width:number){
 const spec=forestLayers[layer],base=300,top=base-spec.height,cx=Math.round(width*.42);
 const trunk=['#30334d','#30354e','#263748','#1a303b'][layer];
 const leaves=['#41425e','#3c4563','#304b60','#264d56'][layer];
 for(const shift of [-width,0,width]){
  const x=cx+shift,tw=spec.trunkWidth,ch=spec.height*.37;
  poly(c,[[x,top+ch*.4],[x+tw*.8,top+ch*.42],[x+tw*.9,base-30],[x+tw+4,base-7],[x+tw+7,base],[x-5,base],[x+1,base-24]],trunk);
  box(c,x,base-5,tw,5,trunk);
  // Forked branches and notched, non-rectangular leaf masses.
  poly(c,[[x+tw/2,top+ch+20],[x-spec.canopyWidth*.2,top+ch*.55],[x-spec.canopyWidth*.13,top+ch*.5],[x+tw,top+ch+5]],trunk);
  poly(c,[[x+tw/2,top+ch+10],[x+spec.canopyWidth*.42,top+ch*.45],[x+spec.canopyWidth*.35,top+ch*.4],[x,top+ch]],trunk);
  for(let j=0;j<4;j++){
   const left=x-spec.canopyWidth*.42+j*4,w=spec.canopyWidth-j*7,y=top+j*ch*.19;
   poly(c,[[left+12,y],[left+w*.45,y-3],[left+w*.52,y],[left+w-14,y+2],[left+w-14,y+8],[left+w,y+8],[left+w+3,y+ch*.26],[left+w-7,y+ch*.26],[left+w-7,y+ch*.42],[left+6,y+ch*.42],[left+6,y+ch*.34],[left-4,y+ch*.34],[left-4,y+9],[left+12,y+9]],leaves);
   for(let k=0;k<28;k++){
    const px=left+5+(k*23+j*7)%Math.max(10,Math.floor(w-7)),py=y+4+(k*13)%Math.max(6,Math.floor(ch*.32));
    box(c,px,py,2+layer%2,1,k%4===0?['#68607a','#637087','#5c7e85','#4e827e'][layer]:['#4f4c6c','#4a5576','#3c6475','#346c6b'][layer]);
   }
  }
  for(let i=0;i<17;i++){
   const y=top+ch+i*(base-top-ch)/18;
   box(c,x+2+(i*7)%Math.max(2,tw-3),y,1,3+layer,'#576074');
   if(layer>1&&i%4===0){box(c,x+tw-4,y,3,1,'#6b8c85');box(c,x+tw-2,y+1,1,5,'#42695e')}
  }
  if(layer>1){box(c,x-3,base-3,tw+5,3,'#365a52');box(c,x+2,base-4,tw-1,1,'#648477')}
 }
}
export function paintSky(c:C){
 const sky=c.createLinearGradient(0,0,0,360);sky.addColorStop(0,'#10152f');sky.addColorStop(.55,'#30314f');sky.addColorStop(1,'#545166');c.fillStyle=sky;c.fillRect(0,0,800,360);
 for(let i=0;i<70;i++)box(c,(i*137+29)%800,(i*47)%180,i%9===0?2:1,1,i%3?'#7f8aaa':'#e3d9b5');
 const moon=c.createRadialGradient(646,52,5,646,52,62);moon.addColorStop(0,'#f9e8b42b');moon.addColorStop(1,'#f9e8b400');c.fillStyle=moon;c.fillRect(584,0,124,116);
 c.fillStyle='#eadbc0';c.beginPath();c.arc(646,52,19,0,Math.PI*2);c.fill();c.fillStyle='#bab5b0';c.globalAlpha=.3;c.beginPath();c.arc(639,45,5,0,Math.PI*2);c.arc(650,58,3,0,Math.PI*2);c.fill();c.globalAlpha=1;
 poly(c,[[0,185],[76,119],[145,161],[232,93],[336,171],[420,116],[535,177],[615,121],[720,162],[800,110],[800,360],[0,360]],'#30344f');
 poly(c,[[0,219],[115,158],[211,205],[314,136],[426,214],[539,156],[656,218],[743,170],[800,193],[800,360],[0,360]],'#343c53');
}
export function paintGround(c:C){
 box(c,0,0,800,61,'#192f37');box(c,0,0,800,4,'#7e9c7a');box(c,0,4,800,5,'#345749');
 for(let i=0;i<240;i++){const x=i*37%800,y=10+i*7%49;box(c,x,y,1+i%4,1,i%4?'#33534e':'#57736b');if(i%17===0)box(c,x,y-2,2,1,'#798570')}
 for(let i=0;i<15;i++){const x=i*61%800;poly(c,[[x,1],[x+7,1],[x+5,8],[x+4,8]],'#5e805e')}
}
export function paintFerns(c:C){
 for(let i=0;i<10;i++){
  const x=i*89+6;box(c,x,9,1,11,'#6a9275');
  for(let k=0;k<4;k++){box(c,x-4-k,10+k*2,4+k,1,k%2?'#527e68':'#75967a');box(c,x+1,9+k*2,4+k,1,'#7a9e80')}
  if(i%3===0){box(c,x+16,13,2,7,'#a2adb3');box(c,x+12,11,10,3,'#729da2');box(c,x+14,9,6,2,'#98c5c6');box(c,x+14,12,2,1,'#e7e4b9')}
  if(i%4===0){box(c,x+31,14,1,6,'#6c927a');box(c,x+29,12,5,2,'#c2b6d5');box(c,x+31,11,1,4,'#f1d5aa')}
 }
}
export function paintFog(c:C){
 const fog=c.createLinearGradient(0,0,0,96);fog.addColorStop(0,'#99a4d000');fog.addColorStop(.5,'#99b9ce20');fog.addColorStop(1,'#99a4d000');c.fillStyle=fog;c.fillRect(0,0,800,96);
}
export function paintPlayer(c:C,pose:string,phase:number){
 const run=pose==='run',stride=run?Math.sin(phase):0,bob=run?Math.abs(Math.cos(phase))*1:0;
 c.save();c.translate(0,-bob);
 // Outlined limbs and wide trousers move independently rather than rocking the sprite.
 const left=18-stride*4,right=28+stride*4,feet=pose==='jump'?58:pose==='fall'?61:63;
 poly(c,[[17,39],[25,39],[left+5,feet-3],[left-2,feet-3]],'#121b2b');poly(c,[[25,39],[33,39],[right+5,feet-3],[right-2,feet-3]],'#101a27');
 box(c,left-1,feet-5,3,3,'#3c485b');box(c,right,feet-5,3,3,'#3c485b');box(c,left-3,feet-2,10,3,'#101926');box(c,right-2,feet-2,10,3,'#101926');box(c,left-2,feet,8,1,'#737986');box(c,right-1,feet,8,1,'#737986');
 // Long blond hair and mullet silhouette.
 poly(c,[[17,3],[29,2],[35,7],[35,20],[32,26],[17,24],[13,18],[13,8]],'#7a6048');
 poly(c,[[18,4],[29,3],[33,8],[32,23],[29,26],[15,23],[15,10]],'#d4b976');
 poly(c,[[17,22],[27,21],[34,25],[33,40],[18,42],[13,36],[13,26]],'#b7ab92');
 poly(c,[[16,23],[22,22],[25,27],[28,22],[33,25],[32,39],[19,40],[14,35],[14,26]],'#ece1c5');
 box(c,16,26,3,8,'#fff0ce');box(c,19,37,13,2,'#d7c6a7');box(c,29,27,1,10,'#c9b898');box(c,19,29,1,7,'#d4c4a8');
 poly(c,[[21,23],[24,29],[27,24],[26,33],[23,32]],'#bb9277');box(c,24,27,1,6,'#eed28e');box(c,23,31,3,2,'#f6ddaa');
 // Head facing the route, separate nose/eye/ear/eyebrow highlights.
 poly(c,[[20,8],[29,8],[31,13],[34,14],[33,17],[31,18],[31,21],[25,23],[19,20],[18,13]],'#dfa98a');
 box(c,21,10,9,9,'#f3c9a1');box(c,30,14,3,2,'#f7d4b2');box(c,20,14,2,4,'#d19478');box(c,27,12,4,1,'#82644f');box(c,29,13,2,2,'#263348');box(c,30,13,1,.5,'#fff6dd');box(c,29,18,3,.5,'#9f695b');
 poly(c,[[16,6],[22,3],[29,4],[32,7],[29,9],[24,8],[20,13],[17,14]],'#ecd28d');
 for(let i=0;i<7;i++)box(c,17+i*2,6+(i%3),1,4,'#fff0b3');box(c,16,15,2,7,'#e6c783');box(c,18,20,1,4,'#b6945d');
 // Left arm swings; right hand holds the reference microphone.
 const hand=pose==='pickup'?-5:stride*2;
 poly(c,[[15,25],[18,27],[16,35+hand],[12,38+hand],[10,35+hand],[12,30]],'#ece1c5');box(c,11,35+hand,4,4,'#ecc0a0');
 box(c,32,26,4,9,'#d9ceb4');box(c,34,25,4,5,'#f3c9a1');box(c,35,19,3,9,'#e9b998');box(c,34,18,5,3,'#f3c9a1');box(c,34,16,10,2,'#172b37');box(c,33,15,4,4,'#293d49');box(c,33,15,3,1,'#96aab1');
 if(pose==='land'){box(c,15,40,19,2,'#bda989')}
 c.restore();
}
export function paintEnemy(c:C,pose:string,phase:number){
 // Dark hair, silver crown and embroidered ivory dress from the reference.
 const sway=pose==='idle'?Math.sin(phase)*.5:0;c.save();c.translate(sway,0);
 poly(c,[[19,8],[34,6],[43,12],[45,44],[36,48],[16,44],[14,19]],'#141a2a');
 poly(c,[[19,10],[25,8],[36,9],[40,17],[40,39],[18,40]],'#22283a');
 poly(c,[[24,13],[35,13],[39,19],[38,29],[32,34],[25,31],[21,23]],'#d5a991');box(c,26,16,10,12,'#f2cbb1');box(c,25,20,3,1,'#523d43');box(c,33,20,3,1,'#523d43');box(c,26,21,1,1,'#1b2534');box(c,34,21,1,1,'#1b2534');box(c,30,27,4,1,'#ac6d75');box(c,31,24,1,1,'#d4a38c');
 poly(c,[[20,13],[29,8],[35,11],[41,16],[38,20],[33,14],[25,15],[21,22]],'#171c29');
 box(c,19,9,21,2,'#bbcbd1');for(let i=0;i<6;i++){box(c,20+i*3,7-i%2,2,3,'#f0ede0');box(c,20+i*3,6-i%2,1,1,'#fff3bd')}
 box(c,38,26,2,3,'#e9d99e');box(c,25,32,10,4,'#deb49c');
 poly(c,[[23,34],[37,34],[41,41],[39,49],[46,64],[49,67],[12,67],[17,60],[21,48],[19,41]],'#b0b9c6');
 poly(c,[[24,35],[36,35],[39,42],[35,48],[42,63],[45,66],[17,66],[22,51],[23,44],[21,40]],'#e5e4de');
 poly(c,[[28,39],[31,36],[34,40],[32,47],[35,59],[30,64],[25,62],[28,49]],'#f8f0da');
 for(let i=0;i<28;i++){const x=22+(i*7)%17,y=39+(i*11)%25;box(c,x,y,1,1,i%3?'#9aafc3':'#fff8dc')}
 box(c,24,36,12,1,'#c9d5dd');box(c,27,37,6,1,'#f5e9b9');
 const open=pose==='release'?6:pose==='hold'?2:0;
 poly(c,[[20,35],[23,38],[21-open,48],[18-open,50],[16-open,47],[18,40]],'#e1b298');poly(c,[[38,35],[41,38],[43+open,46],[40+open,48],[37,42]],'#ecc3a7');
 if(pose==='hold'){box(c,17,48,7,3,'#f3cfb3');box(c,35,47,8,3,'#f3cfb3')}
 c.restore();
}
export function paintShadow(c:C){const glow=c.createRadialGradient(32,6,1,32,6,32);glow.addColorStop(0,'#02081788');glow.addColorStop(1,'#02081700');c.fillStyle=glow;c.save();c.translate(0,3);c.scale(1,.2);c.fillRect(0,-25,64,80);c.restore()}
