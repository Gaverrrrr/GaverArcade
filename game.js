const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 10;
const DAILY_MAX_ATTEMPTS = 6;
const MIN_VISIBLE_ROWS = 6;
const STATUS = {
  correct: "correct",
  present: "present",
  absent: "absent",
};
const STATUS_RANK = {
  [STATUS.absent]: 1,
  [STATUS.present]: 2,
  [STATUS.correct]: 3,
};
const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const STATS_STORAGE_KEY = "letterlock.stats.v1";
const DAILY_SESSION_STORAGE_KEY = "letterlock.dailySession.v1";
const PRACTICE_SESSION_STORAGE_KEY = "letterlock.practiceSession.v1";
const DAILY_HISTORY_STORAGE_KEY = "letterlock.dailyHistory.v1";
const THEME_STORAGE_KEY = "letterlock.theme.v1";
const STATS_SCHEMA_VERSION = 3;
const DAILY_HISTORY_DAYS = 14;
const EASTER_EGG_WORD = "gaver";
const CONFETTI_DURATION = 4200;
const CONFETTI_PIECES = 120;
const UNLOCK_EFFECT_DURATION = 1750;
const UNLOCK_CONFETTI_DELAY = 240;
const UNLOCK_CONFETTI_FALLBACK_COUNT = 150;
const UNLOCK_CONFETTI_BURST_COUNT = 170;
const CONFETTI_COLORS = ["#3f7a3f", "#9a842f", "#d4ad32", "#d65a3a", "#429a92", "#7163d7", "#d66798"];
const UNLOCK_CONFETTI_COLORS = ["#ffd166", "#5bd88f", "#4ecbff", "#ff6f9e", "#9d8cff", "#ffffff"];
const GAME_MODES = {
  daily: "daily",
  practice: "practice",
};
const DAILY_ANSWER_OVERRIDES = {
  "2026-05-27": "plant",
  "2026-05-28": "smile",
};
const DAILY_EPOCH = Date.UTC(2024, 0, 1);
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const FALLBACK_WORDS = [
  "about",
  "adore",
  "alert",
  "apple",
  "arise",
  "beach",
  "blend",
  "brave",
  "chair",
  "clean",
  "cloud",
  "dance",
  "dream",
  "earth",
  "faith",
  "flame",
  "fresh",
  "globe",
  "grace",
  "heart",
  "house",
  "light",
  "magic",
  "music",
  "ocean",
  "plant",
  "quiet",
  "river",
  "scale",
  "shine",
  "smile",
  "sound",
  "stone",
  "table",
  "touch",
  "trace",
  "trust",
  "value",
  "voice",
  "world",
];

const DICTIONARY_GUESSES = normalizeWordList(globalThis.WORDLE_GUESS_WORDS);
const DICTIONARY_ANSWERS = normalizeWordList(globalThis.WORDLE_ANSWER_WORDS);
const GUESS_WORDS = DICTIONARY_GUESSES.length
  ? DICTIONARY_GUESSES
  : normalizeWordList(FALLBACK_WORDS);
const GUESS_SET = new Set(GUESS_WORDS);
const ANSWER_WORDS = normalizeWordList(
  (DICTIONARY_ANSWERS.length ? DICTIONARY_ANSWERS : GUESS_WORDS).filter((word) =>
    GUESS_SET.has(word),
  ),
);

const els = {
  board: document.querySelector("#board"),
  keyboard: document.querySelector("#keyboard"),
  message: document.querySelector("#message"),
  roundLabel: document.querySelector("#round-label"),
  helpButton: document.querySelector("#help-button"),
  themeButton: document.querySelector("#theme-button"),
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
  guessDistribution: document.querySelector("#guess-distribution"),
  dailyHistory: document.querySelector("#daily-history"),
  dailyCurrentStreak: document.querySelector("#daily-current-streak"),
  dailyBestStreak: document.querySelector("#daily-best-streak"),
  dailyRecentWins: document.querySelector("#daily-recent-wins"),
  dailyCalendar: document.querySelector("#daily-calendar"),
  dailyHistoryList: document.querySelector("#daily-history-list"),
  dailyHistoryEmpty: document.querySelector("#daily-history-empty"),
  newGameButton: document.querySelector("#new-game-button"),
  resultPanel: document.querySelector("#result-panel"),
  answerLine: document.querySelector("#answer-line"),
  wordInfo: document.querySelector("#word-info"),
  wordInfoWord: document.querySelector("#word-info-word"),
  wordInfoLevel: document.querySelector("#word-info-level"),
  wordInfoEnglish: document.querySelector("#word-info-en"),
  wordInfoChinese: document.querySelector("#word-info-zh"),
  copyButton: document.querySelector("#copy-button"),
  shareDialog: document.querySelector("#share-dialog"),
  closeShareButton: document.querySelector("#close-share-button"),
  shareMeta: document.querySelector("#share-meta"),
  shareScore: document.querySelector("#share-score"),
  shareGrid: document.querySelector("#share-grid"),
  shareCopyButton: document.querySelector("#share-copy-button"),
  shareCopyStatus: document.querySelector("#share-copy-status"),
  confetti: document.querySelector("#confetti"),
  unlockEffect: document.querySelector("#unlock-effect"),
  modeButtons: document.querySelectorAll("[data-mode]"),
  statsModeButtons: document.querySelectorAll("[data-stats-mode]"),
  resetRecordsButton: document.querySelector("#reset-records-button"),
};

const state = {
  mode: GAME_MODES.daily,
  activeStatsMode: GAME_MODES.daily,
  round: 0,
  dailyKey: getDailyKey(),
  answer: "",
  guesses: [],
  currentGuess: "",
  keyStatuses: {},
  revealingGuessIndex: -1,
  inputPulseIndex: -1,
  solved: false,
  gameOver: false,
  nextPracticeRoundPrepared: false,
  modeSessions: {},
  stats: loadStats(),
  lastAnswer: "",
};

