const MAX_MISTAKES = 4;
const GAME_NAME = "WordWeave";
const CONNECTIONS_STATS_STORAGE_KEY = "wordweave.stats.v1";
const CONNECTIONS_DAILY_SESSION_STORAGE_KEY = "wordweave.dailySession.v1";
const CONNECTIONS_PRACTICE_SESSION_STORAGE_KEY = "wordweave.practiceSession.v1";
const CONNECTIONS_STATS_SCHEMA_VERSION = 1;
const CONNECTIONS_DAILY_EPOCH = Date.UTC(2024, 0, 1);
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const GROUP_EMOJIS = ["🟨", "🟩", "🟦", "🟪"];
const CONNECTIONS_MODES = {
  daily: "daily",
  practice: "practice",
};

const PUZZLES = [
  {
    id: "lex-001",
    groups: [
      { title: "软件编辑命令", words: ["撤销", "保存", "复制", "粘贴"] },
      { title: "中国传统颜色名", words: ["胭脂", "靛蓝", "月白", "竹青"] },
      { title: "以城市命名的食物", words: ["北京烤鸭", "兰州拉面", "重庆小面", "扬州炒饭"] },
      { title: "可接在“背”后", words: ["单词", "台词", "黑锅", "包袱"] },
    ],
  },
  {
    id: "lex-002",
    groups: [
      { title: "对立词对", words: ["黑白", "是非", "生死", "左右"] },
      { title: "乐队常见配置", words: ["主唱", "吉他", "贝斯", "鼓手"] },
      { title: "牌桌相关词", words: ["洗牌", "切牌", "听牌", "清一色"] },
      { title: "可接在“挂”后", words: ["电话", "窗帘", "衣服", "蚊帐"] },
    ],
  },
  {
    id: "lex-003",
    groups: [
      { title: "手机拍摄模式", words: ["人像", "夜景", "全景", "慢动作"] },
      { title: "鲁迅作品", words: ["狂人日记", "孔乙己", "阿Q正传", "祝福"] },
      { title: "带“风”但不是天气", words: ["家风", "学风", "作风", "耳边风"] },
      { title: "可接在“刷”后", words: ["牙齿", "信用卡", "练习题", "朋友圈"] },
    ],
  },
  {
    id: "lex-004",
    groups: [
      { title: "火锅蘸料", words: ["芝麻酱", "蒜泥", "香油", "沙茶酱"] },
      { title: "《西游记》元素", words: ["火焰山", "女儿国", "紧箍咒", "芭蕉扇"] },
      { title: "前接“画”成为成语", words: ["添足", "点睛", "充饥", "类犬"] },
      { title: "后接“机”成为设备", words: ["洗衣", "打印", "收音", "榨汁"] },
    ],
  },
  {
    id: "lex-005",
    groups: [
      { title: "一天中的模糊时段", words: ["凌晨", "正午", "黄昏", "深夜"] },
      { title: "常见修辞手法", words: ["比喻", "拟人", "排比", "夸张"] },
      { title: "互联网流行语", words: ["破防", "上头", "内卷", "出圈"] },
      { title: "可接在“晒”后", words: ["太阳", "照片", "工资", "幸福"] },
    ],
  },
  {
    id: "lex-006",
    groups: [
      { title: "北京地铁换乘大站", words: ["西直门", "国贸", "东单", "宋家庄"] },
      { title: "三国人物字号", words: ["孔明", "玄德", "云长", "孟德"] },
      { title: "可接在“吃”后", words: ["苦头", "飞醋", "豆腐", "闭门羹"] },
      { title: "后接“证”成为证件", words: ["身份", "学生", "驾驶", "结婚"] },
    ],
  },
  {
    id: "lex-007",
    groups: [
      { title: "戏曲行当/角色", words: ["青衣", "花旦", "老生", "武丑"] },
      { title: "二十四节气", words: ["惊蛰", "小满", "白露", "大寒"] },
      { title: "围棋术语", words: ["布局", "定式", "官子", "手筋"] },
      { title: "可接在“追”后", words: ["电视剧", "明星", "梦想", "债务"] },
    ],
  },
  {
    id: "lex-008",
    groups: [
      { title: "《红楼梦》人物", words: ["宝玉", "黛玉", "宝钗", "凤姐"] },
      { title: "浏览器常见操作", words: ["刷新", "收藏", "后退", "下载"] },
      { title: "可接在“抢”后", words: ["红包", "头条", "镜头", "沙发"] },
      { title: "后接“线”成为常见词", words: ["斑马", "地平", "生命", "及格"] },
    ],
  },
  {
    id: "lex-009",
    groups: [
      { title: "浏览器/网页操作", words: ["刷新", "收藏", "后退", "下载"] },
      { title: "上海高校简称", words: ["复旦", "同济", "交大", "华师"] },
      { title: "菜名里藏人物/身份", words: ["东坡肉", "叫花鸡", "佛跳墙", "夫妻肺片"] },
      { title: "前接“小”成为常见词", words: ["龙虾", "程序", "红书", "心眼"] },
    ],
  },
  {
    id: "lex-010",
    groups: [
      { title: "职场黑话", words: ["对齐", "拉通", "闭环", "赋能"] },
      { title: "常见中药材", words: ["当归", "黄芪", "枸杞", "人参"] },
      { title: "饭圈用语", words: ["应援", "站姐", "塌房", "控评"] },
      { title: "可接在“装”后", words: ["糊涂", "可怜", "门面", "样子"] },
    ],
  },
  {
    id: "lex-011",
    groups: [
      { title: "日本动画常见类型", words: ["热血", "恋爱", "机甲", "异世界"] },
      { title: "几何对象", words: ["直线", "射线", "圆锥", "棱柱"] },
      { title: "后接“感”成为心理感受", words: ["安全", "存在", "方向", "仪式"] },
      { title: "可接在“拍”后", words: ["照片", "电影", "桌子", "马屁"] },
    ],
  },
  {
    id: "lex-012",
    groups: [
      { title: "香港电影导演", words: ["杜琪峰", "王家卫", "周星驰", "徐克"] },
      { title: "中国茶名", words: ["龙井", "普洱", "铁观音", "大红袍"] },
      { title: "可接在“翻”后", words: ["旧账", "白眼", "跟头", "牌子"] },
      { title: "后接“眼”成为常见词", words: ["青光", "老花", "斗鸡", "势利"] },
    ],
  },
];

