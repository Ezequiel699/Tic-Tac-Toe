/* Loading */
window.addEventListener('load', () => {
  const bar = document.querySelector('.loading-bar');
  const container = document.querySelector('.loading-bar-container');
  if (!bar || !container) return;

  const maxWidth = container.offsetWidth;
  let width = 0;

  const interval = setInterval(() => {
    width += 10;
    if (width > maxWidth) width = maxWidth;
    bar.style.width = width + 'px';
    if (width === maxWidth) {
      clearInterval(interval);
      mostrarSlide('slide-2');
    }
  }, 30);
});

/* Slides */
function mostrarSlide(id) {
  document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
  const d = document.getElementById(id);
  if (d) d.classList.add('active');
}

/* Estado */
const state = {
  mode: 'pvp',
  board: Array(9).fill(null),
  current: 'X',
  locked: false,
  p1Name: 'Jugador 1',
  p2Name: 'Jugador 2',
  scores: { p1: 0, p2: 0, draws: 0 }
};
const storageKey = 'ttt_scores_v1';

/* Utils */
function iniciales(n) { return (n||'').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,3).toUpperCase() || 'P1'; }
function saveScores() {
  localStorage.setItem(storageKey, JSON.stringify({ p1Name: state.p1Name, p2Name: state.p2Name, scores: state.scores }));
}
function loadScoresForNames(p1,p2){
  const raw = localStorage.getItem(storageKey);
  if(!raw){ state.scores = {p1:0,p2:0,draws:0}; return; }
  try{
    const d = JSON.parse(raw);
    if(d.p1Name===p1 && d.p2Name===p2 && d.scores){ state.scores = {...d.scores}; }
    else{ state.scores = {p1:0,p2:0,draws:0}; }
  }catch{ state.scores = {p1:0,p2:0,draws:0}; }
}
function updateScoreboard(){
  document.getElementById('p1-wins').textContent = `${state.scores.p1} GANADAS`;
  document.getElementById('p2-wins').textContent = `${state.scores.p2} GANADAS`;
  document.getElementById('empates').textContent = `${state.scores.draws} EMPATES`;
}

/* Inicio juego */
function initGame(mode){
  state.mode = mode; state.current='X'; state.locked=false;
  state.p1Name = document.getElementById('p1-name').textContent || 'Jugador 1';
  state.p2Name = document.getElementById('p2-name').textContent || (mode==='cpu'?'CPU':'Jugador 2');

  document.getElementById('p1-badge').textContent = iniciales(state.p1Name);
  document.getElementById('p2-badge').textContent = iniciales(state.p2Name);
  document.getElementById('p1-short').textContent = iniciales(state.p1Name);
  document.getElementById('p2-short').textContent = iniciales(state.p2Name);

  loadScoresForNames(state.p1Name,state.p2Name);
  updateScoreboard();
  resetBoardOnly();
}

/* Navegación */
document.querySelector('.jugador-vs-jugador')?.addEventListener('click', ()=>mostrarSlide('slide-3'));
document.querySelector('.jugador-vs-cpu')?.addEventListener('click', ()=>mostrarSlide('slide-4'));

document.querySelector('.iniciar-pvp')?.addEventListener('click', ()=>{
  const p1 = document.querySelector('#slide-3 .jugador1')?.value?.trim() || 'Jugador 1';
  const p2 = document.querySelector('#slide-3 .jugador2')?.value?.trim() || 'Jugador 2';
  document.getElementById('p1-name').textContent = p1;
  document.getElementById('p2-name').textContent = p2;
  mostrarSlide('slide-5'); initGame('pvp');
});
document.querySelector('.iniciar-cpu')?.addEventListener('click', ()=>{
  const p1 = document.querySelector('#slide-4 .jugador1')?.value?.trim() || 'Jugador 1';
  document.getElementById('p1-name').textContent = p1;
  document.getElementById('p2-name').textContent = 'CPU';
  mostrarSlide('slide-5'); initGame('cpu');
});

document.querySelector('.back-btn')?.addEventListener('click', ()=>mostrarSlide('slide-2'));

