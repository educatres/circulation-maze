const organInfo = {
  H: { name: '心臟', icon: '❤️', fact: '心臟像幫浦推動血液，是全身循環與肺循環的出發站。' },
  L: { name: '肺臟', icon: '🫁', fact: '肺泡周圍的微血管讓血液排出二氧化碳、取得氧氣。' },
  I: { name: '小腸', icon: '🌀', fact: '小腸絨毛增加吸收面積，葡萄糖與胺基酸會進入血液。' },
  V: { name: '肝臟', icon: '🟤', fact: '肝臟調節養分，也能把有毒的氨轉成較容易排除的尿素。' },
  K: { name: '腎臟', icon: '🫘', fact: '腎臟過濾血液，把尿素、多餘水分與鹽類形成尿液排出。' },
  B: { name: '大腦', icon: '🧠', fact: '大腦需要穩定供應氧氣與葡萄糖，才能維持神經活動。' },
  M: { name: '肌肉', icon: '💪', fact: '肌肉細胞使用氧氣與葡萄糖產生能量，並製造二氧化碳等代謝物。' }
};

const organCells = new Set(Object.keys(organInfo));

const mazeMap = [
  '###############',
  '#B...#...L...K#',
  '#.##.#.#.#.##.#',
  '#....#.#.#....#',
  '#.####.#.####.#',
  '#.....H.......#',
  '###.##.#.##.###',
  '#....#.#.#....#',
  '#.##.#.#.#.##.#',
  '#I...#...V...M#',
  '#.###.###.###.#',
  '#.....#.#.....#',
  '###.#.....#.###',
  '#.............#',
  '###############'
];

const levels = [
  {
    title: '任務一：二氧化碳過高，先去肺臟',
    story: '你剛從組織回到心臟，血液中的 CO2 偏高。必須先到肺臟完成氣體交換，變成含氧血後，才能把氧氣送到肌肉。',
    cargo: ['起始狀態：CO2 偏高', '必經器官：肺臟', '目的地：肌肉'],
    route: ['L', 'M'],
    start: 'H',
    status: ['CO2 偏高', '含氧血', '氧氣送達肌肉'],
    moving: ['co2', 'plaque', 'glucose']
  },
  {
    title: '任務二：早餐養分送往大腦',
    story: '早餐被消化後，先到小腸吸收葡萄糖與胺基酸，再經過肝臟調節，最後供應大腦。',
    cargo: ['取得：葡萄糖', '取得：胺基酸', '目的地：大腦'],
    route: ['I', 'V', 'B'],
    start: 'H',
    status: ['空車血液', '載入養分', '肝臟調節完成', '大腦獲得能量'],
    moving: ['pathogen', 'amino', 'plaque']
  },
  {
    title: '任務三：運動後的廢物處理',
    story: '肌肉活動後產生代謝廢物。從肌肉出發，先到肝臟處理含氮廢物，再到腎臟完成過濾。',
    cargo: ['起點：肌肉', '處理：肝臟', '排除：腎臟'],
    route: ['V', 'K'],
    start: 'M',
    status: ['代謝廢物增加', '尿素形成', '腎臟過濾完成'],
    moving: ['toxin', 'co2', 'glucose']
  },
  {
    title: '任務四：大腦需要氧氣與葡萄糖',
    story: '大腦不能缺氧，也需要葡萄糖。先到肺臟補氧，再到小腸載入葡萄糖，最後送往大腦。',
    cargo: ['先取得：氧氣', '再取得：葡萄糖', '目的地：大腦'],
    route: ['L', 'I', 'B'],
    start: 'H',
    status: ['等待補給', '氧氣充足', '氧氣與葡萄糖齊備', '供應大腦完成'],
    moving: ['pathogen', 'toxin', 'amino']
  },
  {
    title: '最終任務：供應運動中的肌肉',
    story: '肌肉正在快速收縮，需要葡萄糖和氧氣。先到小腸載入養分，再到肺臟補氧，最後前往肌肉。',
    cargo: ['載入：葡萄糖', '補充：氧氣', '目的地：肌肉'],
    route: ['I', 'L', 'M'],
    start: 'H',
    status: ['準備補給', '養分充足', '氧氣與養分齊備', '肌肉供能完成'],
    moving: ['plaque', 'co2', 'toxin', 'glucose']
  }
];

