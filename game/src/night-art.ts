/** Ground plants painted once into world chunks. */
type C=CanvasRenderingContext2D;
function box(c:C,x:number,y:number,w:number,h:number,color:string){c.fillStyle=color;c.fillRect(Math.round(x*2)/2,Math.round(y*2)/2,w,h)}
export function paintFerns(c:C){
 for(let i=0;i<10;i++){
  const x=i*89+6;box(c,x,9,1,11,'#6a9275');
  for(let k=0;k<4;k++){box(c,x-4-k,10+k*2,4+k,1,k%2?'#527e68':'#75967a');box(c,x+1,9+k*2,4+k,1,'#7a9e80')}
  if(i%3===0){box(c,x+16,13,2,7,'#a2adb3');box(c,x+12,11,10,3,'#729da2');box(c,x+14,9,6,2,'#98c5c6');box(c,x+14,12,2,1,'#e7e4b9')}
  if(i%4===0){box(c,x+31,14,1,6,'#6c927a');box(c,x+29,12,5,2,'#c2b6d5');box(c,x+31,11,1,4,'#f1d5aa')}
 }
}
