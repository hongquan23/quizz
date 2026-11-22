/* Trang bộ đề: chi tiết, chế độ luyện tập và chế độ thi. */
(function () {
  "use strict";

  const LEVEL = {
    recognition: { label: "Nhận biết", cls: "lv-easy" },
    comprehension: { label: "Thông hiểu", cls: "lv-medium" },
    application: { label: "Vận dụng", cls: "lv-hard" }
  };
  const KEYS = ["A", "B", "C", "D"];
  const $ = function (id) { return document.getElementById(id); };
  const esc = function (s) { return App.escapeHTML(s); };

  const state = {
    deck: null, deckIndex: 0, mode: "practice",
    order: [], current: 0, answers: {}, flags: new Set(),
    startTime: 0, endTime: 0, timerId: null, examRunning: false, submitted: false
  };

  // ---------- Khởi tạo ----------
  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const id = App.getParam("id");
    const root = $("quiz-root");
    if (!id) {
      App.showError(root, new Error("Thiếu mã bộ đề trên đường dẫn (ví dụ: quiz.html?id=chapter_01)."));
      return;
    }
    try {
      const manifest = await DataLoader.loadManifest();
      state.deckIndex = Math.max(0, manifest.documents.findIndex(function (d) { return d.id === id; }));
      state.deck = await DataLoader.loadDeck(id);
    } catch (err) {
      App.showError(root, err);
      return;
    }
    root.querySelector(".loading").remove();
    document.title = state.deck.documentTitle + " – Luyện thi Quản trị nhân lực";
    document.documentElement.style.setProperty("--tab", App.tabColor(state.deckIndex));

    renderDetail();
    bindEvents();

    // Khôi phục bài thi đang làm dở (khi tải lại trang)
    const saved = loadExamSession();
    if (saved) {
      // Nếu đã hết giờ, tick() đầu tiên sẽ tự nộp bài
      restoreExam(saved);
      return;
    }

    const mode = App.getParam("mode");
    if (App.getParam("start") === "1" && (mode === "practice" || mode === "exam")) {
      document.querySelector('input[name="mode"][value="' + mode + '"]').checked = true;
      start(mode);
    } else {
      show("view-detail");
    }
  }

  function show(viewId) {
    document.querySelectorAll(".view").forEach(function (v) { v.hidden = v.id !== viewId; });
    window.scrollTo(0, 0);
  }

  function questionById(qid) {
    return state.deck.questions.find(function (q) { return q.id === qid; });
  }

  function timeLimitSec() {
    const m = (state.deck.meta && state.deck.meta.timeLimitMinutes) || 30;
    return m * 60;
  }

  // ---------- Trang chi tiết ----------
  function renderDetail() {
    const d = state.deck;
    const total = d.questions.length;
    $("detail-num").textContent = App.chapterNumber(d.documentId, state.deckIndex + 1);
    $("detail-title").textContent = d.documentTitle;
    $("detail-desc").textContent = (d.meta && d.meta.description) || "";

    const count = { recognition: 0, comprehension: 0, application: 0 };
    const topics = {};
    d.questions.forEach(function (q) {
      if (count[q.type] != null) count[q.type]++;
      if (q.topic) topics[q.topic] = (topics[q.topic] || 0) + 1;
    });
    const minutes = timeLimitSec() / 60;
    $("exam-mode-desc").textContent = "Làm cả " + total + " câu trong " + minutes + " phút, chỉ xem đáp án sau khi nộp bài. Hết giờ bài sẽ tự nộp.";

    const facts = [
      ["Tài liệu nguồn", d.sourceFile],
      ["Số slide", d.totalSlides],
      ["Số câu hỏi", total],
      ["Mức độ", count.recognition + " nhận biết, " + count.comprehension + " thông hiểu, " + count.application + " vận dụng"],
      ["Thời gian thi", minutes + " phút"]
    ];
    $("detail-facts").innerHTML = facts.map(function (f) {
      return "<div><dt>" + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd></div>";
    }).join("");

    const topicNames = Object.keys(topics);
    $("detail-topics").innerHTML = topicNames.length
      ? topicNames.map(function (t) { return "<li><span>" + esc(t) + "</span><b>" + topics[t] + " câu</b></li>"; }).join("")
      : "<li>Không có thông tin chủ đề.</li>";

    renderHistory();
  }

  function renderHistory() {
    const p = QuizStorage.getDeck(state.deck.documentId);
    const practiced = Object.keys(p.practice.answers).length;
    let html = "<h3>Kết quả của bạn</h3>";
    if (p.attempts === 0 && practiced === 0) {
      html += "<p class='muted'>Bạn chưa làm bộ đề này.</p>";
    } else {
      html += "<dl class='facts compact'>" +
        "<div><dt>Số lần thi</dt><dd>" + p.attempts + "</dd></div>" +
        "<div><dt>Điểm gần nhất</dt><dd>" + App.formatScore(p.lastScore) + (p.lastScore != null ? "/10" : "") + "</dd></div>" +
        "<div><dt>Điểm cao nhất</dt><dd>" + App.formatScore(p.bestScore) + (p.bestScore != null ? "/10" : "") + "</dd></div>" +
        "<div><dt>Thời gian gần nhất</dt><dd>" + App.formatDuration(p.lastDurationSec) + "</dd></div>" +
        "<div><dt>Luyện tập</dt><dd>" + practiced + "/" + state.deck.questions.length + " câu</dd></div>" +
        "</dl>";
    }
    $("detail-history").innerHTML = html;
  }

  // ---------- Sự kiện ----------
  function bindEvents() {
    document.querySelectorAll('input[name="mode"]').forEach(function (r) {
      r.addEventListener("change", function () {
        $("start-btn").textContent = r.value === "exam" ? "Bắt đầu thi" : "Bắt đầu luyện tập";
      });
    });
    $("start-btn").addEventListener("click", function () {
      start(document.querySelector('input[name="mode"]:checked').value);
    });

    // Luyện tập
    $("p-prev").addEventListener("click", function () { goPractice(state.current - 1); });
    $("p-next").addEventListener("click", function () {
      if (state.current === state.order.length - 1) finishPractice();
      else goPractice(state.current + 1);
    });
    $("p-reset").addEventListener("click", function () {
      if (!confirm("Xóa các câu đã trả lời và luyện tập lại từ đầu?")) return;
      QuizStorage.resetPractice(state.deck.documentId);
      state.answers = {};
      goPractice(0);
    });
    document.querySelector('#view-practice [data-action="exit"]').addEventListener("click", function () {
      renderHistory();
      show("view-detail");
    });

    // Thi
    $("e-prev").addEventListener("click", function () { goExam(state.current - 1); });
    $("e-next").addEventListener("click", function () { goExam(state.current + 1); });
    $("e-flag").addEventListener("click", toggleFlag);
    $("e-submit").addEventListener("click", confirmSubmit);

    document.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", function (e) {
      if (state.examRunning) { e.preventDefault(); e.returnValue = ""; }
    });
  }

  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if ($("confirm-dialog").open) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;
    const practice = !$("view-practice").hidden;
    const exam = !$("view-exam").hidden;
    if (!practice && !exam) return;

    const k = e.key.toUpperCase();
    if (exam && k === "F") { toggleFlag(); e.preventDefault(); return; }
    let idx = KEYS.indexOf(k);
    if (idx < 0 && /^[1-4]$/.test(e.key)) idx = parseInt(e.key, 10) - 1;
    if (idx >= 0) {
      const btn = document.querySelectorAll((practice ? "#p-card" : "#e-card") + " .opt")[idx];
      if (btn && !btn.disabled) { btn.click(); e.preventDefault(); }
      return;
    }
    if (e.key === "ArrowRight") { (practice ? $("p-next") : $("e-next")).click(); e.preventDefault(); }
    if (e.key === "ArrowLeft") { (practice ? $("p-prev") : $("e-prev")).click(); e.preventDefault(); }
  }

  // ---------- Bắt đầu ----------
  function buildOrder() {
    const ids = state.deck.questions.map(function (q) { return q.id; });
    if ($("opt-shuffle").checked) {
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = ids[i]; ids[i] = ids[j]; ids[j] = t;
      }
    }
    return ids;
  }

  function start(mode) {
    state.mode = mode;
    state.order = buildOrder();
    state.current = 0;
    state.flags = new Set();
    state.startTime = Date.now();
    if (mode === "practice") {
      state.answers = Object.assign({}, QuizStorage.getDeck(state.deck.documentId).practice.answers);
      // Bắt đầu từ câu đầu tiên chưa làm
      const firstOpen = state.order.findIndex(function (qid) { return !state.answers[qid]; });
      show("view-practice");
      goPractice(firstOpen < 0 ? 0 : firstOpen);
    } else {
      state.answers = {};
      state.endTime = state.startTime + timeLimitSec() * 1000;
      beginExam();
    }
  }

  // ---------- Vẽ câu hỏi ----------
  function cardHTML(q, pos, total) {
    const lv = LEVEL[q.type] || { label: q.type, cls: "" };
    return '<header class="q-head"><span class="q-num">Câu ' + (pos + 1) + "/" + total + "</span>" +
      '<span class="q-level ' + lv.cls + '">' + esc(lv.label) + "</span>" +
      (q.topic ? '<span class="q-topic">' + esc(q.topic) + "</span>" : "") + "</header>" +
      '<h2 class="q-text" id="q-text">' + esc(q.question) + "</h2>" +
      '<div class="options" role="group" aria-labelledby="q-text">' +
      q.options.map(function (o) {
        return '<button type="button" class="opt" data-id="' + esc(o.id) + '">' +
          '<span class="opt-key">' + esc(o.id) + '</span><span class="opt-text">' + esc(o.text) + "</span></button>";
      }).join("") + "</div>";
  }

  function feedbackHTML(q, chosen) {
    const ok = chosen === q.correctAnswer;
    return '<div class="feedback ' + (ok ? "is-ok" : "is-bad") + '" role="status">' +
      "<p class='fb-title'>" + (ok ? "Chính xác." : "Chưa đúng. Đáp án đúng là " + esc(q.correctAnswer) + ".") + "</p>" +
      "<p>" + esc(q.explanation) + "</p>" +
      "<p class='fb-src'>Slide tham khảo: " + esc((q.sourceSlides || []).join(", ")) + "</p></div>";
  }

  // ---------- Luyện tập ----------
  function goPractice(i) {
    if (i < 0 || i >= state.order.length) return;
    state.current = i;
    const q = questionById(state.order[i]);
    const card = $("p-card");
    card.innerHTML = cardHTML(q, i, state.order.length);
    const chosen = state.answers[q.id];
    if (chosen) lockPractice(q, chosen, false);
    card.querySelectorAll(".opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (state.answers[q.id]) return;
        state.answers[q.id] = btn.dataset.id;
        QuizStorage.savePracticeAnswer(state.deck.documentId, q.id, btn.dataset.id);
        lockPractice(q, btn.dataset.id, true);
        updatePracticeBar();
      });
    });
    $("p-prev").disabled = i === 0;
    $("p-next").textContent = i === state.order.length - 1 ? "Xem kết quả" : "Câu tiếp theo";
    updatePracticeBar();
  }

  function lockPractice(q, chosen, animate) {
    const card = $("p-card");
    card.querySelectorAll(".opt").forEach(function (btn) {
      btn.disabled = true;
      if (btn.dataset.id === q.correctAnswer) btn.classList.add("is-correct");
      else if (btn.dataset.id === chosen) btn.classList.add("is-wrong");
      if (btn.dataset.id === chosen) btn.classList.add("is-chosen");
      if (animate && btn.dataset.id === chosen) btn.classList.add("pop");
    });
    card.insertAdjacentHTML("beforeend", feedbackHTML(q, chosen));
  }

  function updatePracticeBar() {
    const total = state.order.length;
    const answered = state.order.filter(function (qid) { return state.answers[qid]; });
    const correct = answered.filter(function (qid) { return state.answers[qid] === questionById(qid).correctAnswer; }).length;
    $("p-count").textContent = "Câu " + (state.current + 1) + "/" + total + ", đã làm " + answered.length;
    $("p-meter").style.width = (answered.length / total * 100) + "%";
    $("p-score").textContent = correct + " đúng";
  }

  function finishPractice() {
    const unanswered = state.order.filter(function (qid) { return !state.answers[qid]; }).length;
    if (unanswered > 0 && !confirm("Còn " + unanswered + " câu chưa trả lời. Vẫn xem kết quả luyện tập?")) return;
    finish("practice", false);
  }

  // ---------- Thi ----------
  function beginExam() {
    state.examRunning = true;
    show("view-exam");
    renderGrid();
    goExam(state.current);
    tick();
    clearInterval(state.timerId);
    state.timerId = setInterval(tick, 1000);
    saveExamSession();
  }

  function goExam(i) {
    if (i < 0 || i >= state.order.length) return;
    state.current = i;
    const q = questionById(state.order[i]);
    const card = $("e-card");
    card.innerHTML = cardHTML(q, i, state.order.length);
    card.querySelectorAll(".opt").forEach(function (btn) {
      if (state.answers[q.id] === btn.dataset.id) { btn.classList.add("is-selected"); btn.setAttribute("aria-pressed", "true"); }
      else btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", function () {
        state.answers[q.id] = btn.dataset.id;
        card.querySelectorAll(".opt").forEach(function (b) {
          const on = b === btn;
          b.classList.toggle("is-selected", on);
          b.setAttribute("aria-pressed", String(on));
        });
        btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");
        saveExamSession();
        renderGrid();
      });
    });
    $("e-prev").disabled = i === 0;
    $("e-next").disabled = i === state.order.length - 1;
    const flagged = state.flags.has(q.id);
    $("e-flag").setAttribute("aria-pressed", String(flagged));
    $("e-flag").textContent = flagged ? "Bỏ đánh dấu" : "Đánh dấu xem lại";
    renderGrid();
  }

  function renderGrid() {
    const grid = $("e-grid");
    grid.innerHTML = state.order.map(function (qid, i) {
      const cls = ["nav-cell"];
      let label = "Câu " + (i + 1);
      if (state.answers[qid]) { cls.push("answered"); label += ", đã trả lời"; } else label += ", chưa trả lời";
      if (state.flags.has(qid)) { cls.push("flagged"); label += ", cần xem lại"; }
      if (i === state.current) cls.push("current");
      return '<button type="button" class="' + cls.join(" ") + '" data-i="' + i + '" aria-label="' + label + '"' +
        (i === state.current ? ' aria-current="true"' : "") + ">" + (i + 1) + "</button>";
    }).join("");
    grid.querySelectorAll(".nav-cell").forEach(function (b) {
      b.addEventListener("click", function () { goExam(parseInt(b.dataset.i, 10)); });
    });
    const answered = state.order.filter(function (qid) { return state.answers[qid]; }).length;
    $("e-count").textContent = "Đã trả lời " + answered + "/" + state.order.length;
    $("e-meter").style.width = (answered / state.order.length * 100) + "%";
  }

  function toggleFlag() {
    const qid = state.order[state.current];
    if (state.flags.has(qid)) state.flags.delete(qid); else state.flags.add(qid);
    saveExamSession();
    goExam(state.current);
  }

  function tick() {
    const left = Math.max(0, Math.round((state.endTime - Date.now()) / 1000));
    const el = $("e-timer");
    el.textContent = App.formatClock(left);
    el.classList.toggle("is-low", left <= 300);
    el.setAttribute("aria-label", "Còn lại " + Math.floor(left / 60) + " phút " + (left % 60) + " giây");
    if (left === 300 || left === 60) {
      el.setAttribute("aria-live", "assertive");
      setTimeout(function () { el.setAttribute("aria-live", "off"); }, 1500);
    }
    if (left <= 0) submitExam(true);
  }

  function confirmSubmit() {
    const unanswered = state.order.filter(function (qid) { return !state.answers[qid]; }).length;
    const flagged = state.flags.size;
    let text = unanswered === 0 ? "Bạn đã trả lời tất cả các câu." : "Còn " + unanswered + " câu chưa trả lời, các câu này sẽ được tính là sai.";
    if (flagged) text += " Có " + flagged + " câu đang được đánh dấu xem lại.";
    const dlg = $("confirm-dialog");
    $("confirm-text").textContent = text;
    if (typeof dlg.showModal !== "function") {
      if (confirm(text + " Nộp bài?")) submitExam(false);
      return;
    }
    dlg.returnValue = "";
    dlg.showModal();
    dlg.addEventListener("close", function onClose() {
      dlg.removeEventListener("close", onClose);
      if (dlg.returnValue === "ok") submitExam(false);
    });
  }

  function submitExam(timeUp) {
    if (state.submitted) return;
    state.submitted = true;
    clearInterval(state.timerId);
    state.examRunning = false;
    clearExamSession();
    finish("exam", timeUp);
  }

  // ---------- Lưu bài thi dở (sessionStorage) ----------
  function sessionKey() { return "qtnl-exam:" + state.deck.documentId; }
  function saveExamSession() {
    try {
      sessionStorage.setItem(sessionKey(), JSON.stringify({
        order: state.order, answers: state.answers, flags: Array.from(state.flags),
        current: state.current, startTime: state.startTime, endTime: state.endTime
      }));
    } catch (e) { /* ignore */ }
  }
  function loadExamSession() {
    try {
      const raw = sessionStorage.getItem(sessionKey());
      if (!raw) return null;
      const s = JSON.parse(raw);
      const valid = Array.isArray(s.order) && s.order.every(function (qid) { return questionById(qid); });
      return valid ? s : null;
    } catch (e) { return null; }
  }
  function clearExamSession() { try { sessionStorage.removeItem(sessionKey()); } catch (e) { /* ignore */ } }
  function restoreExam(s) {
    state.mode = "exam";
    state.order = s.order;
    state.answers = s.answers || {};
    state.flags = new Set(s.flags || []);
    state.current = s.current || 0;
    state.startTime = s.startTime;
    state.endTime = s.endTime;
    beginExam();
  }

  // ---------- Kết thúc & chuyển sang trang kết quả ----------
  function finish(mode, timeUp) {
    const total = state.order.length;
    let correct = 0, wrong = 0, unanswered = 0;
    state.order.forEach(function (qid) {
      const a = state.answers[qid];
      if (!a) unanswered++;
      else if (a === questionById(qid).correctAnswer) correct++;
      else wrong++;
    });
    const now = Date.now();
    const durationSec = mode === "exam"
      ? Math.min(timeLimitSec(), Math.round((now - state.startTime) / 1000))
      : Math.round((now - state.startTime) / 1000);
    const summary = {
      mode: mode, correct: correct, wrong: wrong, unanswered: unanswered,
      score: Math.round(correct / total * 1000) / 100,
      durationSec: durationSec, date: new Date(now).toISOString()
    };
    QuizStorage.recordAttempt(state.deck.documentId, summary);
    QuizStorage.saveLastResult(Object.assign({
      deckId: state.deck.documentId, order: state.order, answers: state.answers,
      flags: Array.from(state.flags), timeUp: !!timeUp, timeLimitSec: timeLimitSec(), total: total
    }, summary));
    location.href = "result.html?id=" + encodeURIComponent(state.deck.documentId);
  }
})();
