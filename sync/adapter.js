window.startMesAppsSync=async function(){
 const adapter={
  app:'mes-apps',empty:()=>({apps:[]}),editing:()=>dialog.open,
  read:async()=>{manualApps=loadManualApps();render();return {apps:structuredClone(manualApps)};},imageIds:()=>[],image:async()=>null,
  export:doc=>({format:'mes-apps',version:1,apps:doc.apps}),
  validate:async doc=>{if(!Array.isArray(doc.apps)||new Set(doc.apps.map(a=>a.id)).size!==doc.apps.length||doc.apps.some(a=>!a||typeof a.id!=='string'||typeof a.name!=='string'||!safeUrl(a.url)||a.github&&!safeUrl(a.github)))throw Error('Liste distante invalide.');},
  freeze:()=>{const nodes=[...document.querySelectorAll('main,aside')],values=nodes.map(el=>el.inert);nodes.forEach(el=>el.inert=true);return()=>nodes.forEach((el,i)=>el.inert=values[i]);},
  apply:async doc=>{
   if(!Array.isArray(doc.apps)||doc.apps.some(a=>!a||typeof a.id!=='string'||typeof a.name!=='string'||!safeUrl(a.url)))throw Error('Liste distante invalide.');
   localStorage.setItem(STORAGE_KEY,JSON.stringify(doc.apps));manualApps=structuredClone(doc.apps);render();
  }
 };
 window.mesAppsSync=new PersonalSync(adapter);
 try{await window.mesAppsSync.init();}catch(e){window.mesAppsSync.message('Synchronisation indisponible : '+e.message);}
};
