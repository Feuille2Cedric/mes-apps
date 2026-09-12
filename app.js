const onlineApps = [
  {
    name: 'Club 33',
    short: '33',
    repo: 'club-33',
    category: 'Musique',
    accent: '#ff7a59',
    url: 'https://feuille2cedric.github.io/club-33/',
    github: 'https://github.com/Feuille2Cedric/club-33',
    description: "Club d'ecoute avec albums hebdomadaires, notes par personne, historique et classement des proposeurs."
  },
  {
    name: 'Dragon Quiz',
    short: 'DB',
    repo: 'dragon-ball',
    category: 'Jeu',
    accent: '#f59e0b',
    url: 'https://feuille2cedric.github.io/dragon-ball/',
    github: 'https://github.com/Feuille2Cedric/dragon-ball',
    description: 'Quiz Dragon Ball francais avec modes de jeu, progression, bonus et stats locales.'
  },
  {
    name: 'Grand Line Quiz',
    short: 'OP',
    repo: 'one-piece',
    category: 'Jeu',
    accent: '#2563eb',
    url: 'https://feuille2cedric.github.io/one-piece/',
    github: 'https://github.com/Feuille2Cedric/one-piece',
    description: 'Quiz One Piece avec routes, rush, survie, defi quotidien et memory a deux joueurs.'
  },
  {
    name: 're:trouve',
    short: 'RT',
    repo: 'retrouve-vinted',
    category: 'Shopping',
    accent: '#14b8a6',
    url: 'https://feuille2cedric.github.io/retrouve-vinted/',
    github: 'https://github.com/Feuille2Cedric/retrouve-vinted',
    description: 'Assistant Vinted pour preparer les recherches, garder les favoris et filtrer les resultats.'
  },
  {
    name: 'Framed',
    short: 'FR',
    repo: 'Framed',
    category: 'Cinema',
    accent: '#a855f7',
    url: 'https://feuille2cedric.github.io/Framed/',
    github: 'https://github.com/Feuille2Cedric/Framed',
    description: "Jeu pour deviner des films a partir d'images et d'indices progressifs."
  },
  {
    name: 'CineQuizz',
    short: 'CQ',
    repo: 'CineQuizz',
    category: 'Cinema',
    accent: '#ef4444',
    url: 'https://feuille2cedric.github.io/CineQuizz/',
    github: 'https://github.com/Feuille2Cedric/CineQuizz',
    description: 'Quiz cinema deploye sur GitHub Pages.'
  },
  {
    name: 'habitude',
    short: 'HB',
    repo: 'habitude',
    category: 'Perso',
    accent: '#22c55e',
    url: 'https://feuille2cedric.github.io/habitude/',
    github: 'https://github.com/Feuille2Cedric/habitude',
    description: "Application de suivi d'habitudes publiee sur GitHub Pages."
  }
];

const localProjects = [
  { name: 'absolutDirector', folder: 'DEV/absolutDirector', status: 'Local', description: 'Projet local avec une page HTML, pas de GitHub Pages detecte.' },
  { name: 'framed', folder: 'DEV/framed', status: 'Local', description: 'Version locale du jeu Framed.' },
  { name: 'one', folder: 'DEV/one', status: 'A completer', description: 'Dossier present dans DEV, sans index.html ni README detecte.' }
];

const STORAGE_KEY = 'mes-apps-manual';
const onlineGrid = document.querySelector('#online-grid');
const manualGrid = document.querySelector('#manual-grid');
const localGrid = document.querySelector('#local-grid');
const search = document.querySelector('#search');
const onlineCount = document.querySelector('#online-count');
const dialog = document.querySelector('#app-dialog');
const form = document.querySelector('#app-form');
let activeFilter = 'all';
let manualApps = loadManualApps();

function loadManualApps() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(app => app.name && app.url) : [];
  } catch {
    return [];
  }
}

function saveManualApps() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(manualApps));
  window.mesAppsSync?.mark();
}

