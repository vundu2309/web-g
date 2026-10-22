let g,djAge=0,mode="pause",y=0,t=0;
function rect(x,y,w,h,col){g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),w,h)}
function detail(x,y,w,h,color){g.fillStyle=color;g.fillRect(Math.round(x*2)/2,Math.round(y*2)/2,Math.max(.5,Math.round(w*2)/2),Math.max(.5,Math.round(h*2)/2))}
function drawSinger(py){
  // A hand-drawn half-pixel sprite: blond mullet, ivory shirt, wide black trousers.
  const x=106, top=py-12;
  const colors={h:'#e6ce85',H:'#fff0b1',b:'#b59a59',s:'#edbf93',S:'#ffdab2',d:'#bf8c70',e:'#34302e',i:'#f2e9d0',I:'#fff8e7',v:'#d6c9ad',n:'#282b36',N:'#414350',k:'#171d28',m:'#27323a',M:'#65757b',j:'#b7a4ba'};
  const rows=[
    '          bbbbbbb       ',
    '        bbHHHHHHhbb     ',
    '       bHHHHHhhhHhhb    ',
    '       hHHHhhSSShhhhb   ',
    '       hHhhSSSSSShhhb   ',
    '       hhhSSSSSSShhhb   ',
    '        hSSSSSeSShhhb   ',
    '        hSSSSSSSShhhb   ',
    '         SSSSSSSdhhhb   ',
    '         SSSSSSddhhhh   ',
    '        hhdSSSdhhhhhb   ',
    '        hhhSSSShhhhhb   ',
    '        hhijSSjIhhhh    ',
    '       IIIijSjIIIIi     ',
    '      IIIIivSvIIIIii    ',
    '     IIIIIivjvIIIIIii   ',
    '    IIIIIIivSvIIIIIIii  ',
    '   IIIIIIIivvvIIIIIIiii ',
    '  IIII IIIIivIIIIII iii ',
    ' SSSi  IIIIIvIIIIII  SS ',
    ' SSS   IIIIIIIIIIII  SS ',
    ' SSS   IIIIIIIIIIII SSS ',
    ' SSS   IIIIIIIIIIIi SSS ',
    ' SSS   IIIIIIIIIIii SS  ',
    '  SS   iIIIIIIIIiii     ',
    '       iiIIIIIIIiii     ',
    '       iiiIIIIIIiii     ',
    '       nnnnnnnnnnnn     ',
    '       nNNnnnnnNNnn     ',
    '       nNNnnknnNNnn     ',
    '       nNNnnknnNNnn     ',
    '       nNNnnknnNNnn     ',
    '       nNNnnknnNNnn     ',
    '       nNNnnknnNNnn     ',
    '       nNNnnknnNNnn     ',
    '       nnnnnknnnnnn     '
  ];
  // Sprite remains within the original obstacle collision footprint.
  const unit=1.15;
  rows.forEach((row,yy)=>{for(let xx=0;xx<row.length;xx++){const color=colors[row[xx]];if(color)detail(x+xx*unit,top+yy*unit,unit,unit,color)}});
  // Raised hand and microphone point forward, as in the reference performance.
  detail(x+24,top+22,3,7,colors.i);
  detail(x+24,top+16,3,7,colors.s);
  detail(x+23,top+15,4,3,colors.S);
  detail(x+24,top+12,8,2,colors.m);
  detail(x+22,top+11,4,4,colors.m);
  detail(x+22,top+11,3,1,colors.M);
  detail(x+15,top+10,1,2,colors.m);
  // Fine strands, collar seams and shirt creases.
 for(let i=0;i<7;i++)detail(x+10+i,top+2+i%3,.5,3,'#fff0b7');
 detail(x+15,top+8,2,.5,'#8d785e');detail(x+16,top+12,2,.5,'#fff0cf');
 detail(x+10,top+25,.5,10,'#d4c8af');detail(x+19,top+27,.5,8,'#d4c8af');
 for(let i=0;i<3;i++)detail(x+14,top+27+i*3,.5,.5,'#bcae91');
 // Pendants in the open collar and subtle running foot motion.
  detail(x+12,top+18,1,4,colors.j);
  detail(x+11.5,top+22,2,1,colors.H);
  const stride=mode==='play'&&y===0?Math.sin(t*.5)*2:0;
  detail(x+8,top+41+stride,7,3,colors.k);
  detail(x+19,top+41-stride,7,3,colors.k);
}
function drawEnemy(x,top,age){
 g.save();g.translate(x,top);
 const pal={h:'#211c26',H:'#49333e',s:'#e6b59b',S:'#f9cfb0',e:'#3d2633',w:'#f5f1e6',W:'#fffef4',v:'#b8b5c4',j:'#d8e5ed'};
 const rows=[
 '        j j j j         ',
 '       jWjWjWjWj        ',
 '      hhhhhhhhhhh       ',
 '     hHHHHhhhhhhhh      ',
 '     hHHhSSSSShhhh      ',
 '     hhhSSSSSSShhh      ',
 '     hhSSSSSSSSShh      ',
 '     hhSSeSSSeSShh      ',
 '     hhSSSSSSSSShh      ',
 '     hhSSSSSSSSShh      ',
 '     hhhSSSeeSShhh      ',
 '     hhhhSSSSShhhh      ',
 '     hhhjSSSSSjh h      ',
 '    hhSSSjjjjSSShh      ',
 '    hhSSSjjjjSSShh      ',
 '    hhSwwjWWjwwShh      ',
 '    hhSwwWWWWwwShh      ',
 '    hhSwwWWWWwwShh      ',
 '      SwwWWWWwwS        ',
 '      SwwWWWWwwS        ',
 '       wwWWWWww         ',
 '       wwWWWWww         ',
 '      wwwWWWWwww        ',
 '      wwWWWWWWww        ',
 '     wwwWWWWWWwww       ',
 '     wwWWWWWWWWww       ',
 '    wwwWWWWWWWWwww      ',
 '    wwWWWWWWWWWWww      ',
 '   wwwWWWWWWWWWWwww     ',
 '   vvvvvvvvvvvvvvvv     '
 ];
 const u=1.45;
 rows.forEach((row,yy)=>{for(let xx=0;xx<row.length;xx++)if(pal[row[xx]])detail((xx-12)*u,yy*u,u,u,pal[row[xx]])});
 for(let i=0;i<24;i++){const px=-12+(i*7)%24,py=24+(i*5)%17;detail(px,py,1,1,i%3?'#d4d9e4':'#ffffff')}
 detail(-5,12,1,.5,'#fff0d6');detail(5,12,1,.5,'#fff0d6');
 // Persistent Enemy opens her arms briefly when releasing an obstacle.
 const open=age>.6?5:0;
 detail(-15-open,23,5,9,'#f2c4a8');detail(11+open,23,5,9,'#f2c4a8');
 g.restore();
}
function drawBaby(x,top){
 // A sleeping newborn wrapped in a soft cream-and-blue swaddle.
 rect(x+4,top,15,4,'#dcecf2');rect(x+1,top+4,22,17,'#c1dce8');
 rect(x+4,top+3,16,18,'#f3f3e6');rect(x+6,top+1,12,10,'#ecc3a5');
 detail(x+7,top+3,10,6,'#ffdac0');
 detail(x+8,top+5,2,.75,'#74545a');detail(x+13,top+5,2,.75,'#74545a');
 detail(x+11,top+8,2,.5,'#c59085');
 rect(x+5,top+13,15,7,'#dcebf0');rect(x+7,top+20,10,5,'#abcbdc');
 for(let i=0;i<8;i++){detail(x+3+i*2,top+10+i,2,1,'#9fbfd2')}
 detail(x+5,top+12,13,.5,'#ffffff');detail(x+8,top+22,7,1,'#eaf8ff');
}
function drawDJ(x,base){
 const z=base+Math.sin(t/18)*2;
 rect(x-3,z-5,36,6,'#eacb78');rect(x-2,z,34,18,'#202b37');rect(x,z+2,30,12,'#3d5061');
 for(const dx of [6,23]){
   rect(x+dx-4,z+4,9,8,'#101d27');rect(x+dx-2,z+3,5,10,'#8a9dac');
   rect(x+dx-3,z+5,7,5,'#233442');rect(x+dx-1,z+6,3,3,'#e5c778');
 }
 for(let k=0;k<3;k++){rect(x+13+k*2,z+4,1,7,'#b1c6ce');rect(x+13+k*2,z+5+k,1,2,'#f8d77a')}
 rect(x+1,z+15,6,2,'#72d7e8');rect(x+23,z+15,6,2,'#f0c66a');
 rect(x+2,z+18,2,8,'#263642');rect(x+27,z+18,2,8,'#263642');
 g.fillStyle='#fff1b4';g.font='bold 9px monospace';g.fillText('DJ',x+10,z-8);
}
function drawLightstick(x,base){
  const cy=base+Math.sin(t/16)*2;
  g.save();g.globalAlpha=.18;rect(x-3,cy-8,32,32,'#ffe59a');g.restore();
  rect(x+9,cy+15,7,18,'#202832');rect(x+10,cy+15,2,17,'#7a8790');
  rect(x+8,cy+31,10,2,'#d9ad4f');rect(x+7,cy+12,12,4,'#e2b653');
  rect(x+2,cy-2,22,13,'#d4a342');rect(x+5,cy-6,16,21,'#d4a342');
  rect(x+4,cy,18,9,'#302d26');rect(x+7,cy-4,12,17,'#504634');
  rect(x+11,cy-7,4,2,'#fff0a7');rect(x+2,cy+3,3,2,'#fff0a7');rect(x+21,cy+3,3,2,'#fff0a7');
  rect(x+9,cy-1,7,2,'#fff5ce');rect(x+13,cy+1,3,6,'#fff5ce');rect(x+8,cy+6,8,2,'#fff5ce');rect(x+8,cy+4,2,2,'#fff5ce');
  rect(x+5,cy+10,4,2,'#ffe5a0');rect(x+17,cy+10,4,2,'#ffe5a0');
}
function djPosition(){
 const progress=Math.min(1,djAge/1.2),ease=1-Math.pow(1-progress,3);
 return {x:572,y:-115+ease*197+Math.sin(djAge*2.5)*3*progress};
}
function drawFloatingDJ(){
 const x=0,top=0;
 g.save();g.translate(x,top);
 const pal={h:'#22232b',H:'#39333a',s:'#d7a68a',S:'#f0c0a1',d:'#aa7867',b:'#8faec9',B:'#b9cbdc',v:'#5b7898',n:'#222833',k:'#151c28'};
 const rows=[
 '        hhhhhhhh        ',
 '      hhHHHHHhhhhh      ',
 '     hHHHHHHhhhhhhh     ',
 '     hhhhhhhhhhhhhh     ',
 '     hhSSSSSSSSShhh     ',
 '     hSSSSSSSSSSShh     ',
 '      SSSSSSSSSSSS      ',
 '      SSnnSSSSnnSS      ',
 '      SSSSSSSSSSSS      ',
 '       SSSSSSSSSS       ',
 '       SSddSSddSS       ',
 '        SSSSSSSS        ',
 '         dSSSSd         ',
 '       bbSnnnnSbb       ',
 '     bbBBbnnnnbBBbb     ',
 '    bbBBbbnnnnbbBBbb    ',
 '   bbBBbbnnnnnnbbBBbb   ',
 '   bBBbbBnnnnnnBbbBBb   ',
 '   bBBbBBnnnnnnBBbBBb   ',
 '   bBBbBBnnnnnnBBbBBb   ',
 '   bBBbBBnnnnnnBBbBBb   ',
 '   bBBbBBnnnnnnBBbBBb   ',
 '    BBbBBnnnnnnBBbBB    ',
 '    BBbBBnnnnnnBBbBB    ',
 '     bbBBnnnnnnBBbb     ',
 '      bBBnnnnnnBBb      ',
 '      bBBnnnnnnBBb      ',
 '      vvvnnnnnnvvv      '
 ];
 const unit=1.8;
 rows.forEach((row,yy)=>{for(let xx=0;xx<row.length;xx++){if(pal[row[xx]])detail((xx-12)*unit,yy*unit,unit,unit,pal[row[xx]])}});
 // Fine face and hair highlights, shirt buttons, pocket and cuff seams.
 detail(-9,4,12,.75,'#625057');detail(-7,6,8,.5,'#7e6966');
 detail(-5,15,2,.6,'#342e31');detail(8,15,2,.6,'#342e31');
 detail(1,19,1,2,'#bc8b75');detail(0,23,4,.6,'#ab716b');
 for(let j=0;j<4;j++)detail(1,31+j*4,1,1,'#b6b8b9');
 detail(8,37,6,.75,'#d9e1e8');detail(8,38,6,.5,'#4f6882');
 // Blazer plaid and lapels from the reference.
 for(const side of [-1,1]){
   for(let j=0;j<5;j++)detail(side<0?-15:5,28+j*4,10,1,'#c4d0dc');
   for(let j=0;j<3;j++)detail(side<0?-15+j*4:5+j*4,27,1,22,'#56728f');
   detail(side<0?-7:5,28,2,17,'#c0d0de');
 }
 // Floating console, two rotating records, glowing pads and equalizer.
 detail(-39,55,78,22,'#192838');detail(-36,57,72,16,'#405469');
 for(const side of [-1,1]){
   const cx=side*23,cy=65;
   g.fillStyle='#101a26';g.beginPath();g.ellipse(cx,cy,12,6,0,0,Math.PI*2);g.fill();
   detail(cx-2,cy-2,4,4,'#e6c373');

 }
 for(let i=0;i<5;i++){
   detail(-7+i*3,59,1,9,'#9cafba');detail(-7+i*3,61+(i%3),2,2,'#f6d385');
   detail(-6+i*3,72,2,2,'#7fe7df');
 }
 detail(-35,75,70,2,'#e5bd6d');
 g.restore();
}
export function paint(ctx,kind,phase=0){g=ctx;djAge=phase;t=phase*60;mode="play";y=0;if(kind==='performer'){g.translate(85,8);drawFloatingDJ()}if(kind==="player"){g.translate(-100,-250);drawSinger(270)}if(kind==="enemy"){g.translate(27,0);drawEnemy(0,0,phase)}if(kind==="baby")drawBaby(0,0);if(kind==="dj")drawDJ(4,17);if(kind==="power")drawLightstick(3,10);
if(kind==='light'){
 rect(5,4,8,8,'#fff2a0');rect(2,7,14,3,'#e2f29b');detail(7,5,3,3,'#fffde1');detail(0,1,3,2,'#d5eab1');detail(15,0,3,2,'#d5eab1');
}
}