const moverKinds = {
  co2: { name: '二氧化碳團', icon: 'CO₂', message: '二氧化碳亂流讓血液運輸受阻；要到肺臟才是真正的氣體交換。' },
  glucose: { name: '游離葡萄糖', icon: '糖', message: '游離養分撞上血球會干擾路線；吸收養分要走小腸微血管。' },
  amino: { name: '胺基酸流', icon: '胺', message: '胺基酸在血管中移動，但任務要靠正確器官完成吸收與運送。' },
  toxin: { name: '有害物質', icon: '毒', message: '有害物質會傷害血液運輸，請避開並前往肝腎處理路線。' },
  pathogen: { name: '病原體', icon: '菌', message: '病原體阻礙循環任務，保持距離！' },
  plaque: { name: '血管斑塊', icon: '脂', message: '血管斑塊讓通道變窄，碰到會讓任務延誤。' }
};

const moverSpawns = [
  { r: 1, c: 3, dr: 0, dc: 1 },
  { r: 3, c: 13, dr: 1, dc: 0 },
  { r: 7, c: 1, dr: 0, dc: 1 },
  { r: 11, c: 5, dr: 0, dc: -1 },
  { r: 13, c: 11, dr: 0, dc: -1 }
];

let state = {
  level: 0,
  score: 0,
  lives: 3,
  pos: { r: 5, c: 6 },
  step: 0,
  correct: 0,
  total: 0,
  reviews: [],
  movers: [],
  locked: false,
  timer: null
};

const $ = id => document.getElementById(id);
const screens = ['introScreen', 'gameScreen', 'resultScreen'];

function showScreen(id) {
  screens.forEach(screen => $(screen).classList.toggle('active', screen === id));
}

function startGame() {
  clearMoverLoop();
  state = {
    level: 0,
    score: 0,
    lives: 3,
    pos: { r: 5, c: 6 },
    step: 0,
    correct: 0,
    total: 0,
    reviews: [],
    movers: [],
    locked: false,
    timer: null
  };
  showScreen('gameScreen');
  loadLevel();
}

function loadLevel() {
  const level = levels[state.level];
  state.step = 0;
  state.locked = false;
  state.pos = findOrgan(level.start);
  state.movers = makeMovers(level);
  $('missionTitle').textContent = level.title;
  $('missionStory').textContent = level.story;
  $('cargoList').innerHTML = level.cargo.map(item => `<span class="cargo-chip">${item}</span>`).join('');
  $('feedback').textContent = `下一站：${organInfo[level.route[0]].name}。避開移動物質，選對器官通過。`;
  updateKnowledge(level.start);
  render();
  updateHUD();
  startMoverLoop();
}

function findOrgan(code) {
  for (let r = 0; r < mazeMap.length; r++) {
    const c = mazeMap[r].indexOf(code);
    if (c >= 0) return { r, c };
  }
  return { r: 5, c: 6 };
}

function makeMovers(level) {
  return level.moving.map((kind, index) => ({
    ...moverKinds[kind],
    kind,
    r: moverSpawns[index].r,
    c: moverSpawns[index].c,
    dr: moverSpawns[index].dr,
    dc: moverSpawns[index].dc
  }));
}

function render() {
  const maze = $('maze');
  maze.style.gridTemplateColumns = `repeat(${mazeMap[0].length}, 1fr)`;
  maze.innerHTML = '';
  const expected = currentExpectedOrgan();

  mazeMap.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      const cell = document.createElement('div');
      cell.className = `cell ${ch === '#' ? 'wall' : 'path'}`;

      if (organCells.has(ch)) {
        const organ = organInfo[ch];
        cell.classList.add('organ-cell');
        cell.dataset.label = organ.name;
        cell.textContent = organ.icon;
        const routeIndex = levels[state.level].route.indexOf(ch);
        if (ch === expected) cell.classList.add('next-organ');
        if (routeIndex >= 0 && routeIndex < state.step) cell.classList.add('organ-done');
      }

      const mover = state.movers.find(item => item.r === r && item.c === c);
      if (mover) {
        const marker = document.createElement('span');
        marker.className = `mover mover-${mover.kind}`;
        marker.textContent = mover.icon;
        marker.title = mover.name;
        cell.appendChild(marker);
      }

      if (state.pos.r === r && state.pos.c === c) {
        cell.classList.add('player');
      }

      maze.appendChild(cell);
    });
  });

  $('positionLabel').textContent = describePosition();
  $('gateLabel').textContent = `${state.step}/${levels[state.level].route.length}`;
  $('streakLabel').textContent = currentExpectedOrgan() ? organInfo[currentExpectedOrgan()].name : '完成';
}

