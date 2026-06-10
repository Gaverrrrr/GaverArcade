const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ECDICT_SOURCE = process.env.ECDICT_SOURCE || path.join(ROOT, "data/ecdict.csv");
const FREQUENCY_SOURCE = process.env.FREQUENCY_SOURCE || "";
const TARGET = path.join(ROOT, "word-info.js");

require(path.join(ROOT, "dictionary.js"));

const ANSWERS = globalThis.WORDLE_ANSWER_WORDS || [];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some(Boolean)) {
    rows.push(row);
  }

  return rows;
}

function readFrequencyRanks(source) {
  if (!source || !fs.existsSync(source)) {
    return new Map();
  }

  const ranks = new Map();
  fs.readFileSync(source, "utf8")
    .split(/\r?\n/)
    .forEach((line, index) => {
      const [word] = line.trim().split(/\s+/);
      if (/^[a-z]+$/.test(word) && !ranks.has(word)) {
        ranks.set(word, index + 1);
      }
    });
  return ranks;
}

function stripEnglishPartOfSpeech(text) {
  return text.replace(/^(?:n|v|a|s|r|adj|adv)\.?\s+/i, "").trim();
}

function stripChinesePartOfSpeech(text) {
  return text
    .replace(/^(?:interj|prep|pron|conj|adj|adv|vt|vi|int|n|v)\.?\s*/i, "")
    .replace(/^\[[^\]]+\]\s*/, "")
    .trim();
}

function compactText(text, maxLength) {
  const normalized = text.replace(/\s+/g, " ").replace(/[,，]\s*/g, "，").trim();
  if (!maxLength || normalized.length <= maxLength) {
    return normalized;
  }
  const clipped = normalized.slice(0, maxLength - 1);
  const boundary = Math.max(
    clipped.lastIndexOf("；"),
    clipped.lastIndexOf(";"),
    clipped.lastIndexOf("."),
    clipped.lastIndexOf(" "),
  );
  const safeClip = boundary > Math.floor(maxLength * 0.72) ? clipped.slice(0, boundary) : clipped;
  return `${safeClip.trim()}…`;
}

function firstUsefulLines(text, { strip, skipNetwork = false, maxLines = 2, maxLength = 96 }) {
  const lines = String(text || "")
    .replace(/\\n/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !(skipNetwork && /^\[(?:网络|医|法|商)\]/.test(line)))
    .map(strip)
    .filter(Boolean);

  return compactText(lines.slice(0, maxLines).join("；"), maxLength);
}

function getLevel(word, entry, ranks) {
  const rank = ranks.get(word);

  if (rank && rank <= 1800) {
    return "核心词";
  }
  if (rank && rank <= 4500) {
    return "高频词";
  }
  if (rank && rank <= 8500) {
    return "常见词";
  }
  if (rank && rank <= 14000) {
    return "进阶词";
  }
  if (rank) {
    return "低频词";
  }

  const collins = Number(entry.collins || 0);
  const oxford = entry.oxford === "1";
  const tags = String(entry.tag || "");
  if (collins >= 4 || /\b(?:zk|gk)\b/.test(tags)) {
    return "高频词";
  }
  if (collins >= 2 || oxford || /\b(?:cet4|ielts)\b/.test(tags)) {
    return "常见词";
  }
  if (rank || collins > 0 || Number(entry.bnc || 0) > 0 || Number(entry.frq || 0) > 0) {
    return "进阶词";
  }
  return "低频词";
}

if (!fs.existsSync(ECDICT_SOURCE)) {
  throw new Error(`ECDICT source not found: ${ECDICT_SOURCE}`);
}

const rows = parseCsv(fs.readFileSync(ECDICT_SOURCE, "utf8").replace(/^\uFEFF/, ""));
const header = rows.shift();
const fieldIndex = Object.fromEntries(header.map((field, index) => [field, index]));
const ranks = readFrequencyRanks(FREQUENCY_SOURCE);
const entries = new Map();

rows.forEach((row) => {
  const word = String(row[fieldIndex.word] || "").trim().toLowerCase();
  if (!word || entries.has(word)) {
    return;
  }
  entries.set(word, {
    definition: row[fieldIndex.definition] || "",
    translation: row[fieldIndex.translation] || "",
    collins: row[fieldIndex.collins] || "",
    oxford: row[fieldIndex.oxford] || "",
    tag: row[fieldIndex.tag] || "",
    bnc: row[fieldIndex.bnc] || "",
    frq: row[fieldIndex.frq] || "",
  });
});

const info = {};
let missing = 0;

ANSWERS.forEach((word) => {
  const entry = entries.get(word);
  if (!entry) {
    missing += 1;
    return;
  }

  info[word] = {
    level: getLevel(word, entry, ranks),
    en: firstUsefulLines(entry.definition, {
      strip: stripEnglishPartOfSpeech,
      maxLines: 2,
      maxLength: 420,
    }),
    zh: firstUsefulLines(entry.translation, {
      strip: stripChinesePartOfSpeech,
      skipNetwork: true,
      maxLines: 2,
      maxLength: 82,
    }),
  };
});

const output = `/* Generated by scripts/build-word-info.js from ECDICT. */\nglobalThis.LETTERLOCK_WORD_INFO = ${JSON.stringify(info)};\n`;
fs.writeFileSync(TARGET, output);
console.log(`Wrote ${path.relative(ROOT, TARGET)}: ${Object.keys(info).length} words, ${missing} missing`);
