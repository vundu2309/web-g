# Pixel Forest

Game chạy và nhảy trong rừng pixel, viết bằng HTML, CSS và JavaScript thuần, không cần cài thư viện hoặc build.

## Chơi game

Bản online: https://pixel-forest-run.gladloom9.chatgpt.site/

- Space / ↑ hoặc nút NHẢY: nhảy tránh đá và thu thập đom đóm.
- P hoặc nút Tạm dừng: tạm dừng / tiếp tục.
- Mỗi đom đóm cộng 50 điểm; tốc độ tăng theo quãng đường.
- Kỷ lục lưu trong trình duyệt bằng localStorage.

## Chạy trên máy

Mở `dist/index.html` bằng trình duyệt, hoặc chạy từ thư mục repository:

```sh
python3 -m http.server 8000 --directory dist
```

Truy cập http://localhost:8000.

## Mã nguồn

`dist/index.html` chứa toàn bộ giao diện và logic game.
