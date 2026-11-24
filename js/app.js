/* Tiện ích dùng chung + trang chủ. */
(function () {
  "use strict";

  // ---------- Tiện ích dùng chung ----------
  function escapeHTML(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function formatDuration(sec) {
    if (sec == null || isNaN(sec)) return "—";
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return m + " phút " + String(s).padStart(2, "0") + " giây";
  }

  function formatClock(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function formatScore(n) {
    if (n == null) return "—";
    return (Math.round(n * 100) / 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  /** Lấy số chương từ id dạng chapter_03 để hiển thị trên tab hồ sơ. */
  function chapterNumber(id, fallback) {
    const m = /(\d+)\s*$/.exec(id || "");
    return m ? String(parseInt(m[1], 10)) : String(fallback);
  }

  /** Đơn vị nguồn tham khảo: "slide" (mặc định) hoặc "trang" (khai báo sourceUnit). */
  function unitLabel(d) { return (d && d.sourceUnit) || "slide"; }

  function tabColor(index) { return "var(--tab-" + ((index % 8) + 1) + ")"; }

  function getParam(name) { return new URLSearchParams(location.search).get(name); }

  // ---------- Dark mode ----------
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      const dark = theme === "dark";
      btn.setAttribute("aria-pressed", String(dark));
      btn.setAttribute("aria-label", dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối");
      btn.innerHTML = dark ? ICON_SUN : ICON_MOON;
    }
  }
  const ICON_MOON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  const ICON_SUN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

  function initTheme() {
    const saved = window.QuizStorage && QuizStorage.getTheme();
    const prefersDark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(next);
        QuizStorage.setTheme(next);
      });
    }
  }

  function showError(container, err) {
    container.innerHTML =
      '<div class="notice" role="alert"><h2>Không tải được dữ liệu</h2><p>' + escapeHTML(err.message) +
      '</p><p>Kiểm tra file <code>data/manifest.json</code> và các file JSON trong thư mục <code>data/</code>, sau đó tải lại trang.</p>' +
      '<button class="btn" type="button" onclick="location.reload()">Tải lại trang</button></div>';
  }

  window.App = {
    escapeHTML, formatDuration, formatClock, formatScore, formatDate,
    chapterNumber, tabColor, unitLabel, getParam, showError
  };

  // ---------- Trang chủ ----------
  async function renderHome() {
    const drawer = document.getElementById("drawer");
    if (!drawer) return;
    let manifest;
    try {
      manifest = await DataLoader.loadManifest();
    } catch (err) {
      showError(document.getElementById("home-content"), err);
      return;
    }

    const docs = manifest.documents;
    if (manifest.siteTitle) {
      document.getElementById("site-title").textContent = manifest.siteTitle;
    }
    const totalQ = docs.reduce(function (s, d) { return s + (d.totalQuestions || 0); }, 0);
    let examsDone = 0;

    // Nhóm bộ đề theo môn (manifest.subjects). Bộ đề không khai báo môn được gom vào nhóm "Khác".
    const subjects = (manifest.subjects || []).slice();
    const known = {};
    subjects.forEach(function (s) { known[s.id] = true; });
    if (docs.some(function (d) { return !d.subject || !known[d.subject]; })) {
      subjects.push({ id: "__other", title: subjects.length ? "Khác" : "" });
    }

    function card(d, i) {
      const p = QuizStorage.getDeck(d.id);
      const practiced = Object.keys(p.practice.answers || {}).length;
      const pct = d.totalQuestions ? Math.round(practiced / d.totalQuestions * 100) : 0;
      if (p.attempts > 0) examsDone++;
      let status = '<span class="status">Chưa làm</span>';
      if (p.attempts > 0) status = '<span class="status done">Đã thi ' + p.attempts + ' lần</span>';
      else if (practiced > 0) status = '<span class="status doing">Đang luyện tập</span>';

      return '<li><a class="folder" style="--tab:' + tabColor(i) + '" href="pages/quiz.html?id=' + encodeURIComponent(d.id) + '">' +
        '<span class="folder-tab" aria-hidden="true"><small>Chương</small><b>' + escapeHTML(chapterNumber(d.id, i + 1)) + '</b></span>' +
        '<span class="folder-body">' +
          '<h3>' + escapeHTML(d.title) + '</h3>' +
          '<p class="folder-meta">' + d.totalQuestions + ' câu hỏi, thi ' + (d.timeLimitMinutes || 30) + ' phút, nguồn ' + d.totalSlides + ' ' + unitLabel(d) + '</p>' +
          '<span class="meter" role="img" aria-label="Đã luyện ' + practiced + ' trên ' + d.totalQuestions + ' câu"><i style="width:' + pct + '%"></i></span>' +
          '<span class="meter-label">Luyện tập: ' + practiced + '/' + d.totalQuestions + ' câu</span>' +
        '</span>' +
        '<span class="folder-side">' + status +
          (p.lastScore != null
            ? '<span><span class="score">' + formatScore(p.lastScore) + '</span>/10 gần nhất</span><span>Cao nhất: ' + formatScore(p.bestScore) + '</span>'
            : '<span>Chưa có điểm thi</span>') +
        '</span></a></li>';
    }

    let colorIndex = 0;
    drawer.innerHTML = subjects.map(function (s) {
      const list = docs.filter(function (d) {
        return s.id === "__other" ? (!d.subject || !known[d.subject]) : d.subject === s.id;
      });
      if (!list.length) return "";
      const q = list.reduce(function (n, d) { return n + (d.totalQuestions || 0); }, 0);
      const cards = list.map(function (d) { return card(d, colorIndex++); }).join("");
      return '<section class="subject" aria-labelledby="sub-' + escapeHTML(s.id) + '">' +
        (s.title ? '<div class="subject-head"><h2 id="sub-' + escapeHTML(s.id) + '">' + escapeHTML(s.title) + '</h2>' +
          '<p>' + list.length + ' bộ đề, ' + q + ' câu' + (s.description ? '. ' + escapeHTML(s.description) : '') + '</p></div>' : '') +
        '<ul class="drawer">' + cards + '</ul></section>';
    }).join("");

    document.getElementById("totals").innerHTML =
      '<div><strong>' + subjects.filter(function (s) { return s.id !== "__other"; }).length + '</strong><span>môn học</span></div>' +
      '<div><strong>' + docs.length + '</strong><span>bộ đề</span></div>' +
      '<div><strong>' + totalQ + '</strong><span>câu hỏi</span></div>' +
      '<div><strong>' + examsDone + '/' + docs.length + '</strong><span>bộ đề đã thi</span></div>';

    const reset = document.getElementById("reset-progress");
    if (reset) {
      reset.addEventListener("click", function () {
        if (confirm("Xóa toàn bộ điểm số và tiến độ đã lưu trên trình duyệt này?")) {
          QuizStorage.resetAll();
          location.reload();
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    renderHome();
  });
})();
