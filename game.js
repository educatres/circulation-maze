const organInfo = {
  R: { name: '右心', icon: '💙', fact: '右心收集全身回流的缺氧血，再經肺動脈把血液送往肺臟。' },
  H: { name: '左心', icon: '❤️', fact: '左心接收肺臟送回的含氧血，再經主動脈送往全身器官。' },
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
const NUTRIENT_ADD_SECONDS = 6;
const NUTRIENT_TTL_MS = 8000;
const NUTRIENT_SPAWN_MS = 1800;
const MAX_NUTRIENTS = 3;
const TOXIN_TTL_MS = 7000;
const TOXIN_RESPAWN_CHANCE = 0.38;

const nutrientKinds = [
  { kind: 'oxygen', name: '氧氣補給', icon: 'O₂', fact: '氧氣可幫助細胞呼吸順利進行。吃到後剩餘時間增加。' },
  { kind: 'glucose', name: '葡萄糖補給', icon: '糖', fact: '葡萄糖是細胞常用的能量來源。吃到後剩餘時間增加。' },
  { kind: 'amino', name: '胺基酸補給', icon: '胺', fact: '胺基酸可作為合成蛋白質的材料。吃到後剩餘時間增加。' },
  { kind: 'water', name: '水分補給', icon: '水', fact: '水分有助於維持血液流動與體液平衡。吃到後剩餘時間增加。' },
  { kind: 'salt', name: '鹽類補給', icon: '鹽', fact: '適量鹽類有助於維持體液平衡與神經肌肉功能。吃到後剩餘時間增加。' }
];

const scienceNotes = {
  '.': {
    title: '微血管交換',
    text: '微血管管壁很薄，血液中的氧氣、養分、二氧化碳與代謝廢物，主要在這裡和組織細胞交換。',
    refs: [
      ['OpenStax：Capillary Exchange', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-3-capillary-exchange']
    ]
  },
  R: {
    title: '右心啟動肺循環',
    text: '全身回流的血液氧氣較少、二氧化碳較多。右心把它送進肺動脈，前往肺泡周圍的微血管交換氣體。',
    refs: [
      ['OpenStax：Heart Anatomy', 'https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy']
    ]
  },
  H: {
    title: '左心啟動體循環',
    text: '肺臟交換完成後，含氧血經肺靜脈回到左心；左心再把血液送進全身動脈，供應各器官。',
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

// 每一段皆為單向血管。支線代表器官的動脈供應與靜脈回流；血液不可逆流。
const organPositions = {
  R: [8, 6], L: [3, 8], H: [8, 10], B: [2, 14], K: [6, 14],
  M: [12, 13], I: [14, 9], V: [11, 7]
};

const flowRoutes = [
  { type: 'pulmonary', points: [[8, 6], [7, 6], [6, 6], [5, 6], [4, 6], [3, 6], [3, 7], [3, 8], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [8, 10]] },
  { type: 'systemic', points: [[8, 10], [8, 11], [7, 11], [6, 11], [5, 11], [4, 11], [3, 11], [2, 11], [2, 12], [2, 13], [2, 14], [2, 15], [3, 15], [4, 15], [5, 15], [6, 15], [7, 15], [8, 15], [9, 15], [10, 15], [11, 15], [12, 15], [13, 15], [14, 15], [15, 15], [15, 14], [15, 13], [15, 12], [15, 11], [15, 10], [15, 9], [15, 8], [15, 7], [15, 6], [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 6]] },
  { type: 'systemic', points: [[8, 10], [9, 10], [10, 10], [10, 11], [10, 12], [9, 12], [8, 12], [7, 12], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14], [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14], [15, 14], [15, 13], [15, 12], [15, 11], [15, 10], [15, 9], [15, 8], [15, 7], [15, 6], [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 6]] },
  { type: 'systemic', points: [[8, 10], [9, 10], [10, 10], [11, 10], [12, 10], [12, 11], [12, 12], [12, 13], [13, 13], [14, 13], [15, 13], [15, 12], [15, 11], [15, 10], [15, 9], [15, 8], [15, 7], [15, 6], [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 6]] },
  { type: 'portal', points: [[8, 10], [9, 10], [10, 10], [11, 10], [12, 10], [13, 10], [14, 10], [14, 9], [13, 9], [12, 9], [11, 9], [11, 8], [11, 7], [11, 6], [10, 6], [9, 6], [8, 6]] }
];

function buildFlowMap() {
  const grid = Array.from({ length: 17 }, () => Array(17).fill('#'));
  flowRoutes.forEach(route => route.points.forEach(([r, c]) => { grid[r][c] = '.'; }));
  Object.entries(organPositions).forEach(([code, [r, c]]) => { grid[r][c] = code; });
  return grid.map(row => row.join(''));
}

function buildFlowExits() {
  const exits = new Map();
  flowRoutes.forEach(route => route.points.forEach(([r, c], index) => {
    if (index === route.points.length - 1) return;
    const [nr, nc] = route.points[index + 1];
    const key = `${r},${c}`;
    const option = { r: nr, c: nc, type: route.type };
    const options = exits.get(key) || [];
    if (!options.some(item => item.r === nr && item.c === nc)) options.push(option);
    exits.set(key, options);
  }));
  return exits;
}

const mazeMap = buildFlowMap();
const flowExits = buildFlowExits();
const flowTypes = new Map();
flowRoutes.forEach(route => route.points.forEach(([r, c]) => {
  const key = `${r},${c}`;
  if (!flowTypes.has(key)) flowTypes.set(key, route.type);
}));

const levels = [
  {
    title: '任務一：肌肉的 CO2 回收',
    story: '肌肉回流的血液 CO2 偏高。先回到右心、送往肺臟交換，再經左心把含氧血送回肌肉。',
    cargo: ['起始狀態：CO2 偏高', '肺循環：右心→肺臟→左心', '目的地：肌肉'],
    route: ['R', 'L', 'H', 'M'],
    start: 'M',
    timeLimit: 110,
    goals: ['理解 CO2 偏高時要先經肺臟氣體交換', '建立肺臟取得氧氣、肌肉消耗氧氣的路徑概念'],
    status: ['CO2 偏高', '回到右心', '肺臟完成交換', '左心送出含氧血', '氧氣送達肌肉'],
    moving: ['co2', 'plaque', 'glucose']
  },
  {
    title: '任務二：早餐養分送往大腦',
    story: '小腸吸收的養分會先走肝門靜脈到肝臟調節，再回到右心、經肺臟與左心後供應大腦。',
    cargo: ['起點：小腸吸收養分', '必經：肝臟調節', '目的地：大腦'],
    route: ['V', 'R', 'L', 'H', 'B'],
    start: 'I',
    timeLimit: 130,
    goals: ['知道小腸負責吸收葡萄糖與胺基酸', '理解肝臟可調節養分再供應大腦'],
    status: ['養分已吸收', '肝臟調節完成', '回到右心', '肺臟完成交換', '左心送出血液', '大腦獲得能量'],
    moving: ['pathogen', 'amino', 'plaque']
  },
  {
    title: '任務三：腎臟過濾血液',
    story: '肌肉回流的血液先回到右心、經肺臟完成氣體交換，再由左心經腎動脈送到腎臟過濾。',
    cargo: ['起點：肌肉', '肺循環後回左心', '目的地：腎臟'],
    route: ['R', 'L', 'H', 'K'],
    start: 'M',
    timeLimit: 110,
    goals: ['理解肌肉回流血需先通過心肺循環', '認識腎臟由全身動脈血供應並進行過濾'],
    status: ['代謝物增加', '回到右心', '肺臟完成交換', '左心送出血液', '腎臟過濾完成'],
    moving: ['toxin', 'co2', 'glucose']
  },
  {
    title: '任務四：大腦需要氧氣與葡萄糖',
    story: '大腦缺氧時，回流血必須先經右心到肺臟補氧，再由左心進入體循環送回大腦。',
    cargo: ['起點：大腦缺氧回流', '肺循環補氧', '目的地：大腦'],
    route: ['R', 'L', 'H', 'B'],
    start: 'B',
    timeLimit: 140,
    goals: ['比較缺氧血與含氧血的路徑差異', '理解大腦不能由靜脈血直接獲得氧氣'],
    status: ['缺氧回流', '回到右心', '氧氣充足', '左心送出含氧血', '供應大腦完成'],
    moving: ['pathogen', 'toxin', 'amino']
  },
  {
    title: '任務五：供應運動中的肌肉',
    story: '小腸吸收的葡萄糖先到肝臟調節，接著回到右心、經肺循環補氧，最後由左心送往肌肉。',
    cargo: ['起點：小腸養分', '肝門循環：小腸→肝臟', '目的地：肌肉'],
    route: ['V', 'R', 'L', 'H', 'M'],
    start: 'I',
    timeLimit: 140,
    goals: ['統整細胞呼吸需要氧氣與葡萄糖', '理解小腸、肺臟、肌肉在供能任務中的角色分工'],
    status: ['養分已吸收', '肝臟調節完成', '回到右心', '肺臟完成交換', '左心送出補給', '肌肉供能完成'],
    moving: ['plaque', 'co2', 'toxin', 'glucose']
  },
  {
    title: '任務六：血糖調節與能量配送',
    story: '血糖調節要先經小腸到肝臟的肝門循環；調節後的血液回心、過肺，再由左心送往肌肉。',
    cargo: ['起點：小腸吸收', '調節：肝臟', '目的地：肌肉'],
    route: ['V', 'R', 'L', 'H', 'M'],
    start: 'I',
    timeLimit: 136,
    goals: ['認識小腸吸收與血糖來源的關係', '理解肝臟調節養分後再送往組織使用'],
    status: ['養分已吸收', '肝臟調節完成', '回到右心', '肺臟完成交換', '左心送出血液', '肌肉取得能量'],
    moving: ['glucose', 'plaque', 'pathogen', 'toxin']
  },
  {
    title: '任務七：水分鹽類平衡危機',
    story: '腎臟完成水分與鹽類調節後，血液仍需回到右心、經肺循環，再由左心供應大腦。',
    cargo: ['起點：腎臟調節完成', '肺循環後回左心', '目的地：大腦'],
    route: ['R', 'L', 'H', 'B'],
    start: 'K',
    timeLimit: 116,
    goals: ['認識腎臟在水分與鹽類平衡中的角色', '理解器官靜脈血必須回右心後才能再供應大腦'],
    status: ['腎臟調節完成', '回到右心', '肺臟完成交換', '左心送出血液', '大腦供應穩定'],
    moving: ['toxin', 'co2', 'plaque', 'amino']
  },
  {
    title: '最終任務：全身循環壓力測驗',
    story: '從小腸帶著養分經肝門靜脈到肝臟，再回到右心、肺臟、左心，最後把氧氣與養分供應大腦。',
    cargo: ['小腸吸收：養分', '肝門循環：先到肝臟', '最終供應：大腦'],
    route: ['V', 'R', 'L', 'H', 'B'],
    start: 'I',
    timeLimit: 170,
    goals: ['整合肺臟、小腸、肝臟、大腦之間的循環運輸路徑', '在限時與巡邏物壓力下判斷正確器官順序'],
    status: ['養分已吸收', '肝臟完成調節', '回到右心', '肺臟完成氣體交換', '左心送出含氧血', '大腦供應完成'],
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
  plaque: {
    name: '血管斑塊',
    icon: '脂',
    message: '血管斑塊讓通道變窄，碰到會讓任務延誤。',
    text: '血管斑塊會讓血管變窄、血流受阻。遊戲中把它做成障礙，提醒血管暢通和循環效率有關。',
    refs: [['CDC：Cholesterol', 'https://www.cdc.gov/cholesterol/about/index.html']]
  }
};

let state = {
  level: 0,
  score: 0,
  lives: 3,
  pos: { r: 8, c: 6 },
  step: 0,
  correct: 0,
  total: 0,
  reviews: [],
  movers: [],
  nutrients: [],
  locked: false,
  moverTimer: null,
  nutrientTimer: null,
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
    pos: { r: 8, c: 6 },
    step: 0,
    correct: 0,
    total: 0,
    reviews: [],
    movers: [],
    nutrients: [],
    locked: false,
    moverTimer: null,
    nutrientTimer: null,
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
  state.nutrients = [];
  state.timeLeft = level.timeLimit || DEFAULT_TIME_LIMIT;
  state.slowUntil = 0;
  state.lastMoveAt = 0;
  state.hitCooldownUntil = 0;
  state.failReason = '';
  $('missionTitle').textContent = level.title;
  $('missionStory').textContent = level.story;
  $('cargoList').innerHTML = level.cargo.map(item => `<span class="cargo-chip">${item}</span>`).join('');
  $('feedback').textContent = `下一站：${organInfo[level.route[0]].name}。避開移動物質，選對器官通過。`;
  spawnNutrient(true);
  updateKnowledge(level.start);
  render();
  updateHUD();
  startMoverLoop();
  startNutrientLoop();
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
  return { r: 8, c: 6 };
}

function makeMovers(level) {
  const patrolKinds = level.moving;
  const cells = [...flowExits.keys()]
    .map(key => key.split(',').map(Number))
    .filter(([r, c]) => !organCells.has(mazeMap[r][c]));
  return patrolKinds.map((kind, index) => ({
    ...moverKinds[kind],
    kind,
    r: cells[(index * 11 + 4) % cells.length][0],
    c: cells[(index * 11 + 4) % cells.length][1],
    expiresAt: kind === 'toxin' ? Date.now() + TOXIN_TTL_MS : null
  }));
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function walkableCells() {
  const blocked = new Set([
    `${state.pos.r},${state.pos.c}`,
    ...state.movers.map(item => `${item.r},${item.c}`),
    ...state.nutrients.map(item => `${item.r},${item.c}`)
  ]);
  const cells = [];
  mazeMap.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (isSpawnPath(r, c) && !blocked.has(`${r},${c}`)) cells.push({ r, c });
    });
  });
  return cells;
}

function spawnNutrient(force = false) {
  state.nutrients = state.nutrients.filter(item => item.expiresAt > Date.now());
  if (state.nutrients.length >= MAX_NUTRIENTS) return;
  if (!force && Math.random() < 0.42) return;
  const cells = walkableCells();
  if (!cells.length) return;
  const nutrient = randomItem(nutrientKinds);
  state.nutrients.push({
    ...nutrient,
    ...randomItem(cells),
    expiresAt: Date.now() + NUTRIENT_TTL_MS
  });
}

function collectNutrient() {
  const index = state.nutrients.findIndex(item => item.r === state.pos.r && item.c === state.pos.c);
  if (index < 0) return;
  const [nutrient] = state.nutrients.splice(index, 1);
  const before = state.timeLeft;
  state.timeLeft = Math.min((levels[state.level].timeLimit || DEFAULT_TIME_LIMIT) + 20, state.timeLeft + NUTRIENT_ADD_SECONDS);
  state.score += 12;
  flashTime();
  launchFireworks();
  $('feedback').textContent = `吃到${nutrient.name}，時間 +${state.timeLeft - before} 秒！`;
}

function render() {
  const maze = $('maze');
  maze.style.gridTemplateColumns = `repeat(${mazeMap[0].length}, 1fr)`;
  maze.style.gridTemplateRows = `repeat(${mazeMap.length}, minmax(0, 1fr))`;
  maze.innerHTML = '';
  const expected = currentExpectedOrgan();

  mazeMap.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      const cell = document.createElement('div');
      cell.className = `cell ${ch === '#' ? 'wall' : 'path'}`;
      const flowType = flowTypes.get(`${r},${c}`);
      if (flowType) cell.classList.add(`flow-${flowType}`);

      const exits = flowExits.get(`${r},${c}`) || [];
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

      if (ch !== '#' && exits.length) {
        const arrow = document.createElement('span');
        arrow.className = `flow-arrow${exits.length > 1 ? ' flow-choice' : ''}`;
        arrow.textContent = exits.map(exit => flowArrow(r, c, exit)).join('');
        arrow.title = exits.length > 1 ? '血管分岔：選擇一個順流方向' : '血流方向';
        if (exits.length > 1) cell.classList.add('flow-junction');
        cell.appendChild(arrow);
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

      const nutrient = state.nutrients.find(item => item.r === r && item.c === c);
      if (nutrient) {
        const bonus = document.createElement('span');
        bonus.className = `nutrient nutrient-${nutrient.kind}`;
        bonus.textContent = nutrient.icon;
        bonus.title = `${nutrient.name}：+${NUTRIENT_ADD_SECONDS}秒`;
        cell.appendChild(bonus);
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
  $('junctionLabel').textContent = describeJunction();
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
  const type = flowTypes.get(`${state.pos.r},${state.pos.c}`);
  const label = type === 'pulmonary' ? '肺循環血管' : type === 'portal' ? '肝門靜脈路徑' : '體循環血管';
  return label;
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
    bump('這裡沒有血管通道，請沿著箭頭前進。');
    return;
  }
  if (!isFlowMoveAllowed(state.pos, nr, nc)) {
    bump('血液不能逆流。請依血管箭頭與心臟瓣膜方向前進！');
    return;
  }

  const junctionMessage = evaluateJunctionChoice(state.pos, nr, nc);
  state.pos = { r: nr, c: nc };
  const tile = mazeMap[nr][nc];
  if (organCells.has(tile)) {
    visitOrgan(tile);
  } else {
    state.score += 1;
    updateKnowledge('.');
    if (junctionMessage) $('feedback').textContent = junctionMessage;
  }

  moveHazards();
  collectNutrient();
  checkMoverCollision();
  render();
  updateHUD();
}

function isWalkable(r, c) {
  return r >= 0 && c >= 0 && r < mazeMap.length && c < mazeMap[0].length && mazeMap[r][c] !== '#';
}

function isFlowMoveAllowed(from, r, c) {
  return (flowExits.get(`${from.r},${from.c}`) || []).some(exit => exit.r === r && exit.c === c);
}

function isSpawnPath(r, c) {
  return isWalkable(r, c) && !organCells.has(mazeMap[r][c]) && flowExits.has(`${r},${c}`);
}

function flowArrow(r, c, exit) {
  if (exit.r < r) return '↑';
  if (exit.r > r) return '↓';
  return exit.c < c ? '←' : '→';
}

function describeJunction() {
  const exits = flowExits.get(`${state.pos.r},${state.pos.c}`) || [];
  if (exits.length < 2) return '沿箭頭前進';
  return `可選 ${exits.map(exit => flowArrow(state.pos.r, state.pos.c, exit)).join(' 或 ')}`;
}

function evaluateJunctionChoice(from, r, c) {
  const exits = flowExits.get(`${from.r},${from.c}`) || [];
  const expected = currentExpectedOrgan();
  if (exits.length < 2 || !expected) return '';

  const goal = findOrgan(expected);
  const distances = exits.map(exit => flowDistance(exit, goal));
  const shortest = Math.min(...distances);
  const chosenIndex = exits.findIndex(exit => exit.r === r && exit.c === c);
  if (!Number.isFinite(shortest) || chosenIndex < 0) return '';

  if (distances[chosenIndex] === shortest) {
    state.score += 5;
    return `分岔判斷正確！選到通往${organInfo[expected].name}的較短血流路徑，+5 分。`;
  }
  return `選到較遠的血管支線，仍可順流前進，但會多花一些時間。`;
}

function flowDistance(start, goal) {
  const queue = [{ ...start, distance: 0 }];
  const seen = new Set([`${start.r},${start.c}`]);
  while (queue.length) {
    const node = queue.shift();
    if (node.r === goal.r && node.c === goal.c) return node.distance;
    (flowExits.get(`${node.r},${node.c}`) || []).forEach(exit => {
      const key = `${exit.r},${exit.c}`;
      if (!seen.has(key)) {
        seen.add(key);
        queue.push({ ...exit, distance: node.distance + 1 });
      }
    });
  }
  return Infinity;
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
  const level = levels[state.level];
  const now = Date.now();
  state.movers = state.movers.filter(mover => mover.kind !== 'toxin' || mover.expiresAt > now);

  if (level.moving.includes('toxin') && !state.movers.some(mover => mover.kind === 'toxin') && Math.random() < TOXIN_RESPAWN_CHANCE) {
    spawnToxin();
  }

  state.movers.forEach(mover => {
    if (mover.kind === 'toxin') return;
    const exits = (flowExits.get(`${mover.r},${mover.c}`) || []).filter(exit => isWalkable(exit.r, exit.c));
    if (!exits.length) return;
    const next = randomItem(exits);
    mover.r = next.r;
    mover.c = next.c;
  });
}

function spawnToxin() {
  const cells = walkableCells();
  if (!cells.length) return;
  state.movers.push({
    ...moverKinds.toxin,
    kind: 'toxin',
    ...randomItem(cells),
    expiresAt: Date.now() + TOXIN_TTL_MS
  });
}

function moveRandomWalker(mover) {
  moveHazards();
}

function isMoverPath(r, c) {
  return isWalkable(r, c) && flowExits.has(`${r},${c}`);
}

function checkMoverCollision() {
  if (Date.now() < state.hitCooldownUntil) return;
  const hit = state.movers.find(mover => mover.r === state.pos.r && mover.c === state.pos.c);
  if (!hit) return;
  state.hitCooldownUntil = Date.now() + HIT_GRACE_MS;

  if (hit.kind === 'toxin') {
    state.movers = state.movers.filter(mover => mover !== hit);
    state.timeLeft = Math.max(0, state.timeLeft - TIME_PENALTY_SECONDS);
    state.reviews.push(`⚠️ ${levels[state.level].title}：碰到${hit.name}，倒扣時間`);
    flashTime();
    bump(`碰到${hit.name}，倒扣 ${TIME_PENALTY_SECONDS} 秒。血球留在原地，請繼續前進！`);
    if (state.timeLeft <= 0) {
      state.failReason = 'time';
      finish(false);
    }
    return;
  }

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

function startNutrientLoop() {
  clearNutrientLoop();
  state.nutrientTimer = setInterval(() => {
    if (state.locked || !$('gameScreen').classList.contains('active')) return;
    state.nutrients = state.nutrients.filter(item => item.expiresAt > Date.now());
    spawnNutrient();
    render();
  }, NUTRIENT_SPAWN_MS);
}

function clearMoverLoop() {
  if (state.moverTimer) clearInterval(state.moverTimer);
  state.moverTimer = null;
}

function clearNutrientLoop() {
  if (state.nutrientTimer) clearInterval(state.nutrientTimer);
  state.nutrientTimer = null;
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
  clearNutrientLoop();
  clearCountdownLoop();
}

function flashTime() {
  $('timeLabel').classList.remove('time-hit');
  void $('timeLabel').offsetWidth;
  $('timeLabel').classList.add('time-hit');
}

function launchFireworks() {
  const burst = document.createElement('div');
  burst.className = 'fireworks';
  for (let i = 0; i < 18; i++) {
    const spark = document.createElement('span');
    spark.style.setProperty('--angle', `${i * 20}deg`);
    spark.style.setProperty('--distance', `${56 + (i % 4) * 12}px`);
    spark.style.setProperty('--color', ['#f4b942', '#e84955', '#1a9a89', '#2878c8'][i % 4]);
    burst.appendChild(spark);
  }
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 900);
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
  $('feedback').textContent = `提示：下一個正確站點是${organInfo[expected].name}，請順著血管箭頭往${direction}前進。`;
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
    (flowExits.get(`${node.r},${node.c}`) || []).forEach(exit => {
      const nr = exit.r;
      const nc = exit.c;
      const key = `${nr},${nc}`;
      if (!seen.has(key) && isWalkable(nr, nc)) {
        seen.add(key);
        const label = nr < node.r ? '上方' : nr > node.r ? '下方' : nc < node.c ? '左方' : '右方';
        queue.push({ r: nr, c: nc, path: [...node.path, label] });
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
