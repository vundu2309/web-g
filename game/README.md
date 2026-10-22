# Pixel Forest — Trại bên hồ

Game cắm trại, xây dựng và câu cá dùng Phaser 3 + TypeScript + Vite. Chơi tại https://vundu2309.github.io/web-g/.

## Chơi

- Di chuyển: A/D hoặc ←/→; nhảy: Space, W hoặc ↑. Điện thoại dùng nút hai góc màn hình.
- Khi xa hồ, tương tác chỉ hướng tới bờ nước gần nhất theo vị trí hiện tại.
- E / Tương tác: nhặt gỗ, nhặt đá, thả câu, móc cá khi cắn; giữ E để kéo, thả để giảm căng dây. Di chuyển hoặc nhảy sẽ thu cần.
- I / Kho đồ: thay mũ, áo, quần và balo; xem cá đã câu. Có 2 món mặc định mỗi ô và sẵn cần câu, dụng cụ cắm trại.
- B / Dựng trại: chọn lều, bếp lửa, bàn hoặc rương, quầy thu mua, bếp nấu và đồ trang trí. Đi tới đất bằng; bóng xanh đặt được, bóng đỏ cần đổi chỗ. Nhấn E / Đặt để xác nhận; Esc / nút X để hủy. Vật liệu chỉ trừ khi dựng thành công.
- P: tạm dừng. Các hộp thoại dừng thời gian game. Đóng hộp thoại rồi nhấn Tiếp tục để chơi; chọn công trình sẽ trở lại chế độ đặt ngay.
- "Về đầu đường mòn" đưa nhân vật về đầu map và giữ nguyên kho/công trình.

Có 24 gỗ + 16 đá ban đầu. Gỗ khô và đá dọc đường có thể thu thập một lần mỗi điểm. Bản đồ rộng 16.000 × 900, có 5 vùng và 5 ao/hồ/suối. Các mặt nước có lối gỗ băng qua, sậy, lá sen và gợn nước; núi, cây, mặt đất cùng thuộc tọa độ world, không còn rừng nền cuộn riêng.

12 loài cá phân theo môi trường, trọng số độ hiếm và kích thước. Cần tre đợi 2,5–5 giây rồi nhấn E trong 2 giây khi cá cắn. Thanh vàng là độ căng (đỏ gần đứt), thanh xanh là tiến độ; giữ/thả E hoặc nút Kéo cảm ứng để thắng. Chùng quá lâu cá thoát. Cài đặt Câu cá dễ tự nhả dây khi gần đỏ. Có 4 cấp cần trong cửa hàng: tre, sợi thủy tinh (100 xu + 5 gỗ), carbon (350 xu + 8 gỗ + 6 đá), huyền thoại (1.000 xu + 15 gỗ + 10 đá); cần cao kéo khỏe, chờ ngắn và tăng nhẹ cơ hội cá hiếm. Câu thành công tự thêm vào kho, cộng dồn số lượng và giữ kỷ lục kích thước từng loài. Bỏ lỡ thì không nhận cá. Dựng quầy thu mua để bán từng cá/món ăn hoặc bán tất cả trừ một cá kỷ lục mỗi loài; mua 2 trang bị mới mỗi ô (80/220 xu). Kỷ lục sưu tầm không mất khi bán. Cạnh bếp lửa bấm E để nướng cá; bếp nấu dựng trong 300 đơn vị từ lửa cho phép nấu canh. Ăn món trong hộp thoại giúp chạy nhanh 10% trong 120 giây chơi. Giá cá từ 3/8/20/60 xu theo độ hiếm, nhân 1–2 theo kích thước; món nướng/canh nhân 1,8/2,5. Đứng gần rương nhấn E để gửi/rút gỗ, đá, cá theo loài/kích thước và món ăn. Mỗi rương có 20 ô riêng; nhấp chuyển một chồng hoặc Chuyển tất cả. Khi đầy, toàn bộ thao tác bị hủy và giữ nguyên hai kho. Túi cá nhân chưa giới hạn sức chứa; chồng gỗ/đá tối đa 9.999.

Một ngày dài 8 phút chơi, bắt đầu lúc 08:00. HUD hiển thị giờ; pause/menu dừng đồng hồ và buff. Bình minh, ngày, hoàng hôn và đêm đổi màu trời/cảnh; đèn lồng, bếp lửa và lều sáng ấm ban đêm. Cá tầm/cá vàng núi chỉ xuất hiện chiều tối hoặc đêm; cá chép gấm không cắn ban đêm. Chưa có ngủ tua giờ hoặc mồi câu.

## Lưu tiến trình

Save version 2 tự chuyển bản v1, giữ vật liệu, vị trí, trang bị, công trình, điểm thu thập và kỷ lục cá. Một cá cũ giữ kích thước kỷ lục, các cá còn lại dùng kích thước tối thiểu vì bản cũ không lưu thông tin này. Rương có id ổn định và kho riêng, đồng hồ ngày/đêm, xu, trang bị/cần câu đã mua, cần đang dùng, tùy chọn câu dễ, cá riêng lẻ, món ăn và thời gian buff được làm sạch khi tải.

