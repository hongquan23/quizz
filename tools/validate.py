"""Kiểm tra dữ liệu bộ đề trước khi đưa lên GitHub.

Cách chạy (từ thư mục gốc quiz-website):
    python tools/validate.py

Script đọc data/manifest.json và kiểm tra từng file bộ đề:
JSON hợp lệ, đủ 30 câu, đủ 10/10/10 theo mức độ, đủ 4 phương án,
đáp án đúng tồn tại, không trùng ID, slide nguồn nằm trong phạm vi.
"""
import json, os, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
PAIR = {"easy": "recognition", "medium": "comprehension", "hard": "application"}
REQUIRED_Q = ("id", "question", "difficulty", "type", "options", "correctAnswer", "explanation", "sourceSlides")
errors, warnings = [], []


def load(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        errors.append(f"Không tìm thấy file {os.path.relpath(path, ROOT)}")
    except json.JSONDecodeError as e:
        errors.append(f"{os.path.relpath(path, ROOT)}: JSON không hợp lệ ({e})")
    return None


def check_deck(entry):
    path = os.path.join(DATA, entry.get("file", ""))
    deck = load(path)
    if deck is None:
        return
    name = entry.get("file")
    qs = deck.get("questions", [])
    for k in ("documentId", "documentTitle", "sourceFile", "totalSlides", "totalQuestions", "questions"):
        if k not in deck:
            errors.append(f"{name}: thiếu trường {k}")
    if deck.get("documentId") != entry.get("id"):
        errors.append(f"{name}: documentId '{deck.get('documentId')}' khác id trong manifest '{entry.get('id')}'")
    if len(qs) != 30:
        errors.append(f"{name}: có {len(qs)} câu (yêu cầu 30)")
    if deck.get("totalQuestions") != len(qs):
        errors.append(f"{name}: totalQuestions={deck.get('totalQuestions')} nhưng thực tế {len(qs)} câu")
    cnt = collections.Counter(q.get("type") for q in qs)
    for t in PAIR.values():
        if cnt[t] != 10:
            errors.append(f"{name}: {t} có {cnt[t]} câu (yêu cầu 10)")
    ids = [q.get("id") for q in qs]
    dup = [i for i, c in collections.Counter(ids).items() if c > 1]
    if dup:
        errors.append(f"{name}: trùng ID {dup}")
    texts = collections.Counter(q.get("question", "").strip().lower() for q in qs)
    if any(c > 1 for c in texts.values()):
        errors.append(f"{name}: có câu hỏi trùng nội dung")
    total_slides = deck.get("totalSlides", 0)
    for q in qs:
        qid = q.get("id", "?")
        for k in REQUIRED_Q:
            if not q.get(k):
                errors.append(f"{name} {qid}: thiếu {k}")
        opts = q.get("options", [])
        if len(opts) != 4:
            errors.append(f"{name} {qid}: có {len(opts)} phương án (yêu cầu 4)")
        if [o.get("id") for o in opts] != ["A", "B", "C", "D"][:len(opts)]:
            errors.append(f"{name} {qid}: ID phương án phải là A, B, C, D")
        if q.get("correctAnswer") not in [o.get("id") for o in opts]:
            errors.append(f"{name} {qid}: correctAnswer không khớp phương án nào")
        if q.get("difficulty") in PAIR and PAIR[q["difficulty"]] != q.get("type"):
            errors.append(f"{name} {qid}: difficulty '{q['difficulty']}' không khớp type '{q.get('type')}'")
        for s in q.get("sourceSlides", []):
            if not isinstance(s, int) or not (1 <= s <= total_slides):
                errors.append(f"{name} {qid}: slide {s} ngoài phạm vi 1–{total_slides}")
    if entry.get("totalQuestions") != len(qs):
        warnings.append(f"manifest: totalQuestions của {entry.get('id')} chưa khớp file ({len(qs)})")
    if entry.get("totalSlides") != total_slides:
        warnings.append(f"manifest: totalSlides của {entry.get('id')} chưa khớp file ({total_slides})")
    print(f"  {name}: {len(qs)} câu, đáp án {dict(sorted(collections.Counter(q.get('correctAnswer') for q in qs).items()))}")


def main():
    manifest = load(os.path.join(DATA, "manifest.json"))
    if manifest is None:
        print("\n".join(errors)); sys.exit(1)
    docs = manifest.get("documents", [])
    ids = [d.get("id") for d in docs]
    if len(set(ids)) != len(ids):
        errors.append("manifest: trùng id bộ đề")
    print(f"Kiểm tra {len(docs)} bộ đề trong manifest.json")
    for entry in docs:
        check_deck(entry)
    for w in warnings:
        print("Cảnh báo:", w)
    if errors:
        print(f"\n{len(errors)} lỗi:")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    print(f"\nHợp lệ. Tổng {sum(d.get('totalQuestions', 0) for d in docs)} câu hỏi.")


if __name__ == "__main__":
    main()