let confettiAnimation = 0;
let unlockStartTimer = 0;
let unlockHideTimer = 0;
let unlockConfettiTimer = 0;

loadInitialGame();

const systemDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");

function getStoredTheme() {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  els.themeButton.textContent = theme === "dark" ? "☀︎" : "☾︎";
  els.themeButton.setAttribute(
    "aria-label",
    theme === "dark" ? "切换到浅色模式" : "切换到深色模式",
  );
}

function currentTheme() {
  return getStoredTheme() ?? (systemDarkQuery.matches ? "dark" : "light");
}

applyTheme(currentTheme());
systemDarkQuery.addEventListener("change", () => {
  if (!getStoredTheme()) {
    applyTheme(currentTheme());
  }
});
els.themeButton.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    /* 存储不可用时仅本次会话生效 */
  }
  applyTheme(next);
});

document.addEventListener("keydown", handlePhysicalKey);
els.keyboard.addEventListener("click", handleKeyboardClick);
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
  syncDailyHistoryFromStoredSession();
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
    const testKey = "letterlock.storageTest";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function handleNewGameButton() {
  if (state.mode === GAME_MODES.daily) {
    setMessage(
      state.gameOver
        ? "今日挑战已完成，猜测过程会保留。"
        : "每日挑战每天固定一个答案，当前进度会保留。",
      state.gameOver ? "success" : "",
    );
    return;
  }

  const shouldAdvanceRound = state.gameOver;
  startGame({
    advancePracticeRound: shouldAdvanceRound,
    skipAbandonedRecord: true,
  });
  if (!shouldAdvanceRound) {
    setMessage("本局已换词重新开始");
  }
}

function startGame(options = {}) {
  clearUnlockEffect();
  const shouldAdvancePracticeRound =
    state.mode === GAME_MODES.practice && (options.advancePracticeRound ?? true);
  if (shouldAdvancePracticeRound) {
    state.round += 1;
  }
  if (state.mode === GAME_MODES.practice && state.round === 0) {
    state.round = 1;
  }
  if (state.mode === GAME_MODES.daily) {
    state.round = 0;
  }
  state.dailyKey = getDailyKey();
  state.answer = pickAnswer(state.mode, state.lastAnswer);
  state.lastAnswer = state.answer;
  state.guesses = [];
  state.currentGuess = "";
  state.keyStatuses = {};
  state.revealingGuessIndex = -1;
  state.inputPulseIndex = -1;
  state.solved = false;
  state.gameOver = false;
  state.nextPracticeRoundPrepared = false;
  syncResultPanel();
  setMessage("");
  render();
  saveCurrentSession();
}

function handlePhysicalKey(event) {
  if (
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    els.helpDialog.open ||
    els.statsDialog.open ||
    els.shareDialog.open
  ) {
    return;
  }

  const key = event.key.toLowerCase();
  if (key === "enter" || key === "backspace" || /^[a-z]$/.test(key)) {
    event.preventDefault();
    handleKey(key);
  }
}

function handleKeyboardClick(event) {
  const button = event.target.closest("[data-key]");
  if (!button) {
    return;
  }
  handleKey(button.dataset.key);
}

function handleKey(key) {
  if (state.gameOver) {
    setMessage(
      state.solved ? `这一局已经答对了。${getRestartHint()}` : `这一局已经结束。${getRestartHint()}`,
      state.solved ? "success" : "error",
    );
    return;
  }

  if (key === "enter") {
    submitGuess();
    return;
  }

  if (key === "backspace") {
    const deletedIndex = state.currentGuess.length - 1;
    state.currentGuess = state.currentGuess.slice(0, -1);
    state.inputPulseIndex = deletedIndex >= 0 ? deletedIndex : -1;
    render();
    state.inputPulseIndex = -1;
    saveCurrentSession();
    return;
  }

  if (/^[a-z]$/.test(key) && state.currentGuess.length < WORD_LENGTH) {
    state.inputPulseIndex = state.currentGuess.length;
    state.currentGuess += key;
    render();
    state.inputPulseIndex = -1;
    saveCurrentSession();
  }
}

function submitGuess() {
  const guess = state.currentGuess;
  const attemptLimit = getAttemptLimit();
  if (guess.length !== WORD_LENGTH) {
    setMessage("需要刚好 5 个字母。", "error");
    return;
  }

  if (!GUESS_SET.has(guess)) {
    setMessage("词库里没有这个单词。", "error");
    return;
  }

  const shouldUnlock = guess === EASTER_EGG_WORD;

  const evaluation = evaluateGuess(guess, state.answer);
  state.guesses.push({ word: guess, evaluation });
  state.revealingGuessIndex = state.guesses.length - 1;
  updateKeyStatuses(guess, evaluation);
  state.currentGuess = "";

  if (guess === state.answer) {
    state.solved = true;
    state.gameOver = true;
    recordGameResult(true);
    syncResultPanel();
    setMessage(`命中！用了 ${state.guesses.length} 次。`, "success");
  } else if (state.guesses.length >= attemptLimit) {
    state.gameOver = true;
    recordGameResult(false);
    syncResultPanel();
    setMessage(`第 ${attemptLimit} 次还没中，本局结束。`, "error");
  } else {
    const triesLeft = attemptLimit - state.guesses.length;
    setMessage(triesLeft <= 5 ? `还剩 ${triesLeft} 次。` : "");
  }

  render();
  state.revealingGuessIndex = -1;
  saveCurrentSession();
  if (shouldUnlock) {
    unlockStartTimer = window.setTimeout(triggerGaverUnlock, 900);
  }
}

function render() {
  syncPracticeRoundNumber();
  renderMode();
  renderBoard();
  renderKeyboard();
}

