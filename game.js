const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 10;
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
const STATS_SCHEMA_VERSION = 2;
const LEGACY_COMPLETED_ROUNDS_FOR_CORRECTION = 24;
const LEGACY_ABANDONED_ROUND_CORRECTION = 3;
const EASTER_EGG_WORD = "gaver";
const CONFETTI_DURATION = 4200;
const CONFETTI_PIECES = 120;
const CONFETTI_COLORS = ["#3f7a3f", "#9a842f", "#d4ad32", "#d65a3a", "#429a92", "#7163d7", "#d66798"];
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
  closeHelpButton: document.querySelector("#close-help-button"),
  helpDialog: document.querySelector("#help-dialog"),
  statsButton: document.querySelector("#stats-button"),
  closeStatsButton: document.querySelector("#close-stats-button"),
  statsDialog: document.querySelector("#stats-dialog"),
  statsTotal: document.querySelector("#stats-total"),
  statsWins: document.querySelector("#stats-wins"),
  statsLosses: document.querySelector("#stats-losses"),
  statsAbandoned: document.querySelector("#stats-abandoned"),
  statsWinRate: document.querySelector("#stats-win-rate"),
  statsAverage: document.querySelector("#stats-average"),
  statsEmpty: document.querySelector("#stats-empty"),
  guessDistribution: document.querySelector("#guess-distribution"),
  newGameButton: document.querySelector("#new-game-button"),
  resultPanel: document.querySelector("#result-panel"),
  answerLine: document.querySelector("#answer-line"),
  copyButton: document.querySelector("#copy-button"),
  confetti: document.querySelector("#confetti"),
};

const state = {
  round: 0,
  answer: "",
  guesses: [],
  currentGuess: "",
  keyStatuses: {},
  revealingGuessIndex: -1,
  solved: false,
  gameOver: false,
  abandonedRecorded: false,
  stats: loadStats(),
  lastAnswer: "",
};

let confettiAnimation = 0;

startGame();

document.addEventListener("keydown", handlePhysicalKey);
els.keyboard.addEventListener("click", handleKeyboardClick);
els.newGameButton.addEventListener("click", () => startGame());
els.helpButton.addEventListener("click", () => els.helpDialog.showModal());
els.closeHelpButton.addEventListener("click", () => els.helpDialog.close());
els.statsButton.addEventListener("click", openStatsDialog);
els.closeStatsButton.addEventListener("click", () => els.statsDialog.close());
els.copyButton.addEventListener("click", copyResult);
window.addEventListener("beforeunload", recordAbandonedRound);

function startGame() {
  recordAbandonedRound();
  state.round += 1;
  state.answer = pickAnswer(state.lastAnswer);
  state.lastAnswer = state.answer;
  state.guesses = [];
  state.currentGuess = "";
  state.keyStatuses = {};
  state.revealingGuessIndex = -1;
  state.solved = false;
  state.gameOver = false;
  state.abandonedRecorded = false;
  els.resultPanel.hidden = true;
  setMessage("");
  render();
}

function handlePhysicalKey(event) {
  if (event.metaKey || event.ctrlKey || event.altKey || els.helpDialog.open || els.statsDialog.open) {
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
      state.solved ? "这一局已经答对了。点右上角可以换一个新词。" : "这一局已经结束。点右上角可以换一个新词。",
      state.solved ? "success" : "error",
    );
    return;
  }

  if (key === "enter") {
    submitGuess();
    return;
  }

  if (key === "backspace") {
    state.currentGuess = state.currentGuess.slice(0, -1);
    render();
    return;
  }

  if (/^[a-z]$/.test(key) && state.currentGuess.length < WORD_LENGTH) {
    state.currentGuess += key;
    render();
  }
}

