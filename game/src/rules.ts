export const SHIELD_MAX=3;
export type Run={time:number;distance:number;bonus:number;shield:number;boost:number;god:boolean};
export const newRun=(god=false):Run=>({time:0,distance:0,bonus:0,shield:0,boost:0,god});
export function hit(run:Run){if(run.shield>0){run.shield--;return false}return !run.god}
export function firefly(run:Run){run.bonus+=run.boost>0?100:50}
export function dropDelay(seconds:number,random=Math.random()){return Math.max(.55,(2.8-Math.min(seconds/120,1)*2.25)*(.85+random*.3))}
export function tick(run:Run,dt:number,speed:number){run.time+=dt;run.distance+=speed*dt;run.boost=Math.max(0,run.boost-dt)}
