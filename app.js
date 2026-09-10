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

const onlineGrid = document.querySelector('#online-grid');
const localGrid = document.querySelector('#local-grid');
const search = document.querySelector('#search');
const onlineCount = document.querySelector('#online-count');
const localCount = document.querySelector('#local-count');
let activeFilter = 'all';

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

function card(app, index) {
  return `
    <article class="app-card" style="--accent:${app.accent}">
      <div class="card-top">
        <span class="app-icon">${app.short}</span>
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
        <a href="${app.github}" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </article>
  `;
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
  const local = localProjects.filter(filterLocal);
  onlineCount.textContent = onlineApps.length;
  onlineGrid.innerHTML = online.map(card).join('') || '<p class="empty">Aucune app en ligne ne correspond a la recherche.</p>';
  localGrid.innerHTML = local.map(localRow).join('') || '<p class="empty">Aucun projet local ne correspond a la recherche.</p>';
  document.querySelector('#online').hidden = activeFilter === 'local';
  onlineGrid.hidden = activeFilter === 'local';
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
render();