// Render detailed, repeating forest layers once, then scroll the cached textures.
export const forestLayers=[
 {spacing:96,height:150,trunkWidth:8,canopyWidth:64},
 {spacing:148,height:215,trunkWidth:13,canopyWidth:88},
 {spacing:212,height:285,trunkWidth:20,canopyWidth:118}
];
export function paintForest(ctx,layer,width){
 g=ctx;const spec=forestLayers[layer],floor=300;
 const trunk=['#91a98b','#668a68','#365f48'][layer],leaf=['#a1b69a','#799c77','#4a7952'][layer];
 const top=floor-spec.height,canopyHeight=Math.round(spec.height*.36),cx=Math.round(width*.42);
 for(const shift of [-width,0,width]){
  const x=cx+shift,trunkTop=top+canopyHeight*.55;
  // Every trunk is anchored to the same ground line; size and palette convey distance.
  rect(x,trunkTop,spec.trunkWidth,floor-trunkTop,trunk);
  rect(x-3,296,spec.trunkWidth+6,4,trunk);
  for(let j=0;j<3;j++){
   const inset=j*spec.canopyWidth*.07;
   rect(x-spec.canopyWidth*.4+inset,top+j*canopyHeight*.25,spec.canopyWidth-inset,canopyHeight*.43,leaf);
   for(let k=0;k<25;k++){
    const px=x-spec.canopyWidth*.38+inset+(k*17)%(spec.canopyWidth-inset-4),py=top+j*canopyHeight*.25+3+(k*11)%Math.max(4,Math.floor(canopyHeight*.37));
    detail(px,py,1+layer+k%2,1,layer===2?(k%3?'#63915d':'#83a76d'):layer===1?'#94ae87':'#b3c4a4');
   }
  }
  const barkStart=top+canopyHeight;
  for(let k=0;k<14;k++){
   detail(x+2+(k*7)%Math.max(2,spec.trunkWidth-3),barkStart+k*(floor-barkStart)/14,1,3+layer,layer===2?'#284e3c':'#a0b394');
  }
 }
}
export function paintGround(ctx){g=ctx;rect(0,0,800,60,'#2a4833');rect(0,0,800,6,'#7d9e56');
 for(let i=0;i<210;i++)detail(i*37%800,8+i%8*6,1+i%4,1,i%3?'#52744b':'#77915a');
}
export function paintFerns(ctx){g=ctx;for(let i=0;i<10;i++){
 const x=i*89;detail(x,9,1,10,'#4b784a');
 for(let k=0;k<3;k++){detail(x-3-k,11+k*2,3+k,1,'#6b995c');detail(x+1,10+k*2,3+k,1,'#82aa66')}
 if(i%3===0){detail(x+9,12,1,7,'#577c48');detail(x+7,10,5,2,'#e9ce8d');detail(x+9,9,1,4,'#fff1bc')}
}}

