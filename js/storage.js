/* Lưu tiến độ học tập bằng localStorage (không cần tài khoản). */
(function () {
  "use strict";

  const KEY = "qtnl-quiz:v1";
  const RESULT_KEY = "qtnl-quiz:last-result";
  const THEME_KEY = "qtnl-quiz:theme";
  const HISTORY_LIMIT = 20;

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }

  function load() {
    const raw = safeGet(KEY);
    if (!raw) return { decks: {} };
    try {
      const data = JSON.parse(raw);
      return data && typeof data === "object" && data.decks ? data : { decks: {} };
    } catch (e) {
      return { decks: {} };
    }
  }

  function save(data) { safeSet(KEY, JSON.stringify(data)); }

  function emptyDeck() {
    return {
      attempts: 0, bestScore: null, lastScore: null,
      lastDurationSec: null, lastDate: null, history: [],
      practice: { answers: {}, updated: null }
    };
  }

  function getDeck(id) {
    const data = load();
    return Object.assign(emptyDeck(), data.decks[id] || {});
  }

  function updateDeck(id, fn) {
    const data = load();
    const deck = Object.assign(emptyDeck(), data.decks[id] || {});
    fn(deck);
    data.decks[id] = deck;
    save(data);
    return deck;
  }

  /** Ghi nhận một lượt làm bài. Chỉ chế độ thi được tính vào điểm. */
  function recordAttempt(id, summary) {
    return updateDeck(id, function (deck) {
      deck.history.unshift({
        mode: summary.mode, score: summary.score, correct: summary.correct,
        wrong: summary.wrong, unanswered: summary.unanswered,
        durationSec: summary.durationSec, date: summary.date
      });
      deck.history = deck.history.slice(0, HISTORY_LIMIT);
      if (summary.mode === "exam") {
        deck.attempts += 1;
        deck.lastScore = summary.score;
        deck.lastDurationSec = summary.durationSec;
        deck.lastDate = summary.date;
        deck.bestScore = deck.bestScore === null ? summary.score : Math.max(deck.bestScore, summary.score);
      }
    });
  }

  function savePracticeAnswer(id, qid, choice) {
    updateDeck(id, function (deck) {
      deck.practice.answers[qid] = choice;
      deck.practice.updated = new Date().toISOString();
    });
  }

  function resetPractice(id) {
    updateDeck(id, function (deck) { deck.practice = { answers: {}, updated: null }; });
  }

  function resetAll() {
    try { localStorage.removeItem(KEY); localStorage.removeItem(RESULT_KEY); } catch (e) { /* ignore */ }
  }

  function saveLastResult(result) { return safeSet(RESULT_KEY, JSON.stringify(result)); }
  function getLastResult() {
    const raw = safeGet(RESULT_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function getTheme() { return safeGet(THEME_KEY); }
  function setTheme(t) { safeSet(THEME_KEY, t); }

  window.QuizStorage = {
    getDeck, recordAttempt, savePracticeAnswer, resetPractice, resetAll,
    saveLastResult, getLastResult, getTheme, setTheme
  };
})();
