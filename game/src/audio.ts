/** One lazily loaded track, controlled by gameplay state and a user gesture. */
export class DJAudio {
 element?:HTMLAudioElement;
 enabled=true;
 blocked=false;
 failed=false;
 private unlocked=false;
 private probing=false;
 private active=false;
 private revision=0;
 constructor(private changed:()=>void){}
 private ensure(){
  if(!this.element){
   this.element=new Audio(new URL('assets/audio/song-gio.mp3',document.baseURI).href);
   this.element.loop=true;this.element.preload='none';this.element.volume=.55;
   this.element.addEventListener('error',()=>{this.failed=true;this.changed()});
  }
  return this.element;
 }
 unlock(){
  if(!this.enabled||this.unlocked||this.probing)return;
  const audio=this.ensure();this.probing=true;audio.volume=0;
  audio.play().then(()=>{this.probing=false;this.unlocked=true;this.blocked=false;audio.volume=.55;this.sync(this.active)}).catch(()=>{this.probing=false;this.blocked=true;this.changed()});
 }
 sync(active:boolean){
  this.active=active;const revision=++this.revision;
  if(!this.element){if(!active||!this.enabled)return;this.ensure()}
  const audio=this.element!;
  if(!active||!this.enabled){audio.pause();if(!active)audio.currentTime=0;return}
  audio.volume=.55;
  audio.play().then(()=>{
   if(revision!==this.revision){if(!this.active||!this.enabled)audio.pause();return}
   this.blocked=false;this.unlocked=true;this.failed=false;this.changed();
  }).catch(()=>{if(revision===this.revision){this.blocked=true;this.changed()}});
 }
 pause(){this.active=false;this.revision++;this.element?.pause()}
 toggle(){
  if(this.blocked&&this.enabled){this.blocked=false;this.unlocked=false;this.unlock();this.sync(this.active)}
  else {this.enabled=!this.enabled;if(this.enabled)this.unlock();this.sync(this.active)}
  this.changed();
 }
}
