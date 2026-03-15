const baseLevels = [
  [
    '########',
    '#..G...#',
    '#..B...#',
    '#..P...#',
    '#..G.B.#',
    '########',
  ],
  [
    '##########',
    '#....G...#',
    '#.B##....#',
    '#..##.B..#',
    '#..P..G..#',
    '#........#',
    '##########',
  ],
  [
    '##########',
    '#....G...#',
    '#....B...#',
    '#..###...#',
    '#..P.....#',
    '#....G.B.#',
    '##########',
  ],
  [
    '##########',
    '#....G...#',
    '#..##....#',
    '#..B..B..#',
    '#..##....#',
    '#..P.G...#',
    '##########',
  ],
  [
    '##########',
    '#..G..G..#',
    '#..B..B..#',
    '#........#',
    '#...##...#',
    '#...P....#',
    '##########',
  ],
  [
    '##########',
    '#.G......#',
    '#.B.###..#',
    '#...#....#',
    '#...#.B..#',
    '#..G..P..#',
    '##########',
  ],
  [
    '##########',
    '#..G.....#',
    '#..B.##..#',
    '#....##..#',
    '#.P....G.#',
    '#.....B..#',
    '##########',
  ],
  [
    '##########',
    '#..G.....#',
    '#..B.....#',
    '#..###...#',
    '#..#.....#',
    '#..#..P..#',
    '#..G..B..#',
    '##########',
  ],
  [
    '##########',
    '#..G...G.#',
    '#..B...B.#',
    '#........#',
    '#.###....#',
    '#...P....#',
    '##########',
  ],
  [
    '##########',
    '#.....G..#',
    '#.###.B..#',
    '#....#...#',
    '#.P..#...#',
    '#....G.B.#',
    '##########',
  ],
  [
    '##########',
    '#..G.....#',
    '#..B..##.#',
    '#.....##.#',
    '#..P.....#',
    '#..G..B..#',
    '##########',
  ],
  [
    '##########',
    '#....G...#',
    '#....B...#',
    '#.##..##.#',
    '#....P...#',
    '#...G.B..#',
    '##########',
  ],
  [
    '##########',
    '#.G....G.#',
    '#.B....B.#',
    '#..####..#',
    '#....P...#',
    '#........#',
    '##########',
  ],
];

function toMatrix(level) {
  return level.map((row) => row.split(''));
}

function toLevel(matrix) {
  return matrix.map((row) => row.join(''));
}

function mirrorHorizontal(level) {
  return level.map((row) => row.split('').reverse().join(''));
}

function mirrorVertical(level) {
  return [...level].reverse();
}

function rotate180(level) {
  return mirrorVertical(mirrorHorizontal(level));
}

function transformLevel(level, kind) {
  if (kind === 'mirrorH') return mirrorHorizontal(level);
  if (kind === 'mirrorV') return mirrorVertical(level);
  if (kind === 'rotate180') return rotate180(level);
  return level;
}

function findCoords(level, targetChars) {
  const result = [];
  for (let y = 0; y < level.length; y += 1) {
    for (let x = 0; x < level[y].length; x += 1) {
      if (targetChars.includes(level[y][x])) {
        result.push({ x, y });
      }
    }
  }
  return result;
}

function cyclePlayerPosition(level) {
  const matrix = toMatrix(level);
  const floors = [];
  let player = null;

  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      const c = matrix[y][x];
      if (c === '.') floors.push({ x, y });
      if (c === 'P') player = { x, y };
    }
  }

  if (!player || floors.length === 0) return level;

  const nextFloor = floors[(player.x + player.y) % floors.length];
  matrix[player.y][player.x] = '.';
  matrix[nextFloor.y][nextFloor.x] = 'P';
  return toLevel(matrix);
}

function isLevelValid(level) {
  const allRowsSameWidth = level.every((row) => row.length === level[0].length);
  const playerCount = findCoords(level, ['P']).length;
  const boxCount = findCoords(level, ['B']).length;
  const goalCount = findCoords(level, ['G']).length;
  return allRowsSameWidth && playerCount === 1 && boxCount >= 1 && boxCount === goalCount;
}

function buildLevelSet(targetCount) {
  const variants = ['base', 'mirrorH', 'mirrorV', 'rotate180'];
  const generated = [];

  for (const seed of baseLevels) {
    for (const variant of variants) {
      const transformed = transformLevel(seed, variant);
      generated.push(transformed);
      generated.push(cyclePlayerPosition(transformed));
      if (generated.length >= targetCount) break;
    }
    if (generated.length >= targetCount) break;
  }

  const filtered = generated.filter(isLevelValid);
  return filtered.slice(0, targetCount);
}

const levels = buildLevelSet(100);
const CLEARED_STORAGE_KEY = 'sokoban-cleared-levels-v1';

const boardEl = document.getElementById('board');
const stepsEl = document.getElementById('steps');
const shortestEl = document.getElementById('shortest');
const progressEl = document.getElementById('progress');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const nextBtn = document.getElementById('nextBtn');
const debugToggleBtn = document.getElementById('debugToggle');
const stageSelectEl = document.getElementById('stageSelect');
const clearBannerEl = document.getElementById('clearBanner');
const clearDetailEl = document.getElementById('clearDetail');

