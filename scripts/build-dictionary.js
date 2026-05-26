const fs = require("fs");

const GUESS_SOURCE = process.env.WORDLE_GUESS_SOURCE || "data/wordle-allowed-guesses.txt";
const ANSWER_SOURCE = process.env.WORDLE_ANSWER_SOURCE || "data/wordle-answer-words.txt";
const EXTRA_GUESS_SOURCE = process.env.WORDLE_EXTRA_GUESS_SOURCE || "data/extra-guess-words.txt";
const EXTRA_PROPER_GUESS_SOURCE =
  process.env.WORDLE_EXTRA_PROPER_GUESS_SOURCE || "data/extra-proper-guess-words.txt";
const EXCLUDED_ANSWER_SOURCE = process.env.WORDLE_EXCLUDED_ANSWER_SOURCE || "data/excluded-answer-words.txt";
const FALLBACK_SOURCE = process.env.WORDS_SOURCE || "/usr/share/dict/words";
const TARGET = "dictionary.js";
const FIVE_LETTER_WORD_RE = /^[a-z]{5}$/;

const readWords = (source) => {
  const text = fs.readFileSync(source, "utf8");
  return [...new Set(text.split(/\r?\n/).filter((word) => FIVE_LETTER_WORD_RE.test(word)))]
    .sort((left, right) => left.localeCompare(right, "en-US"));
};

const guesses = fs.existsSync(GUESS_SOURCE) ? readWords(GUESS_SOURCE) : readWords(FALLBACK_SOURCE);
const extraGuesses = fs.existsSync(EXTRA_GUESS_SOURCE) ? readWords(EXTRA_GUESS_SOURCE) : [];
const extraProperGuesses = fs.existsSync(EXTRA_PROPER_GUESS_SOURCE)
  ? readWords(EXTRA_PROPER_GUESS_SOURCE)
  : [];
const supplementalGuesses = [...new Set([...extraGuesses, ...extraProperGuesses])];
const guessWords = [...new Set([...guesses, ...supplementalGuesses])]
  .sort((left, right) => left.localeCompare(right, "en-US"));
const answers = fs.existsSync(ANSWER_SOURCE) ? readWords(ANSWER_SOURCE) : guesses;
const excludedAnswers = fs.existsSync(EXCLUDED_ANSWER_SOURCE) ? new Set(readWords(EXCLUDED_ANSWER_SOURCE)) : new Set();
const answerExclusions = new Set([...excludedAnswers, ...supplementalGuesses]);
const guessSet = new Set(guessWords);
const answerWords = answers.filter((word) => guessSet.has(word) && !answerExclusions.has(word));

if (!guessWords.length || !answerWords.length) {
  throw new Error("No usable five-letter words found");
}

const output = `/*
 * Generated from:
 * - guesses: ${fs.existsSync(GUESS_SOURCE) ? GUESS_SOURCE : FALLBACK_SOURCE}
 * - extra guesses: ${fs.existsSync(EXTRA_GUESS_SOURCE) ? EXTRA_GUESS_SOURCE : "none"}
 * - extra proper guesses: ${fs.existsSync(EXTRA_PROPER_GUESS_SOURCE) ? EXTRA_PROPER_GUESS_SOURCE : "none"}
 * - answers: ${fs.existsSync(ANSWER_SOURCE) ? ANSWER_SOURCE : "same as guesses"}
 * - excluded answers: ${fs.existsSync(EXCLUDED_ANSWER_SOURCE) ? EXCLUDED_ANSWER_SOURCE : "none"}
 */
globalThis.WORDLE_GUESS_WORDS = ${JSON.stringify(guessWords)};
globalThis.WORDLE_ANSWER_WORDS = ${JSON.stringify(answerWords)};
`;

fs.writeFileSync(TARGET, output);
console.log(`Wrote ${TARGET}: ${guessWords.length} guess words, ${answerWords.length} answer words`);
