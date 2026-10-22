import {test,expect} from '@playwright/test';
test('Firebase initializes the selected web app once without changing gameplay',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>Boolean((window as any).forest));await page.locator('#start').click();
 const actual=await page.evaluate(async()=>{
  const path='/src/firebase.ts';const {initFirebase}=await import(path);const [first,second]=await Promise.all([initFirebase(),initFirebase()]);
  return {same:first===second,name:first.name,project:first.options.projectId,app:first.options.appId,status:(window as any).forest.status};
 });
 expect(actual).toEqual({same:true,name:'pixel-forest',project:'movieapp-fa2d4',app:'1:1071572901905:web:4d7072ef0a493528ea11b0',status:'play'});expect(errors).toEqual([]);
});