let currentLevel = 0;
let map = [];
let player = { x: 0, y: 0 };
let steps = 0;
let debugMode = false;
const shortestStepsCache = new Map();
const clearedLevels = loadClearedLevels();

function loadClearedLevels() {
  try {
    const raw = localStorage.getItem(CLEARED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(parsed.filter((x) => Number.isInteger(x) && x >= 0 && x < levels.length));
  } catch {
    return new Set();
  }
}

function saveClearedLevels() {
  localStorage.setItem(CLEARED_STORAGE_KEY, JSON.stringify([...clearedLevels].sort((a, b) => a - b)));
}

function cloneMap(source) {
  return source.map((row) => row.split(''));
}

function hideClearBanner() {
  clearBannerEl.hidden = true;
  clearDetailEl.textContent = '';
}

function updateProgressText() {
  progressEl.textContent = `クリア: ${clearedLevels.size}/${levels.length}`;
}

function updateStageSelect() {
  stageSelectEl.innerHTML = '';
  for (let i = 0; i < levels.length; i += 1) {
    const option = document.createElement('option');
    const clearedMark = clearedLevels.has(i) ? '✅' : '⬜';
    const shortest = getShortestSteps(i);
    const shortestLabel = Number.isFinite(shortest) ? shortest : '--';
    option.value = String(i);
    option.textContent = `${clearedMark} ${i + 1} (最短:${shortestLabel})`;
    if (i === currentLevel) option.selected = true;
    stageSelectEl.append(option);
  }
}

function showClearBanner() {
  clearBannerEl.hidden = false;
  const shortest = getShortestSteps(currentLevel);
  const deltaText = Number.isFinite(shortest) ? `（最短 +${Math.max(0, steps - shortest)}）` : '';

  if (currentLevel < levels.length - 1) {
    clearDetailEl.textContent = `手数 ${steps} ${deltaText} でクリア！「次のステージ」へ進めます。`;
  } else {
    clearDetailEl.textContent = `手数 ${steps} ${deltaText} で最終ステージをクリア！おめでとう！`;
  }
}

function updateShortestLabel() {
  const shortest = getShortestSteps(currentLevel);
  shortestEl.textContent = Number.isFinite(shortest) ? `最短: ${shortest}` : '最短: --';
}

function loadLevel(index) {
  currentLevel = index;
  map = cloneMap(levels[index]);
  steps = 0;
  hideClearBanner();
  statusEl.textContent = `ステージ ${currentLevel + 1} / ${levels.length}`;
  nextBtn.disabled = true;

  for (let y = 0; y < map.length; y += 1) {
    for (let x = 0; x < map[y].length; x += 1) {
      if (map[y][x] === 'P') {
        player = { x, y };
      }
    }
  }

  stageSelectEl.value = String(currentLevel);
  updateShortestLabel();
  render();
}

function tileAt(x, y) {
  if (y < 0 || y >= map.length || x < 0 || x >= map[y].length) return '#';
  return map[y][x];
}

function setTile(x, y, value) {
  map[y][x] = value;
}

function isGoalChar(char) {
  return char === 'G' || char === '+' || char === '*';
}

function isBoxChar(char) {
  return char === 'B' || char === '*';
}

function move(dx, dy) {
  if (nextBtn.disabled === false) return;

  const nx = player.x + dx;
  const ny = player.y + dy;
  const target = tileAt(nx, ny);

  if (target === '#') return;

  if (isBoxChar(target)) {
    const bx = nx + dx;
    const by = ny + dy;
    const behind = tileAt(bx, by);
    if (behind === '#' || isBoxChar(behind)) return;

    setTile(bx, by, isGoalChar(behind) ? '*' : 'B');
    setTile(nx, ny, target === '*' ? 'G' : '.');
  }

  const current = tileAt(player.x, player.y);
  setTile(player.x, player.y, current === '+' ? 'G' : '.');

  setTile(nx, ny, isGoalChar(target) ? '+' : 'P');
  player = { x: nx, y: ny };
  steps += 1;

  if (isCleared()) {
    clearedLevels.add(currentLevel);
    saveClearedLevels();
    updateProgressText();
    updateStageSelect();

    statusEl.textContent = `ステージ ${currentLevel + 1} クリア！ 手数 ${steps}`;
    showClearBanner();
    if (currentLevel < levels.length - 1 || debugMode) {
      nextBtn.disabled = false;
    }
  }

  render();
}

function isCleared() {
  for (const row of map) {
    if (row.includes('B')) {
      return false;
    }
  }
  return true;
}

function render() {
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${map[0].length}, var(--cell-size))`;

  for (let y = 0; y < map.length; y += 1) {
    for (let x = 0; x < map[y].length; x += 1) {
      const c = map[y][x];
      const cell = document.createElement('div');
      cell.classList.add('cell');

      if (c === '#') {
        cell.classList.add('wall');
      } else {
        cell.classList.add('floor');
        if (c === 'G' || c === '+' || c === '*') {
          cell.classList.add('goal');
          cell.textContent = '⭐';
        }
        if (c === 'B' || c === '*') {
          cell.classList.add('box');
          cell.textContent = '📦';
        }
        if (c === 'P' || c === '+') {
          cell.classList.add('player');
          cell.textContent = '🙂';
        }
      }

      boardEl.append(cell);
    }
  }

  stepsEl.textContent = `手数: ${steps} | ステージ: ${currentLevel + 1}/${levels.length}`;
}

function parseLevelForSolver(level) {
  const height = level.length;
  const width = level[0].length;
  const walls = new Set();
  const goals = new Set();
  const boxes = [];
  let startPlayer = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const ch = level[y][x];
      const idx = y * width + x;
      if (ch === '#') walls.add(idx);
      if (ch === 'G') goals.add(idx);
      if (ch === 'B') boxes.push(idx);
      if (ch === 'P') startPlayer = idx;
    }
  }

  return { width, height, walls, goals, boxes, startPlayer };
}

function serializeBoxes(boxes) {
  return boxes.slice().sort((a, b) => a - b).join(',');
}

function getShortestSteps(levelIndex) {
  if (shortestStepsCache.has(levelIndex)) {
    return shortestStepsCache.get(levelIndex);
  }

  const level = levels[levelIndex];
  const { width, height, walls, goals, boxes, startPlayer } = parseLevelForSolver(level);
  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];

  const initialBoxesKey = serializeBoxes(boxes);
  const initialKey = `${startPlayer}|${initialBoxesKey}`;
  const queue = [{ p: startPlayer, b: boxes, d: 0 }];
  const visited = new Set([initialKey]);

  let head = 0;
  while (head < queue.length) {
    const state = queue[head];
    head += 1;

    const currentBoxesSet = new Set(state.b);
    let solved = true;
    for (const b of state.b) {
      if (!goals.has(b)) {
        solved = false;
        break;
      }
    }
    if (solved) {
      shortestStepsCache.set(levelIndex, state.d);
      return state.d;
    }

    const px = state.p % width;
    const py = Math.floor(state.p / width);

    for (const [dx, dy] of dirs) {
      const nx = px + dx;
      const ny = py + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const nidx = ny * width + nx;
      if (walls.has(nidx)) continue;

      if (!currentBoxesSet.has(nidx)) {
        const key = `${nidx}|${serializeBoxes(state.b)}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ p: nidx, b: state.b, d: state.d + 1 });
        }
        continue;
      }

      const bx = nx + dx;
      const by = ny + dy;
      if (bx < 0 || bx >= width || by < 0 || by >= height) continue;
      const bidx = by * width + bx;
      if (walls.has(bidx) || currentBoxesSet.has(bidx)) continue;

      const nextBoxes = state.b.map((value) => (value === nidx ? bidx : value));
      const nextBoxesKey = serializeBoxes(nextBoxes);
      const key = `${nidx}|${nextBoxesKey}`;
      if (visited.has(key)) continue;

      visited.add(key);
      queue.push({ p: nidx, b: nextBoxes, d: state.d + 1 });
    }
  }

  shortestStepsCache.set(levelIndex, null);
  return null;
}

