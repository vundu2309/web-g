import type {FirebaseApp, FirebaseOptions} from 'firebase/app';

// Public web-app configuration supplied by Firebase; never put Admin credentials here.
export const firebaseConfig:FirebaseOptions={
  "projectId": "movieapp-fa2d4",
  "appId": "1:1071572901905:web:4d7072ef0a493528ea11b0",
  "databaseURL": "https://movieapp-fa2d4-default-rtdb.firebaseio.com",
  "storageBucket": "movieapp-fa2d4.firebasestorage.app",
  "apiKey": "AIzaSyAWuubrajRnSynquICOwsnSLRn_p68CAUo",
  "authDomain": "movieapp-fa2d4.firebaseapp.com",
  "messagingSenderId": "1071572901905"
};
let pending:Promise<FirebaseApp>|undefined;

/** Load only Firebase Core; services are added explicitly when the game needs them. */
export function initFirebase():Promise<FirebaseApp>{
 if(!pending)pending=import('firebase/app').then(({getApps,initializeApp})=>getApps().find(app=>app.name==='pixel-forest')??initializeApp(firebaseConfig,'pixel-forest')).catch(error=>{pending=undefined;throw error});
 return pending;
}