// Exact soft-light stops from the original renderer. These are cached once.
export function paintEffect(ctx,kind){
 const disk=(x,y,r)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()};
 if(kind==='golden-scene'){
  const glow=ctx.createRadialGradient(121,220,25,350,160,520);
  glow.addColorStop(0,'#ffdc6a30');glow.addColorStop(.65,'#ffcf6524');glow.addColorStop(1,'#f4b94210');ctx.fillStyle=glow;ctx.fillRect(0,0,800,360);
 }
 if(kind==='water'){
  const fill=ctx.createRadialGradient(26,24,2,36,36,35);
  fill.addColorStop(0,'#dcfbff50');fill.addColorStop(.65,'#6dcfff15');fill.addColorStop(1,'#8beaff60');ctx.fillStyle=fill;disk(36,36,35);
 }
 if(kind==='light-aura'){
  const glow=ctx.createRadialGradient(44,44,5,44,44,43);
  glow.addColorStop(0,'#fff1b044');glow.addColorStop(.6,'#ffd35f33');glow.addColorStop(1,'#ffd35f00');ctx.fillStyle=glow;ctx.fillRect(0,0,88,88);
 }
 if(kind==='dj-aura'){
  const aura=ctx.createRadialGradient(85,85,8,85,85,78);
  aura.addColorStop(0,'#fff7c866');aura.addColorStop(.4,'#ffe58e44');aura.addColorStop(.75,'#ffc94f22');aura.addColorStop(1,'#ffc94f00');ctx.fillStyle=aura;ctx.fillRect(0,0,170,170);
  const glow=ctx.createRadialGradient(85,92,8,85,92,80);glow.addColorStop(0,'#fff0a638');glow.addColorStop(1,'#ffe09000');ctx.fillStyle=glow;ctx.fillRect(5,12,160,160);
 }
}
