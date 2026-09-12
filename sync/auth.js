/* Email/password authentication. Passwords only go to Supabase Auth. */
(() => {
 'use strict';
 const q=s=>document.querySelector(s);
 class PersonalAuth {
  constructor(sync){
   this.sync=sync;this.mode='login';this.busy=false;
   this.recovery=new URLSearchParams(location.hash.slice(1)).get('type')==='recovery';
   q('#sync-login').innerHTML=`
    <div class="auth-tabs" aria-label="Compte"><button type="button" data-auth-mode="login" aria-pressed="true">Connexion</button><button type="button" data-auth-mode="signup" aria-pressed="false">Créer un compte</button></div>
    <label>Adresse e-mail<input id="sync-email" name="email" type="email" required autocomplete="username"></label>
    <label id="auth-password-label">Mot de passe<input id="auth-password" name="password" type="password" required autocomplete="current-password"></label>
    <label id="auth-confirm-label" hidden>Confirmer le mot de passe<input id="auth-confirm" type="password" autocomplete="new-password"></label>
    <p id="auth-help">Retrouve tes données avec ton e-mail et ton mot de passe.</p>
    <button id="auth-submit" type="submit">Se connecter</button>
    <button id="auth-forgot" type="button" class="auth-secondary">Mot de passe oublié ?</button>`;
   q('#sync-connected').insertAdjacentHTML('afterend',`
    <details id="auth-security" hidden><summary>Définir ou changer mon mot de passe</summary>
     <p>Si tu utilisais un lien par e-mail, définis ton mot de passe ici pour tes prochaines connexions.</p>
     <form id="auth-password-form"><label>Nouveau mot de passe<input id="auth-new-password" name="new-password" type="password" minlength="8" required autocomplete="new-password"></label>
     <label>Confirmer le nouveau mot de passe<input id="auth-new-confirm" type="password" minlength="8" required autocomplete="new-password"></label>
     <p>Au moins 8 caractères.</p><button type="submit">Enregistrer mon mot de passe</button></form>
    </details><p id="auth-message" role="status" aria-live="polite"></p>`);
   q('#sync-login').onsubmit=e=>{e.preventDefault();this.submit();};
   q('#auth-password-form').onsubmit=e=>{e.preventDefault();this.setPassword();};
   document.querySelectorAll('[data-auth-mode]').forEach(b=>b.onclick=()=>this.setMode(b.dataset.authMode));
   q('#auth-forgot').onclick=()=>this.setMode('reset');
   q('.sync-dialog').addEventListener('close',()=>this.clearPasswords());
  }
  message(value){q('#auth-message').textContent=value;}
  clearPasswords(){document.querySelectorAll('.sync-dialog input[type=password]').forEach(el=>el.value='');}
  setMode(mode){
   if(this.busy)return;this.mode=mode;this.clearPasswords();this.message('');
   document.querySelectorAll('[data-auth-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.authMode===mode)));
   q('#auth-password-label').hidden=mode==='reset';q('#auth-password').required=mode!=='reset';q('#auth-password').minLength=mode==='signup'?8:1;
   q('#auth-password').autocomplete=mode==='signup'?'new-password':'current-password';
   q('#auth-confirm-label').hidden=mode!=='signup';q('#auth-confirm').required=mode==='signup';
   q('#auth-forgot').hidden=mode==='reset';
   q('#auth-submit').textContent=mode==='signup'?'Créer mon compte':mode==='reset'?'Recevoir un lien de récupération':'Se connecter';
   q('#auth-help').textContent=mode==='signup'?'Choisis au moins 8 caractères. Un e-mail pourra te demander de confirmer ton compte.':mode==='reset'?'Saisis ton e-mail. Le lien reçu te permettra de choisir un nouveau mot de passe.':'Retrouve tes données avec ton e-mail et ton mot de passe.';
  }
  update(){
   const user=this.sync.user;q('#auth-security').hidden=!user;
   if(!user)this.clearPasswords();
   if(user&&this.recovery){q('#auth-security').open=true;q('.sync-dialog').showModal();this.message('Choisis ton nouveau mot de passe pour terminer la récupération.');}
  }
  error(e){
   const messages={invalid_credentials:'E-mail ou mot de passe incorrect.',email_not_confirmed:'Confirme ton adresse avec le lien reçu par e-mail avant de te connecter.',over_email_send_rate_limit:'La limite d’envoi d’e-mails est atteinte. La connexion avec un mot de passe existant reste disponible. Réessaie cet envoi plus tard.',over_request_rate_limit:'Trop de tentatives. Patiente avant de réessayer.',email_address_not_authorized:'Supabase ne peut pas envoyer à cette adresse avec son service e-mail actuel. Un service SMTP doit être configuré.',weak_password:'Choisis un mot de passe plus robuste (au moins 8 caractères).',same_password:'Choisis un mot de passe différent du précédent.',reauthentication_needed:'Supabase demande une connexion récente. Reconnecte-toi avant de changer ton mot de passe.'};
   return messages[e.code]||e.message||'Connexion impossible. Vérifie ta connexion Internet puis réessaie.';
  }
  async request(action){
   if(this.busy)return;
   if(!this.sync.client)return this.message('La connexion est indisponible pour le moment. Recharge la page.');
   this.busy=true;this.message('Un instant…');
   const buttons=[...document.querySelectorAll('#sync-login button,#auth-password-form button,#sync-logout')];buttons.forEach(b=>b.disabled=true);
   try{await action();}catch(e){this.message(this.error(e));}finally{this.busy=false;buttons.forEach(b=>b.disabled=false);}
  }
  async submit(){
   if(!q('#sync-login').reportValidity())return;
   const email=q('#sync-email').value.trim(),password=q('#auth-password').value,mode=this.mode;
   if(mode==='signup'&&password!==q('#auth-confirm').value)return this.message('Les deux mots de passe ne correspondent pas.');
   await this.request(async()=>{
    const auth=this.sync.client.auth,redirect=location.origin+location.pathname;
    if(mode==='reset'){
     const {error}=await auth.resetPasswordForEmail(email,{redirectTo:redirect});if(error)throw error;
     this.message('Si un compte correspond à cette adresse, un lien de récupération va être envoyé. Ouvre-le dans ce navigateur.');return;
    }
    const {data,error}=mode==='signup'?await auth.signUp({email,password,options:{emailRedirectTo:redirect}}):await auth.signInWithPassword({email,password});
    if(error)throw error;this.clearPasswords();
    if(data.session){this.sync.user=data.session.user;this.sync.checkAccount();this.message('Connexion réussie.');}
    else this.message('Consulte tes e-mails pour confirmer ton compte. Si tu as déjà un compte, utilise Connexion ou Mot de passe oublié.');
   });
  }
  async setPassword(){
   if(!q('#auth-password-form').reportValidity())return;
   const password=q('#auth-new-password').value;
   if(password!==q('#auth-new-confirm').value)return this.message('Les deux mots de passe ne correspondent pas.');
   await this.request(async()=>{
    const {error}=await this.sync.client.auth.updateUser({password});if(error)throw error;
    this.recovery=false;this.clearPasswords();q('#auth-security').open=false;
    this.message('Mot de passe enregistré. Utilise-le avec ton e-mail sur tous tes appareils.');this.sync.cycle();
   });
  }
 }
 window.PersonalAuth=PersonalAuth;
})();
