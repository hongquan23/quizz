/* Trang kết quả: thống kê và xem lại từng câu. */
(function () {
  "use strict";

  const $ = function (id) { return document.getElementById(id); };
  const esc = function (s) { return App.escapeHTML(s); };
  let items = [];
  let filter = "all";

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const root = $("result-root");
    const result = QuizStorage.getLastResult();
    const id = App.getParam("id");
    if (!result || (id && result.deckId !== id)) {
      root.innerHTML = '<div class="notice"><h2>Chưa có kết quả để hiển thị</h2>' +
        '<p>Hãy làm một bộ đề ở chế độ luyện tập hoặc thi thử, kết quả sẽ xuất hiện ở đây sau khi bạn nộp bài.</p>' +
        '<a class="btn btn-primary" href="../index.html">Chọn bộ đề</a></div>';
      return;
    }

    let deck, deckIndex = 0;
    try {
      const manifest = await DataLoader.loadManifest();
      deckIndex = Math.max(0, manifest.documents.findIndex(function (d) { return d.id === result.deckId; }));
      deck = await DataLoader.loadDeck(result.deckId);
    } catch (err) {
      App.showError(root, err);
      return;
    }
    root.querySelector(".loading").remove();
    document.documentElement.style.setProperty("--tab", App.tabColor(deckIndex));
    render(result, deck);
  }

  function render(r, deck) {
    unit = App.unitLabel(deck);
    const byId = {};
    deck.questions.forEach(function (q) { byId[q.id] = q; });
    const order = (r.order || []).filter(function (qid) { return byId[qid]; });

    items = order.map(function (qid, i) {
      const q = byId[qid];
      const chosen = r.answers[qid] || null;
      const status = !chosen ? "none" : chosen === q.correctAnswer ? "ok" : "bad";
      return { q: q, pos: i + 1, chosen: chosen, status: status };
    });

    const total = items.length;
    const correct = items.filter(function (x) { return x.status === "ok"; }).length;
    const wrong = items.filter(function (x) { return x.status === "bad"; }).length;
    const none = total - correct - wrong;
    const score = Math.round(correct / total * 1000) / 100;
    const pct = Math.round(correct / total * 1000) / 10;

    document.title = "Kết quả " + deck.documentTitle + " – Luyện thi trắc nghiệm";
    $("r-mode").textContent = r.mode === "exam" ? "Điểm bài thi" : "Điểm luyện tập";
    $("r-score").textContent = App.formatScore(score);
    $("r-sub").textContent = correct + "/" + total + " câu đúng";
    $("r-title").textContent = deck.documentTitle;
    $("r-timeup").hidden = !r.timeUp;

    const seg = function (n, cls) { return n ? '<i class="' + cls + '" style="flex:' + n + '"></i>' : ""; };
    $("r-split").innerHTML = seg(correct, "s-ok") + seg(wrong, "s-bad") + seg(none, "s-none");
    $("r-split").setAttribute("aria-label", correct + " đúng, " + wrong + " sai, " + none + " chưa trả lời");

    const timeText = App.formatDuration(r.durationSec) +
      (r.mode === "exam" && r.timeLimitSec ? " / " + Math.round(r.timeLimitSec / 60) + " phút" : "");
    const stats = [
      ["Tổng số câu", total, ""],
      ["Trả lời đúng", correct, "ok"],
      ["Trả lời sai", wrong, "bad"],
      ["Chưa trả lời", none, "none"],
      ["Tỷ lệ chính xác", pct.toLocaleString("vi-VN") + "%", ""],
      ["Thời gian làm bài", timeText, ""]
    ];
    $("r-stats").innerHTML = stats.map(function (s) {
      return '<div class="stat ' + s[2] + '"><dt>' + esc(s[0]) + "</dt><dd>" + esc(s[1]) + "</dd></div>";
    }).join("");

    const mode = r.mode === "exam" ? "exam" : "practice";
    $("r-retry").href = "quiz.html?id=" + encodeURIComponent(r.deckId) + "&mode=" + mode + "&start=1";
    $("r-retry").textContent = mode === "exam" ? "Thi lại" : "Luyện tập tiếp";
    $("r-detail").href = "quiz.html?id=" + encodeURIComponent(r.deckId);

    const filters = [
      ["all", "Tất cả", total], ["bad", "Sai", wrong], ["none", "Chưa trả lời", none], ["ok", "Đúng", correct]
    ];
    $("r-filters").innerHTML = filters.map(function (f) {
      return '<button type="button" class="chip" data-f="' + f[0] + '" aria-pressed="' + (f[0] === filter) + '">' +
        esc(f[1]) + " <b>" + f[2] + "</b></button>";
    }).join("");
    $("r-filters").querySelectorAll(".chip").forEach(function (b) {
      b.addEventListener("click", function () {
        filter = b.dataset.f;
        $("r-filters").querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
        renderList();
      });
    });

    $("result-view").hidden = false;
    renderList();
  }

  let unit = "slide";
  function srcText(q) {
    let t = (unit === "trang" ? "Trang tham khảo trong tài liệu: " : "Slide tham khảo: ") + (q.sourceSlides || []).join(", ");
    if (q.sourceRef) t += " (" + q.sourceRef + " trong đề gốc)";
    return t;
  }

  function optText(q, id) {
    const o = q.options.find(function (x) { return x.id === id; });
    return o ? id + ". " + o.text : "";
  }

  function renderList() {
    const list = $("r-list");
    const shown = items.filter(function (x) { return filter === "all" || x.status === filter; });
    if (!shown.length) {
      list.innerHTML = '<li class="empty">Không có câu nào trong mục này.</li>';
      return;
    }
    const label = { ok: "Đúng", bad: "Sai", none: "Chưa trả lời" };
    list.innerHTML = shown.map(function (x) {
      const q = x.q;
      return '<li class="review-item ' + x.status + '">' +
        '<div class="ri-head"><span class="ri-num">Câu ' + x.pos + '</span><span class="ri-status">' + label[x.status] + "</span></div>" +
        '<p class="ri-q">' + esc(q.question) + "</p>" +
        '<dl class="ri-answers">' +
          "<div><dt>Bạn chọn</dt><dd>" + (x.chosen ? esc(optText(q, x.chosen)) : "<em>Không trả lời</em>") + "</dd></div>" +
          (x.status !== "ok" ? '<div class="right"><dt>Đáp án đúng</dt><dd>' + esc(optText(q, q.correctAnswer)) + "</dd></div>" : "") +
        "</dl>" +
        '<p class="ri-exp">' + esc(q.explanation) + "</p>" +
        '<p class="ri-src">' + esc(srcText(q)) + "</p>" +
        "</li>";
    }).join("");
  }
})();
