# Luyện thi Quản trị nhân lực

Website luyện tập và thi thử trắc nghiệm theo từng chương bài giảng. Chạy hoàn toàn bằng file tĩnh (HTML, CSS, JavaScript thuần, JSON) nên deploy được trực tiếp lên GitHub Pages: không cần backend, database, API hay tài khoản.

- 7 bộ đề (Chương 1, 3, 4, 5, 6, 7, 8), mỗi bộ 30 câu, tổng 210 câu.
- Mỗi bộ có 10 câu nhận biết, 10 thông hiểu, 10 vận dụng, kèm lời giải thích và số slide nguồn.
- Bảng phân tích tài liệu và phân bổ câu hỏi: [`docs/phan-tich-tai-lieu.md`](docs/phan-tich-tai-lieu.md).

## Tính năng

| Màn hình | Nội dung |
|---|---|
| Trang chủ (`index.html`) | Tổng số bộ đề và câu hỏi, danh sách bộ đề, trạng thái học tập, điểm gần nhất/cao nhất, tiến độ luyện tập |
| Chi tiết bộ đề (`pages/quiz.html?id=...`) | Thông tin tài liệu, số câu theo mức độ và chủ đề, chọn chế độ luyện tập hoặc thi, tùy chọn trộn câu hỏi |
| Luyện tập | Chọn đáp án là thấy đúng/sai, lời giải thích và slide nguồn; câu trước/câu sau; thanh tiến độ; tiến độ được lưu |
| Thi thử | 30 câu, đồng hồ đếm ngược (mặc định 30 phút), bảng điều hướng câu đã/chưa trả lời, đánh dấu xem lại, nộp bài, **tự nộp khi hết giờ**; tải lại trang không mất bài đang làm |
| Kết quả (`pages/result.html`) | Tổng câu, đúng, sai, chưa trả lời, điểm thang 10, tỷ lệ chính xác, thời gian; xem lại từng câu kèm lọc Sai/Chưa trả lời/Đúng; làm lại, về trang chủ |

Khác: Dark mode, responsive (desktop/tablet/mobile), phím tắt (A–D hoặc 1–4 để chọn, ← → để chuyển câu, F để đánh dấu).

**Lưu tiến độ (localStorage):** điểm từng bộ đề, số lần thi, điểm cao nhất, thời gian hoàn thành gần nhất, lịch sử 20 lượt gần nhất, các câu đã luyện tập. Chỉ lượt **thi thử** được tính vào số lần thi và điểm cao nhất (vì ở chế độ luyện tập đáp án hiện ngay). Dữ liệu chỉ nằm trên trình duyệt đang dùng; nút "Xóa tiến độ đã lưu" ở chân trang chủ để xóa.

## Cấu trúc thư mục

```
quiz-website/
├── index.html              Trang chủ
├── pages/
│   ├── quiz.html           Chi tiết bộ đề + luyện tập + thi
│   └── result.html         Kết quả
├── css/  style.css · quiz.css · result.css
├── js/
│   ├── app.js              Tiện ích dùng chung, dark mode, trang chủ
│   ├── data-loader.js      fetch() manifest và bộ đề, kiểm tra dữ liệu, báo lỗi
│   ├── storage.js          Đọc/ghi localStorage
│   ├── quiz.js             Logic luyện tập và thi
│   └── result.js           Trang kết quả
├── data/
│   ├── manifest.json       Danh sách bộ đề (website tự hiển thị theo file này)
│   └── chapter_01.json … chapter_08.json
├── docs/phan-tich-tai-lieu.md
├── tools/validate.py       Kiểm tra dữ liệu JSON trước khi đẩy lên GitHub
└── .nojekyll
```

## Chạy thử trên máy

Trình duyệt chặn `fetch()` khi mở file trực tiếp (`file://`), nên hãy chạy qua một web server tĩnh:

```bash
cd quiz-website
python -m http.server 8000
# mở http://localhost:8000
```

(Hoặc dùng extension "Live Server" của VS Code.)

## Deploy lên GitHub Pages

1. **Tạo repository:** đăng nhập GitHub → nút **New** (hoặc **+ → New repository**) → đặt tên, ví dụ `quiz-qtnl` → chọn **Public** → **Create repository**.
   (GitHub Pages miễn phí cho repository public; repository private cần gói trả phí.)
2. **Đưa source code lên** — chọn một trong hai cách:
   - *Trên web:* trong repository mới, bấm **uploading an existing file**, kéo thả **toàn bộ nội dung bên trong** thư mục `quiz-website` (để `index.html` nằm ở gốc repository, không nằm trong thư mục con) → **Commit changes**. Lưu ý kéo cả file ẩn `.nojekyll` nếu hệ điều hành cho phép; thiếu file này website vẫn chạy bình thường.
   - *Bằng Git:*
     ```bash
     cd quiz-website
     git init
     git add .
     git commit -m "Website luyện thi Quản trị nhân lực"
     git branch -M main
     git remote add origin https://github.com/<tên-tài-khoản>/quiz-qtnl.git
     git push -u origin main
     ```