`localStorage` khóa `forest-camping-v1` lưu vị trí, trang bị, cá, vật liệu, điểm đã thu thập và công trình. Lưu ngay khi có thay đổi và định kỳ 10 giây khi chơi. Nút về trại không xóa dữ liệu. Tiến trình thuộc thiết bị/trình duyệt hiện tại; xóa dữ liệu web sẽ mất bản lưu. SaveRepository phụ trách đọc/ghi; có kiểm tra cấu trúc khi đọc dữ liệu và thông báo nếu thiết bị không cho lưu.

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

Map dùng mảnh canvas 512 đơn vị vẽ một lần, không tải ảnh đồ họa từ mạng. Độ phân giải canvas thích ứng theo màn hình; Đẹp nhân thêm DPI, Tiết kiệm giữ mức nhẹ hơn. Góc nhìn giữ cao 360; rộng theo tỉ lệ màn hình, giới hạn 144–1.100 để hỗ trợ điện thoại dọc, giới hạn mức render 8×. Chưa đo hiệu năng và pin trên điện thoại thật.

## HUD và typography

Giao diện cozy pixel dùng viền nét thẳng, bóng đổ cứng, icon SVG 16×16 và thanh công cụ dạng ô vật phẩm. Chân dung HUD thay cùng trang bị; gỗ/đá, cá và công trình cập nhật từ trạng thái game. Menu kho đồ dùng ô trang bị và hình đại diện thực tế.

Font Nunito variable 400–900, subset Latin + Vietnamese (~51 KB WOFF2), được đóng gói trong `public/fonts/` và cache offline. Game không gọi Google Fonts khi chơi. Giấy phép OFL ở `public/fonts/OFL-Nunito.txt`; nguồn Google Fonts: https://github.com/google/fonts/tree/main/ofl/nunito. Chữ Nunito dùng cả trong HUD, menu và nhãn trên map; chờ font sẵn sàng trước khi tạo canvas chữ.

## Refactor và màn hình lớn

Xem [kiến trúc và hướng dẫn mở rộng](docs/ARCHITECTURE.md). Danh mục nội dung, luật chơi, input, UI, render và lưu dữ liệu được tách riêng. `src/main.ts` chỉ khởi động game; `CampingScene` điều phối các module. Tự chuyển bản lưu version 1 sang version 2 và các tính năng camping hiện có.

Canvas phủ cửa sổ ở 16:9, 16:10, 4:3 và điện thoại dọc/ngang; khung nhìn rộng thích nghi, không kéo méo nhân vật. Canvas tự chọn mật độ theo cửa sổ/DPI và cập nhật lại khi resize, kể cả lúc pause. Chữ trên map được raster lại cùng mức render; sprite giữ nét pixel bằng nearest filtering. HUD/menu tăng cỡ chữ và layout ở màn hình lớn, không kéo giãn ảnh UI. Có chế độ Tiết kiệm để giảm lượng pixel render.

Quy ước dùng chung cho mọi công cụ AI nằm trong [AGENTS.md](AGENTS.md). Chạy `npm run check` trước khi báo hoàn tất; lệnh này kiểm tra định dạng, ESLint, kiểu và mọi unit test theo thứ tự. `npm run format` định dạng toàn repo theo `.prettierignore`; `npm run lint -- --fix` sửa các lỗi lint tự động được. Các cảnh báo legacy được giới hạn theo file trong `eslint.config.js`, không tắt luật toàn cục.

## Đồ họa — giai đoạn 1

Mây, núi xa, núi gần và rừng nền dùng tile texture cache một lần, hệ số cuộn khác nhau.
Mây chạy theo đồng hồ game nên dừng khi pause. Màu nền hòa trong 640 đơn vị quanh ranh giới vùng;
lớp phủ ngày/đêm vẫn tác động toàn cảnh. Tiết kiệm chỉ giữ núi xa/rừng, bỏ mây và núi gần.
Đất có tầng màu, đá và rễ vẽ một lần trong chunk. Màu cũ đã gom trong `src/data/palette.ts`.
Hộp va chạm thực tế vẫn 24×44 đơn vị, đáy trùng chân sprite; không thay đổi vật lý hoặc Save.

## Mẫu sprite — chờ duyệt art

Dev có [gallery](http://localhost:5173/?gallery): nhân vật 24×32, hai bộ màu, ba animation
idle/run/jump, có đổi trạng thái, tốc độ, hướng và tạm dừng. Sprite được đọc từ lưới ký tự và
palette, biên dịch thành texture native có NEAREST; mỗi pixel nghệ thuật bằng 2 đơn vị world.
Gallery và mẫu thử bị loại khỏi production. Mẫu chưa thay nhân vật đang chơi; đang dừng ở
bước duyệt tỉ lệ/nét/phong cách trước khi làm các trạng thái và công trình còn lại.

Mẫu duyệt đã có thêm mức 48×64 (gấp 4 số pixel) sau phản hồi thiếu chi tiết.
Chọn Mật độ pixel trong gallery để so với 24×32 ở cùng kích thước hiển thị.
Đây là phương án review, chưa đổi ART_PIXEL=2, kích thước world hoặc nhân vật đang chơi.