function submitGuess() {
  const guess = state.currentGuess;
  if (guess.length !== WORD_LENGTH) {
    setMessage("需要刚好 5 个字母。", "error");
    return;
  }

  if (!GUESS_SET.has(guess)) {
    setMessage("词库里没有这个单词。", "error");
    return;
  }

  if (guess === EASTER_EGG_WORD) {
    triggerConfetti();
  }

  const evaluation = evaluateGuess(guess, state.answer);
  state.guesses.push({ word: guess, evaluation });
  state.revealingGuessIndex = state.guesses.length - 1;
  updateKeyStatuses(guess, evaluation);
  state.currentGuess = "";

  if (guess === state.answer) {
    state.solved = true;
    state.gameOver = true;
    recordGameResult(true);
    els.resultPanel.hidden = false;
    els.answerLine.textContent = `答案：${state.answer.toUpperCase()}，用了 ${state.guesses.length} 次。`;
    setMessage(`命中！用了 ${state.guesses.length} 次。`, "success");
  } else if (state.guesses.length >= MAX_ATTEMPTS) {
    state.gameOver = true;
    recordGameResult(false);
    els.resultPanel.hidden = false;
    els.answerLine.textContent = `答案：${state.answer.toUpperCase()}。`;
    setMessage(`第 ${MAX_ATTEMPTS} 次还没中，本局结束。`, "error");
  } else {
    const triesLeft = MAX_ATTEMPTS - state.guesses.length;
    setMessage(triesLeft <= 5 ? `还剩 ${triesLeft} 次。` : "");
  }

  render();
  state.revealingGuessIndex = -1;
}

function render() {
  els.roundLabel.textContent = `第 ${state.round} 局`;
  renderBoard();
  renderKeyboard();
}

function renderBoard() {
  els.board.innerHTML = "";
  const rowCount = Math.max(
    MIN_VISIBLE_ROWS,
    Math.min(MAX_ATTEMPTS, state.guesses.length + (state.gameOver ? 0 : 1)),
  );

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = document.createElement("div");
    row.className = "row";

    const guess = state.guesses[rowIndex];
    if (guess) {
      for (let index = 0; index < WORD_LENGTH; index += 1) {
        const revealIndex = rowIndex === state.revealingGuessIndex ? index : -1;
        row.append(createTile(guess.word[index], guess.evaluation[index], false, revealIndex));
      }
    } else if (rowIndex === state.guesses.length && !state.gameOver) {
      for (let index = 0; index < WORD_LENGTH; index += 1) {
        row.append(createTile(state.currentGuess[index] || "", "", true));
      }
    } else {
      for (let index = 0; index < WORD_LENGTH; index += 1) {
        row.append(createTile("", "", false));
      }
    }

    els.board.append(row);
  }
}

function createTile(letter, status, active, revealIndex = -1) {
  const tile = document.createElement("div");
  tile.className = [
    "tile",
    letter ? "filled" : "",
    active ? "active" : "",
    active && letter ? "has-letter" : "",
    revealIndex >= 0 ? "reveal" : "",
    status,
  ]
    .filter(Boolean)
    .join(" ");
  tile.textContent = letter;
  if (revealIndex >= 0) {
    tile.style.setProperty("--reveal-index", revealIndex);
  }

  if (letter && status) {
    tile.setAttribute("aria-label", `${letter.toUpperCase()} ${statusLabel(status)}`);
  }

  return tile;
}

function renderKeyboard() {
  els.keyboard.innerHTML = "";

  KEYBOARD_ROWS.forEach((letters, rowIndex) => {
    const row = document.createElement("div");
    row.className = "keyboard-row";

    if (rowIndex === 2) {
      row.append(createKey("enter", "ENTER", true));
    }

    Array.from(letters).forEach((letter) => {
      row.append(createKey(letter, letter, false));
    });

    if (rowIndex === 2) {
      row.append(createKey("backspace", "⌫", true, "删除"));
    }

    els.keyboard.append(row);
  });
}

function openStatsDialog() {
  renderStats();
  els.statsDialog.showModal();
}