function normalize(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function includesQuery(item) {
  const query = normalize(search.value.trim());
  if (!query) return true;
  return normalize(Object.values(item).join(' ')).includes(query);
}

function filterOnline(app) {
  return activeFilter !== 'local' && includesQuery(app);
}

function filterLocal(project) {
  return activeFilter !== 'online' && includesQuery(project);
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'AP';
}

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function card(app, index, manual = false) {
  app = {...app, url: safeUrl(app.url) ? app.url : '#', github: safeUrl(app.github) ? app.github : '', accent: /^#[0-9a-f]{6}$/i.test(app.accent) ? app.accent : '#3056d3'};
  app = Object.fromEntries(Object.entries(app).map(([key,value]) => [key, escapeHTML(value)]));
  return `
    <article class="app-card" style="--accent:${app.accent}">
      <div class="card-top">
        <span class="app-icon">${app.short || initials(app.name)}</span>
        <span class="pill">${app.category}</span>
      </div>
      <div>
        <h3>${app.name}</h3>
        <p>${app.description}</p>
      </div>
      <div class="app-meta">
        <span>${app.repo}</span>
        <span>Pages</span>
      </div>
      <div class="actions">
        <a class="launch" href="${app.url}" target="_blank" rel="noopener noreferrer">Ouvrir</a>
        ${app.github ? `<a href="${app.github}" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''}
        ${manual ? `<button type="button" data-delete-manual="${app.id}">Supprimer</button>` : ''}
      </div>
    </article>
  `;
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function safeUrl(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol); } catch { return false; }
}

function localRow(project) {
  return `
    <article class="local-card">
      <div class="local-main">
        <strong>${project.name}</strong>
        <span>${project.folder}</span>
      </div>
      <p>${project.description}</p>
      <span class="local-status">${project.status}</span>
    </article>
  `;
}

function render() {
  const online = onlineApps.filter(filterOnline);
  const manual = manualApps.filter(filterOnline);
  const local = localProjects.filter(filterLocal);
  onlineCount.textContent = onlineApps.length + manualApps.length;
  onlineGrid.innerHTML = online.map((app,index)=>card(app,index)).join('') || '<p class="empty">Aucune app en ligne ne correspond a la recherche.</p>';
  manualGrid.innerHTML = manual.map((app, index) => card(app, index, true)).join('') || '<p class="empty">Aucune app ajoutee a la main.</p>';
  localGrid.innerHTML = local.map(localRow).join('') || '<p class="empty">Aucun projet local ne correspond a la recherche.</p>';
  document.querySelector('#online').hidden = activeFilter === 'local';
  onlineGrid.hidden = activeFilter === 'local';
  document.querySelector('#manual').hidden = activeFilter === 'local';
  manualGrid.hidden = activeFilter === 'local';
  document.querySelector('#local').hidden = activeFilter === 'online';
  localGrid.hidden = activeFilter === 'online';
}

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('active', item === button));
    render();
  });
});

search.addEventListener('input', render);
document.querySelector('#add-app').addEventListener('click', () => {
  form.reset();
  form.querySelector('.form-error').textContent = '';
  dialog.showModal();
});
document.querySelector('.icon-close').addEventListener('click', () => dialog.close());
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const name = data.name.trim();
  const url = data.url.trim();
  const github = data.github.trim();
  const category = data.category.trim() || 'App';
  const description = data.description.trim() || 'App ajoutee manuellement.';
  try {
    if (!safeUrl(url) || github && !safeUrl(github)) throw Error('URL');
  } catch {
    form.querySelector('.form-error').textContent = 'Entre une URL valide.';
    return;
  }
  manualApps.unshift({ id: makeId(), name, short: initials(name), repo: new URL(url).hostname, category, accent: '#3056d3', url, github, description });
  saveManualApps();
  dialog.close();
  render();
});
manualGrid.addEventListener('click', event => {
  const button = event.target.closest('[data-delete-manual]');
  if (!button) return;
  manualApps = manualApps.filter(app => app.id !== button.dataset.deleteManual);
  saveManualApps();
  render();
});
render();

if(window.startMesAppsSync)window.startMesAppsSync();