function renderMode() {
  els.roundLabel.textContent =
    state.mode === GAME_MODES.daily
      ? `每日挑战 · ${formatDailyLabel(state.dailyKey)}`
      : "自由练习";
  const newGameButtonLabel =
    state.mode === GAME_MODES.daily
      ? "保留今日挑战"
      : state.gameOver
        ? "进入下一局"
        : "本局重来并换词";
  els.newGameButton.setAttribute(
    "aria-label",
    newGameButtonLabel,
  );
  els.newGameButton.setAttribute(
    "title",
    newGameButtonLabel,
  );
  els.modeButtons.forEach((button) => {
    const selected = button.dataset.mode === state.mode;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

function syncResultPanel() {
  if (!state.gameOver) {
    els.resultPanel.hidden = true;
    els.answerLine.textContent = "";
    renderWordInfo("");
    return;
  }

  els.resultPanel.hidden = false;
  els.answerLine.textContent = state.solved
    ? `答案：${state.answer.toUpperCase()}，用了 ${state.guesses.length} 次。`
    : `答案：${state.answer.toUpperCase()}。`;
  renderWordInfo(state.answer);
}

function renderWordInfo(word) {
  const info = word ? globalThis.LETTERLOCK_WORD_INFO?.[word] : null;
  if (!info || (!info.en && !info.zh)) {
    els.wordInfo.hidden = true;
    els.wordInfoWord.textContent = "";
    els.wordInfoLevel.textContent = "";
    els.wordInfoEnglish.textContent = "";
    els.wordInfoChinese.textContent = "";
    return;
  }

  els.wordInfo.hidden = false;
  els.wordInfoWord.textContent = word.toUpperCase();
  els.wordInfoLevel.textContent = info.level || "较少见";
  els.wordInfoEnglish.textContent = info.en || "暂无英文释义";
  els.wordInfoChinese.textContent = info.zh || "暂无中文含义";
}

function renderBoard() {
  els.board.innerHTML = "";
  const attemptLimit = getAttemptLimit();
  const rowCount = Math.max(
    MIN_VISIBLE_ROWS,
    Math.min(attemptLimit, state.guesses.length + (state.gameOver ? 0 : 1)),
  );

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = document.createElement("div");
    row.className = "row";

    const guess = state.guesses[rowIndex];
    if (guess) {
      for (let index = 0; index < WORD_LENGTH; index += 1) {
        const revealIndex = rowIndex === state.revealingGuessIndex ? index : -1;
        row.append(createTile(guess.word[index], guess.evaluation[index], false, revealIndex, index));
      }
    } else if (rowIndex === state.guesses.length && !state.gameOver) {
      for (let index = 0; index < WORD_LENGTH; index += 1) {
        row.append(
          createTile(
            state.currentGuess[index] || "",
            "",
            true,
            -1,
            index,
            index === state.inputPulseIndex,
          ),
        );
      }
    } else {
      for (let index = 0; index < WORD_LENGTH; index += 1) {
        row.append(createTile("", "", false, -1, index));
      }
    }

    els.board.append(row);
  }
}

function createTile(letter, status, active, revealIndex = -1, letterIndex = 0, pulse = false) {
  const tile = document.createElement("div");
  tile.className = [
    "tile",
    letter ? "filled" : "",
    active ? "active" : "",
    active && letter ? "has-letter" : "",
    pulse ? "input-pulse" : "",
    revealIndex >= 0 ? "reveal" : "",
    status,
  ]
    .filter(Boolean)
    .join(" ");
  tile.textContent = formatTileLetter(letter, letterIndex);
  if (revealIndex >= 0) {
    tile.style.setProperty("--reveal-index", revealIndex);
  }

  if (letter && status) {
    tile.setAttribute("aria-label", `${letter.toUpperCase()} ${statusLabel(status)}`);
  }

  return tile;
}

function formatTileLetter(letter, index) {
  if (!letter) {
    return "";
  }
  return letter.toUpperCase();
}

function renderKeyboard() {
  els.keyboard.innerHTML = "";

  KEYBOARD_ROWS.forEach((letters, rowIndex) => {
    const row = document.createElement("div");
    row.className = ["keyboard-row", `keyboard-row-${rowIndex + 1}`].join(" ");

    if (rowIndex === 1) {
      row.append(createKeyboardSpacer("half"));
    }

    Array.from(letters).forEach((letter) => {
      row.append(createKey(letter, letter, false));
    });

    if (rowIndex === 1) {
      row.append(createKeyboardSpacer("half"));
    }

    if (rowIndex === 2) {
      row.prepend(createKey("enter", "ENTER", true));
      row.append(createKey("backspace", "⌫", true, "删除"));
    }

    els.keyboard.append(row);
  });
}

function openStatsDialog() {
  state.activeStatsMode = state.mode;
  renderStats();
  els.statsDialog.showModal();
}

function renderStats() {
  const stats = getStatsForMode(state.activeStatsMode);
  const { wins, losses, distribution } = stats;
  const attemptLimit = getAttemptLimit(state.activeStatsMode);
  const completed = wins + losses;
  const total = completed;
  const totalWinGuesses = distribution.reduce((sum, count, index) => sum + count * index, 0);
  const average = wins ? totalWinGuesses / wins : 0;
  const maxBucket = Math.max(1, ...distribution.slice(1, attemptLimit + 1));

  els.statsModeButtons.forEach((button) => {
    const selected = button.dataset.statsMode === state.activeStatsMode;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
  els.statsTotal.textContent = total.toLocaleString("en-US");
  els.statsWins.textContent = wins.toLocaleString("en-US");
  els.statsLosses.textContent = losses.toLocaleString("en-US");
  els.statsWinRate.textContent = completed ? `${Math.round((wins / completed) * 100)}%` : "0%";
  els.statsAverage.textContent = wins ? average.toFixed(1) : "-";
  els.statsEmpty.hidden = wins > 0;
  els.guessDistribution.innerHTML = "";
  renderDailyHistory();

  for (let guessCount = 1; guessCount <= attemptLimit; guessCount += 1) {
    const count = distribution[guessCount] || 0;
    const barRow = document.createElement("div");
    barRow.className = "distribution-row";

    const label = document.createElement("span");
    label.className = "distribution-label";
    label.textContent = guessCount;
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

    els.guessDistribution.append(barRow);
  }
}

function renderDailyHistory() {
  const isDailyStats = state.activeStatsMode === GAME_MODES.daily;
  els.dailyHistory.hidden = !isDailyStats;
  if (!isDailyStats) {
    return;
  }

  const history = loadDailyHistory();
  const keys = getRecentDailyKeys(DAILY_HISTORY_DAYS);
  const playedKeys = keys.filter((key) => history[key]);
  const recentWins = keys.filter((key) => history[key]?.won).length;

  els.dailyCurrentStreak.textContent = `${getCurrentDailyStreak(history)}天`;
  els.dailyBestStreak.textContent = `${getBestDailyStreak(history)}天`;
  els.dailyRecentWins.textContent = `${recentWins}/${DAILY_HISTORY_DAYS}`;
  els.dailyHistoryEmpty.hidden = playedKeys.length > 0;
  els.dailyCalendar.innerHTML = "";
  els.dailyHistoryList.innerHTML = "";

  keys.forEach((key) => {
    const record = history[key];
    const day = document.createElement("div");
    day.className = [
      "daily-calendar-day",
      record ? (record.won ? "won" : "lost") : "missed",
      key === getDailyKey() ? "today" : "",
    ]
      .filter(Boolean)
      .join(" ");
    day.setAttribute("title", getDailyHistoryTitle(key, record));

    const date = document.createElement("span");
    date.textContent = formatHistoryDate(key);
    const result = document.createElement("strong");
    result.textContent = record ? (record.won ? `${record.guesses}/${record.maxAttempts}` : "X") : "-";

    day.append(date, result);
    els.dailyCalendar.append(day);
  });

  playedKeys
    .slice()
    .reverse()
    .slice(0, 7)
    .forEach((key) => {
      const record = history[key];
      const row = document.createElement("div");
      row.className = ["daily-history-row", record.won ? "won" : "lost"].join(" ");

      const date = document.createElement("span");
      date.textContent = formatHistoryDate(key);
      const status = document.createElement("strong");
      status.textContent = record.won ? "猜对" : "未中";
      const score = document.createElement("span");
      score.textContent = record.won ? `${record.guesses}/${record.maxAttempts}` : `X/${record.maxAttempts}`;

      row.append(date, status, score);
      els.dailyHistoryList.append(row);
    });
}

function getDailyHistoryTitle(key, record) {
  if (!record) {
    return `${formatHistoryDate(key)} 未玩`;
  }
  return record.won
    ? `${formatHistoryDate(key)} 猜对，用了 ${record.guesses} 次`
    : `${formatHistoryDate(key)} 未中`;
}

function recordDailyHistory(won) {
  recordDailyHistoryFromSession({
    dailyKey: state.dailyKey,
    guesses: state.guesses,
    gameOver: state.gameOver,
    solved: won,
  });
}

function recordDailyHistoryFromSession(session) {
  if (!session?.gameOver || !session.dailyKey) {
    return;
  }

  const history = loadDailyHistory();
  history[session.dailyKey] = {
    date: session.dailyKey,
    won: Boolean(session.solved),
    guesses: clamp(session.guesses?.length || 0, 0, DAILY_MAX_ATTEMPTS),
    maxAttempts: DAILY_MAX_ATTEMPTS,
  };
  saveDailyHistory(history);
}

function syncDailyHistoryFromStoredSession() {
  const candidates = [
    state.mode === GAME_MODES.daily ? captureSession() : null,
    loadDailySession(),
  ];

  candidates.forEach((candidate) => {
    const session = sanitizeSession(GAME_MODES.daily, candidate);
    if (session?.gameOver) {
      recordDailyHistoryFromSession(session);
    }
  });
}

function recordGameResult(won) {
  const stats = getStatsForMode(state.mode);
  if (won) {
    stats.wins += 1;
    stats.distribution[state.guesses.length] += 1;
  } else {
    stats.losses += 1;
  }
  if (state.mode === GAME_MODES.daily) {
    recordDailyHistory(won);
  }
  saveStats(state.stats);
  renderStats();
}

function createKey(key, label, wide, ariaLabel = label, extraClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = ["key", wide ? "wide" : "", extraClass, state.keyStatuses[key] || ""]
    .filter(Boolean)
    .join(" ");
  button.dataset.key = key;
  button.textContent = label;
  button.setAttribute("aria-label", ariaLabel);
  return button;
}

function createKeyboardSpacer(size = "") {
  const spacer = document.createElement("span");
  spacer.className = ["key-spacer", size ? `key-spacer-${size}` : ""].filter(Boolean).join(" ");
  spacer.setAttribute("aria-hidden", "true");
  return spacer;
}

function evaluateGuess(guess, answer) {
  const result = Array(WORD_LENGTH).fill(STATUS.absent);
  const leftovers = new Map();

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (guess[index] === answer[index]) {
      result[index] = STATUS.correct;
    } else {
      leftovers.set(answer[index], (leftovers.get(answer[index]) || 0) + 1);
    }
  }

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (result[index] === STATUS.correct) {
      continue;
    }

    const count = leftovers.get(guess[index]) || 0;
    if (count > 0) {
      result[index] = STATUS.present;
      leftovers.set(guess[index], count - 1);
    }
  }

  return result;
}

function updateKeyStatuses(guess, evaluation) {
  for (let index = 0; index < WORD_LENGTH; index += 1) {
    const letter = guess[index];
    const nextStatus = evaluation[index];
    const currentStatus = state.keyStatuses[letter];
    if (!currentStatus || STATUS_RANK[nextStatus] > STATUS_RANK[currentStatus]) {
      state.keyStatuses[letter] = nextStatus;
    }
  }
}

function statusLabel(status) {
  if (status === STATUS.correct) {
    return "字母和位置正确";
  }
  if (status === STATUS.present) {
    return "字母正确但位置不对";
  }
  return "本轮词语没有这个字母";
}

function saveCurrentSession() {
  const session = captureSession();
  state.modeSessions[state.mode] = session;
  if (state.mode === GAME_MODES.daily) {
    saveDailySession(session);
  } else if (state.mode === GAME_MODES.practice) {
    savePracticeSession(session);
  }
}

function captureSession() {
  return {
    mode: state.mode,
    round: state.round,
    dailyKey: state.dailyKey,
    answer: state.answer,
    guesses: state.guesses.map(({ word, evaluation }) => ({
      word,
      evaluation: evaluation.slice(),
    })),
    currentGuess: state.currentGuess,
    solved: state.solved,
    gameOver: state.gameOver,
    nextPracticeRoundPrepared: state.nextPracticeRoundPrepared,
    lastAnswer: state.lastAnswer,
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
  state.answer = session.answer;
  state.guesses = session.guesses;
  state.currentGuess = session.currentGuess;
  state.keyStatuses = rebuildKeyStatuses(session.guesses);
  state.revealingGuessIndex = -1;
  state.solved = session.solved;
  state.gameOver = session.gameOver;
  state.nextPracticeRoundPrepared = session.nextPracticeRoundPrepared;
  state.lastAnswer = session.lastAnswer || session.answer;
  syncResultPanel();
  setMessage("");
  render();
  saveCurrentSession();
}

function getRestorableSession(mode) {
  if (mode !== GAME_MODES.daily) {
    return choosePreferredSession(
      sanitizeSession(mode, state.modeSessions[mode]),
      sanitizeSession(mode, loadPracticeSession()),
    );
  }

  return choosePreferredSession(
    sanitizeSession(mode, state.modeSessions[mode]),
    sanitizeSession(mode, loadDailySession()),
  );
}

function sanitizeSession(mode, source) {
  if (!source || source.mode !== mode) {
    return null;
  }

  const limit = getAttemptLimit(mode);
  const dailyKey = mode === GAME_MODES.daily ? getDailyKey() : String(source.dailyKey || getDailyKey());
  const rawAnswer = String(source.answer || "").trim().toLowerCase();
  const expectedDailyAnswer = mode === GAME_MODES.daily ? pickAnswer(GAME_MODES.daily, "") : "";
  const answer = mode === GAME_MODES.daily ? expectedDailyAnswer : rawAnswer;
  if (!ANSWER_WORDS.includes(answer)) {
    return null;
  }
  if (mode === GAME_MODES.daily && (source.dailyKey !== dailyKey || rawAnswer !== expectedDailyAnswer)) {
    return null;
  }

  const guesses = Array.isArray(source.guesses)
    ? source.guesses
        .slice(0, limit)
        .map((guess) => sanitizeGuessRecord(guess, answer))
        .filter(Boolean)
    : [];
  const solved = guesses.some(({ word }) => word === answer);
  const gameOver = Boolean(source.gameOver) || solved || guesses.length >= limit;
  const currentGuess = gameOver ? "" : sanitizeCurrentGuess(source.currentGuess);
  const round = mode === GAME_MODES.practice
    ? Math.max(1, Number.isInteger(source.round) ? source.round : 1)
    : 0;

  return {
    mode,
    round,
    dailyKey,
    answer,
    guesses,
    currentGuess,
    solved,
    gameOver,
    nextPracticeRoundPrepared: false,
    lastAnswer: String(source.lastAnswer || answer).trim().toLowerCase(),
  };
}

function sanitizeGuessRecord(guess, answer) {
  const word = String(guess?.word || "").trim().toLowerCase();
  if (!GUESS_SET.has(word) || !/^[a-z]{5}$/.test(word)) {
    return null;
  }

  const evaluation = Array.isArray(guess?.evaluation) && guess.evaluation.length === WORD_LENGTH
    ? guess.evaluation.map((status) =>
        Object.values(STATUS).includes(status) ? status : STATUS.absent,
      )
    : evaluateGuess(word, answer);

  return { word, evaluation };
}

function sanitizeCurrentGuess(value) {
  const guess = String(value || "").trim().toLowerCase();
  return /^[a-z]{0,5}$/.test(guess) ? guess : "";
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
  return completedBonus + solvedBonus + session.guesses.length * 10 + session.currentGuess.length;
}

function rebuildKeyStatuses(guesses) {
  const keyStatuses = {};
  guesses.forEach(({ word, evaluation }) => {
    for (let index = 0; index < WORD_LENGTH; index += 1) {
      const letter = word[index];
      const nextStatus = evaluation[index];
      const currentStatus = keyStatuses[letter];
      if (!currentStatus || STATUS_RANK[nextStatus] > STATUS_RANK[currentStatus]) {
        keyStatuses[letter] = nextStatus;
      }
    }
  });
  return keyStatuses;
}

function saveDailySession(session) {
  try {
    const preferred = choosePreferredSession(
      sanitizeSession(GAME_MODES.daily, session),
      sanitizeSession(GAME_MODES.daily, loadDailySession()),
    );
    if (preferred) {
      state.modeSessions[GAME_MODES.daily] = preferred;
      localStorage.setItem(DAILY_SESSION_STORAGE_KEY, JSON.stringify(preferred));
    }
  } catch {
    // Daily progress should survive refresh when storage is available.
  }
}

function savePracticeSession(session) {
  try {
    const sanitized = sanitizeSession(GAME_MODES.practice, session);
    if (sanitized) {
      state.modeSessions[GAME_MODES.practice] = sanitized;
      localStorage.setItem(PRACTICE_SESSION_STORAGE_KEY, JSON.stringify(sanitized));
    }
  } catch {
    // Practice progress should survive refresh when storage is available.
  }
}

function loadDailySession() {
  try {
    return JSON.parse(localStorage.getItem(DAILY_SESSION_STORAGE_KEY));
  } catch {
    return null;
  }
}

function loadPracticeSession() {
  try {
    return JSON.parse(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY));
  } catch {
    return null;
  }
}

function switchMode(nextMode) {
  if (!Object.values(GAME_MODES).includes(nextMode) || nextMode === state.mode) {
    return;
  }

  saveCurrentSession();
  state.mode = nextMode;
  if (!restoreModeSession(nextMode)) {
    startGame({ advancePracticeRound: false, skipAbandonedRecord: true });
  }
}

function switchStatsMode(nextMode) {
  if (!Object.values(GAME_MODES).includes(nextMode)) {
    return;
  }

  state.activeStatsMode = nextMode;
  renderStats();
}

function resetAllRecords() {
  const confirmed = window.confirm("确定要清空本机所有记录吗？统计、每日挑战进度和练习模式局数都会被删除。");
  if (!confirmed) {
    return;
  }

  try {
    localStorage.removeItem(STATS_STORAGE_KEY);
    localStorage.removeItem("letterlock.mode.v1");
    localStorage.removeItem(DAILY_SESSION_STORAGE_KEY);
    localStorage.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    localStorage.removeItem(DAILY_HISTORY_STORAGE_KEY);
  } catch {
    setMessage("本机记录暂时无法清空。", "error");
    return;
  }

  state.mode = GAME_MODES.daily;
  state.activeStatsMode = GAME_MODES.daily;
  state.round = 0;
  state.dailyKey = getDailyKey();
  state.modeSessions = {};
  state.stats = createEmptyStats();
  state.lastAnswer = "";
  saveStats(state.stats);
  startGame({ skipAbandonedRecord: true });
  renderStats();
  setMessage("本机记录已清空。", "success");
}

function pickAnswer(mode, previousAnswer) {
  const bank = ANSWER_WORDS.length ? ANSWER_WORDS : FALLBACK_WORDS;
  if (bank.length === 1) {
    return bank[0];
  }

  if (mode === GAME_MODES.daily) {
    const dailyOverride = getDailyOverride(bank);
    if (dailyOverride) {
      return dailyOverride;
    }
    return bank[getDailyIndex(bank.length)];
  }

  let candidate = bank[randomIndex(bank.length)];
  while (candidate === previousAnswer) {
    candidate = bank[randomIndex(bank.length)];
  }
  return candidate;
}

function getRestartHint() {
  return state.mode === GAME_MODES.daily
    ? "今日挑战会保留完整记录。"
    : "点右上角可以换一个练习词。";
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
  const daysSinceEpoch = Math.floor((beijingDate - DAILY_EPOCH) / DAY_IN_MS);
  return positiveModulo(daysSinceEpoch, length);
}

function getRecentDailyKeys(count) {
  const today = getDailyKey();
  return Array.from({ length: count }, (_, index) => addDaysToDailyKey(today, index - count + 1));
}

function addDaysToDailyKey(key, delta) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + delta));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function formatHistoryDate(key) {
  const [, month, day] = key.split("-");
  return `${month}.${day}`;
}