function renderStats() {
  const { wins, losses, abandoned, distribution } = state.stats;
  const completed = wins + losses;
  const total = completed + abandoned;
  const totalWinGuesses = distribution.reduce((sum, count, index) => sum + count * index, 0);
  const average = wins ? totalWinGuesses / wins : 0;
  const maxBucket = Math.max(1, ...distribution.slice(1));

  els.statsTotal.textContent = total.toLocaleString("en-US");
  els.statsWins.textContent = wins.toLocaleString("en-US");
  els.statsLosses.textContent = losses.toLocaleString("en-US");
  els.statsAbandoned.textContent = abandoned.toLocaleString("en-US");
  els.statsWinRate.textContent = completed ? `${Math.round((wins / completed) * 100)}%` : "0%";
  els.statsAverage.textContent = wins ? average.toFixed(1) : "-";
  els.statsEmpty.hidden = wins > 0;
  els.guessDistribution.innerHTML = "";

  for (let guessCount = 1; guessCount <= MAX_ATTEMPTS; guessCount += 1) {
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

function recordGameResult(won) {
  state.abandonedRecorded = true;
  if (won) {
    state.stats.wins += 1;
    state.stats.distribution[state.guesses.length] += 1;
  } else {
    state.stats.losses += 1;
  }
  saveStats(state.stats);
  renderStats();
}

function recordAbandonedRound() {
  if (state.gameOver || state.abandonedRecorded || state.guesses.length === 0) {
    return;
  }

  state.stats.abandoned += 1;
  state.abandonedRecorded = true;
  saveStats(state.stats);
}

function createKey(key, label, wide, ariaLabel = label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = ["key", wide ? "wide" : "", state.keyStatuses[key] || ""]
    .filter(Boolean)
    .join(" ");
  button.dataset.key = key;
  button.textContent = label;
  button.setAttribute("aria-label", ariaLabel);
  return button;
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
    return "位置正确";
  }
  if (status === STATUS.present) {
    return "字母正确但位置不对";
  }
  return "答案里没有";
}

function pickAnswer(previousAnswer) {
  const bank = ANSWER_WORDS.length ? ANSWER_WORDS : FALLBACK_WORDS;
  if (bank.length === 1) {
    return bank[0];
  }

  let candidate = bank[randomIndex(bank.length)];
  while (candidate === previousAnswer) {
    candidate = bank[randomIndex(bank.length)];
  }
  return candidate;
}

function randomIndex(max) {
  if (window.crypto?.getRandomValues) {
    const bucket = new Uint32Array(1);
    window.crypto.getRandomValues(bucket);
    return bucket[0] % max;
  }
  return Math.floor(Math.random() * max);
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
  const duration = reducedMotion ? 1200 : CONFETTI_DURATION;
  const startedAt = performance.now();
  const pieces = createConfettiPieces(width, height, reducedMotion ? 42 : CONFETTI_PIECES);

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

    pieces.forEach((piece) => drawConfettiPiece(context, piece, progress, height));

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

function createConfettiPieces(width, height, count) {
  const pieces = [];

  for (let index = 0; index < count; index += 1) {
    const laneProgress = index / count;
    pieces.push({
      alpha: randomFloat(0.62, 0.95),
      bob: randomFloat(5, 18),
      bend: randomFloat(-2.8, 2.8),
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
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

function createEmptyStats() {
  return {
    schemaVersion: STATS_SCHEMA_VERSION,
    wins: 0,
    losses: 0,
    abandoned: 0,
    distribution: Array(MAX_ATTEMPTS + 1).fill(0),
  };
}

function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY));
    const stats = createEmptyStats();
    stats.wins = Number.isInteger(saved?.wins) && saved.wins > 0 ? saved.wins : 0;
    stats.losses = Number.isInteger(saved?.losses) && saved.losses > 0 ? saved.losses : 0;
    stats.abandoned = Number.isInteger(saved?.abandoned) && saved.abandoned > 0 ? saved.abandoned : 0;
    if (Array.isArray(saved?.distribution)) {
      for (let index = 1; index <= MAX_ATTEMPTS; index += 1) {
        const count = saved.distribution[index];
        stats.distribution[index] = Number.isInteger(count) && count > 0 ? count : 0;
      }
    }
    if (
      saved &&
      saved.schemaVersion !== STATS_SCHEMA_VERSION &&
      !Number.isInteger(saved.abandoned) &&
      stats.wins + stats.losses === LEGACY_COMPLETED_ROUNDS_FOR_CORRECTION
    ) {
      stats.abandoned = LEGACY_ABANDONED_ROUND_CORRECTION;
    }
    stats.schemaVersion = STATS_SCHEMA_VERSION;
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    return stats;
  } catch {
    return createEmptyStats();
  }
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
  const rows = state.guesses
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

  return `LetterLock ${state.guesses.length}/${MAX_ATTEMPTS}\n${rows}\n答案：${state.answer.toUpperCase()}`;
}

async function copyResult() {
  const text = createShareText();
  try {
    await navigator.clipboard.writeText(text);
    setMessage("结果已复制。", "success");
  } catch {
    setMessage(text);
  }
}
