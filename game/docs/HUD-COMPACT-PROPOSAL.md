# HUD gọn — đã duyệt và triển khai

Bố cục đã được duyệt và áp dụng vào game. Các phần bên dưới lưu lại nguồn mockup và kết quả duyệt ban đầu.
Runtime: `GameUI.ts`, `inventoryView.ts`, `compact.css`, `compact-inventory.css` và `index.html`.
Hợp đồng giao diện hiện tại và giới hạn kiểm chứng đọc tại `DESIGN.md`.
Không đổi Save, luật gameplay, Firebase hay dependency.
Giữ màu, icon, Nunito, cảnh và sprite hiện có; tham khảo cách phân cấp HUD/hotbar kiểu Terraria.
Không thêm chức năng gameplay, tài khoản, lưu dữ liệu hay dependency.

## Kết quả triển khai runtime

- `npm run check`: đạt, 187/187 unit test, không có lỗi mới; 41 warning ESLint legacy và 3 warning CSS legacy.
- `npm run build` và `npx playwright test`: đạt trong bản sao kiểm thử `/tmp/pixel-hud-implementation/isolate`.
- 31/31 luồng Chrome đã qua, gồm HUD 4K, bàn phím/focus, trang bị, câu cá, dựng trại, giao dịch, cảm ứng và PWA offline.
- Cổng riêng 8101/8102, không dùng hoặc dừng server của người dùng. Server chụp ảnh dùng 8100 và được dừng sau kiểm tra.
- Đã xem ảnh game thật ở PC 1600×900, mobile 390×844, ngang 844×390 và 4K; không pageerror hay tràn ngang.
- Build còn cảnh báo chunk lớn vốn có; số FPS headless/software GPU không phải hiệu năng điện thoại thật.
- Chưa kiểm Safari hoặc thiết bị cảm ứng thật. Không commit, push hoặc deploy.

## Bố cục đề xuất

| Thành phần             | PC 1600×900                                | Điện thoại 390×844                 |
| ---------------------- | ------------------------------------------ | ---------------------------------- |
| Kho đồ / dựng trại     | Hai ô 40×40 ở trái trên, nhãn phím I/B     | Hai ô 44×44, icon                  |
| Đồng hồ / menu         | Cụm nhỏ phải trên                          | Cụm nhỏ phải trên                  |
| Tài nguyên / chân dung | Chi tiết trong kho khi mở                  | Chi tiết trong kho khi mở          |
| Điều khiển             | Bàn phím, không hiện nút cảm ứng           | Trái/phải, nhảy và tương tác 56×56 |
| Tương tác gần hồ       | Nhãn nhỏ “E · Câu cá” gần vị trí hoạt động | Nút theo ngữ cảnh trên nút nhảy    |
| Kho đồ                 | Bảng cạnh trái, ô vật phẩm và tab          | Bảng gọn phía trên, cuộn nếu dài   |
| Tên vùng               | Hiện tạm thời khi sang vùng                | Hiện tạm thời khi sang vùng        |

Hai ô truy cập nhanh tương ứng chức năng đang có. Không thêm ô nhật ký khi chức năng chưa tồn tại.
Kho đồ mẫu có tab Vật liệu/Trang bị/Cá, dùng ảnh trang bị và công trình thật.
Ô trống và số lượng là bố cục minh họa, không thay cấu trúc Save hoặc luật sức chứa.
Khi mở bảng có dòng “TẠM DỪNG”; runtime đã nối vào luồng pause hiện có.

## Mở và thao tác mẫu

File: `docs/style-reference/hud-compact-mockup.html`.
Khi đang chạy Vite, vào `/docs/style-reference/hud-compact-mockup.html`.
Không tự mở trình duyệt cho người dùng.

- Nhấn I/B hoặc bấm icon để xem bảng kho đồ/dựng trại.
- Bấm tab để xem vật liệu, trang bị và trạng thái chưa có cá.
- Esc hoặc nút đóng trả focus về nút đã mở bảng.
- Menu có nút xem thử tên vùng hiện trong 2,5 giây.
- Các nút điều khiển cảm ứng chỉ minh họa vùng bấm, không chạy nhân vật.
- Mẫu là HTML độc lập trên cảnh tĩnh; không nạp Phaser, không đọc/ghi localStorage.

Bản mẫu ban đầu có token riêng. Runtime hiện dùng token `--hud-*` và hợp đồng STYLE/DESIGN đã cập nhật.
Cảnh nền có hai kích thước gốc, không scale ảnh trong mockup để giữ pixel; cửa sổ khác kích thước sẽ cắt cảnh.
Đây là bản duyệt bố cục cho hai kích thước trên, chưa là hệ responsive hoàn chỉnh cho game.

## File của bản mẫu

- `style-reference/hud-compact-mockup.html`: cấu trúc và icon dùng lại từ index.html.
- `style-reference/hud-compact.css`: các cụm HUD và điều khiển cảm ứng.
- `style-reference/hud-compact-panels.css`: bảng kho đồ và dựng trại.
- `style-reference/hud-compact.js`: tương tác mẫu, không nối gameplay.
- `style-reference/hud-compact-assets/`: hai ảnh cảnh thật và năm sprite lấy từ renderer hiện tại.

Bản mẫu ban đầu không thay runtime; phần triển khai sau duyệt đã cập nhật src, index.html và kiểm thử.
Tài liệu và ảnh mẫu không được import vào entry production, không tăng dữ liệu tải khi chơi.

## Kiểm chứng bản mẫu trước triển khai

Đã xem bốn ảnh: khám phá PC/mobile và mở kho đồ PC/mobile.
Chrome headless: cả hai không có pageerror hoặc tràn ngang.
Đã đo ô menu 40px trên PC, 44px trên mobile; nút chạm 56px.
Đã thử tab trang bị, I/B/Esc, đóng bảng và aria-expanded/focus.
`npm run check`: đạt, 187/187 unit test; 0 lỗi, giữ 41 warning ESLint và 4 warning CSS legacy.
Chưa kiểm thiết bị cảm ứng/Safari thật; đây là kiểm tra viewport và pointer trong Chrome headless.
Không chạy lại e2e/build vì chỉ thêm mẫu trong docs, không đổi runtime game.
Server duyệt mẫu dùng cổng riêng 8100, dừng sau khi kiểm tra, không động server của người dùng.

## Các điểm đã được duyệt

- Hai ô góc trái có đủ rõ để truy cập Kho đồ/Dựng trại không?
- Các nút cảm ứng 56px có phù hợp, hay muốn tách tùy chọn kích thước sau này?
- Đồng ý chuyển số tài nguyên và chân dung vào bảng thay vì luôn hiện trên HUD?
- Đồng ý kho đồ dạng lưới và vị trí bảng cạnh trái/phía trên?

Đã triển khai vào GameUI/CSS và cập nhật STYLE/DESIGN. Luồng đóng bảng vẫn quay về menu tạm dừng hiện có.

## Ảnh đã xem

- [PC khi khám phá](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/compact-hud-proposal/desktop-explore.png)
- [Điện thoại khi khám phá](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/compact-hud-proposal/mobile-explore.png)
- [Kho đồ PC](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/compact-hud-proposal/desktop-inventory.png)
- [Kho đồ điện thoại](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/compact-hud-proposal/mobile-inventory.png)
