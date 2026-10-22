export type Slot='hat'|'shirt'|'pants'|'backpack';
export const slots:Record<Slot,string>={hat:'Mũ',shirt:'Áo',pants:'Quần',backpack:'Balo'};
export const gear=[
 {id:'hat-ranger',slot:'hat',name:'Mũ kiểm lâm',color:'#bda46e'},{id:'hat-knit',slot:'hat',name:'Mũ len rừng',color:'#b65d43'},
 {id:'shirt-linen',slot:'shirt',name:'Áo vải dã ngoại',color:'#ded2a9'},{id:'shirt-pine',slot:'shirt',name:'Áo khoác thông',color:'#4c7560'},
 {id:'pants-trail',slot:'pants',name:'Quần leo núi',color:'#4e5e56'},{id:'pants-denim',slot:'pants',name:'Quần denim',color:'#526d8e'},
 {id:'bag-canvas',slot:'backpack',name:'Balo vải bố',color:'#a1754d'},{id:'bag-moss',slot:'backpack',name:'Balo rêu',color:'#617a50'}
] as const;
export const fishSpecies=[
 {id:'perch',name:'Cá rô đồng',habitats:['pond','lake'],rarity:'Thường',weight:35,color:'#93aa71',min:12,max:28},
 {id:'tilapia',name:'Cá rô phi',habitats:['pond','lake'],rarity:'Thường',weight:30,color:'#b8b6a2',min:18,max:40},
 {id:'carp',name:'Cá chép',habitats:['pond','lake'],rarity:'Ít gặp',weight:18,color:'#d7a15d',min:20,max:65},
 {id:'crucian',name:'Cá diếc',habitats:['pond'],rarity:'Thường',weight:28,color:'#c9d3bf',min:10,max:25},
 {id:'catfish',name:'Cá trê',habitats:['pond','river'],rarity:'Ít gặp',weight:17,color:'#7c8270',min:25,max:75},
 {id:'snakehead',name:'Cá lóc',habitats:['pond','river'],rarity:'Hiếm',weight:8,color:'#647c65',min:30,max:85},
 {id:'trout',name:'Cá hồi suối',habitats:['river'],rarity:'Ít gặp',weight:25,color:'#cb9d94',min:20,max:55},
 {id:'goby',name:'Cá bống suối',habitats:['river'],rarity:'Thường',weight:40,color:'#b5a284',min:7,max:18},
 {id:'bass',name:'Cá vược hồ',habitats:['lake'],rarity:'Hiếm',weight:10,color:'#7ba396',min:25,max:80},
 {id:'koi',name:'Cá chép gấm',habitats:['pond','lake'],rarity:'Rất hiếm',weight:2,color:'#e1a078',min:20,max:60},
 {id:'sturgeon',name:'Cá tầm',habitats:['lake','river'],rarity:'Rất hiếm',weight:2,color:'#819faf',min:45,max:110},
 {id:'golden',name:'Cá vàng núi',habitats:['river'],rarity:'Rất hiếm',weight:1,color:'#eed58b',min:12,max:30}
] as const;
export type Habitat='pond'|'lake'|'river';
export type FishId=typeof fishSpecies[number]['id'];
export type BuildingKind='tent'|'fire'|'bench'|'chest';
export const recipes:Record<BuildingKind,{name:string;wood:number;stone:number;description:string}>={
 tent:{name:'Lều vải',wood:8,stone:2,description:'Một mái trú chân giữa rừng.'},fire:{name:'Bếp lửa',wood:4,stone:4,description:'Ánh lửa ấm áp cho khu trại.'},bench:{name:'Bàn dã ngoại',wood:10,stone:4,description:'Góc nghỉ bên hồ câu.'},chest:{name:'Rương gỗ',wood:12,stone:4,description:'Trang trí và đánh dấu nơi đóng trại.'}
};
export type Building={kind:BuildingKind;x:number};
export type Save={version:1;x:number;wood:number;stone:number;equipped:Record<Slot,string>;fish:Partial<Record<FishId,{count:number;largest:number}>>;buildings:Building[];harvested:string[]};
export const SAVE_KEY='forest-camping-v1';
export function newSave():Save{return {version:1,x:120,wood:24,stone:16,equipped:{hat:'hat-ranger',shirt:'shirt-linen',pants:'pants-trail',backpack:'bag-canvas'},fish:{},buildings:[],harvested:[]}}
export function decodeSave(raw:string|null):Save{
 const clean=newSave();if(!raw)return clean;
 try{const s=JSON.parse(raw);if(s.version!==1)return clean;
  const number=(n:unknown,max:number)=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;
  clean.x=Math.max(30,number(s.x,15960));clean.wood=number(s.wood,9999);clean.stone=number(s.stone,9999);
  for(const slot of Object.keys(slots) as Slot[])if(gear.some(g=>g.slot===slot&&g.id===s.equipped?.[slot]))clean.equipped[slot]=s.equipped[slot];
  for(const f of fishSpecies){const entry=s.fish?.[f.id];if(entry&&number(entry.count,9999)>0)clean.fish[f.id]={count:number(entry.count,9999),largest:Math.max(f.min,Math.min(f.max,number(entry.largest,f.max)))}}
  if(Array.isArray(s.buildings))for(const b of s.buildings.slice(0,80))if(Object.hasOwn(recipes,b?.kind)&&typeof b.x==='number'&&b.x>=60&&b.x<=15940)clean.buildings.push({kind:b.kind,x:Math.round(b.x)});
  if(Array.isArray(s.harvested))clean.harvested=s.harvested.filter((id:unknown)=>typeof id==='string'&&/^node-\d+$/.test(id)).slice(0,200);
 }catch{}return clean;
}
export function equip(save:Save,id:string){const item=gear.find(g=>g.id===id);if(!item)return false;save.equipped[item.slot]=id;return true}
export function rollFish(habitat:Habitat,random=Math.random(),sizeRandom=Math.random()){
 const candidates=fishSpecies.filter(f=>(f.habitats as readonly string[]).includes(habitat));let draw=Math.max(0,Math.min(.999999,random))*candidates.reduce((n,f)=>n+f.weight,0);
 const species=candidates.find(f=>(draw-=f.weight)<0)??candidates[candidates.length-1];return {species,length:Math.round(species.min+Math.max(0,Math.min(1,sizeRandom))*(species.max-species.min))};
}
export function storeFish(save:Save,id:FishId,length:number){const old=save.fish[id];save.fish[id]={count:(old?.count??0)+1,largest:Math.max(old?.largest??0,length)}}
export function craft(save:Save,kind:BuildingKind,x:number){const r=recipes[kind];if(save.wood<r.wood||save.stone<r.stone||save.buildings.length>=80)return false;save.wood-=r.wood;save.stone-=r.stone;save.buildings.push({kind,x});return true}
