# CLAUDE.md – Website luyện thi trắc nghiệm

Ngôn ngữ làm việc: **tiếng Việt** (giao diện, câu hỏi, commit message, giải thích cho người dùng).

## Dự án là gì
Website luyện tập/thi thử trắc nghiệm theo chương, deploy trên **GitHub Pages** (branch `main`, folder `/ (root)`).
Chỉ dùng HTML5, CSS3, JavaScript ES6+ thuần, JSON tĩnh, localStorage.
**Không** dùng backend, database, API ngoài, framework (React/Vue/Angular), dịch vụ cần API key, bước build.
Mọi đường dẫn phải tương đối (site chạy dưới đường dẫn con `/<tên-repo>/`).

## Cấu trúc
- `index.html` – trang chủ: tổng số môn/bộ đề/câu, danh sách bộ đề **nhóm theo môn**, trạng thái, điểm, tiến độ luyện tập.
- `pages/quiz.html` (+ `js/quiz.js`, `css/quiz.css`) – `?id=<deckId>`: trang chi tiết → chế độ Luyện tập hoặc Thi. Tham số `&mode=exam|practice&start=1` để vào thẳng.
- `pages/result.html` (+ `js/result.js`, `css/result.css`) – kết quả lượt làm gần nhất, lọc Sai/Chưa trả lời/Đúng.
- `js/app.js` – tiện ích dùng chung (`window.App`), dark mode, render trang chủ.
- `js/data-loader.js` – `fetch()` manifest + bộ đề, kiểm tra dữ liệu, báo lỗi rõ ràng (`window.DataLoader`). Gốc site lấy từ `<html data-root="..">`.
- `js/storage.js` – localStorage (`window.QuizStorage`), key `qtnl-quiz:v1`, kết quả gần nhất `qtnl-quiz:last-result`, theme `qtnl-quiz:theme`. Bài thi dở lưu ở sessionStorage `qtnl-exam:<deckId>`. **Không đổi tên key** (người dùng sẽ mất tiến độ).
- `data/manifest.json` – `subjects[]` + `documents[]`. Thêm bộ đề = thêm JSON + một mục manifest, **không sửa JS**.
- `tools/validate.py` – chạy `python tools/validate.py` sau mỗi lần sửa dữ liệu.
- `docs/` – phân tích tài liệu, ghi chú đáp án.

## Dữ liệu hiện có
| Môn (`subject`) | File | Ghi chú |
|---|---|---|
| Quản trị nhân lực (`qtnl`) | `chapter_01/03/04/05/06/07/08.json` | Biên soạn từ slide. Mỗi bộ đúng 30 câu: 10 easy/recognition, 10 medium/comprehension, 10 hard/application. Có `topic`. Manifest có `expectQuestions: 30`, `expectPerLevel: 10`. Không có Chương 2 (chưa có PDF). |
| Hành vi người tiêu dùng (`hvtd`) | `hvtd_ch02.json` … `hvtd_ch10.json` | Từ ngân hàng câu hỏi PDF 44 trang **không có đáp án** → đáp án do Claude giải. Giữ nguyên thứ tự A–D như đề gốc. `sourceUnit: "trang"`, `sourceSlides` = số trang PDF, `sourceRef` = vị trí câu trong đề gốc. Ch5 có 21 câu (câu bổ sung từ Ch2 chuyển sang). 4 câu chưa chắc: xem `docs/hvtd-ghi-chu-dap-an.md`. |

## Schema câu hỏi
```json
{ "id": "Q001", "question": "...", "difficulty": "easy|medium|hard",
  "type": "recognition|comprehension|application", "topic": "(tùy chọn)",
  "options": [{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}],
  "correctAnswer": "A", "explanation": "...", "sourceSlides": [2,3], "sourceRef": "(tùy chọn)" }
```
easy↔recognition, medium↔comprehension, hard↔application. JSON UTF-8, không comment, không markdown.

## Quy tắc khi tạo câu hỏi từ tài liệu
- Chỉ dùng kiến thức trong tài liệu; chỗ không rõ thì đánh dấu để người dùng kiểm tra, không bịa.
- 4 phương án, đúng 1 đáp án, phương án nhiễu hợp lý; tránh đáp án đúng luôn dài nhất hoặc phương án nhiễu toàn từ tuyệt đối ("chỉ", "luôn", "duy nhất").
- Giải thích nêu căn cứ + số slide/trang nguồn.

## Quy ước giao diện
- Thiết kế "tủ hồ sơ nhân sự": tab màu chỉ mục mang số chương (`--tab-1..8`), nền giấy xám-xanh, mực navy, nhấn teal; font Be Vietnam Pro (fallback system-ui). Có dark mode (`html[data-theme="dark"]`).
- Số chương trên tab lấy từ số cuối của `id` (chapter_03 → 3).
- Responsive tới 390px không tràn ngang; giữ focus nhìn thấy được, tôn trọng reduced-motion.
- Phím tắt: A–D / 1–4 chọn đáp án, ← → chuyển câu, F đánh dấu (chế độ thi).
- Chỉ lượt **thi** tính vào số lần thi / điểm cao nhất; luyện tập lưu riêng.
- Thời gian thi lấy từ `timeLimitMinutes` của manifest (QTNL 30 phút; HVTD 1 phút/câu).

## Kiểm thử
- Chạy local: `python -m http.server 8000` rồi mở `http://localhost:8000` (mở file:// trực tiếp sẽ lỗi fetch).
- Sau khi sửa JS: kiểm tra trang chủ, luyện tập, thi (nộp bài, hết giờ tự nộp, tải lại trang giữa bài thi), trang kết quả, mobile, dark mode, `?id=` sai phải hiện thông báo lỗi.
- Sau khi sửa dữ liệu: `python tools/validate.py` phải báo "Hợp lệ".
