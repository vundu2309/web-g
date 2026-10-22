# Pixel Forest

Game chính dùng **Phaser 3.90 + TypeScript + Vite**. Mã nguồn ở `src/`; `index.html` chỉ là giao diện HUD và các hộp thoại của game Phaser. Bản Canvas cũ không còn là trang chính.

## Chạy và kiểm tra

```sh
npm ci
npm run dev
npm test
npm run test:e2e
npm run build
npm run preview
```

- Game phát triển: http://localhost:5173.
- `←` / `→` hoặc `A` / `D` để di chuyển; `Space` / `↑` / `W` để nhảy; `P` tạm dừng. Điện thoại giữ nút trái/phải và có thể nhấn Nhảy đồng thời.
- Trong lúc chơi có Trái, Phải, Nhảy, Tạm dừng và Cài đặt. Âm nhạc, mức đồ họa, God mode và toàn màn hình nằm trong Cài đặt.
- Mở Cài đặt trong game tự tạm dừng. Đóng Cài đặt trở về màn hình pause; bấm Tiếp tục hoặc Esc/P để chạy tiếp.
- Cây nền có 4 lớp cao lần lượt 112/172/235/289 đơn vị, đều neo chân ở mặt đất; lớp xa nhỏ/nhạt và cuộn chậm hơn.

E2E dùng Chrome chạy ẩn, hiện cấu hình đường dẫn Chrome macOS trong `playwright.config.ts`. Máy khác cần sửa executablePath hoặc cài browser Playwright. Bộ kiểm thử gồm luật chơi, va chạm thật, âm nhạc, hiệu ứng, modal bàn phím/focus, hình học cây, UI mobile và cache offline.

## Tính năng

Nhân vật pixel có animation; Enemy đứng đất bên phải thả chướng ngại theo độ khó; đom đóm +50; lightstick x2 điểm đom đóm trong 10 giây; bàn DJ kích hoạt khiên 3 va chạm, DJ bay xuống đánh đàn và aura vàng. Khiên nứt/vỡ, hết khiên sẽ kết thúc DJ/nhạc. God mode không mất lượt chơi nhưng khiên vẫn giảm độ bền. Có lưu kỷ lục local, pause khi đổi tab và reset khi chơi lại.

Hiệu ứng đã đối chiếu bản Canvas: gradient vàng toàn cảnh, gradient bóng nước, aura x2, hai lớp sáng quanh DJ, vòng tròn/hạt sáng nhấp nháy, nốt nhạc và bóng sân khấu. Texture được cache; sprite dùng nearest filtering, glow dùng lọc mượt. Clock và physics dùng chung bước 1/60 giây.

## Build và PWA

`dist/` là sản phẩm build, không sửa thủ công. Đường dẫn tương đối hỗ trợ triển khai ở GitHub Pages `/web-g/`. Phải triển khai **nội dung dist**; không phục vụ trực tiếp source TypeScript.

Manifest, icon và service worker có trong build production. Phần game được cache để chơi offline sau lần tải đầu; file nhạc không precache. Âm nhạc ở `public/assets/audio/song-gio.mp3`, khoảng 9,8 MiB, chỉ tải sau tương tác. Cần tải file này cùng bản build nếu muốn phát online.

JS build khoảng 1,25 MB thô / 346 KB gzip, chưa tính nhạc. Chưa đo pin/FPS hoặc kiểm tra cài đặt trên điện thoại thật. Bản Phaser được phát hành trên GitHub Pages; bản build nằm ở gốc repository, mã nguồn ở `game/` trên GitHub.

## Sân khấu giữa rừng đêm

- Bầu trời chạng vạng, trăng/sao, núi và 4 lớp cây nhỏ dần theo khoảng cách, sương mỏng, nấm phát sáng và thực vật ven đường.
- Atlas nhân vật có 8 frame chạy và các tư thế nhảy, rơi, tiếp đất, nhận vật phẩm; Enemy có tư thế đứng, ôm và thả.
- DJ bay xuống trong cột sáng, có LED/equalizer, hào quang, nốt nhạc; khiên có phản chiếu chuyển động, gợn khi trúng đòn và hạt nước khi vỡ.
- Nhặt vật phẩm có hào quang/điểm nổi, nhảy tiếp đất có bụi; lightstick tạo vệt sáng.
- Đẹp: render 1600×720, có sương và đầy đủ hạt sáng. Tiết kiệm: render 800×360, tắt sương, giảm hạt. Thiết bị cảm ứng mặc định Tiết kiệm nếu chưa có lựa chọn lưu.
- Hiệu ứng mô phỏng giới hạn 96 hạt ở mức Đẹp / 32 ở Tiết kiệm, tối đa 6 thông báo điểm; trạng thái này đóng băng khi pause và dọn khi restart.
- Không thêm thư viện đồ họa hoặc ảnh tải ngoài. Hình và sprite được cache; chưa đo hiệu năng/pin trên thiết bị thật.

## Di chuyển chủ động

Nhân vật chỉ di chuyển khi giữ điều khiển, giới hạn trong màn chơi. Nền và chướng ngại không tự trượt. Enemy báo vị trí trước khi thả; vật cản rơi xuống rồi đứng yên, tối đa 8 vật cản. Vật phẩm xuất hiện trong vùng có thể tiếp cận, tối đa 12. Điểm quãng đường chỉ tính theo vị trí xa nhất đã tới, không tăng khi đứng yên hoặc đi qua lại. Pause, mất focus và chơi lại xóa điều khiển đang giữ.