function getCurrentDailyStreak(history) {
  const today = getDailyKey();
  const todayRecord = history[today];
  if (todayRecord && !todayRecord.won) {
    return 0;
  }

  let cursor = todayRecord?.won ? today : addDaysToDailyKey(today, -1);
  let streak = 0;
  while (history[cursor]?.won) {
    streak += 1;
    cursor = addDaysToDailyKey(cursor, -1);
  }
  return streak;
}

function getBestDailyStreak(history) {
  const keys = Object.keys(history).sort();
  let best = 0;
  let current = 0;
  let previous = "";

  keys.forEach((key) => {
    const record = history[key];
    if (!record?.won) {
      current = 0;
      previous = key;
      return;
    }

    current = previous && addDaysToDailyKey(previous, 1) === key ? current + 1 : 1;
    best = Math.max(best, current);
    previous = key;
  });

  return best;
}

function getDailyOverride(bank) {
  const override = DAILY_ANSWER_OVERRIDES[getDailyKey()];
  return override && bank.includes(override) ? override : "";
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function getAttemptLimit(mode = state.mode) {
  return mode === GAME_MODES.daily ? DAILY_MAX_ATTEMPTS : MAX_ATTEMPTS;
}

function getPracticeDisplayRound() {
  if (state.mode !== GAME_MODES.practice) {
    return Math.max(1, state.round || 1);
  }
  return getExpectedPracticeRoundNumber();
}

function getStatsForMode(mode) {
  if (!state.stats.modes[mode]) {
    state.stats.modes[mode] = createEmptyModeStats();
  }
  return state.stats.modes[mode];
}

function getCompletedPracticeRounds() {
  const stats = getStatsForMode(GAME_MODES.practice);
  return stats.wins + stats.losses;
}

function getExpectedPracticeRoundNumber() {
  const completed = getCompletedPracticeRounds();
  return Math.max(1, completed + (state.gameOver ? 0 : 1));
}

function syncPracticeRoundNumber() {
  if (state.mode !== GAME_MODES.practice) {
    return;
  }
  state.round = getExpectedPracticeRoundNumber();
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

function triggerGaverUnlock() {
  const origin = getUnlockOrigin();
  if (!els.unlockEffect) {
    triggerConfetti({
      mode: "burst",
      count: UNLOCK_CONFETTI_FALLBACK_COUNT,
      duration: 1700,
      colors: UNLOCK_CONFETTI_COLORS,
      origin,
    });
    return;
  }

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  clearUnlockEffect();
  setUnlockOrigin(origin);
  void els.unlockEffect.offsetWidth;
  void els.board.offsetWidth;
  els.unlockEffect.classList.add("active");
  els.board.classList.add("unlock-burst");
  document.body.classList.add("unlocking");

  unlockConfettiTimer = window.setTimeout(
    () =>
      triggerConfetti({
        mode: "burst",
        count: UNLOCK_CONFETTI_BURST_COUNT,
        duration: 1700,
        colors: UNLOCK_CONFETTI_COLORS,
        origin,
      }),
    reducedMotion ? 120 : UNLOCK_CONFETTI_DELAY,
  );
  unlockHideTimer = window.setTimeout(
    clearUnlockEffect,
    reducedMotion ? 900 : UNLOCK_EFFECT_DURATION,
  );
}

function clearUnlockEffect() {
  window.clearTimeout(unlockStartTimer);
  window.clearTimeout(unlockHideTimer);
  window.clearTimeout(unlockConfettiTimer);
  els.unlockEffect?.classList.remove("active");
  els.board.classList.remove("unlock-burst");
  document.body.classList.remove("unlocking");
}

function getUnlockOrigin() {
  const rect = els.board.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function setUnlockOrigin(origin) {
  els.unlockEffect.style.setProperty("--unlock-x", `${origin.x}px`);
  els.unlockEffect.style.setProperty("--unlock-y", `${origin.y}px`);
}

function triggerConfetti(options = {}) {
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
  const duration = reducedMotion ? 1200 : options.duration || CONFETTI_DURATION;
  const startedAt = performance.now();
  const count = reducedMotion ? 32 : options.count || CONFETTI_PIECES;
  const colors = options.colors || CONFETTI_COLORS;
  const isBurst = options.mode === "burst";
  const origin = options.origin || { x: width / 2, y: height * 0.42 };
  const pieces = isBurst
    ? createBurstConfettiPieces(width, height, count, colors, origin)
    : createConfettiPieces(width, height, count, colors);

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

    pieces.forEach((piece) => {
      if (isBurst) {
        drawBurstConfettiPiece(context, piece, progress);
        return;
      }
      drawConfettiPiece(context, piece, progress, height);
    });

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

function createConfettiPieces(width, height, count, colors = CONFETTI_COLORS) {
  const pieces = [];

  for (let index = 0; index < count; index += 1) {
    const laneProgress = index / count;
    pieces.push({
      alpha: randomFloat(0.62, 0.95),
      bob: randomFloat(5, 18),
      bend: randomFloat(-2.8, 2.8),
      color: colors[index % colors.length],
      delay: laneProgress * 0.42 + randomFloat(-0.025, 0.025),
      drift: randomFloat(-44, 44),
      endOffset: randomFloat(20, 150),
      fallCurve: randomFloat(0.92, 1.16),
      length: randomFloat(8, 18),
      phase: randomFloat(0, Math.PI * 2),
      spin: randomFloat(-1.1, 1.1),
      startX: randomFloat(-10, width + 10),
      startY: randomFloat(-height * 0.48, -24),
      sway: randomFloat(18, 46),
      swaySpeed: randomFloat(1.25, 2.6),
      tumble: randomFloat(1.6, 2.8),
      width: randomFloat(4, 7),
    });
  }

  return pieces;
}

function createBurstConfettiPieces(width, height, count, colors, origin) {
  const pieces = [];
  const reach = Math.min(Math.max(width, height) * 0.54, 560);

  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count + randomFloat(-0.22, 0.22);
    const speed = randomFloat(reach * 0.34, reach);
    pieces.push({
      alpha: randomFloat(0.7, 1),
      angle,
      bend: randomFloat(-3.4, 3.4),
      color: colors[index % colors.length],
      delay: randomFloat(0, 0.12),
      gravity: randomFloat(height * 0.09, height * 0.18),
      length: randomFloat(9, 20),
      originX: origin.x,
      originY: origin.y,
      phase: randomFloat(0, Math.PI * 2),
      spin: randomFloat(-2.8, 2.8),
      speed,
      width: randomFloat(4, 7),
    });
  }

  return pieces;
}

function drawBurstConfettiPiece(context, piece, progress) {
  const localProgress = clamp((progress - piece.delay) / (1 - piece.delay), 0, 1);
  if (localProgress <= 0) {
    return;
  }

  const launch = 1 - (1 - localProgress) ** 2.6;
  const settle = localProgress ** 2;
  const flutter = Math.sin(localProgress * Math.PI * 5.2 + piece.phase);
  const flip = 0.28 + Math.abs(Math.cos(localProgress * Math.PI * 6.5 + piece.phase)) * 0.88;
  const driftX = Math.cos(piece.angle) * piece.speed * launch;
  const driftY = Math.sin(piece.angle) * piece.speed * launch + piece.gravity * settle;
  const x = piece.originX + driftX + flutter * 10;
  const y = piece.originY + driftY + Math.cos(localProgress * Math.PI * 3 + piece.phase) * 8;
  const rotation = piece.angle + Math.PI / 2 + piece.spin * localProgress * Math.PI + flutter * 0.42;
  const fadeIn = clamp(localProgress / 0.08, 0, 1);
  const fadeOut = 1 - clamp((localProgress - 0.58) / 0.42, 0, 1);

  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.globalAlpha = piece.alpha * fadeIn * fadeOut;
  drawConfettiRibbon(context, piece, flip, piece.bend + flutter * piece.width * 0.45);
  context.restore();
}

function drawConfettiPiece(context, piece, progress, height) {
  const localProgress = clamp((progress - piece.delay) / 0.74, 0, 1);
  if (localProgress <= 0) {
    return;
  }

  const fallProgress = localProgress ** piece.fallCurve;
  const fadeIn = clamp(localProgress / 0.08, 0, 1);
  const fadeByFall = 1 - localProgress * 0.58;
  const fadeOut = 1 - clamp((localProgress - 0.86) / 0.14, 0, 1);
  const flutter = Math.sin(localProgress * Math.PI * piece.swaySpeed + piece.phase);
  const lazyFlutter = Math.sin(localProgress * Math.PI * (piece.swaySpeed * 0.55) + piece.phase * 0.7);
  const flip = 0.35 + Math.abs(Math.cos(localProgress * Math.PI * 5 + piece.phase)) * 0.75;
  const x = piece.startX + piece.drift * localProgress + flutter * piece.sway + lazyFlutter * piece.sway * 0.34;
  const y =
    piece.startY +
    (height + piece.endOffset - piece.startY) * fallProgress +
    Math.sin(localProgress * Math.PI * 3 + piece.phase) * piece.bob;
  const rotation =
    piece.phase +
    piece.spin * localProgress * Math.PI +
    Math.sin(localProgress * Math.PI * piece.tumble + piece.phase) * 0.9;
  const bend = piece.bend + flutter * piece.width * 0.55;

  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.globalAlpha = piece.alpha * fadeIn * fadeByFall * fadeOut;
  drawConfettiRibbon(context, piece, flip, bend);
  context.restore();
}

function drawConfettiRibbon(context, piece, flip, bend) {
  const halfWidth = (piece.width * flip) / 2;
  const halfLength = piece.length / 2;

  context.fillStyle = piece.color;
  context.beginPath();
  context.moveTo(-halfWidth, -halfLength);
  context.quadraticCurveTo(-halfWidth + bend, 0, -halfWidth, halfLength);
  context.lineTo(halfWidth, halfLength);
  context.quadraticCurveTo(halfWidth + bend, 0, halfWidth, -halfLength);
  context.closePath();
  context.fill();

  context.globalAlpha *= 0.22;
  context.strokeStyle = "#ffffff";
  context.lineWidth = Math.max(0.7, piece.width * 0.18);
  context.beginPath();
  context.moveTo(-halfWidth * 0.25, -halfLength * 0.82);
  context.quadraticCurveTo(bend * 0.35, 0, -halfWidth * 0.25, halfLength * 0.82);
  context.stroke();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomFloat(min, max) {
  return min + Math.random() * (max - min);
}

function normalizeWordList(source) {
  if (!Array.isArray(source)) {
    return [];
  }

  return [...new Set(source.map((word) => String(word).trim().toLowerCase()))]
    .filter((word) => /^[a-z]{5}$/.test(word))
    .sort((left, right) => left.localeCompare(right, "en-US"));
}

function createEmptyModeStats() {
  return {
    wins: 0,
    losses: 0,
    distribution: Array(MAX_ATTEMPTS + 1).fill(0),
  };
}

function createEmptyStats() {
  return {
    schemaVersion: STATS_SCHEMA_VERSION,
    modes: {
      [GAME_MODES.daily]: createEmptyModeStats(),
      [GAME_MODES.practice]: createEmptyModeStats(),
    },
  };
}

function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY));
    const stats = createEmptyStats();

    if (saved?.modes) {
      stats.modes[GAME_MODES.daily] = sanitizeModeStats(saved.modes[GAME_MODES.daily]);
      stats.modes[GAME_MODES.practice] = sanitizeModeStats(saved.modes[GAME_MODES.practice]);
    } else if (saved) {
      stats.modes[GAME_MODES.practice] = sanitizeModeStats(saved);
    }

    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    return stats;
  } catch {
    return createEmptyStats();
  }
}