function updateHUD() {
  $('levelLabel').textContent = `${state.level + 1}/${levels.length}`;
  $('scoreLabel').textContent = state.score;
  $('lifeLabel').textContent = '❤'.repeat(state.lives) + '♡'.repeat(3 - state.lives);
}

function currentExpectedOrgan() {
  return levels[state.level].route[state.step];
}

function describePosition() {
  const ch = mazeMap[state.pos.r][state.pos.c];
  if (organCells.has(ch)) return organInfo[ch].name;
  return `血管通道 ${state.pos.r + 1}-${state.pos.c + 1}`;
}

function updateKnowledge(code) {
  const info = organInfo[code] || {
    name: '微血管通道',
    icon: '🩸',
    fact: '微血管是血液與組織細胞交換物質的重要場所。'
  };
  $('organName').textContent = info.name;
  $('organIcon').textContent = info.icon;
  $('organFact').textContent = info.fact;
}

function move(dr, dc) {
  if (state.locked) return;
  const nr = state.pos.r + dr;
  const nc = state.pos.c + dc;
  if (!isWalkable(nr, nc)) {
    bump('血管壁擋住了，換一條路！');
    return;
  }

  state.pos = { r: nr, c: nc };
  const tile = mazeMap[nr][nc];
  if (organCells.has(tile)) {
    visitOrgan(tile);
  } else {
    state.score += 1;
    updateKnowledge('.');
  }

  moveHazards();
  checkMoverCollision();
  render();
  updateHUD();
}

function isWalkable(r, c) {
  return r >= 0 && c >= 0 && r < mazeMap.length && c < mazeMap[0].length && mazeMap[r][c] !== '#';
}

function visitOrgan(code) {
  updateKnowledge(code);
  const level = levels[state.level];
  const expected = currentExpectedOrgan();

  if (!expected) return;
  if (code === level.start && state.step === 0) {
    $('feedback').textContent = `從${organInfo[code].name}出發，先找${organInfo[expected].name}。`;
    return;
  }

  state.total++;
  if (code === expected) {
    state.correct++;
    state.score += 18 + state.step * 4;
    const statusText = level.status[state.step + 1] || '狀態更新';
    state.step++;
    state.reviews.push(`✅ ${level.title}：經過${organInfo[code].name}，${statusText}`);

    if (state.step >= level.route.length) {
      completeLevel();
      return;
    }

    $('feedback').textContent = `正確！現在狀態：${statusText}。下一站：${organInfo[currentExpectedOrgan()].name}。`;
    return;
  }

  state.lives--;
  state.score = Math.max(0, state.score - 8);
  state.reviews.push(`❌ ${level.title}：誤入${organInfo[code].name}，應先到${organInfo[expected].name}`);
  bump(`路線不對：目前應先到${organInfo[expected].name}，不是${organInfo[code].name}。`);
  if (state.lives <= 0) finish(false);
}

function completeLevel() {
  const level = levels[state.level];
  const finalStatus = level.status[level.status.length - 1];
  state.score += 25;
  state.reviews.push(`🏁 ${level.title}：${finalStatus}`);

  if (state.level === levels.length - 1) {
    finish(true);
    return;
  }

  state.level++;
  loadLevel();
}

function moveHazards() {
  state.movers.forEach(mover => {
    let nr = mover.r + mover.dr;
    let nc = mover.c + mover.dc;
    if (!isMoverPath(nr, nc)) {
      mover.dr *= -1;
      mover.dc *= -1;
      nr = mover.r + mover.dr;
      nc = mover.c + mover.dc;
    }
    if (isMoverPath(nr, nc)) {
      mover.r = nr;
      mover.c = nc;
    }
  });
}

function isMoverPath(r, c) {
  return isWalkable(r, c) && !organCells.has(mazeMap[r][c]);
}

