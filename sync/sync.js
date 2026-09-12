/* Shared private sync for Curio and Mes apps. Images are immutable and separate. */
(() => {
 'use strict';
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const absent=Symbol('absent');
 function merge(base,local,remote,path=''){
  if(same(local,remote))return local;
  if(same(base,local))return remote;
  if(same(base,remote))return local;
  if(path.endsWith('/visited')||path.endsWith('/updated'))return Math.max(Number(local)||0,Number(remote)||0);
  if([local,remote].every(v=>Array.isArray(v))){
   base=Array.isArray(base)?base:[];
   if(![...(base||[]),...local,...remote].every(v=>v&&typeof v==='object'&&typeof v.id==='string'))throw Error('Conflit : '+path);
   const ids=[...new Set([...remote,...local,...(base||[])].map(v=>v.id))];
   const items=ids.map(id=>merge((base||[]).find(v=>v.id===id)??absent,local.find(v=>v.id===id)??absent,remote.find(v=>v.id===id)??absent,path+'/'+id)).filter(v=>v!==absent);
   // Honor a single-device reorder; do not invent an order for two conflicting reorders.
   const order=arr=>(arr||[]).map(v=>v.id).filter(id=>(base||[]).some(v=>v.id===id)&&local.some(v=>v.id===id)&&remote.some(v=>v.id===id));
   const bo=order(base),lo=order(local),ro=order(remote);
   if(!same(lo,bo)&&!same(ro,bo)&&!same(lo,ro))throw Error('Conflit d’ordre : '+path);
   const preferred=!same(lo,bo)?local:remote;
   const rank=new Map(preferred.map((v,i)=>[v.id,i]));
   return items.sort((a,b)=>(rank.get(a.id)??1e9)-(rank.get(b.id)??1e9));
  }
  if(local&&remote&&local!==absent&&remote!==absent&&typeof local==='object'&&typeof remote==='object'&&!Array.isArray(local)&&!Array.isArray(remote)){
   const result={};for(const key of new Set([...Object.keys(base===absent?{}:base||{}),...Object.keys(remote),...Object.keys(local)])){
    const value=merge(base&&base!==absent&&Object.hasOwn(base,key)?base[key]:absent,Object.hasOwn(local,key)?local[key]:absent,Object.hasOwn(remote,key)?remote[key]:absent,path+'/'+key);
    if(value!==absent)result[key]=value;
   }return result;
  }
  throw Error('Deux appareils ont modifié le même contenu : '+path);
 }
 const get=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
 const completed=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);});
 const dataURL=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});
 const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,'0')).join('');
 const q=s=>document.querySelector(s);
 class PersonalSync {
  constructor(adapter){this.a=adapter;this.generation=0;this.busy=false;this.applying=false;this.pendingConflict=null;this.user=null;this.meta={};this.buildUI();}
  buildUI(){
   const container=document.createElement('div');container.innerHTML=`<div class="sync-lock" hidden><p>Connecte-toi à ton compte pour retrouver tes informations.</p></div><div class="personal-sync"><span id="sync-status" role="status">Sur cet appareil</span><button id="sync-account">Synchroniser</button></div><dialog class="sync-dialog"><button class="sync-close" type="button">Fermer</button><h2>Mes données, partout.</h2><p>Connecte-toi avec la même adresse e-mail sur tes appareils. Tes données restent privées.</p><form id="sync-login"><label>Adresse e-mail<input id="sync-email" type="email" required autocomplete="email"></label><button>Recevoir un lien de connexion</button></form><div class="sync-actions" id="sync-connected" hidden><button id="sync-now">Synchroniser maintenant</button><button id="sync-logout">Se déconnecter</button></div><p class="sync-message" role="status"></p><div id="sync-conflict" hidden><p>Deux versions différentes existent. Exporte-les avant de choisir laquelle conserver.</p><div class="sync-actions"><button id="sync-backup">Exporter les deux versions</button><button id="sync-use-cloud" disabled>Garder la version en ligne</button><button id="sync-use-local" disabled>Garder celle de cet appareil</button></div></div></dialog>`;
   document.body.append(container);
   q('#sync-account').onclick=()=>q('.sync-dialog').showModal();q('.sync-close').onclick=()=>q('.sync-dialog').close();
   q('#sync-login').onsubmit=async event=>{event.preventDefault();if(!this.client)return this.message('La synchronisation doit encore être activée dans Supabase. Tes données locales sont conservées.');
    const button=event.target.querySelector('button');button.disabled=true;
    try{const {error}=await this.client.auth.signInWithOtp({email:q('#sync-email').value.trim(),options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;this.message('Ouvre le lien reçu par e-mail dans ce navigateur.');}catch(e){this.message(e.message);}finally{button.disabled=false;}
   };
   q('#sync-now').onclick=()=>this.cycle();
   q('#sync-logout').onclick=async()=>{if(this.busy)return this.message('Attends la fin de la synchronisation.');const {error}=await this.client.auth.signOut({scope:'local'});if(error)this.message(error.message);else{this.user=null;this.lock(Boolean(this.meta.owner));this.authUI();}};
   q('#sync-backup').onclick=()=>this.backupConflict();
   q('#sync-use-cloud').onclick=()=>this.resolve('remote');q('#sync-use-local').onclick=()=>this.resolve('local');
  }
  status(text){q('#sync-status').textContent=text;}
  message(text){q('.sync-message').textContent=text;}
  lock(value){q('.sync-lock').hidden=!value;document.querySelectorAll('main,aside').forEach(el=>el.inert=value);if(value)document.querySelectorAll('dialog:not(.sync-dialog)').forEach(el=>el.close());}
  authUI(){q('#sync-login').hidden=Boolean(this.user);q('#sync-connected').hidden=!this.user;q('#sync-account').textContent=this.user?'Mon compte':'Se connecter';this.status(this.user?'Connexion établie':'Sur cet appareil');}
  async init(){
   const opening=indexedDB.open('personal-app-sync',1);opening.onupgradeneeded=()=>opening.result.createObjectStore('meta');this.db=await get(opening);
   this.meta=await get(this.db.transaction('meta').objectStore('meta').get(this.a.app))||{};
   const c=window.PERSONAL_SYNC_CONFIG;
   if(!c?.url||!c?.key||!window.supabase){this.status('Synchronisation à activer');return;}
   this.client=window.supabase.createClient(c.url,c.key,{auth:{storageKey:'personal-app-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
   const {data,error}=await this.client.auth.getSession();if(error)this.message(error.message);
   this.user=data?.session?.user||null;this.checkAccount();
   this.client.auth.onAuthStateChange((event,session)=>{setTimeout(()=>{this.user=session?.user||null;this.checkAccount();},0);});
   this.interval=setInterval(()=>this.cycle(),15000);window.addEventListener('online',()=>this.cycle());window.addEventListener('focus',()=>this.cycle());
   await this.cycle();
  }
  checkAccount(){
   const mismatch=this.meta.owner&&this.user&&this.meta.owner!==this.user.id;
   if(!this.user||mismatch){this.pendingConflict=null;q('#sync-conflict').hidden=true;q('#sync-use-cloud').disabled=true;q('#sync-use-local').disabled=true;}
   if(!this.busy||!this.user||mismatch)this.lock(Boolean(this.meta.owner&&(!this.user||mismatch)));this.authUI();
   if(mismatch)this.message('Ce navigateur contient les données d’un autre compte. Reconnecte-toi au compte initial ou utilise un profil de navigateur séparé.');
   if(this.user&&!mismatch)this.cycle();
  }
  mark(){if(this.applying)return;this.generation++;this.status(this.user?'Modifications à synchroniser':'Sur cet appareil');clearTimeout(this.timer);this.timer=setTimeout(()=>this.cycle(),1800);}
  async metadata(value){const tx=this.db.transaction('meta','readwrite'),wait=completed(tx);tx.objectStore('meta').put(value,this.a.app);await wait;this.meta=value;}
  async path(id){return `${this.cycleOwner||this.user.id}/${this.a.app}/${await digest(id)}`;}
  async remote(){const {data,error}=await this.io.from('personal_app_state').select('revision,document').eq('app',this.a.app).eq('owner_id',this.cycleOwner).maybeSingle();if(error)throw error;return data||{revision:0,document:this.a.empty()};}
  async images(document,remoteDoc){
   const refs=this.a.imageIds(document),remoteIds=new Set(this.a.imageIds(remoteDoc)),downloaded={};
   for(const id of refs){
    const local=await this.a.image(id);
    if(!remoteIds.has(id)){
     if(!local)throw Error('Image locale manquante. Exporte une sauvegarde avant de continuer.');
     const blob=await (await fetch(local)).blob();
     const {error}=await this.io.storage.from('personal-app-images').upload(await this.path(id),blob,{contentType:blob.type,upsert:false});
     if(error&&!['409','Duplicate'].includes(String(error.statusCode||error.error)))throw error;
    }else if(!local){
     const {data,error}=await this.io.storage.from('personal-app-images').download(await this.path(id));if(error)throw error;downloaded[id]=await dataURL(data);
    }
   }return downloaded;
  }
  async cycle(){
   if(navigator.locks)return navigator.locks.request('personal-sync-'+this.a.app,{ifAvailable:true},lock=>lock?this.runCycle():undefined);
   return this.runCycle();
  }
  async runCycle(){
   if(!this.client||!this.user||this.busy||this.pendingConflict||this.meta.owner&&this.meta.owner!==this.user.id)return;
   if(this.a.editing()){this.status('Écriture en cours · envoi après fermeture de l’éditeur');return;}
   this.busy=true;const owner=this.user.id;let release=()=>{};
   try{
    if(!navigator.onLine)throw Error('Hors connexion. Tes changements restent sur cet appareil.');
    const {data:auth,error:authError}=await this.client.auth.getSession();
    if(authError)throw authError;
    if(auth.session?.user.id!==owner)return;
    // Pin every request to this account, even if another tab changes the session.
    const c=window.PERSONAL_SYNC_CONFIG;
    this.cycleOwner=owner;
    this.io=window.supabase.createClient(c.url,c.key,{accessToken:async()=>auth.session.access_token});
    const meta=await get(this.db.transaction('meta').objectStore('meta').get(this.a.app))||{};this.meta=meta;
    if(this.user?.id!==owner)return;
    if(meta.owner&&meta.owner!==owner)return this.checkAccount();
    if(!meta.owner)await this.metadata({...meta,owner});
    const ticket=this.generation,local=await this.a.read(),remote=await this.remote();
    let merged;
    try{merged=merge(meta.base||this.a.empty(),local,remote.document);}catch(e){this.pendingConflict={local,remote};q('#sync-conflict').hidden=false;q('.sync-dialog').showModal();this.message('Les modifications simultanées ne peuvent pas être fusionnées automatiquement.');this.status('Choix de version nécessaire');return;}
    this.status('Synchronisation…');
    const images=await this.images(merged,remote.document);
    try{await this.a.validate(merged,images);}catch(e){this.pendingConflict={local,remote};q('#sync-conflict').hidden=false;q('.sync-dialog').showModal();this.message('Ces versions ne peuvent pas être réunies : '+e.message);this.status('Choix de version nécessaire');return;}
    if(this.generation!==ticket||this.a.editing()||this.user?.id!==owner)return;
    // Prevent edits only during the final commit; uploads/downloads happen beforehand.
    release=this.a.freeze();
    if(this.generation!==ticket||this.user?.id!==owner)return;
    let rev=remote.revision;
    if(!same(merged,remote.document)||!rev){
     const {data,error}=await this.io.rpc('personal_app_save',{p_app:this.a.app,p_revision:rev,p_document:merged});if(error)throw error;
     if(data.conflict){this.status('Autre appareil actif · nouvelle tentative…');return;}
     rev=data.revision;
    }
    if(this.user?.id!==owner)return;
    if(!same(local,merged)){this.applying=true;await this.a.apply(merged,images);this.applying=false;}
    await this.metadata({owner,revision:rev,base:merged});
    this.status('✓ Synchronisé');this.message('Connecté : '+this.user.email+'\nTes données sont à jour.');
   }catch(e){this.status(navigator.onLine?'Synchronisation en attente':'Hors connexion');this.message('Tes données locales sont conservées. '+(e.message||'Réessaie dans quelques instants.'));}
   finally{this.applying=false;release();this.lock(Boolean(this.meta.owner&&this.meta.owner!==this.user?.id));this.busy=false;this.cycleOwner=null;}
  }
  async backupConflict(){
   try{
    const versions={};for(const name of ['local','remote']){
     const document=name==='local'?this.pendingConflict.local:this.pendingConflict.remote.document,images={};
     for(const id of this.a.imageIds(document)){let value=await this.a.image(id);if(!value){const {data,error}=await this.client.storage.from('personal-app-images').download(await this.path(id));if(error)throw error;value=await dataURL(data);}images[id]=value;}
     versions[name]=this.a.export(document,images);
    }
    const url=URL.createObjectURL(new Blob([JSON.stringify(versions)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=this.a.app+'-versions-en-conflit.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    q('#sync-use-cloud').disabled=false;q('#sync-use-local').disabled=false;this.message('Les deux versions ont été exportées. Choisis maintenant la version à conserver.');
   }catch(e){this.message(e.message);}
  }
  async resolve(choice){
   if(!this.pendingConflict||this.busy)return;
   // Use a baseline equal to the discarded side: next CAS cycle applies the chosen side.
   const conflict=this.pendingConflict;
   await this.metadata({...this.meta,owner:this.user.id,base:choice==='local'?conflict.remote.document:conflict.local});
   this.pendingConflict=null;q('#sync-conflict').hidden=true;q('#sync-use-cloud').disabled=true;q('#sync-use-local').disabled=true;await this.cycle();
  }
 }
 window.PersonalSync=PersonalSync;window.PersonalSyncMerge=merge;
})();