function sanitizeModeStats(source) {
  const stats = createEmptyModeStats();
  stats.wins = Number.isInteger(source?.wins) && source.wins > 0 ? source.wins : 0;
  stats.losses = Number.isInteger(source?.losses) && source.losses > 0 ? source.losses : 0;

  if (Array.isArray(source?.distribution)) {
    for (let index = 1; index <= MAX_ATTEMPTS; index += 1) {
      const count = source.distribution[index];
      stats.distribution[index] = Number.isInteger(count) && count > 0 ? count : 0;
    }
  }

  return stats;
}

function loadDailyHistory() {
  try {
    return sanitizeDailyHistory(JSON.parse(localStorage.getItem(DAILY_HISTORY_STORAGE_KEY)));
  } catch {
    return {};
  }
}

function saveDailyHistory(history) {
  try {
    localStorage.setItem(DAILY_HISTORY_STORAGE_KEY, JSON.stringify(sanitizeDailyHistory(history)));
  } catch {
    setMessage("每日挑战历史暂时无法保存到本地。", "error");
  }
}

function sanitizeDailyHistory(source) {
  if (!source || typeof source !== "object") {
    return {};
  }

  const history = {};
  Object.entries(source).forEach(([key, value]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !value || typeof value !== "object") {
      return;
    }
    const guesses = Number(value.guesses);
    const maxAttempts = Number(value.maxAttempts);
    history[key] = {
      date: key,
      won: Boolean(value.won),
      guesses: Number.isInteger(guesses) ? clamp(guesses, 0, DAILY_MAX_ATTEMPTS) : 0,
      maxAttempts: Number.isInteger(maxAttempts)
        ? clamp(maxAttempts, 1, DAILY_MAX_ATTEMPTS)
        : DAILY_MAX_ATTEMPTS,
    };
  });

  return history;
}