3. **Cấu hình GitHub Pages:** vào **Settings → Pages**. Ở mục **Build and deployment**, chọn **Source: Deploy from a branch**.
4. **Chọn branch và folder:** Branch **`main`**, folder **`/ (root)`** → **Save**.
5. **Kiểm tra sau khi deploy:** chờ 1–3 phút (theo dõi ở tab **Actions**), rồi mở `https://<tên-tài-khoản>.github.io/quiz-qtnl/`. Kiểm tra nhanh:
   - Trang chủ hiện đủ 7 bộ đề và tổng 210 câu.
   - Mở một bộ đề, luyện tập vài câu, quay lại trang chủ thấy tiến độ đã lưu.
   - Thi thử, nộp bài, xem trang kết quả.
   - Nếu thấy thông báo "Không tải được dữ liệu": kiểm tra thư mục `data/` đã được upload và tên file trong `manifest.json` trùng khớp (phân biệt chữ hoa/thường trên GitHub Pages).

Website dùng đường dẫn tương đối nên chạy đúng cả khi nằm trong đường dẫn con `/quiz-qtnl/`.

## Thêm bộ đề mới (khi có thêm PDF)

1. Tạo bộ câu hỏi 30 câu cho PDF mới (10 nhận biết, 10 thông hiểu, 10 vận dụng) theo đúng cấu trúc JSON dưới đây và lưu thành `data/chapter_02.json` (tên tùy ý, không dấu, không khoảng trắng).
2. Thêm một mục vào mảng `documents` trong `data/manifest.json`:
   ```json
   {
     "id": "chapter_02",
     "file": "chapter_02.json",
     "title": "Chương 2 - Tên chương",
     "sourceFile": "Chương 2 - Tên file.pdf",
     "totalSlides": 40,
     "totalQuestions": 30,
     "timeLimitMinutes": 30,
     "description": "Mô tả ngắn hiển thị ở trang chi tiết."
   }
   ```
   Thứ tự trong mảng là thứ tự hiển thị ở trang chủ. Số trên tab hồ sơ được lấy từ phần số cuối của `id` (chapter_02 → 2). `timeLimitMinutes` cho phép đổi thời gian thi riêng từng bộ.
3. Chạy `python tools/validate.py` để kiểm tra. Script báo lỗi nếu thiếu câu, sai số lượng theo mức độ, đáp án không khớp, trùng ID, slide nguồn ngoài phạm vi…
4. Commit và push (hoặc upload file trên web). GitHub Pages tự cập nhật sau 1–3 phút. **Không cần sửa bất kỳ file JavaScript nào.**

### Cấu trúc một câu hỏi

```json
{
  "id": "Q001",
  "question": "Nội dung câu hỏi?",
  "difficulty": "easy",
  "type": "recognition",
  "topic": "Tên chủ đề (không bắt buộc, dùng để thống kê ở trang chi tiết)",
  "options": [
    { "id": "A", "text": "Phương án A" },
    { "id": "B", "text": "Phương án B" },
    { "id": "C", "text": "Phương án C" },
    { "id": "D", "text": "Phương án D" }
  ],
  "correctAnswer": "A",
  "explanation": "Giải thích chi tiết vì sao A đúng.",
  "sourceSlides": [2, 3]
}
```

Quy ước: `easy`/`recognition` = Nhận biết, `medium`/`comprehension` = Thông hiểu, `hard`/`application` = Vận dụng.

## Cập nhật website khi có thêm tài liệu

- **Sửa câu hỏi:** chỉnh trực tiếp file JSON tương ứng → chạy `tools/validate.py` → push.
- **Thêm chương:** làm theo mục "Thêm bộ đề mới".
- **Bỏ một chương:** xóa mục đó khỏi `manifest.json` (có thể giữ file JSON).
- Nếu đổi `id` của một bộ đề, tiến độ đã lưu của bộ đó trên trình duyệt người học sẽ bắt đầu lại từ đầu (tiến độ được lưu theo `id`).
- Sau khi push, nếu trình duyệt vẫn hiện dữ liệu cũ, tải lại trang bằng Ctrl + F5.

## Ghi chú

- Font Be Vietnam Pro được tải từ Google Fonts (không cần API key). Nếu không tải được, trang tự dùng font hệ thống.
- Bộ tài liệu được cung cấp không có Chương 2; xem các điểm cần kiểm tra khác trong `docs/phan-tich-tai-lieu.md`.

