# Pixel Forest — hướng dẫn chung cho mọi AI

## Dự án

Game camping, xây dựng và câu cá dùng Phaser 3.90, TypeScript strict và Vite.
Giao diện cozy pixel, chữ Nunito có dấu tiếng Việt; tiến trình hiện lưu trên thiết bị.
Chỉ thực hiện yêu cầu được giao, giữ nguyên hành vi ngoài phạm vi đó.

## Bản đồ source

- `src/data/`: catalog, địa hình, vùng, tài nguyên; `palette.ts` và `palette/` là nguồn màu TS.
- `src/data/sprites/structures/`: chín công trình 55×37, tách thân và phần phát sáng.
- `src/domain/`: Save, làm sạch dữ liệu, luật trang bị, cá/vật liệu thuần.
- `src/domain/tilemap/`, `lighting/`, `backdrop/`, `vegetation/`: lưới ô, trường sáng, nền và thực vật.
- `src/domain/camperRig/`: bộ xương 36×48, pose, neo và hình dáng trang bị; `tone.ts` suy tông.
- `src/game/CampingScene.ts`: điều phối scene, camera, physics và lệnh gameplay.
- `src/game/systems/`: FishingSystem và ConstructionSystem, không phụ thuộc UI.
- `src/game/rendering/`: asset/cache, world, hiệu ứng, độ phân giải/DPI; ba camera:
  nền depth âm / thế giới chiếu sáng 0–20 / hiệu ứng không chiếu sáng từ 21.
- `src/ui/styleguide*.ts`, `gallery.ts`: trang xem mẫu chỉ DEV (`?styleguide`, `?gallery`).
- `src/ui/GameUI.ts`, `src/ui/styles/`: DOM, menu, HUD và CSS chia theo trách nhiệm.
- `src/input/`: phím, pointer và vòng đời listener.
- `src/storage/`: repository local và lựa chọn đồ họa.
- `src/camp-art.ts`: art legacy còn giữ; không thêm logic gameplay vào đây.
- `src/firebase.ts`: cấu hình/khởi tạo Firebase hiện có, không tự thay đổi.
- `src/camping.ts`, `src/world.ts`: entry legacy/re-export chồng với
  `domain/`, `data/`, `game/`; **hợp nhất sau, không thêm code mới vào nơi trùng**.
- `src/main.ts`: bootstrap cũ nối vào `game/`; hiện chỉ khởi động, không phải bản sao
  gameplay. Giữ mỏng; không chuyển logic từ `game/`, `ui/`, `input/`, `storage/` vào đây.
- `src/**/*.test.ts`: unit test bằng Node; `tests/`: luồng trình duyệt Playwright.
- `scripts/pwa.mjs`: tạo service worker sau build; `public/`: font/icon/manifest.
- `docs/ARCHITECTURE.md`: sơ đồ kiến trúc và hướng dẫn mở rộng hiện tại.

Không dọn cấu trúc chồng lặp hoặc nối lại system ngoài nhiệm vụ được giao.

## Lệnh

- **`npm run check` là cửa kiểm tra duy nhất trước khi báo hoàn tất**:
  format → ESLint → `lint:css` (stylelint) → typecheck → mọi unit test; dừng ở lỗi đầu tiên.
- `npm run format`: định dạng; `npm run lint -- --fix`: sửa lint tự động.
- `npm run test:e2e`: build và kiểm tra luồng trình duyệt (Chrome macOS theo config).
- `npm run dev`: chạy local; `npm run build`: kiểm kiểu, build và tạo cache PWA.
- `npm run preview`: xem build; `npm run typecheck`: kiểm kiểu riêng.
- Node hiện dùng 24; script test có glob đặt trong dấu nháy để Node tự tìm test lồng nhau.

## Quy ước

- EditorConfig: UTF-8, LF, thụt 2 space, newline cuối file; Markdown giữ trailing space.
- Prettier là nguồn chuẩn: single quote, semicolon, trailing comma `all`, printWidth 120,
  arrowParens `always`, **bracketSpacing `false`**: `{a, b}` thay vì `{ a, b }`.
