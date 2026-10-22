import Phaser from 'phaser';
import {paintForest,paintFerns} from './night-art';
export const WORLD_WIDTH=16000,WORLD_HEIGHT=900,SECTION=256;
export const regions=[{x:0,name:'THUNG LŨNG ĐOM ĐÓM'},{x:3200,name:'RỪNG THÔNG SƯƠNG'},{x:6400,name:'THÁC NGÂN HÀ'},{x:9600,name:'ĐÈO TRĂNG'},{x:12800,name:'PHẾ TÍCH TRÊN MÂY'}];
export function groundAt(x:number){
 const column=Math.floor(Math.max(0,Math.min(WORLD_WIDTH-1,x))/SECTION);
 return 650-Math.round((Math.sin(column*.19)*65+column*3.1)/16)*16;
}
export function regionAt(x:number){return regions[Math.min(4,Math.floor(Math.max(0,x)/3200))]}
export function buildWorld(scene:Phaser.Scene){
 const platforms=scene.physics.add.staticGroup();
 for(let x=0;x<WORLD_WIDTH;x+=SECTION){const y=groundAt(x);const platform=scene.add.rectangle(x,y,SECTION,WORLD_HEIGHT-y,0,0).setOrigin(0);platforms.add(platform);}
 // Cache narrow chunks once; Phaser culls their draw calls outside the viewport.
 for(let start=0;start<WORLD_WIDTH;start+=512){
  const width=Math.min(512,WORLD_WIDTH-start),key='land-'+start;
  const texture=scene.textures.createCanvas(key,width,WORLD_HEIGHT)!,c=texture.context;
  for(let local=0;local<width;local+=SECTION){
   const x=start+local,y=groundAt(x),zone=Math.floor(x/3200);
   c.fillStyle=['#213934','#253c41','#293e4c','#373c50','#323b49'][zone];c.fillRect(local,y,SECTION,WORLD_HEIGHT-y);
   c.fillStyle='#7e9b79';c.fillRect(local,y,SECTION,4);c.fillStyle='#476951';c.fillRect(local,y+4,SECTION,10);
   for(let i=0;i<160;i++){const px=local+(i*47)%SECTION,py=y+16+(i*31)%Math.max(1,WORLD_HEIGHT-y-20);c.fillStyle=i%7?'#486056':'#6c7870';c.fillRect(px,py,2+i%5,1+i%2);}
   const tx=local+55+(Math.sin(x*.03)*.5+.5)*100,scale=.63+(Math.sin(x*.071)*.5+.5)*.48;
   c.save();c.translate(tx,groundAt(start+tx));
   if(zone===1||zone===3){
    const height=160+scale*65;c.fillStyle='#263c42';c.fillRect(-4,-height,8,height);
    for(let branch=0;branch<5;branch++){const top=-height+branch*height*.14,w=22+branch*10;c.fillStyle=branch%2?'#355654':'#41665e';c.beginPath();c.moveTo(0,top-20);c.lineTo(-w,top+55);c.lineTo(w,top+55);c.closePath();c.fill();c.fillStyle='#688d78';c.fillRect(-w+8,top+53,w,2);}
   }else{c.scale(scale,scale);c.translate(-108,-300);paintForest(c,2,216);}
   c.restore();
   c.save();c.translate(local,y-20);paintFerns(c);c.restore();
   // Rounded boulders, moss, mushrooms and clumps of grass are scenery only.
   for(let i=0;i<8;i++){const px=local+7+(i*83+start)%242;c.fillStyle='#8eaa80';c.fillRect(px,y-5,1,5);c.fillRect(px+2,y-8,1,8);if(i%3===0){c.fillStyle='#b2c5ba';c.fillRect(px+12,y-8,2,8);c.fillStyle='#76b7b8';c.fillRect(px+8,y-10,11,3);}}
   if((x/SECTION)%5===2){c.fillStyle='#465e62';c.beginPath();c.ellipse(local+180,y-5,24,13,0,Math.PI,Math.PI*2);c.fill();c.fillStyle='#809b83';c.fillRect(local+164,y-16,25,3);}
  }
  texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);scene.add.image(start,0,key).setOrigin(0).setDepth(8);
 }
 const scenery=scene.add.graphics().setDepth(10);
 // Cascading water and a reflecting pool, behind the walkable ridge.
 const wx=7350,wy=groundAt(wx);
 scenery.fillStyle(0x40535d);scenery.fillPoints([{x:wx-60,y:wy},{x:wx-53,y:wy-155},{x:wx-30,y:wy-218},{x:wx+10,y:wy-235},{x:wx+76,y:wy-223},{x:wx+100,y:wy-140},{x:wx+112,y:wy}],true);
 scenery.lineStyle(2,0x6b8584,.5);for(let i=0;i<6;i++){const rx=wx-45+i*26;scenery.lineBetween(rx,wy-30,rx+7,wy-160-(i%2)*35)}
 scenery.fillStyle(0x749181);scenery.fillRect(wx-35,wy-226,110,6);scenery.fillStyle(0xa1d6d6,.55);scenery.fillEllipse(wx+23,wy-219,52,8);
 scenery.fillStyle(0x8ac9d6,.38);scenery.fillRect(wx,wy-210,46,205);scenery.fillStyle(0xd3f2ec,.55);
 for(let i=0;i<8;i++)scenery.fillRect(wx+4+i*5,wy-200+(i%3)*8,2,180);
 scenery.fillStyle(0x89cfdd,.45);scenery.fillEllipse(wx+23,wy-5,150,15);
 // Campsites, trail markers and ancient stone arches provide distinct landmarks.
 for(const x of [1700,4800,10500,14500]){const y=groundAt(x);scenery.fillStyle(0x8f8470);scenery.fillRect(x,y-39,4,39);scenery.fillStyle(0xc5b88d);scenery.fillRect(x-12,y-40,43,12);scenery.fillStyle(0x627c70);scenery.fillRect(x+45,y-18,40,18);scenery.fillStyle(0xd6b98b);scenery.fillTriangle(x+40,y-18,x+65,y-46,x+90,y-18);}
 const ax=13950,ay=groundAt(ax);scenery.fillStyle(0x73838a);scenery.fillRect(ax,ay-100,22,100);scenery.fillRect(ax+95,ay-100,22,100);scenery.fillRect(ax-6,ay-115,130,22);scenery.lineStyle(2,0xc2bda0,.6);scenery.strokeRect(ax+5,ay-90,12,60);scenery.strokeRect(ax+100,ay-90,12,60);
 for(const r of regions)scene.add.text(r.x+260,groundAt(r.x+260)-100,r.name,{fontFamily:'monospace',fontSize:'11px',color:'#dfdcc0',backgroundColor:'#142634aa',padding:{x:9,y:6}}).setDepth(12);
 return platforms;
}