const els = {
  board: document.querySelector("#connections-board"),
  solvedGroups: document.querySelector("#solved-groups"),
  message: document.querySelector("#message"),
  roundLabel: document.querySelector("#round-label"),
  helpButton: document.querySelector("#help-button"),
  closeHelpButton: document.querySelector("#close-help-button"),
  helpDialog: document.querySelector("#help-dialog"),
  statsButton: document.querySelector("#stats-button"),
  closeStatsButton: document.querySelector("#close-stats-button"),
  statsDialog: document.querySelector("#stats-dialog"),
  statsTotal: document.querySelector("#stats-total"),
  statsWins: document.querySelector("#stats-wins"),
  statsLosses: document.querySelector("#stats-losses"),
  statsWinRate: document.querySelector("#stats-win-rate"),
  statsAverage: document.querySelector("#stats-average"),
  statsEmpty: document.querySelector("#stats-empty"),
  mistakeDistribution: document.querySelector("#mistake-distribution"),
  newGameButton: document.querySelector("#new-game-button"),
  resultPanel: document.querySelector("#result-panel"),
  answerLine: document.querySelector("#answer-line"),
  copyButton: document.querySelector("#copy-button"),
  shareDialog: document.querySelector("#share-dialog"),
  closeShareButton: document.querySelector("#close-share-button"),
  shareMeta: document.querySelector("#share-meta"),
  shareScore: document.querySelector("#share-score"),
  shareGrid: document.querySelector("#share-grid"),
  shareCopyButton: document.querySelector("#share-copy-button"),
  shareCopyStatus: document.querySelector("#share-copy-status"),
  confetti: document.querySelector("#confetti"),
  modeButtons: document.querySelectorAll("[data-mode]"),
  statsModeButtons: document.querySelectorAll("[data-stats-mode]"),
  resetRecordsButton: document.querySelector("#reset-records-button"),
  mistakeDots: document.querySelector("#mistake-dots"),
  shuffleButton: document.querySelector("#shuffle-button"),
  deselectButton: document.querySelector("#deselect-button"),
  submitButton: document.querySelector("#submit-button"),
};

const state = {
  mode: CONNECTIONS_MODES.daily,
  activeStatsMode: CONNECTIONS_MODES.daily,
  round: 0,
  dailyKey: getDailyKey(),
  puzzle: null,
  tileOrder: [],
  selectedWords: [],
  solvedGroups: [],
  mistakeCount: 0,
  submittedKeys: [],
  solved: false,
  gameOver: false,
  lastPuzzleId: "",
  modeSessions: {},
  stats: loadStats(),
};

let confettiAnimation = 0;

loadInitialGame();

els.board.addEventListener("click", handleBoardClick);
els.shuffleButton.addEventListener("click", shuffleRemainingTiles);
els.deselectButton.addEventListener("click", clearSelection);
els.submitButton.addEventListener("click", submitSelection);
els.newGameButton.addEventListener("click", handleNewGameButton);
els.helpButton.addEventListener("click", () => els.helpDialog.showModal());
els.closeHelpButton.addEventListener("click", () => els.helpDialog.close());
els.statsButton.addEventListener("click", openStatsDialog);
els.closeStatsButton.addEventListener("click", () => els.statsDialog.close());
els.closeShareButton.addEventListener("click", () => els.shareDialog.close());
els.copyButton.addEventListener("click", openShareDialog);
els.shareCopyButton.addEventListener("click", copyShareText);
els.modeButtons.forEach((button) => {
  button.addEventListener("click", () => switchMode(button.dataset.mode));
});
els.statsModeButtons.forEach((button) => {
  button.addEventListener("click", () => switchStatsMode(button.dataset.statsMode));
});
els.resetRecordsButton.addEventListener("click", resetAllRecords);
window.addEventListener("pagehide", saveCurrentSession);

