# Hành vi người tiêu dùng: ghi chú đáp án

**Nguồn:** file PDF ngân hàng câu hỏi (44 trang, Chương 2–10). File gốc **không có đáp án** (không có bảng đáp án, không phương án nào được in đậm hay tô màu). Toàn bộ đáp án, phân loại mức độ và lời giải thích trong `data/hvtd_ch02.json` … `hvtd_ch10.json` do Claude biên soạn dựa trên lý thuyết Hành vi người tiêu dùng. Nên đối chiếu với giáo trình hoặc đáp án của giảng viên nếu có.

## Xử lý dữ liệu

| Vấn đề trong file gốc | Cách xử lý |
|---|---|
| Chương 8 bị dán lặp hai lần (trang 25–31 và 32–37, nội dung trùng khớp) | Giữ một bản |
| Chương 2 có "Câu bổ sung" (câu 21) về người ảnh hưởng cố vấn/áp đặt – nội dung thuộc vai trò trong quyết định mua của gia đình | Chuyển sang Chương 5 thành câu 21; trường `sourceRef` vẫn ghi "Chương 2, câu bổ sung" |
| Chữ "Câu bổ sung" dính vào cuối phương án D câu 20 Chương 2 | Xóa |
| Chương 9 câu 5 và câu 13: chuỗi "Cảm xúc Ý định hành vi Nhận thức" thiếu mũi tên | Thêm "→" để rõ thứ tự, không đổi nội dung |
| Thứ tự phương án A–D | Giữ nguyên như PDF để dễ đối chiếu |

Mỗi câu có `sourceSlides` = số trang trong PDF và `sourceRef` = vị trí câu trong đề gốc.

## Các câu nên kiểm tra lại

| Bộ đề | Câu (đề gốc) | Đáp án đã chọn | Lý do chưa chắc |
|---|---|---|---|
| Chương 2 | Câu 9 – từ chối cho lửa sáng mùng 1 Tết | D. Tục lệ | Giáo trình phân biệt phong tục / tục lệ (gắn với điều cấm kỵ) / quy ước. Kiêng cho lửa là một điều cấm kỵ nên chọn tục lệ; một số tài liệu có thể xếp vào phong tục. |
| Chương 5 | Câu 13 – nhóm sống chung không quan hệ hôn nhân/huyết thống, chi tiêu chung | D. Hộ tiêu dùng gia đình | Tên phương án trong đề hơi lạ ("hộ tiêu dùng gia đình"); về khái niệm đây là hộ tiêu dùng (không phải gia đình). Phương án A "gia đình phi truyền thống" cũng có thể được một số slide dùng. |
| Chương 6 | Câu 15 – 6 giá trị đầu trong LOV của Kahle | A. Giá trị nội bộ, xuất phát từ cá nhân | Cách nhóm "6 giá trị đầu" phụ thuộc thứ tự liệt kê trong slide bài giảng. |
| Chương 9 | Câu 5 – thứ bậc Cảm xúc → Hành vi → Nhận thức | D. Mua hàng trải nghiệm, hưởng thụ | Theo mô hình thứ bậc hiệu ứng: gắn kết thấp là Nhận thức → Hành vi → Cảm xúc; trải nghiệm là Cảm xúc → Hành vi → Nhận thức. Nếu slide của lớp xếp khác thì cần sửa. |

Câu 8 Chương 2, câu 20 Chương 4 và các câu dạng ma trận nhóm tham khảo / chiến lược khi không tìm kiếm thông tin được giải theo khung lý thuyết phổ biến (Bearden & Etzel; Hawkins).

## Phân bổ mức độ

Đề gốc không phân loại mức độ; Claude gán: câu khái niệm, định nghĩa → nhận biết; câu phân biệt, so sánh → thông hiểu; câu tình huống → vận dụng. Vì vậy các bộ đề này không theo tỉ lệ 10/10/10 như bộ Quản trị nhân lực.

| Bộ đề | Số câu | Nhận biết | Thông hiểu | Vận dụng |
|---|--:|--:|--:|--:|
| Chương 2 - Văn hóa và hành vi tiêu dùng | 20 | 7 | 3 | 10 |
| Chương 3 - Giai tầng xã hội và hành vi tiêu dùng | 20 | 8 | 3 | 9 |
| Chương 4 - Nhóm tham khảo và hành vi người tiêu dùng | 20 | 8 | 2 | 10 |
| Chương 5 - Gia đình và hành vi người tiêu dùng | 21 | 8 | 3 | 10 |
| Chương 6 - Giá trị chuẩn mực, cá tính và lối sống | 20 | 8 | 2 | 10 |
| Chương 7 - Nhu cầu và động cơ của người tiêu dùng | 20 | 8 | 2 | 10 |
| Chương 8 - Kiến thức, sự hiểu biết và nhận thức của người tiêu dùng | 20 | 7 | 3 | 10 |
| Chương 9 - Thái độ của người tiêu dùng | 20 | 8 | 2 | 10 |
| Chương 10 - Quá trình ra quyết định mua của người tiêu dùng | 20 | 6 | 4 | 10 |