function saveStats(stats) {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    setMessage("统计暂时无法保存到本地。", "error");
  }
}

function setMessage(text, type = "") {
  els.message.textContent = text;
  els.message.className = `message ${type}`.trim();
}

function createShareText() {
  return `LetterLock ${getShareModeText()} ${getShareScoreText()}\n${getShareEmojiRows()}\n不含答案`;
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

  state.guesses.forEach(({ evaluation }) => {
    const row = document.createElement("div");
    row.className = "share-grid-row";
    evaluation.forEach((status) => {
      const tile = document.createElement("span");
      tile.className = ["share-grid-cell", status].filter(Boolean).join(" ");
      row.append(tile);
    });
    els.shareGrid.append(row);
  });
}

function getShareModeText() {
  if (state.mode === GAME_MODES.daily) {
    return `每日挑战 · ${formatShareDate(state.dailyKey)}`;
  }
  return "自由练习";
}

function formatShareDate(key) {
  return key.split("-").join(".");
}

function getShareScoreText() {
  const score = state.solved ? state.guesses.length : "X";
  return `${score}/${getAttemptLimit()}`;
}

function getShareEmojiRows() {
  return state.guesses
    .map(({ evaluation }) =>
      evaluation
        .map((status) => {
          if (status === STATUS.correct) {
            return "🟩";
          }
          if (status === STATUS.present) {
            return "🟨";
          }
          return "⬛";
        })
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
