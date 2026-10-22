import type {Save,BuildingKind} from './camping';
import {gear} from './camping';
type C=CanvasRenderingContext2D;
export function paintCamper(c:C,save:Save,frame:number){
 const color=(slot:string)=>gear.find(g=>g.id===save.equipped[slot as keyof Save['equipped']])!.color;
 const swing=Math.sin(frame*Math.PI/4)*3;
 const rect=(x:number,y:number,w:number,h:number,t:string)=>{c.fillStyle=t;c.fillRect(Math.round(x),Math.round(y),w,h)};
 rect(12,25,12,20,'#3b4238');rect(12,26,10,17,color('backpack'));rect(13,30,8,3,'#d2ba88');rect(14,37,5,4,'#594e38');
 rect(19,40,7,20-swing,color('pants'));rect(27,40,7,20+swing,color('pants'));rect(18,57-swing,10,6,'#3b3734');rect(26,57+swing,11,6,'#3b3734');
 rect(18,23,16,21,color('shirt'));rect(18,42,16,2,'#806e50');rect(22,24,2,16,'#ffffff30');rect(28,29,5,5,'#ffffff22');
 rect(18,5,14,17,'#775b40');rect(21,9,12,12,'#edc59f');rect(31,14,4,4,'#edc59f');rect(29,12,2,2,'#34473c');rect(27,20,4,5,'#deb48d');
 rect(15,5,20,6,color('hat'));rect(20,1,11,7,color('hat'));rect(13,10,25,3,color('hat'));rect(17,7,17,2,'#ffffff30');
 rect(16,26,6,12+swing,color('shirt'));rect(17,37+swing,5,5,'#edc59f');rect(32,26,5,12-swing,color('shirt'));rect(33,37-swing,5,5,'#edc59f');
}
export function paintBuilding(c:C,kind:BuildingKind){
 const box=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
 if(kind==='tent'){
 c.fillStyle='#c2a16c';c.beginPath();c.moveTo(8,68);c.lineTo(53,10);c.lineTo(102,68);c.closePath();c.fill();c.fillStyle='#e8cf99';c.beginPath();c.moveTo(53,10);c.lineTo(80,68);c.lineTo(102,68);c.closePath();c.fill();c.fillStyle='#3e594c';c.beginPath();c.moveTo(27,68);c.lineTo(53,23);c.lineTo(74,68);c.closePath();c.fill();box(52,12,2,55,'#f6e5bd');box(6,68,98,3,'#576447');box(3,67,3,7,'#716043');box(104,67,3,7,'#716043');
 }else if(kind==='fire'){
 for(let i=0;i<7;i++)box(23+i*9,63+(i%2)*3,10,5,'#778477');box(36,61,36,5,'#715138');box(43,56,31,5,'#886043');c.fillStyle='#e4a54f';c.beginPath();c.moveTo(43,59);c.lineTo(45,38);c.lineTo(53,45);c.lineTo(60,25);c.lineTo(75,59);c.closePath();c.fill();box(55,47,10,15,'#ffe3a1');
 }else if(kind==='bench'){
 box(12,35,86,8,'#b18c5c');box(23,43,8,27,'#755e43');box(80,43,8,27,'#755e43');box(8,54,92,5,'#96764e');box(14,59,5,13,'#755e43');box(91,59,5,13,'#755e43');box(16,35,78,2,'#d3b982');
 }else{box(28,38,56,31,'#9d784c');box(26,33,60,11,'#b49361');box(30,46,52,2,'#6d573e');box(35,33,4,36,'#d0b885');box(73,33,4,36,'#d0b885');box(53,43,8,9,'#ead29a');}
}