function loadInitialGame() {
  if (!restoreModeSession(state.mode)) {
    startGame({ skipAbandonedRecord: true });
  }
  warnIfStorageMayBeTemporary();
}

function warnIfStorageMayBeTemporary() {
  if (window.location.protocol === "file:") {
    setMessage("当前是本地文件打开，保存可能被浏览器拦截；测试记录保留请用本地服务器或 GitHub Pages 地址。", "error");
    return;
  }

  if (!canUseLocalStorage()) {
    setMessage("当前浏览器阻止了本机保存，重新打开后记录可能会丢失。", "error");
  }
}

function canUseLocalStorage() {
  try {
    const testKey = "wordweave.storageTest";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function handleNewGameButton() {
  if (state.mode === CONNECTIONS_MODES.daily) {
    setMessage(
      state.gameOver
        ? "今日挑战已完成，结果会保留。"
        : "每日挑战每天固定一题，当前进度会保留。",
      state.gameOver ? "success" : "",
    );
    return;
  }

  startGame({ advancePracticeRound: state.gameOver });
  if (!state.gameOver) {
    setMessage("已换一题。");
  }
}

function startGame(options = {}) {
  const shouldAdvancePracticeRound =
    state.mode === CONNECTIONS_MODES.practice && (options.advancePracticeRound ?? true);
  if (shouldAdvancePracticeRound) {
    state.round += 1;
  }
  if (state.mode === CONNECTIONS_MODES.practice && state.round === 0) {
    state.round = 1;
  }
  if (state.mode === CONNECTIONS_MODES.daily) {
    state.round = 0;
  }

  state.dailyKey = getDailyKey();
  state.puzzle = pickPuzzle(state.mode, state.lastPuzzleId);
  state.lastPuzzleId = state.puzzle.id;
  state.tileOrder = shuffleWords(getPuzzleWords(state.puzzle));
  state.selectedWords = [];
  state.solvedGroups = [];
  state.mistakeCount = 0;
  state.submittedKeys = [];
  state.solved = false;
  state.gameOver = false;
  syncResultPanel();
  setMessage("");
  render();
  saveCurrentSession();
}

function handleBoardClick(event) {
  const button = event.target.closest("[data-word]");
  if (!button || state.gameOver) {
    return;
  }

  toggleWord(button.dataset.word);
}

function toggleWord(word) {
  if (isWordSolved(word)) {
    return;
  }

  const selectedIndex = state.selectedWords.indexOf(word);
  if (selectedIndex >= 0) {
    state.selectedWords.splice(selectedIndex, 1);
    setMessage("");
    render();
    saveCurrentSession();
    return;
  }

  if (state.selectedWords.length >= 4) {
    setMessage("一次只能选 4 个词。", "error");
    return;
  }

  state.selectedWords.push(word);
  setMessage("");
  render();
  saveCurrentSession();
}

function submitSelection() {
  if (state.gameOver) {
    setMessage(state.solved ? "这一局已经完成。" : "这一局已经结束。", state.solved ? "success" : "error");
    return;
  }

  if (state.selectedWords.length !== 4) {
    setMessage("请选择 4 个词。", "error");
    return;
  }

  const submittedKey = getWordSetKey(state.selectedWords);
  if (state.submittedKeys.includes(submittedKey)) {
    setMessage("这个组合已经试过了。", "error");
    return;
  }

  state.submittedKeys.push(submittedKey);
  const groupIndex = getMatchingGroupIndex(state.selectedWords);

  if (groupIndex >= 0) {
    state.solvedGroups.push(groupIndex);
    state.selectedWords = [];

    if (state.solvedGroups.length === 4) {
      state.solved = true;
      state.gameOver = true;
      recordGameResult(true);
      syncResultPanel();
      setMessage("完成！四组都找到了。", "success");
      triggerConfetti();
    } else {
      setMessage("找到一组。", "success");
    }

    render();
    saveCurrentSession();
    return;
  }

  state.mistakeCount += 1;
  const clue = isOneAway(state.selectedWords) ? "只差一个。" : "不是一组。";
  state.selectedWords = [];

  if (state.mistakeCount >= MAX_MISTAKES) {
    state.gameOver = true;
    recordGameResult(false);
    syncResultPanel();
    setMessage(`错误用完，本局结束。${clue}`, "error");
  } else {
    setMessage(`${clue}还剩 ${MAX_MISTAKES - state.mistakeCount} 次错误机会。`, "error");
  }

  render();
  saveCurrentSession();
}

function shuffleRemainingTiles() {
  if (state.gameOver) {
    return;
  }

  const solvedWords = new Set(getSolvedWords());
  const remaining = state.tileOrder.filter((word) => !solvedWords.has(word));
  const shuffled = shuffleWords(remaining);
  state.tileOrder = [...getSolvedWordsInOrder(), ...shuffled];
  setMessage("");
  render();
  saveCurrentSession();
}

function clearSelection() {
  if (!state.selectedWords.length) {
    return;
  }

  state.selectedWords = [];
  setMessage("");
  render();
  saveCurrentSession();
}

function render() {
  renderMode();
  renderSolvedGroups();
  renderBoard();
  renderMistakes();
  renderControls();
}

function renderMode() {
  els.roundLabel.textContent =
    state.mode === CONNECTIONS_MODES.daily
      ? `每日挑战 · ${formatDailyLabel(state.dailyKey)}`
      : `练习模式 · 第 ${getPracticeDisplayRound()} 局`;
  const newGameButtonLabel =
    state.mode === CONNECTIONS_MODES.daily
      ? "保留今日挑战"
      : state.gameOver
        ? "进入下一局"
        : "换一题";
  els.newGameButton.setAttribute("aria-label", newGameButtonLabel);
  els.newGameButton.setAttribute("title", newGameButtonLabel);
  els.modeButtons.forEach((button) => {
    const selected = button.dataset.mode === state.mode;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

function renderSolvedGroups() {
  els.solvedGroups.innerHTML = "";
  getVisibleGroupIndexes().forEach((groupIndex) => {
    els.solvedGroups.append(createSolvedGroup(groupIndex));
  });
}

function createSolvedGroup(groupIndex) {
  const group = state.puzzle.groups[groupIndex];
  const panel = document.createElement("section");
  panel.className = ["solved-group", `connection-group-${groupIndex}`].join(" ");
  panel.style.setProperty("--group-color", `var(--connection-${getGroupColorName(groupIndex)})`);

  const title = document.createElement("strong");
  title.className = "solved-group-title";
  title.textContent = group.title;
  panel.append(title);

  const words = document.createElement("div");
  words.className = "solved-group-words";
  words.textContent = group.words.join(" · ");
  panel.append(words);

  return panel;
}

function renderBoard() {
  els.board.innerHTML = "";
  const solvedWords = new Set(getVisibleSolvedWords());
  const words = state.tileOrder.filter((word) => !solvedWords.has(word));

  words.forEach((word) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = ["connection-tile", state.selectedWords.includes(word) ? "selected" : ""]
      .filter(Boolean)
      .join(" ");
    button.dataset.word = word;
    button.textContent = word;
    button.disabled = state.gameOver;
    button.setAttribute("aria-pressed", state.selectedWords.includes(word) ? "true" : "false");
    els.board.append(button);
  });
}

function renderMistakes() {
  els.mistakeDots.innerHTML = "";
  for (let index = 0; index < MAX_MISTAKES; index += 1) {
    const dot = document.createElement("span");
    dot.className = ["mistake-dot", index < state.mistakeCount ? "used" : ""]
      .filter(Boolean)
      .join(" ");
    els.mistakeDots.append(dot);
  }
}

function renderControls() {
  const hasSelection = state.selectedWords.length > 0;
  els.shuffleButton.disabled = state.gameOver;
  els.deselectButton.disabled = state.gameOver || !hasSelection;
  els.submitButton.disabled = state.gameOver || state.selectedWords.length !== 4;
}

function syncResultPanel() {
  if (!state.gameOver) {
    els.resultPanel.hidden = true;
    els.answerLine.textContent = "";
    return;
  }

  els.resultPanel.hidden = false;
  els.answerLine.textContent = state.solved
    ? `完成，用掉 ${state.mistakeCount} 次错误机会。`
    : "答案已全部展开。";
}

function openStatsDialog() {
  state.activeStatsMode = state.mode;
  renderStats();
  els.statsDialog.showModal();
}

function renderStats() {
  const stats = getStatsForMode(state.activeStatsMode);
  const { wins, losses, mistakeDistribution } = stats;
  const completed = wins + losses;
  const totalMistakes = mistakeDistribution.reduce((sum, count, index) => sum + count * index, 0);
  const average = wins ? totalMistakes / wins : 0;
  const maxBucket = Math.max(1, ...mistakeDistribution);

  els.statsModeButtons.forEach((button) => {
    const selected = button.dataset.statsMode === state.activeStatsMode;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
  els.statsTotal.textContent = completed.toLocaleString("en-US");
  els.statsWins.textContent = wins.toLocaleString("en-US");
  els.statsLosses.textContent = losses.toLocaleString("en-US");
  els.statsWinRate.textContent = completed ? `${Math.round((wins / completed) * 100)}%` : "0%";
  els.statsAverage.textContent = wins ? average.toFixed(1) : "-";
  els.statsEmpty.hidden = wins > 0;
  els.mistakeDistribution.innerHTML = "";

  for (let mistakeCount = 0; mistakeCount <= MAX_MISTAKES - 1; mistakeCount += 1) {
    const count = mistakeDistribution[mistakeCount] || 0;
    const barRow = document.createElement("div");
    barRow.className = "distribution-row";

    const label = document.createElement("span");
    label.className = "distribution-label";
    label.textContent = mistakeCount;
    barRow.append(label);

    const track = document.createElement("div");
    track.className = "distribution-track";

    const bar = document.createElement("div");
    bar.className = "distribution-bar";
    if (count === 0) {
      bar.classList.add("empty");
    }
    bar.style.width = count ? `${Math.max(5, (count / maxBucket) * 100)}%` : "0";
    bar.textContent = count;
    track.append(bar);
    barRow.append(track);

    els.mistakeDistribution.append(barRow);
  }
}

function recordGameResult(won) {
  const stats = getStatsForMode(state.mode);
  if (won) {
    stats.wins += 1;
    stats.mistakeDistribution[state.mistakeCount] += 1;
  } else {
    stats.losses += 1;
  }
  saveStats(state.stats);
  renderStats();
}

function getVisibleGroupIndexes() {
  if (!state.gameOver) {
    return state.solvedGroups.slice();
  }

  const allIndexes = state.puzzle.groups.map((_, index) => index);
  return [
    ...state.solvedGroups,
    ...allIndexes.filter((index) => !state.solvedGroups.includes(index)),
  ];
}

function getVisibleSolvedWords() {
  return getVisibleGroupIndexes().flatMap((groupIndex) => state.puzzle.groups[groupIndex].words);
}

function getSolvedWords() {
  return state.solvedGroups.flatMap((groupIndex) => state.puzzle.groups[groupIndex].words);
}

function getSolvedWordsInOrder() {
  const solvedWords = new Set(getSolvedWords());
  return state.tileOrder.filter((word) => solvedWords.has(word));
}

function isWordSolved(word) {
  return getSolvedWords().includes(word);
}

function getMatchingGroupIndex(words) {
  const selectedSet = new Set(words);
  return state.puzzle.groups.findIndex((group, groupIndex) => {
    if (state.solvedGroups.includes(groupIndex)) {
      return false;
    }
    return group.words.every((word) => selectedSet.has(word));
  });
}

function isOneAway(words) {
  const selectedSet = new Set(words);
  return state.puzzle.groups.some((group, groupIndex) => {
    if (state.solvedGroups.includes(groupIndex)) {
      return false;
    }
    const matched = group.words.filter((word) => selectedSet.has(word)).length;
    return matched === 3;
  });
}

function getWordSetKey(words) {
  return words.slice().sort((left, right) => left.localeCompare(right, "zh-Hans-CN")).join("|");
}

function saveCurrentSession() {
  const session = captureSession();
  state.modeSessions[state.mode] = session;
  if (state.mode === CONNECTIONS_MODES.daily) {
    saveDailySession(session);
  } else if (state.mode === CONNECTIONS_MODES.practice) {
    savePracticeSession(session);
  }
}

function captureSession() {
  return {
    mode: state.mode,
    round: state.round,
    dailyKey: state.dailyKey,
    puzzleId: state.puzzle?.id || "",
    tileOrder: state.tileOrder.slice(),
    selectedWords: state.selectedWords.slice(),
    solvedGroups: state.solvedGroups.slice(),
    mistakeCount: state.mistakeCount,
    submittedKeys: state.submittedKeys.slice(),
    solved: state.solved,
    gameOver: state.gameOver,
    lastPuzzleId: state.lastPuzzleId,
  };
}

function restoreModeSession(mode) {
  const sanitized = getRestorableSession(mode);
  if (!sanitized) {
    return false;
  }

  applySession(sanitized);
  return true;
}

function applySession(session) {
  state.mode = session.mode;
  state.round = session.round;
  state.dailyKey = session.dailyKey;
  state.puzzle = session.puzzle;
  state.tileOrder = session.tileOrder;
  state.selectedWords = session.selectedWords;
  state.solvedGroups = session.solvedGroups;
  state.mistakeCount = session.mistakeCount;
  state.submittedKeys = session.submittedKeys;
  state.solved = session.solved;
  state.gameOver = session.gameOver;
  state.lastPuzzleId = session.lastPuzzleId || session.puzzle.id;
  syncResultPanel();
  setMessage("");
  render();
  saveCurrentSession();
}

function getRestorableSession(mode) {
  const storedSession =
    mode === CONNECTIONS_MODES.daily ? loadDailySession() : loadPracticeSession();
  return choosePreferredSession(
    sanitizeSession(mode, state.modeSessions[mode]),
    sanitizeSession(mode, storedSession),
  );
}

function sanitizeSession(mode, source) {
  if (!source || source.mode !== mode) {
    return null;
  }

  const dailyKey = mode === CONNECTIONS_MODES.daily ? getDailyKey() : String(source.dailyKey || getDailyKey());
  const sourcePuzzleId = String(source.puzzleId || source.puzzle?.id || "");
  const expectedDailyPuzzle = mode === CONNECTIONS_MODES.daily ? pickPuzzle(CONNECTIONS_MODES.daily, "") : null;
  const puzzle =
    mode === CONNECTIONS_MODES.daily
      ? expectedDailyPuzzle
      : PUZZLES.find((item) => item.id === sourcePuzzleId);
  if (!puzzle) {
    return null;
  }
  if (mode === CONNECTIONS_MODES.daily && (source.dailyKey !== dailyKey || sourcePuzzleId !== puzzle.id)) {
    return null;
  }

  const puzzleWords = getPuzzleWords(puzzle);
  const wordSet = new Set(puzzleWords);
  const tileOrder = Array.isArray(source.tileOrder)
    ? source.tileOrder.filter((word) => wordSet.has(word))
    : [];
  puzzleWords.forEach((word) => {
    if (!tileOrder.includes(word)) {
      tileOrder.push(word);
    }
  });

  const solvedGroups = Array.isArray(source.solvedGroups)
    ? [...new Set(source.solvedGroups)]
        .filter((index) => Number.isInteger(index) && index >= 0 && index < puzzle.groups.length)
        .slice(0, 4)
    : [];
  const solvedWords = new Set(solvedGroups.flatMap((index) => puzzle.groups[index].words));
  const gameOver = Boolean(source.gameOver) || solvedGroups.length === 4 || Number(source.mistakeCount) >= MAX_MISTAKES;
  const selectedWords = gameOver || !Array.isArray(source.selectedWords)
    ? []
    : source.selectedWords.filter((word) => wordSet.has(word) && !solvedWords.has(word)).slice(0, 4);
  const mistakeCount = clampNumber(source.mistakeCount, 0, MAX_MISTAKES);
  const submittedKeys = Array.isArray(source.submittedKeys)
    ? source.submittedKeys.map((key) => String(key)).slice(0, 80)
    : [];
  const round = mode === CONNECTIONS_MODES.practice
    ? Math.max(1, Number.isInteger(source.round) ? source.round : 1)
    : 0;

  return {
    mode,
    round,
    dailyKey,
    puzzle,
    tileOrder,
    selectedWords,
    solvedGroups,
    mistakeCount,
    submittedKeys,
    solved: solvedGroups.length === 4 || Boolean(source.solved),
    gameOver,
    lastPuzzleId: String(source.lastPuzzleId || puzzle.id),
  };
}

function choosePreferredSession(left, right) {
  if (!left) {
    return right || null;
  }
  if (!right) {
    return left;
  }

  return getSessionScore(right) > getSessionScore(left) ? right : left;
}

function getSessionScore(session) {
  const completedBonus = session.gameOver ? 1000 : 0;
  const solvedBonus = session.solved ? 100 : 0;
  return completedBonus + solvedBonus + session.solvedGroups.length * 20 - session.mistakeCount;
}

function saveDailySession(session) {
  try {
    const preferred = choosePreferredSession(
      sanitizeSession(CONNECTIONS_MODES.daily, session),
      sanitizeSession(CONNECTIONS_MODES.daily, loadDailySession()),
    );
    if (preferred) {
      state.modeSessions[CONNECTIONS_MODES.daily] = preferred;
      localStorage.setItem(CONNECTIONS_DAILY_SESSION_STORAGE_KEY, JSON.stringify(captureStoredSession(preferred)));
    }
  } catch {
    // Daily progress should survive refresh when storage is available.
  }
}

function savePracticeSession(session) {
  try {
    const sanitized = sanitizeSession(CONNECTIONS_MODES.practice, session);
    if (sanitized) {
      state.modeSessions[CONNECTIONS_MODES.practice] = sanitized;
      localStorage.setItem(CONNECTIONS_PRACTICE_SESSION_STORAGE_KEY, JSON.stringify(captureStoredSession(sanitized)));
    }
  } catch {
    // Practice progress should survive refresh when storage is available.
  }
}

function captureStoredSession(session) {
  return {
    mode: session.mode,
    round: session.round,
    dailyKey: session.dailyKey,
    puzzleId: session.puzzle?.id || session.puzzleId || "",
    tileOrder: session.tileOrder,
    selectedWords: session.selectedWords,
    solvedGroups: session.solvedGroups,
    mistakeCount: session.mistakeCount,
    submittedKeys: session.submittedKeys,
    solved: session.solved,
    gameOver: session.gameOver,
    lastPuzzleId: session.lastPuzzleId,
  };
}

function loadDailySession() {
  try {
    return JSON.parse(localStorage.getItem(CONNECTIONS_DAILY_SESSION_STORAGE_KEY));
  } catch {
    return null;
  }
}

function loadPracticeSession() {
  try {
    return JSON.parse(localStorage.getItem(CONNECTIONS_PRACTICE_SESSION_STORAGE_KEY));
  } catch {
    return null;
  }
}

function switchMode(nextMode) {
  if (!Object.values(CONNECTIONS_MODES).includes(nextMode) || nextMode === state.mode) {
    return;
  }

  saveCurrentSession();
  state.mode = nextMode;
  if (!restoreModeSession(nextMode)) {
    startGame({ advancePracticeRound: false, skipAbandonedRecord: true });
  }
}

function switchStatsMode(nextMode) {
  if (!Object.values(CONNECTIONS_MODES).includes(nextMode)) {
    return;
  }

  state.activeStatsMode = nextMode;
  renderStats();
}

function resetAllRecords() {
  const confirmed = window.confirm("确定要清空 WordWeave 的本机记录吗？统计、每日挑战进度和练习模式局数都会被删除。");
  if (!confirmed) {
    return;
  }

  try {
    localStorage.removeItem(CONNECTIONS_STATS_STORAGE_KEY);
    localStorage.removeItem(CONNECTIONS_DAILY_SESSION_STORAGE_KEY);
    localStorage.removeItem(CONNECTIONS_PRACTICE_SESSION_STORAGE_KEY);
  } catch {
    setMessage("本机记录暂时无法清空。", "error");
    return;
  }

  state.mode = CONNECTIONS_MODES.daily;
  state.activeStatsMode = CONNECTIONS_MODES.daily;
  state.round = 0;
  state.dailyKey = getDailyKey();
  state.modeSessions = {};
  state.stats = createEmptyStats();
  state.lastPuzzleId = "";
  saveStats(state.stats);
  startGame({ skipAbandonedRecord: true });
  renderStats();
  setMessage("本机记录已清空。", "success");
}

function pickPuzzle(mode, previousPuzzleId) {
  if (mode === CONNECTIONS_MODES.daily) {
    return PUZZLES[getDailyIndex(PUZZLES.length)];
  }

  if (PUZZLES.length === 1) {
    return PUZZLES[0];
  }

  let candidate = PUZZLES[randomIndex(PUZZLES.length)];
  while (candidate.id === previousPuzzleId) {
    candidate = PUZZLES[randomIndex(PUZZLES.length)];
  }
  return candidate;
}

function getPuzzleWords(puzzle) {
  return puzzle.groups.flatMap((group) => group.words);
}

function getGroupIndexForWord(word) {
  return state.puzzle.groups.findIndex((group) => group.words.includes(word));
}

function getGroupColorName(groupIndex) {
  return ["yellow", "green", "blue", "violet"][groupIndex] || "yellow";
}

function getDailyKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value || String(date.getUTCFullYear());
  const month =
    parts.find((part) => part.type === "month")?.value ||
    String(date.getUTCMonth() + 1).padStart(2, "0");
  const day =
    parts.find((part) => part.type === "day")?.value ||
    String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDailyIndex(length) {
  const [year, month, day] = getDailyKey().split("-").map(Number);
  const beijingDate = Date.UTC(year, month - 1, day);
  const daysSinceEpoch = Math.floor((beijingDate - CONNECTIONS_DAILY_EPOCH) / DAY_IN_MS);
  return positiveModulo(daysSinceEpoch, length);
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function getPracticeDisplayRound() {
  if (state.mode !== CONNECTIONS_MODES.practice) {
    return Math.max(1, state.round || 1);
  }
  return getExpectedPracticeRoundNumber();
}

function getCompletedPracticeRounds() {
  const stats = getStatsForMode(CONNECTIONS_MODES.practice);
  return stats.wins + stats.losses;
}

function getExpectedPracticeRoundNumber() {
  const completed = getCompletedPracticeRounds();
  return Math.max(1, completed + (state.gameOver ? 0 : 1));
}

function formatDailyLabel(key) {
  const [, month, day] = key.split("-");
  return `${month}.${day}`;
}

function randomIndex(max) {
  if (window.crypto?.getRandomValues) {
    const bucket = new Uint32Array(1);
    window.crypto.getRandomValues(bucket);
    return bucket[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function shuffleWords(words) {
  const shuffled = words.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function triggerConfetti() {
  const canvas = els.confetti;
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const duration = reducedMotion ? 900 : 2600;
  const startedAt = performance.now();
  const count = reducedMotion ? 28 : 90;
  const colors = ["#d9be5a", "#70a66f", "#6ca6c9", "#a983c4", "#ffffff"];
  const pieces = Array.from({ length: count }, (_, index) => ({
    color: colors[index % colors.length],
    x: randomFloat(-20, width + 20),
    y: randomFloat(-height * 0.35, -20),
    drift: randomFloat(-38, 38),
    speed: randomFloat(height * 0.72, height * 1.06),
    size: randomFloat(7, 15),
    spin: randomFloat(-4, 4),
    phase: randomFloat(0, Math.PI * 2),
    delay: randomFloat(0, 0.25),
  }));

  cancelAnimationFrame(confettiAnimation);
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  canvas.classList.add("active");

  const drawFrame = (time) => {
    const progress = Math.min((time - startedAt) / duration, 1);
    context.clearRect(0, 0, width, height);

    pieces.forEach((piece) => drawConfettiPiece(context, piece, progress));
    context.globalAlpha = 1;

    if (progress < 1) {
      confettiAnimation = requestAnimationFrame(drawFrame);
      return;
    }

    context.clearRect(0, 0, width, height);
    canvas.classList.remove("active");
  };

  confettiAnimation = requestAnimationFrame(drawFrame);
}

function drawConfettiPiece(context, piece, progress) {
  const localProgress = clampNumber((progress - piece.delay) / (1 - piece.delay), 0, 1);
  if (localProgress <= 0) {
    return;
  }

  const x = piece.x + piece.drift * localProgress + Math.sin(localProgress * Math.PI * 4 + piece.phase) * 18;
  const y = piece.y + piece.speed * localProgress;
  const fade = 1 - clampNumber((localProgress - 0.74) / 0.26, 0, 1);

  context.save();
  context.translate(x, y);
  context.rotate(piece.spin * localProgress + piece.phase);
  context.globalAlpha = fade;
  context.fillStyle = piece.color;
  context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.62);
  context.restore();
}

function randomFloat(min, max) {
  return min + Math.random() * (max - min);
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return min;
  }
  return Math.min(Math.max(number, min), max);
}

function createEmptyModeStats() {
  return {
    wins: 0,
    losses: 0,
    mistakeDistribution: Array(MAX_MISTAKES + 1).fill(0),
  };
}

function createEmptyStats() {
  return {
    schemaVersion: CONNECTIONS_STATS_SCHEMA_VERSION,
    modes: {
      [CONNECTIONS_MODES.daily]: createEmptyModeStats(),
      [CONNECTIONS_MODES.practice]: createEmptyModeStats(),
    },
  };
}

function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONNECTIONS_STATS_STORAGE_KEY));
    const stats = createEmptyStats();

    if (saved?.modes) {
      stats.modes[CONNECTIONS_MODES.daily] = sanitizeModeStats(saved.modes[CONNECTIONS_MODES.daily]);
      stats.modes[CONNECTIONS_MODES.practice] = sanitizeModeStats(saved.modes[CONNECTIONS_MODES.practice]);
    }

    localStorage.setItem(CONNECTIONS_STATS_STORAGE_KEY, JSON.stringify(stats));
    return stats;
  } catch {
    return createEmptyStats();
  }
}

function sanitizeModeStats(source) {
  const stats = createEmptyModeStats();
  stats.wins = Number.isInteger(source?.wins) && source.wins > 0 ? source.wins : 0;
  stats.losses = Number.isInteger(source?.losses) && source.losses > 0 ? source.losses : 0;

  if (Array.isArray(source?.mistakeDistribution)) {
    for (let index = 0; index <= MAX_MISTAKES; index += 1) {
      const count = source.mistakeDistribution[index];
      stats.mistakeDistribution[index] = Number.isInteger(count) && count > 0 ? count : 0;
    }
  }

  return stats;
}

function getStatsForMode(mode) {
  if (!state.stats.modes[mode]) {
    state.stats.modes[mode] = createEmptyModeStats();
  }
  return state.stats.modes[mode];
}

function saveStats(stats) {
  try {
    localStorage.setItem(CONNECTIONS_STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    setMessage("统计暂时无法保存到本地。", "error");
  }
}

function setMessage(text, type = "") {
  els.message.textContent = text;
  els.message.className = `message ${type}`.trim();
}

function createShareText() {
  return `${GAME_NAME} ${getShareModeText()} ${getShareScoreText()}\n${getShareEmojiRows()}\n不含答案`;
}

function openShareDialog() {
  if (!state.gameOver) {
    return;
  }

  renderSharePreview();
  els.shareCopyStatus.textContent = "";
  els.shareDialog.showModal();
}

function renderSharePreview() {
  els.shareMeta.textContent = getShareModeText();
  els.shareScore.textContent = getShareScoreText();
  els.shareGrid.innerHTML = "";

  state.submittedKeys.forEach((key) => {
    const words = key.split("|").filter(Boolean);
    const row = document.createElement("div");
    row.className = "share-grid-row";
    words.forEach((word) => {
      const groupIndex = getGroupIndexForWord(word);
      const tile = document.createElement("span");
      tile.className = ["share-grid-cell", `connection-group-${groupIndex}`].join(" ");
      row.append(tile);
    });
    els.shareGrid.append(row);
  });
}

function getShareModeText() {
  if (state.mode === CONNECTIONS_MODES.daily) {
    return `每日挑战 · ${formatShareDate(state.dailyKey)}`;
  }
  return `练习模式 · 第 ${getPracticeDisplayRound()} 局`;
}

function formatShareDate(key) {
  return key.split("-").join(".");
}

function getShareScoreText() {
  if (state.solved) {
    return `4/4 · 错 ${state.mistakeCount}`;
  }
  return `X/4 · 错 ${state.mistakeCount}`;
}

function getShareEmojiRows() {
  return state.submittedKeys
    .map((key) =>
      key
        .split("|")
        .filter(Boolean)
        .map((word) => GROUP_EMOJIS[getGroupIndexForWord(word)] || "⬛")
        .join(""),
    )
    .join("\n");
}

async function copyShareText() {
  const text = createShareText();
  try {
    await navigator.clipboard.writeText(text);
    els.shareCopyStatus.textContent = "已复制。";
    setMessage("分享文案已复制。", "success");
  } catch {
    els.shareCopyStatus.textContent = "当前浏览器不允许自动复制，文案已显示在页面下方。";
    setMessage(text);
  }
}
