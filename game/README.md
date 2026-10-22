# Pixel Forest — Trại bên hồ

Game cắm trại, xây dựng và câu cá dùng Phaser 3 + TypeScript + Vite. Chơi tại https://vundu2309.github.io/web-g/.

## Chơi

- Di chuyển: A/D hoặc ←/→; nhảy: Space, W hoặc ↑. Điện thoại dùng nút hai góc màn hình.
- E / Tương tác: nhặt gỗ, nhặt đá, thả câu và giật cần khi cá cắn. Di chuyển hoặc nhảy sẽ thu cần.
- I / Kho đồ: thay mũ, áo, quần và balo; xem cá đã câu. Có 2 món mặc định mỗi ô và sẵn cần câu, dụng cụ cắm trại.
- B / Dựng trại: chọn lều, bếp lửa, bàn hoặc rương trang trí. Đi tới đất bằng; bóng xanh đặt được, bóng đỏ cần đổi chỗ. Nhấn E / Đặt để xác nhận; Esc / nút X để hủy. Vật liệu chỉ trừ khi dựng thành công.
- P: tạm dừng. Các hộp thoại dừng thời gian game. Đóng hộp thoại rồi nhấn Tiếp tục để chơi; chọn công trình sẽ trở lại chế độ đặt ngay.
- "Về đầu đường mòn" đưa nhân vật về đầu map và giữ nguyên kho/công trình.

Có 24 gỗ + 16 đá ban đầu. Gỗ khô và đá dọc đường có thể thu thập một lần mỗi điểm. Bản đồ rộng 16.000 × 900, có 5 vùng và 5 ao/hồ/suối. Các mặt nước có lối gỗ băng qua, sậy, lá sen và gợn nước; núi, cây, mặt đất cùng thuộc tọa độ world, không còn rừng nền cuộn riêng.

12 loài cá phân theo môi trường, trọng số độ hiếm và kích thước. Đợi 2,5–5 giây rồi giật cần trong 2 giây khi cá cắn. Câu thành công tự thêm vào kho, cộng dồn số lượng và giữ kỷ lục kích thước từng loài. Bỏ lỡ thì không nhận cá. Chưa có cơ chế nấu ăn, bán cá hoặc sử dụng rương như kho độc lập; rương hiện là công trình trang trí.

## Lưu tiến trình

`localStorage` khóa `forest-camping-v1` lưu vị trí, trang bị, cá, vật liệu, điểm đã thu thập và công trình. Lưu ngay khi có thay đổi và định kỳ 10 giây khi chơi. Nút về trại không xóa dữ liệu. Tiến trình thuộc thiết bị/trình duyệt hiện tại; xóa dữ liệu web sẽ mất bản lưu. Có kiểm tra cấu trúc khi đọc dữ liệu và thông báo nếu thiết bị không cho lưu.

Firebase Core vẫn được tải riêng khi bắt đầu chơi: project tên `web-g`, Project ID `movieapp-fa2d4`, Web App `1:1071572901905:web:4d7072ef0a493528ea11b0`. Cấu hình công khai ở `src/firebase.ts`, CLI chọn project qua `.firebaserc`. Chưa tích hợp đăng nhập hoặc đồng bộ cloud; không thay đổi database/security rules hiện có.

## Phát triển và phát hành

```sh
npm ci
npm run dev
npm test
npm run test:e2e
npm run build
npm run preview
```

Dev: http://localhost:5173. Kiểm thử gồm quy tắc kho/trang bị/cá/xây dựng, tương tác trên trình duyệt, lưu/tải lại, UI điện thoại dọc/ngang, camera và offline. E2E dùng Chrome macOS cấu hình trong `playwright.config.ts`; máy khác cần đổi đường dẫn trình duyệt.

Trên GitHub, source ở `game/`, thư mục gốc là nội dung `dist/` đã build để GitHub Pages phục vụ từ `main` / root. Đường dẫn tương đối hỗ trợ `/web-g/`. Service worker cache bản game, kể cả Firebase Core; manifest hỗ trợ cài PWA. Không còn DJ, nhạc, lightstick, aura, khiên, Enemy hoặc vật phẩm arcade.

Map dùng mảnh canvas 512 đơn vị vẽ một lần, không tải ảnh đồ họa từ mạng. Chế độ Tiết kiệm render 800×360, Đẹp 1600×720. Chưa đo hiệu năng và pin trên điện thoại thật.