const keyMap = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  w: [0, -1],
  s: [0, 1],
  a: [-1, 0],
  d: [1, 0],
};

document.addEventListener('keydown', (event) => {
  const dir = keyMap[event.key];
  if (!dir) return;
  event.preventDefault();
  move(dir[0], dir[1]);
});

resetBtn.addEventListener('click', () => loadLevel(currentLevel));
nextBtn.addEventListener('click', () => loadLevel(Math.min(currentLevel + 1, levels.length - 1)));

debugToggleBtn.addEventListener('click', () => {
  debugMode = !debugMode;
  debugToggleBtn.textContent = `デバッグ: ${debugMode ? 'ON' : 'OFF'}`;
  debugToggleBtn.setAttribute('aria-pressed', String(debugMode));
  stageSelectEl.disabled = !debugMode;
  statusEl.textContent = debugMode
    ? `デバッグモードON: 任意のステージに移動できます（${currentLevel + 1}/${levels.length}）`
    : `ステージ ${currentLevel + 1} / ${levels.length}`;
});

stageSelectEl.addEventListener('change', () => {
  if (!debugMode) return;
  const nextLevel = Number(stageSelectEl.value);
  if (!Number.isInteger(nextLevel)) return;
  loadLevel(nextLevel);
});

const touchDirMap = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

for (const button of document.querySelectorAll('.dir')) {
  const handleDirection = (event) => {
    event.preventDefault();
    const dir = touchDirMap[button.dataset.dir];
    if (!dir) return;
    move(dir[0], dir[1]);
  };

  button.addEventListener('click', handleDirection);
  button.addEventListener('touchstart', handleDirection, { passive: false });
}

updateProgressText();
updateStageSelect();
loadLevel(0);
