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
const DEFAULT_TIME_LIMIT = 60;
const TIME_WARNING_SECONDS = 10;
const TIME_DARK_SECONDS = 5;
const TIME_PENALTY_SECONDS = 8;
const SLOW_DURATION_MS = 5000;
const NORMAL_MOVE_DELAY_MS = 80;
const SLOWED_MOVE_DELAY_MS = 460;
const HIT_GRACE_MS = 900;

const scienceNotes = {
  '.': {
    title: '微血管交換',
    text: '微血管管壁很薄，血液中的氧氣、養分、二氧化碳與代謝廢物，主要在這裡和組織細胞交換。',
    refs: [
      ['OpenStax：Capillary Exchange', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-3-capillary-exchange']
    ]
  },
  H: {
    title: '心臟是循環幫浦',
    text: '心臟把血液推向肺臟與全身。先分清楚目前血液需要去肺循環補氧，還是進入全身循環送物質，是完成任務的關鍵。',
    refs: [
      ['OpenStax：Heart Anatomy', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy']
    ]
  },
  L: {
    title: '肺臟進行氣體交換',
    text: '當血液二氧化碳偏高時，必須先經過肺泡微血管。二氧化碳離開血液，氧氣進入血液，血液才適合把氧氣送到肌肉或大腦。',
    refs: [
      ['OpenStax：Gas Exchange', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/22-4-gas-exchange']
    ]
  },
  I: {
    title: '小腸吸收養分',
    text: '小腸絨毛與微血管增加吸收面積，消化後的葡萄糖、胺基酸等小分子可以進入血液，再被送往需要能量或材料的細胞。',
    refs: [
      ['OpenStax：Small Intestine', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/23-5-the-small-and-large-intestines']
    ]
  },
  V: {
    title: '肝臟調節與解毒',
    text: '肝臟會調節血糖與養分，也參與把含氮廢物轉成尿素。遊戲中先到肝臟，代表先把部分代謝廢物轉成較容易排除的形式。',
    refs: [
      ['OpenStax：Accessory Organs', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/23-6-accessory-organs-in-digestion-the-liver-pancreas-and-gallbladder']
    ]
  },
  K: {
    title: '腎臟過濾血液',
    text: '腎臟會過濾血液，把尿素、多餘水分與鹽類排入尿液。因此處理廢物任務通常要在肝臟之後再到腎臟。',
    refs: [
      ['OpenStax：Kidneys', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/25-1-physical-characteristics-of-urine']
    ]
  },
  B: {
    title: '大腦需要穩定供能',
    text: '大腦對氧氣與葡萄糖供應很敏感。路線若少了肺臟補氧或小腸養分補給，就不符合大腦任務需求。',
    refs: [
      ['OpenStax：Nervous Tissue', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/12-2-nervous-tissue']
    ]
  },
  M: {
    title: '肌肉進行細胞呼吸',
    text: '肌肉收縮需要能量；氧氣與葡萄糖是細胞呼吸的重要原料。運動後也會產生二氧化碳與代謝廢物，需要再運走。',
    refs: [
      ['OpenStax：Cellular Respiration', 'https://openstax.org/books/biology-2e/pages/7-introduction']
    ]
  }
};

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
    timeLimit: 55,
    goals: ['理解 CO2 偏高時要先經肺臟氣體交換', '建立肺臟取得氧氣、肌肉消耗氧氣的路徑概念'],
    status: ['CO2 偏高', '含氧血', '氧氣送達肌肉'],
    moving: ['co2', 'plaque', 'glucose']
  },
  {
    title: '任務二：早餐養分送往大腦',
    story: '早餐被消化後，先到小腸吸收葡萄糖與胺基酸，再經過肝臟調節，最後供應大腦。',
    cargo: ['取得：葡萄糖', '取得：胺基酸', '目的地：大腦'],
    route: ['I', 'V', 'B'],
    start: 'H',
    timeLimit: 65,
    goals: ['知道小腸負責吸收葡萄糖與胺基酸', '理解肝臟可調節養分再供應大腦'],
    status: ['空車血液', '載入養分', '肝臟調節完成', '大腦獲得能量'],
    moving: ['pathogen', 'amino', 'plaque']
  },
  {
    title: '任務三：運動後的廢物處理',
    story: '肌肉活動後產生代謝廢物。從肌肉出發，先到肝臟處理含氮廢物，再到腎臟完成過濾。',
    cargo: ['起點：肌肉', '處理：肝臟', '排除：腎臟'],
    route: ['V', 'K'],
    start: 'M',
    timeLimit: 55,
    goals: ['理解肌肉活動會產生代謝廢物', '認識肝臟形成尿素、腎臟過濾排除的先後關係'],
    status: ['代謝廢物增加', '尿素形成', '腎臟過濾完成'],
    moving: ['toxin', 'co2', 'glucose']
  },
  {
    title: '任務四：大腦需要氧氣與葡萄糖',
    story: '大腦不能缺氧，也需要葡萄糖。先到肺臟補氧，再到小腸載入葡萄糖，最後送往大腦。',
    cargo: ['先取得：氧氣', '再取得：葡萄糖', '目的地：大腦'],
    route: ['L', 'I', 'B'],
    start: 'H',
    timeLimit: 70,
    goals: ['比較氧氣與葡萄糖對大腦供能的重要性', '練習先補氧、再補養分、最後送達目的器官的路線判斷'],
    status: ['等待補給', '氧氣充足', '氧氣與葡萄糖齊備', '供應大腦完成'],
    moving: ['pathogen', 'toxin', 'amino']
  },
  {
    title: '任務五：供應運動中的肌肉',
    story: '肌肉正在快速收縮，需要葡萄糖和氧氣。先到小腸載入養分，再到肺臟補氧，最後前往肌肉。',
    cargo: ['載入：葡萄糖', '補充：氧氣', '目的地：肌肉'],
    route: ['I', 'L', 'M'],
    start: 'H',
    timeLimit: 70,
    goals: ['統整細胞呼吸需要氧氣與葡萄糖', '理解小腸、肺臟、肌肉在供能任務中的角色分工'],
    status: ['準備補給', '養分充足', '氧氣與養分齊備', '肌肉供能完成'],
    moving: ['plaque', 'co2', 'toxin', 'glucose']
  },
  {
    title: '任務六：血糖調節與能量配送',
    story: '血糖偏高時，先到小腸確認吸收來源，再到肝臟調節養分，最後把能量送到肌肉使用。',
    cargo: ['確認：小腸吸收', '調節：肝臟', '目的地：肌肉'],
    route: ['I', 'V', 'M'],
    start: 'H',
    timeLimit: 68,
    goals: ['認識小腸吸收與血糖來源的關係', '理解肝臟調節養分後再送往組織使用'],
    status: ['血糖等待調節', '養分來源確認', '肝臟調節完成', '肌肉取得能量'],
    moving: ['glucose', 'plaque', 'pathogen', 'toxin']
  },
  {
    title: '任務七：水分鹽類平衡危機',
    story: '身體流汗後水分與鹽類需要調節。先到腎臟維持體液平衡，再把穩定血流送往大腦。',
    cargo: ['調節：水分與鹽類', '維持：大腦供應'],
    route: ['K', 'B'],
    start: 'H',
    timeLimit: 58,
    goals: ['認識腎臟在水分與鹽類平衡中的角色', '理解體液平衡會影響大腦等器官的穩定供應'],
    status: ['體液平衡待調整', '腎臟調節完成', '大腦供應穩定'],
    moving: ['toxin', 'co2', 'plaque', 'amino']
  },
  {
    title: '最終任務：全身循環壓力測驗',
    story: '巡邏物變多，時間更緊。從肌肉帶走 CO2，到肺臟交換氣體，再補充小腸養分，經肝臟調節後供應大腦。',
    cargo: ['帶走：CO2', '補充：氧氣與葡萄糖', '最終供應：大腦'],
    route: ['L', 'I', 'V', 'B'],
    start: 'M',
    timeLimit: 85,
    goals: ['整合肺臟、小腸、肝臟、大腦之間的循環運輸路徑', '在限時與巡邏物壓力下判斷正確器官順序'],
    status: ['運動後待回收', '肺臟完成氣體交換', '小腸載入養分', '肝臟完成調節', '大腦供應完成'],
    moving: ['co2', 'toxin', 'pathogen', 'plaque', 'glucose']
  }
];

const moverKinds = {
  co2: {
    name: '二氧化碳團',
    icon: 'CO₂',
    message: '二氧化碳亂流讓血液運輸受阻；要到肺臟才是真正的氣體交換。',
    text: '二氧化碳是細胞呼吸產生的廢氣之一。血液把它帶到肺臟，經由肺泡排出體外。',
    refs: [['OpenStax：Gas Exchange', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/22-4-gas-exchange']]
  },
  glucose: {
    name: '游離葡萄糖',
    icon: '糖',
    message: '游離養分撞上血球會干擾路線；吸收養分要走小腸微血管。',
    text: '葡萄糖是細胞常用的能量來源。消化後的葡萄糖會由小腸吸收進入血液，再運送到大腦、肌肉等組織。',
    refs: [['OpenStax：Carbohydrates', 'https://openstax.org/books/biology-2e/pages/3-2-carbohydrates']]
  },
  amino: {
    name: '胺基酸流',
    icon: '胺',
    message: '胺基酸在血管中移動，但任務要靠正確器官完成吸收與運送。',
    text: '胺基酸是蛋白質的基本單位。蛋白質被消化成胺基酸後，可被小腸吸收並由血液運送。',
    refs: [['OpenStax：Proteins', 'https://openstax.org/books/biology-2e/pages/3-4-proteins']]
  },
  toxin: {
    name: '有害物質',
    icon: '毒',
    message: '有害物質會傷害血液運輸，請避開並前往肝腎處理路線。',
    text: '身體會透過肝臟代謝部分有害物質，再透過腎臟等途徑排除廢物。不是所有有害物都能靠同一器官處理。',
    refs: [['OpenStax：Liver', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/23-6-accessory-organs-in-digestion-the-liver-pancreas-and-gallbladder']]
  },
  pathogen: {
    name: '病原體',
    icon: '菌',
    message: '病原體阻礙循環任務，保持距離！',
    text: '病原體包含細菌、病毒、寄生蟲等。若進入血液或組織，可能引發免疫反應，影響身體正常運輸。',
    refs: [['CDC：Infectious Diseases', 'https://www.cdc.gov/infectious-diseases/index.html']]
  },
  parasite: {
    name: '血液寄生蟲',
    icon: '蟲',
    message: '血液寄生蟲正在巡邏，碰到會讓紅血球受損並延誤任務。',
    text: '有些寄生蟲會出現在血液中，甚至感染紅血球。遊戲用巡邏物表示它們會干擾血液運輸，學生要避開。',
    refs: [['CDC：Babesiosis', 'https://www.cdc.gov/babesiosis/about/index.html']]
  },
  plasmodium: {
    name: '瘧原蟲',
    icon: '瘧',
    message: '瘧原蟲會感染紅血球，碰到會造成嚴重干擾！',
    text: '瘧原蟲是造成瘧疾的寄生蟲，會經由受感染蚊子傳播，並在人體肝臟與紅血球階段發育；紅血球階段和發病症狀關係密切。',
    refs: [
      ['CDC：About Malaria', 'https://www.cdc.gov/malaria/about/index.html'],
      ['CDC DPDx：Malaria', 'https://www.cdc.gov/dpdx/malaria/index.html'],
      ['WHO：Malaria Q&A', 'https://www.who.int/news-room/questions-and-answers/item/malaria']
    ]
  },
  plaque: {
    name: '血管斑塊',
    icon: '脂',
    message: '血管斑塊讓通道變窄，碰到會讓任務延誤。',
    text: '血管斑塊會讓血管變窄、血流受阻。遊戲中把它做成障礙，提醒血管暢通和循環效率有關。',
    refs: [['CDC：Cholesterol', 'https://www.cdc.gov/cholesterol/about/index.html']]
  }
};

const moverSpawns = [
  { r: 1, c: 3, dr: 0, dc: 1 },
  { r: 3, c: 13, dr: 1, dc: 0 },
  { r: 7, c: 1, dr: 0, dc: 1 },
  { r: 11, c: 5, dr: 0, dc: -1 },
  { r: 13, c: 11, dr: 0, dc: -1 },
  { r: 13, c: 3, dr: 0, dc: 1 },
  { r: 3, c: 1, dr: 1, dc: 0 }
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
  moverTimer: null,
  countdownTimer: null,
  timeLeft: DEFAULT_TIME_LIMIT,
  slowUntil: 0,
  lastMoveAt: 0,
  hitCooldownUntil: 0,
  failReason: ''
};

const $ = id => document.getElementById(id);
const screens = ['introScreen', 'gameScreen', 'resultScreen'];

function showScreen(id) {
  screens.forEach(screen => $(screen).classList.toggle('active', screen === id));
}

function startGame() {
  clearLoops();
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
    moverTimer: null,
    countdownTimer: null,
    timeLeft: DEFAULT_TIME_LIMIT,
    slowUntil: 0,
    lastMoveAt: 0,
    hitCooldownUntil: 0,
    failReason: ''
  };
  showScreen('gameScreen');
  loadLevel();
}

function loadLevel() {
  clearLoops();
  const level = levels[state.level];
  state.step = 0;
  state.locked = false;
  state.pos = findOrgan(level.start);
  state.movers = makeMovers(level);
  state.timeLeft = level.timeLimit || DEFAULT_TIME_LIMIT;
  state.slowUntil = 0;
  state.lastMoveAt = 0;
  state.hitCooldownUntil = 0;
  state.failReason = '';
  $('missionTitle').textContent = level.title;
  $('missionStory').textContent = level.story;
  $('cargoList').innerHTML = level.cargo.map(item => `<span class="cargo-chip">${item}</span>`).join('');
  $('feedback').textContent = `下一站：${organInfo[level.route[0]].name}。避開移動物質，選對器官通過。`;
  updateKnowledge(level.start);
  render();
  updateHUD();
  startMoverLoop();
  startCountdownLoop();
}

function renderLevelsOverview() {
  $('levelsOverview').innerHTML = levels.map((level, index) => {
    const route = level.route.map(code => organInfo[code].name).join(' → ');
    const goals = level.goals.map(goal => `<li>${goal}</li>`).join('');
    const cargo = level.cargo.map(item => `<span>${item}</span>`).join('');
    return `
      <article class="level-overview-card">
        <div class="level-overview-head">
          <b>${index + 1}</b>
          <h3>${level.title}</h3>
        </div>
        <p>${level.story}</p>
        <div class="level-overview-meta">
          <span>限時 ${level.timeLimit} 秒</span>
          <span>${route}</span>
        </div>
        <div class="level-overview-cargo">${cargo}</div>
        <h4>希望學生學會</h4>
        <ul>${goals}</ul>
      </article>
    `;
  }).join('');
}

function findOrgan(code) {
  for (let r = 0; r < mazeMap.length; r++) {
    const c = mazeMap[r].indexOf(code);
    if (c >= 0) return { r, c };
  }
  return { r: 5, c: 6 };
}

function makeMovers(level) {
  const patrolKinds = ['parasite', 'plasmodium', ...level.moving];
  return patrolKinds.map((kind, index) => ({
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
        cell.title = `查看${organ.name}知識`;
        cell.setAttribute('role', 'button');
        cell.tabIndex = 0;
        cell.onclick = () => updateKnowledge(ch);
        cell.onkeydown = event => activateKnowledgeKey(event, () => updateKnowledge(ch));
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
        marker.setAttribute('role', 'button');
        marker.tabIndex = 0;
        marker.onclick = event => {
          event.stopPropagation();
          updateKnowledge(`mover:${mover.kind}`);
        };
        marker.onkeydown = event => activateKnowledgeKey(event, () => updateKnowledge(`mover:${mover.kind}`));
        cell.appendChild(marker);
      }

      if (state.pos.r === r && state.pos.c === c) {
        cell.classList.add('player');
        if (Date.now() < state.slowUntil) cell.classList.add('slowed');
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
  $('timeLabel').textContent = state.timeLeft;
  const gameScreen = $('gameScreen');
  gameScreen.classList.toggle('time-warning', state.timeLeft <= TIME_WARNING_SECONDS);
  gameScreen.classList.toggle('time-dark', state.timeLeft <= TIME_DARK_SECONDS);
  document.body.style.setProperty('--danger-darkness', dangerDarkness());
}

function dangerDarkness() {
  if (state.timeLeft > TIME_DARK_SECONDS) return 0;
  return Math.min(0.78, (TIME_DARK_SECONDS - state.timeLeft + 1) * 0.14).toFixed(2);
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
  const isMover = code.startsWith && code.startsWith('mover:');
  const mover = isMover ? moverKinds[code.replace('mover:', '')] : null;
  const info = mover || organInfo[code] || {
    name: '微血管通道',
    icon: '🩸',
    fact: '微血管是血液與組織細胞交換物質的重要場所。'
  };
  const note = mover ? { title: mover.name, text: mover.text, refs: mover.refs } : scienceNotes[code] || scienceNotes['.'];
  $('organName').textContent = info.name;
  $('organIcon').textContent = info.icon;
  $('organFact').textContent = info.fact || info.message;
  $('knowledgePanel').classList.toggle('hazard-note', Boolean(mover));
  $('scienceText').textContent = note.text;
  $('scienceLinks').innerHTML = note.refs.map(([label, url]) => (
    `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
  )).join('');
}

function activateKnowledgeKey(event, action) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  event.stopPropagation();
  action();
}

function move(dr, dc) {
  if (state.locked) return;
  const now = Date.now();
  const moveDelay = now < state.slowUntil ? SLOWED_MOVE_DELAY_MS : NORMAL_MOVE_DELAY_MS;
  if (now - state.lastMoveAt < moveDelay) return;
  state.lastMoveAt = now;
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
  if (state.lives <= 0) {
    state.failReason = 'life';
    finish(false);
  }
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
  if (Date.now() < state.hitCooldownUntil) return;
  const hit = state.movers.find(mover => mover.r === state.pos.r && mover.c === state.pos.c);
  if (!hit) return;
  state.hitCooldownUntil = Date.now() + HIT_GRACE_MS;
  state.slowUntil = Date.now() + SLOW_DURATION_MS;
  state.lives--;
  state.score = Math.max(0, state.score - 10);
  state.timeLeft = Math.max(0, state.timeLeft - TIME_PENALTY_SECONDS);
  state.pos = findOrgan(levels[state.level].start);
  state.reviews.push(`⚠️ ${levels[state.level].title}：碰到${hit.name}`);
  flashTime();
  bump(`${hit.message} 血液流速下降，倒扣 ${TIME_PENALTY_SECONDS} 秒。`);
  if (state.lives <= 0) state.failReason = 'life';
  if (state.timeLeft <= 0) state.failReason = 'time';
  if (state.lives <= 0 || state.timeLeft <= 0) finish(false);
}

function startMoverLoop() {
  clearMoverLoop();
  state.moverTimer = setInterval(() => {
    if (state.locked || !document.getElementById('gameScreen').classList.contains('active')) return;
    moveHazards();
    checkMoverCollision();
    render();
    updateHUD();
  }, 900);
}

function clearMoverLoop() {
  if (state.moverTimer) clearInterval(state.moverTimer);
  state.moverTimer = null;
}

function startCountdownLoop() {
  clearCountdownLoop();
  state.countdownTimer = setInterval(() => {
    if (state.locked || !$('gameScreen').classList.contains('active')) return;
    state.timeLeft = Math.max(0, state.timeLeft - 1);
    updateHUD();
    if (state.timeLeft <= 0) {
      state.failReason = 'time';
      state.reviews.push(`⌛ ${levels[state.level].title}：時間用完`);
      finish(false);
    }
  }, 1000);
}

function clearCountdownLoop() {
  if (state.countdownTimer) clearInterval(state.countdownTimer);
  state.countdownTimer = null;
}

function clearLoops() {
  clearMoverLoop();
  clearCountdownLoop();
}

function flashTime() {
  $('timeLabel').classList.remove('time-hit');
  void $('timeLabel').offsetWidth;
  $('timeLabel').classList.add('time-hit');
}

function bump(message) {
  $('feedback').textContent = message;
  $('maze').classList.remove('shake');
  void $('maze').offsetWidth;
  $('maze').classList.add('shake');
  updateHUD();
}

function finish(win) {
  clearLoops();
  showScreen('resultScreen');
  $('gameScreen').classList.remove('time-warning', 'time-dark');
  document.body.style.setProperty('--danger-darkness', 0);
  const accuracy = state.total ? Math.round((state.correct / state.total) * 100) : 0;
  const failText = state.failReason === 'time'
    ? '時間用完了。可以先規劃器官順序，再避開巡邏物加速完成任務。'
    : '生命值用完了。複習器官功能與任務順序後，再挑戰一次。';
  $('resultIcon').textContent = win ? '🏆' : '🩹';
  $('resultTitle').textContent = win ? '循環運輸大師！' : '任務暫停，重新整備！';
  $('resultText').textContent = win
    ? '你已完成肺部氣體交換、養分吸收、肝臟處理、腎臟排除與組織供應任務。'
    : failText;
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
$('openLevelsBtn').onclick = () => {
  renderLevelsOverview();
  $('levelsDialog').showModal();
};

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

addEventListener('dblclick', event => {
  event.preventDefault();
}, { passive: false });