- Mỗi dòng một câu lệnh. Giới hạn dòng 120 do Prettier điều phối; chuỗi không thể bẻ
  dòng có thể dài hơn. Không tự tranh luận hoặc định dạng khác cấu hình.
- PascalCase cho file chứa class/system: `CampingScene.ts`, `FishingSystem.ts`.
  camelCase cho phần còn lại: `catalog.ts`, `resolution.ts`; CSS dùng kebab-case.
  Giữ tên legacy hiện có, không đổi tên hàng loạt chỉ để khớp quy ước.
- Không dùng `any`; ưu tiên `unknown`, type guard và kiểu cụ thể. Dùng `import type`
  cho import chỉ dùng làm kiểu. So sánh `===`/`!==`.
- Chữ hiển thị cho người chơi là tiếng Việt có dấu.
- Luật game đặt trong `domain/` hoặc `game/systems/`, không nhét vào UI/renderer.
- `domain/` và `data/` không import Phaser, game, UI, input hoặc storage; phải test thuần được.
- System không import UI; trả kết quả cho scene điều phối.

## Luật cứng

- Đổi cấu trúc `Save` phải nâng `version`, viết migrate và test bản lưu cũ.
- Mọi dữ liệu đọc từ localStorage phải được làm sạch/xác thực trước khi dùng.
- Không thêm dependency mới khi chưa hỏi người dùng.
- Không đụng Firebase config/rules nếu nhiệm vụ không yêu cầu rõ.
- Mỗi tính năng mới phải có test phù hợp; không đổi hành vi game khi chỉ chỉnh công cụ/format.
- Không báo “xong” nếu `npm run check` chưa chạy và xanh.
- Các override lint legacy chỉ áp dụng đúng file/rule đã khai báo, không tắt luật toàn cục.
  Không tăng nợ trong những file đang được hạ xuống warn.
- Không tự commit, push, deploy hoặc git init; làm theo ủy quyền của người dùng.

## Giao diện và phong cách

Đọc `docs/STYLE.md` (art, palette, camera, ví dụ chuẩn vàng) và `docs/DESIGN.md` (UI/UX, token,
trạng thái, bàn phím, responsive) trước khi sửa giao diện. Kiểm kê nền ở `docs/STYLE-INVENTORY.md`.

- Màu TS chỉ từ palette; CSS chỉ dùng token cho màu/chữ/kích thước mỹ thuật/tầng/bóng.
- Không gradient CSS, blur shadow hay góc tròn; ngoại lệ đóng được ghi trong STYLE/DESIGN.
- Vật thể ở đúng camera; công trình tự sáng tách thân và glow; animation game theo clock game.
- Theo ví dụ chuẩn vàng, xem `?styleguide` và `?gallery`; không đưa trang mẫu vào production.
- Chạy `npm run check`; kiểm hình ảnh khi sửa hình ảnh, không tự đổi palette để sửa nợ tương phản.
- Giá trị cấu trúc/media/font descriptor và icon SVG nhiều tông là ngoại lệ có tài liệu.

## Phạm vi chưa có

Đã có bán cá, nấu ăn, cần câu, rương độc lập và ngày/đêm trong Save v2.
Tài khoản username/mật khẩu, đồng bộ đám mây và multiplayer theo phòng đang lên kế hoạch, chưa hiện thực.
Chưa có ngủ tua giờ hoặc mồi câu. T8b (nước/thác/cổng vòm và hiệu ứng hoạt động) chưa làm.
Không tự bổ sung các mục này nếu chưa được yêu cầu.

## Báo cáo

Nêu lệnh thật đã chạy và kết quả; tách cảnh báo legacy khỏi lỗi mới.
Nói rõ phần chưa kiểm chứng, test bị chặn và lý do; không suy diễn test đã pass.
Với thay đổi công cụ, phân biệt nhóm setup và nhóm định dạng hàng loạt.
