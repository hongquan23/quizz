/* Đọc manifest.json và dữ liệu bộ đề bằng fetch() với đường dẫn tương đối. */
(function () {
  "use strict";

  // Trang con nằm trong /pages nên dữ liệu ở ../data/
  const BASE = document.documentElement.dataset.root || ".";
  const DATA_DIR = BASE.replace(/\/$/, "") + "/data/";
  const cache = {};

  async function fetchJSON(path) {
    let res;
    try {
      res = await fetch(path, { cache: "no-cache" });
    } catch (e) {
      throw new Error("Không kết nối được tới " + path + ". Nếu bạn mở file trực tiếp (file://), hãy chạy qua một web server hoặc GitHub Pages.");
    }
    if (!res.ok) throw new Error("Không tải được " + path + " (mã lỗi " + res.status + ").");
    try {
      return await res.json();
    } catch (e) {
      throw new Error("File " + path + " không phải JSON hợp lệ.");
    }
  }

  async function loadManifest() {
    if (cache.manifest) return cache.manifest;
    const m = await fetchJSON(DATA_DIR + "manifest.json");
    if (!m || !Array.isArray(m.documents)) throw new Error("manifest.json thiếu danh sách \"documents\".");
    cache.manifest = m;
    return m;
  }

  async function loadDeck(id) {
    if (cache[id]) return cache[id];
    const manifest = await loadManifest();
    const entry = manifest.documents.find(function (d) { return d.id === id; });
    if (!entry) throw new Error("Không tìm thấy bộ đề \"" + id + "\" trong manifest.json.");
    const deck = await fetchJSON(DATA_DIR + entry.file);
    validateDeck(deck, entry.file);
    deck.meta = entry;
    cache[id] = deck;
    return deck;
  }

  function validateDeck(deck, file) {
    if (!deck || !Array.isArray(deck.questions) || deck.questions.length === 0) {
      throw new Error("File " + file + " không có câu hỏi nào.");
    }
    deck.questions.forEach(function (q, i) {
      if (!q.id || !q.question || !Array.isArray(q.options) || q.options.length < 2) {
        throw new Error("Câu thứ " + (i + 1) + " trong " + file + " thiếu dữ liệu.");
      }
      if (!q.options.some(function (o) { return o.id === q.correctAnswer; })) {
        throw new Error("Câu " + q.id + " trong " + file + " có đáp án đúng không khớp phương án nào.");
      }
    });
  }

  window.DataLoader = { loadManifest, loadDeck };
})();