/* Mostrar modal de reinicio */
const resetModal = document.getElementById('reset-modal');
document.querySelector('.reset-btn')?.addEventListener('click', ()=>{
  resetModal.classList.remove('hidden');
});
document.getElementById('reset-cancel')?.addEventListener('click', ()=>{
  resetModal.classList.add('hidden');
});
document.getElementById('reset-confirm')?.addEventListener('click', ()=>{
  resetModal.classList.add('hidden');
  resetBoardOnly();
});

/* Tablero */
const cells = Array.from(document.querySelectorAll('#slide-5 .cell'));
cells.forEach(c=>c.addEventListener('click', onCellClick));
function onCellClick(e){
  if(state.locked) return;
  const idx = Number(e.currentTarget.getAttribute('data-index'));
  if(state.board[idx]) return;
  placeMark(idx,state.current);
  if(checkEndOfRound()) return;
  if(state.mode==='cpu' && state.current==='O'){
    state.locked = true;
    setTimeout(cpuMove,400);
  }
}
function placeMark(i,m){ state.board[i]=m; cells[i].classList.add(m.toLowerCase()); state.current=(m==='X'?'O':'X'); }
function cpuMove(){
  const empty = state.board.map((v,i)=>v?null:i).filter(v=>v!==null);
  if(!empty.length){ state.locked=false; return; }
  const pick = empty[Math.floor(Math.random()*empty.length)];
  placeMark(pick,'O'); state.locked=false; checkEndOfRound();
}

/* Fin de ronda */
const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function winner(m){ return WINS.some(c=>c.every(i=>state.board[i]===m)); }
function isDraw(){ return state.board.every(Boolean); }
function afterPaint(cb){ requestAnimationFrame(()=>requestAnimationFrame(cb)); }

function checkEndOfRound(){
  if(winner('X')){ state.scores.p1++; afterPaint(()=>showWinModal('X')); return true; }
  if(winner('O')){ state.scores.p2++; afterPaint(()=>showWinModal('O')); return true; }
  if(isDraw()){ state.scores.draws++; afterPaint(()=>showWinModal('draw')); return true; }
  return false;
}

/* Modal victoria/derrota */
const winModal = document.getElementById('victoria-modal');
const ganadorNombre = document.getElementById('ganador-nombre');
const titleEl = document.querySelector('.victoria-text');
const trophyEl = document.querySelector('.modal-trophy');

document.getElementById('btn-round')?.addEventListener('click', ()=>{
  winModal.classList.add('hidden'); resetBoardOnly();
});
document.getElementById('btn-salir')?.addEventListener('click', ()=>{
  winModal.classList.add('hidden'); mostrarSlide('slide-2');
});

function showWinModal(result){
  updateScoreboard(); saveScores();

  const cpuWins = (state.mode==='cpu' && result==='O');
  if(cpuWins){
    titleEl.textContent = 'PERDISTE';
    ganadorNombre.textContent = state.p1Name;
    trophyEl.style.backgroundImage = "url('assets/icons/Group 42567.svg')";
  }else{
    titleEl.textContent = 'VICTORIA';
    ganadorNombre.textContent = (result==='X')?state.p1Name : (result==='O')?state.p2Name : 'Empate';
    trophyEl.style.backgroundImage = "url('assets/icons/Group 42539.svg')";
  }

  document.getElementById('modal-p1').textContent = iniciales(state.p1Name);
  document.getElementById('modal-p2').textContent = iniciales(state.p2Name);
  document.getElementById('modal-p1-score').textContent = `${state.scores.p1} GANADAS`;
  document.getElementById('modal-p2-score').textContent = `${state.scores.p2} GANADAS`;
  document.getElementById('modal-draws').textContent   = `${state.scores.draws} EMPATES`;

  winModal.classList.remove('hidden');
}

/* Reset tablero */
function resetBoardOnly(){
  state.board = Array(9).fill(null);
  state.current='X';
  cells.forEach(c=>c.classList.remove('x','o'));
}
