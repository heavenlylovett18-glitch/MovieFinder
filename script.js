const API_KEY = 'f8bb3171';
const API_URL = 'https://www.omdbapi.com/';

const form = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const sortSelect = document.querySelector('#sort-select');
const grid = document.querySelector('#movie-grid');
const status = document.querySelector('#status');
const count = document.querySelector('#result-count');
const loadMore = document.querySelector('#load-more');
document.querySelector('#year').textContent = new Date().getFullYear();

let movies = [];
let currentQuery = '';
let currentPage = 0;
let totalResults = 0;
let isLoading = false;
let requestVersion = 0;

function showStatus(title, message, loading = false) {
  status.hidden = false;
  status.innerHTML = '';
  const visual = document.createElement('div');
  visual.className = loading ? 'spinner' : 'empty-icon';
  if (!loading) visual.textContent = '🎞️';
  const heading = document.createElement('h3');
  heading.textContent = title;
  const paragraph = document.createElement('p');
  paragraph.textContent = message;
  status.append(visual, heading, paragraph);
}

function sortedMovies() {
  const list = [...movies];
  const titleCompare = (a, b) => a.Title.localeCompare(b.Title);
  const year = item => parseInt(item.Year, 10) || 0;
  switch (sortSelect.value) {
    case 'za': return list.sort((a, b) => titleCompare(b, a));
    case 'newest': return list.sort((a, b) => year(b) - year(a) || titleCompare(a, b));
    case 'oldest': return list.sort((a, b) => year(a) - year(b) || titleCompare(a, b));
    default: return list.sort(titleCompare);
  }
}

function renderMovies() {
  grid.replaceChildren();
  for (const movie of sortedMovies()) {
    const card = document.createElement('article');
    card.className = 'movie-card';
    if (movie.Poster && movie.Poster !== 'N/A') {
      const poster = document.createElement('img');
      poster.className = 'poster';
      poster.src = movie.Poster;
      poster.alt = `Poster for ${movie.Title}`;
      poster.loading = 'lazy';
      poster.onerror = () => { const fallback = document.createElement('div'); fallback.className = 'poster-fallback'; fallback.textContent = '🎬'; poster.replaceWith(fallback); };
      card.append(poster);
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'poster-fallback';
      fallback.textContent = '🎬';
      card.append(fallback);
    }
    const info = document.createElement('div');
    info.className = 'movie-info';
    const heading = document.createElement('h3');
    heading.textContent = movie.Title;
    const meta = document.createElement('div');
    meta.className = 'movie-meta';
    const release = document.createElement('span');
    release.textContent = movie.Year;
    const type = document.createElement('span');
    type.textContent = movie.Type === 'movie' ? 'Movie' : movie.Type === 'series' ? 'Series' : 'Episode';
    meta.append(release, type);
    info.append(heading, meta);
    card.append(info);
    grid.append(card);
  }
  status.hidden = movies.length > 0;
  count.textContent = `${movies.length} of ${totalResults} results for “${currentQuery}”`;
  loadMore.hidden = movies.length >= totalResults;
}

async function fetchMovies(query, page, version) {
  isLoading = true;
  loadMore.hidden = true;
  if (page === 1) { grid.replaceChildren(); showStatus('Searching movies...', 'Fetching results from OMDb.', true); count.textContent = 'Loading...'; }
  else { loadMore.textContent = 'Loading...'; loadMore.hidden = false; loadMore.disabled = true; }
  try {
    const params = new URLSearchParams({ apikey: API_KEY, s: query, page: String(page) });
    const response = await fetch(`${API_URL}?${params}`);
    if (!response.ok) throw new Error(`Movie service returned HTTP ${response.status}. Please try again.`);
    const data = await response.json();
    if (version !== requestVersion) return;
    if (data.Response === 'False') {
      if (page === 1) { movies = []; totalResults = 0; grid.replaceChildren(); count.textContent = '0 results'; showStatus('No movies found', data.Error || 'Try another movie title.'); }
      else { loadMore.hidden = true; }
      return;
    }
    totalResults = Number(data.totalResults) || 0;
    currentPage = page;
    const existingIds = new Set(movies.map(movie => movie.imdbID));
    for (const movie of data.Search || []) if (!existingIds.has(movie.imdbID)) { movies.push(movie); existingIds.add(movie.imdbID); }
    renderMovies();
  } catch (error) {
    if (version !== requestVersion) return;
    if (page === 1) { count.textContent = 'Unable to load results'; showStatus('Something went wrong', error.message); }
    else { showStatus('Could not load more', error.message); }
  } finally {
    if (version === requestVersion) {
      isLoading = false;
      loadMore.disabled = false;
      loadMore.textContent = 'Load more movies';
    }
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (query.length < 2) return;
  currentQuery = query;
  currentPage = 0;
  totalResults = 0;
  movies = [];
  requestVersion++;
  fetchMovies(query, 1, requestVersion);
  document.querySelector('#results').scrollIntoView({ behavior: 'smooth' });
});
sortSelect.addEventListener('change', () => { if (movies.length) renderMovies(); });
loadMore.addEventListener('click', () => { if (!isLoading && movies.length < totalResults) fetchMovies(currentQuery, currentPage + 1, requestVersion); });

searchInput.value = 'Batman';
currentQuery = 'Batman';
requestVersion++;
fetchMovies(currentQuery, 1, requestVersion);