function checkMoverCollision() {
  const hit = state.movers.find(mover => mover.r === state.pos.r && mover.c === state.pos.c);
  if (!hit) return;
  state.lives--;
  state.score = Math.max(0, state.score - 10);
  state.pos = findOrgan(levels[state.level].start);
  state.reviews.push(`⚠️ ${levels[state.level].title}：碰到${hit.name}`);
  bump(hit.message + ' 回到起點重新規劃路線。');
  if (state.lives <= 0) finish(false);
}

function startMoverLoop() {
  clearMoverLoop();
  state.timer = setInterval(() => {
    if (state.locked || !document.getElementById('gameScreen').classList.contains('active')) return;
    moveHazards();
    checkMoverCollision();
    render();
    updateHUD();
  }, 900);
}

function clearMoverLoop() {
  if (state.timer) clearInterval(state.timer);
}

function bump(message) {
  $('feedback').textContent = message;
  $('maze').classList.remove('shake');
  void $('maze').offsetWidth;
  $('maze').classList.add('shake');
  updateHUD();
}

function finish(win) {
  clearMoverLoop();
  showScreen('resultScreen');
  const accuracy = state.total ? Math.round((state.correct / state.total) * 100) : 0;
  $('resultIcon').textContent = win ? '🏆' : '🩹';
  $('resultTitle').textContent = win ? '循環運輸大師！' : '任務暫停，重新整備！';
  $('resultText').textContent = win
    ? '你已完成肺部氣體交換、養分吸收、肝臟處理、腎臟排除與組織供應任務。'
    : '生命值用完了。複習器官功能與任務順序後，再挑戰一次。';
  $('finalScore').textContent = state.score;
  $('accuracy').textContent = accuracy + '%';
  $('completedLevels').textContent = `${win ? levels.length : state.level}/${levels.length}`;
  $('reviewList').innerHTML = '<h3>學習紀錄</h3>' + state.reviews.map(item => `<div class="review-item">${item}</div>`).join('');
}

function hint() {
  if (state.score >= 5) state.score -= 5;
  const expected = currentExpectedOrgan();
  if (!expected) return;
  const next = findOrgan(expected);
  const direction = firstStepToward(state.pos, next);
  $('feedback').textContent = `提示：下一個正確器官是${organInfo[expected].name}，可以先往${direction}探索。`;
  updateHUD();
}

function firstStepToward(start, goal) {
  const queue = [{ ...start, path: [] }];
  const seen = new Set([`${start.r},${start.c}`]);
  const dirs = [
    { dr: -1, dc: 0, label: '上方' },
    { dr: 1, dc: 0, label: '下方' },
    { dr: 0, dc: -1, label: '左方' },
    { dr: 0, dc: 1, label: '右方' }
  ];

  while (queue.length) {
    const node = queue.shift();
    if (node.r === goal.r && node.c === goal.c) return node.path[0] || '附近';
    dirs.forEach(dir => {
      const nr = node.r + dir.dr;
      const nc = node.c + dir.dc;
      const key = `${nr},${nc}`;
      if (!seen.has(key) && isWalkable(nr, nc)) {
        seen.add(key);
        queue.push({ r: nr, c: nc, path: [...node.path, dir.label] });
      }
    });
  }

  return '附近';
}

$('startBtn').onclick = startGame;
$('playAgainBtn').onclick = startGame;
$('restartLevelBtn').onclick = () => {
  state.score = Math.max(0, state.score - 5);
  loadLevel();
};
$('hintBtn').onclick = hint;
$('openGuideBtn').onclick = () => $('guideDialog').showModal();

document.querySelectorAll('[data-dir]').forEach(button => {
  button.onclick = () => ({
    up: () => move(-1, 0),
    down: () => move(1, 0),
    left: () => move(0, -1),
    right: () => move(0, 1)
  })[button.dataset.dir]();
});

addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  const moves = {
    arrowup: [-1, 0],
    w: [-1, 0],
    arrowdown: [1, 0],
    s: [1, 0],
    arrowleft: [0, -1],
    a: [0, -1],
    arrowright: [0, 1],
    d: [0, 1]
  };
  if (moves[key]) {
    event.preventDefault();
    move(...moves[key]);
  }
});
