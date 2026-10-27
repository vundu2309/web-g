# Nhiệm vụ: Thiết lập UI/UX design và style guide cho Pixel Forest (dựa trên giao diện đã cải tiến T1–T7, R1–R3 và T8a; T8b chưa làm)

Repo: /Users/vunguyendanguy/web-g (Phaser 3.90 + TypeScript strict + Vite, PWA). Source do nhiều AI viết, nên mọi quy ước phong cách phải (1) được GHI RA trong repo, (2) có ví dụ mẫu, (3) bị công cụ tự động chặn khi lệch. ĐỌC trước: `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/TERRARIA-STYLE-PLAN.md` (639 dòng; đặc biệt các mục T1–T8a và R1–R3), `docs/style-reference/` (mockup cảnh `terraria-style-mockup.html`, nhân vật `character-rig-mockup.html`: chuẩn thẩm mỹ người dùng đã duyệt).

## Hiện trạng cần nắm (đã đo lại)

- **Đồ họa thế giới (kiểu Terraria, chỉ hình ảnh):** ô 16×16 pixel nghệ thuật = 32 đơn vị, `ART_PIXEL=2`, khung nhìn ~270 pixel nghệ thuật cao, scale NGUYÊN theo pixel thiết bị (cả DPR), mọi texture `NEAREST`; chất liệu 3–4 tông (sáng, thường, bóng, đậm; sáng từ trên-trái; viền tối bằng tông đậm của chính chất liệu, không viền đen); nền trời dither Bayer 4×4 theo giờ và 5 vùng (`backdropTones.ts`, `domain/backdrop/`); thực vật nhiều biến thể (`domain/vegetation/`); ánh sáng theo ô (`domain/lighting/`: tách trường vô hướng, post-FX nhân màu CHỈ trên camera thế giới, bloom cộng); ba camera: nền (depth âm) / thế giới có chiếu sáng (depth 0–20) / hiệu ứng KHÔNG chiếu sáng (depth ≥21).
- **Nhân vật (đã nối vào game):** bộ xương 36×48 pixel nghệ thuật (`src/domain/camperRig/`, 11 trạng thái, 38 frame, neo `hand`/`rodTip`/`head`/`headTop`/`feet`/`ground`), đầu vẽ tay (`src/data/camperHead.ts`), hai kiểu hình dáng cho mỗi slot trang bị, tông suy từ `gear[].color` bằng `domain/tone.ts`; texture dựng ở `game/rendering/CamperSheet.ts`; chân dung HUD cắt đầu-vai 16×16 phóng ×3; hộp va chạm 24×74.
- **Công trình (T8a xong):** 9 công trình vẽ lại trong `src/data/sprites/structures/*.ts` (khung 55×37, màu qua `src/data/palette/structures.ts`), TÁCH thân (lớp thế giới depth 16, được chiếu sáng) và lớp phát sáng (lớp hiệu ứng, không chiếu sáng) cho lều, bếp lửa, bếp nấu, đèn lồng; xem `game/rendering/structureSprites.ts`.
- **UI DOM:** font Nunito (có dấu tiếng Việt), `src/ui/styles/*.css` (tokens, base, hud, controls, panels, inventory, feedback, responsive, gallery, fonts), kiểu "cozy pixel" kem/thông xanh, viền 3px, bóng cứng, icon SVG pixel 16×16 trong `index.html`; hộp thoại dùng `<dialog>`; HUD, thanh hành động, nút cảm ứng, toast, kho đồ, dựng trại, cửa hàng, nấu ăn, rương. Dev: gallery `?gallery` (`src/ui/gallery.ts`, `CamperRigGallery.ts`, `CamperRigPaint.ts`, `SpriteGalleryScene.ts`).
- **Palette TS:** `src/data/palette.ts` (254 dòng, sắp chạm giới hạn 300) + `src/data/palette/{camper,camperRig,lighting,structures,vegetation}.ts` + `src/data/backdropTones.ts`.
- **Nợ cần xử lý (đo ngày hôm nay):**
  - 106 mã hex (92 giá trị khác nhau) nằm NGOÀI `tokens.css` trong các file CSS; 10 hex trong SVG icon của `index.html`;
  - 33 chuỗi hex `'#xxxxxx'` trong TS ngoài các file palette, ở 5 file: `src/main.ts`, `src/ui/CamperRigGallery.ts`, `src/ui/CamperRigPaint.ts`, `src/game/CampingScene.ts`, `src/data/catalog.ts`;
  - `tokens.css` chỉ có 7 màu + `--border`, `--edge`, `--font`; chưa có token cho khoảng cách, cỡ chữ, z-index, thời lượng animation, kích thước chạm;
  - CSS có 9 `@media` (`pointer: coarse`, `max-width: 600px/359px`, `max-height: 500px`, `min-width: 601–760px`, `min-width: 1600px`/`2560px`), 7 lần dùng `z-index` ở 4 file, 3 dòng có `gradient`/`border-radius`, 16 dòng `box-shadow`;
  - chưa có stylelint (script `lint` chỉ chạy ESLint);
  - `AGENTS.md` (79 dòng) có bản đồ source lỗi thời: còn nhắc `src/night-art.ts` (ĐÃ XÓA) và chưa nhắc `domain/tilemap`, `domain/lighting`, `domain/backdrop`, `domain/vegetation`, `domain/camperRig`, `data/palette/*`, ba camera, `data/sprites/structures/`.
- **T8b CHƯA làm** (nước/thác/cổng vòm vẽ lại, hiệu ứng câu cá: cá nhảy, bắn nước, phao; hiệu ứng nhặt/dựng): tài liệu phải có mục "T8b phải tuân theo" thay vì mô tả thứ chưa tồn tại.
- **Sắp có (chỉ định nghĩa mẫu UI, chưa hiện thực):** đăng nhập username + mật khẩu, lưu đám mây, co-op theo phòng (mã mời).

## Phạm vi

LÀM: tài liệu `docs/STYLE.md` và `docs/DESIGN.md`; hoàn thiện token CSS; gom màu TS về palette; stylelint + test bảo vệ; trang xem mẫu dev `?styleguide`; cập nhật `AGENTS.md`.
KHÔNG làm: đổi diện mạo game (sau khi thay giá trị cứng bằng token/palette, hình ảnh phải GIỐNG HỆT trước), đổi gameplay, làm T8b, hiện thực đăng nhập/Firebase/multiplayer, thêm Playwright test mới hay so sánh ảnh tự động, đổi `Save`, đụng Firebase. Chỉ được thêm devDependency `stylelint` và `stylelint-config-standard`; không thêm gì khác. KHÔNG commit, KHÔNG `git init`.

## Ràng buộc chung

- Theo `AGENTS.md`: mỗi câu lệnh một dòng, Prettier là nguồn chuẩn (single quote, `bracketSpacing: false`, printWidth 120), file mới ≤300 dòng (kể cả dòng trống và chú thích), logic thuần không import Phaser và có test `node --test`, không `any`, chữ hiển thị tiếng Việt có dấu.
- Sau khi xong chạy THẬT `npm run check`, `npx tsc --noEmit`, `npm run build` (chạy trong BẢN SAO cách ly ở thư mục tạm ngoài repo để không ghi đè `dist/`), và e2e HIỆN CÓ (`npx playwright test` TRÊN BẢN SAO cách ly với cổng riêng: đồng bộ bằng `rsync` trừ `node_modules`/`dist`/`test-results`/`playwright.config.ts`, đổi 5173→8101 và 4173→8102 trong `tests/*.ts` bằng `perl -pi -e` KHÔNG tạo file sao lưu, cấu hình webServer của bản sao dùng cổng 8101/8102; chạy cho XONG và báo số đạt/lỗi thật; nếu timeout vì máy tải, chạy lại riêng file đó 3 lần và nêu số lần đạt). KHÔNG báo "xong" khi e2e chưa chạy xong.
- Xem bằng mắt qua `npm run dev` ở cổng RIÊNG (ví dụ `npx vite --host 127.0.0.1 --port 8100 --strictPort`). XEM TỪNG ẢNH bạn dùng để báo cáo. Khi chụp ảnh tự động, đặt cửa sổ ≤800 px rộng nếu cần chi tiết pixel gốc, đảm bảo trang hiển thị và game đang chơi (game tự tạm dừng khi tab ẩn) và nhân vật đứng trên mặt đất (chờ hết rơi).
- Tiến trình: TUYỆT ĐỐI không kill theo cổng khi chưa xác minh PID; chỉ dừng đúng tiến trình bạn tự khởi chạy (lưu PID khi chạy nền, xác minh đường dẫn/thư mục làm việc trước khi dừng), dừng hết server test (8100/8101/8102) trước khi báo cáo; không động tới server khác của người dùng. Không để file rác (không dùng `sed -i` kiểu tạo file `*-e`).
- Có thể có một agent khác đang sửa file; nếu lệnh kiểm tra lỗi do file người khác đang sửa dở, ghi lại và chạy lại sau, không sửa logic trong file đó. Khi gom hex trong TS ở các file đó, chỉ thay chuỗi màu bằng tham chiếu palette (thay đổi tối thiểu).

## Bước 0 — Kiểm kê (ghi vào `docs/STYLE.md` mục phụ lục "Kiểm kê")

Lập danh sách và số lượng: mọi màu (CSS, `index.html`, TS) nhóm theo vai trò; khoảng cách (margin/padding/gap), cỡ chữ, `border-radius`, `box-shadow`, `border`, `z-index`, `transition`/`animation`, breakpoint (`@media`) đang dùng; danh sách thành phần UI và class của chúng (nút, ô vật phẩm, thẻ công thức, hộp thoại, tab, toast, thanh HUD, chân dung, nút cảm ứng, thanh câu cá...). Ghi rõ những giá trị hiện vi phạm quy tắc "KHÔNG BAO GIỜ" bên dưới. CHỤP ẢNH "TRƯỚC" (xem Bước 8) trước khi sửa CSS.

## Bước 1 — Token CSS đầy đủ (giữ nguyên diện mạo)

- Mở rộng `src/ui/styles/tokens.css`: màu theo VAI TRÒ (không chỉ tên màu): chữ chính/phụ, nền giấy, nền tối, viền, nhấn vàng, nút chính/phụ/nguy hiểm/khóa, trạng thái (thành công, cảnh báo, lỗi), lớp phủ; thang khoảng cách; thang cỡ chữ và độ đậm; bán kính (0, ghi rõ nếu có ngoại lệ); viền và bóng cứng (`--edge`, `--shadow-hard`); tầng `z-index` có tên (hud, panel, dialog, toast, overlay); thời lượng và easing animation; kích thước chạm tối thiểu (`--tap-min: 44px`).
- Thay giá trị cứng trong mọi file CSS bằng token (kể cả màu có alpha: dùng `color-mix` hoặc token có tên; chọn cách giữ giá trị cuối GIỐNG HỆT). SVG icon trong `index.html`: dùng `currentColor`/biến CSS khi an toàn; nếu một icon dùng nhiều màu cố định thì giữ nguyên và liệt kê trong tài liệu như ngoại lệ có chủ đích.
- Màu dùng chung giữa CSS và TS (`--ink`, `--pine`, `--cream`, `--gold`, `--paper`, `--wood`, `--moss`) phải có MỘT nguồn: viết test thuần kiểm tra giá trị trong `tokens.css` khớp với tên tương ứng trong `src/data/palette.ts` (hoặc ngược lại), để không lệch.
- Sau khi đổi, so sánh bằng ảnh trước/sau (Bước 8): không đổi hình ảnh.

## Bước 2 — Gom màu TS về palette

- Chuyển 33 chuỗi hex trong TS (5 file nêu trên) sang palette có TÊN theo vai trò (file phù hợp trong `src/data/palette/`; `palette.ts` đang 254 dòng nên đặt màu mới vào file palette riêng, ví dụ `src/data/palette/ui.ts`). Không đổi giá trị màu. Gom hoặc xóa màu legacy không còn dùng SAU KHI `grep` xác nhận (nêu danh sách; lưu ý `src/camp-art.ts` còn dùng một số khóa legacy).
- Thêm test thuần `palette.guard.test.ts`: quét `src/**/*.ts` và FAIL nếu có chuỗi hex ngoài danh sách file được phép (các file palette, `backdropTones.ts`, test, và một danh sách ngoại lệ có chú thích ngắn gọn, chỉ giảm chứ không tăng). Báo cáo ngoại lệ còn lại (nếu có) và lý do.

## Bước 3 — `docs/STYLE.md` (tiếng Việt, 250–400 dòng, súc tích, có bảng)

1. **Tầm nhìn một câu** và 4–6 từ khóa phong cách (rút từ mockup đã duyệt).
2. **Quy tắc pixel đo được:** `ART_PIXEL`, kích thước ô, khung nhân vật 36×48, khung công trình 55×37, scale nguyên, `NEAREST`, không làm mịn, không bóng mờ; 3–4 tông mỗi chất liệu, hướng sáng, sel-out (làm tối ~0,66 ở mép, không thêm pixel viền); dither Bayer; cách đặt tên màu theo vai trò; cách suy tông bằng `tone.ts`.
3. **Hệ thống palette:** bản đồ các file palette, quy tắc đặt tên, cách thêm màu, cấm hex ngoài palette.
4. **Lớp vẽ và độ sâu:** bảng depth thực tế (trời, mây, núi, rừng, địa hình, nước, trang trí, công trình thân/glow, nhân vật, hiệu ứng, nhãn), ba camera và quy tắc "vật thể cần ánh sáng ở lớp nào, vật tự phát sáng và UI trong canvas ở lớp nào"; cách tách thân/glow; cách đăng ký nguồn sáng (`domain/lighting`, `BUILDING_LIFT`); chất lượng Đẹp/Tiết kiệm đổi gì.
5. **Hoạt hình và hiệu năng:** dùng đồng hồ game (dừng khi pause), không cấp phát trong vòng vẽ, pool, không `Math.random`/`Date.now` trong art (dùng hash cố định), texture dựng một lần và cache, nạp sẵn (`outfitsReady`).
6. **Nhân vật:** bộ xương, neo, đầu vẽ tay, hình dáng trang bị, quy tắc thêm pose/trang bị mới, quy tắc đặt nhãn theo `headTop`.
7. **Ví dụ chuẩn vàng** (đường dẫn file thật): thêm một loại ô (`tileArt`), một sprite thực vật, một pose hoặc kiểu trang bị (`camperRig`), một công trình lưới có thân + glow (`data/sprites/structures/`), một lớp nền (`backdrop*`), một nguồn sáng (`domain/lighting`), một nhãn trong canvas (`WorldLabelFader`, `fishingLabels`).
8. **"KHÔNG BAO GIỜ":** màu hex ngoài palette; gradient mềm/bóng mờ/bo góc tròn lớn; scale không nguyên; viền đen dày; vật thể cần chiếu sáng đặt ở lớp hiệu ứng (và ngược lại: toàn bộ vật phát sáng đặt ở lớp thế giới); animation theo thời gian thực; chữ không dấu; thêm dependency.
9. **Checklist** khi thêm ô, sprite, công trình, hiệu ứng, nguồn sáng, màu mới; và mục **"T8b phải tuân theo"** (nước/thác/cổng vòm dùng lưới + palette + lớp đúng; hiệu ứng câu cá và nhặt/dựng dùng pool hạt ở lớp hiệu ứng, theo đồng hồ game, dừng khi pause, giảm ở Tiết kiệm).
10. **Phụ lục:** kiểm kê Bước 0 và các ngoại lệ có chủ đích.

## Bước 4 — `docs/DESIGN.md` (UI/UX DOM, tiếng Việt, 200–350 dòng)

1. Nguyên tắc UI: cozy pixel, đọc nhanh, một tay trên điện thoại, dừng game khi mở hộp thoại.
2. Token (tham chiếu `tokens.css`) và quy tắc "CSS chỉ dùng token".
3. **Danh mục thành phần** với tên class, file CSS, trạng thái (mặc định, hover, focus-visible, pressed, disabled, đang chọn): nút (chính/phụ/quiet/khóa/nguy hiểm), thanh hành động và nút cảm ứng, HUD (chân dung, vật liệu, xu, tên vùng, giờ), toast, hộp thoại (tạm dừng, cài đặt, kho đồ, dựng trại, cửa hàng, nấu ăn, rương), tab, ô vật phẩm, thẻ công thức, thanh tiến độ, thanh câu cá.
4. **Responsive và cảm ứng:** breakpoint thực tế đang dùng (đọc `responsive.css`), vùng an toàn (`env(safe-area-inset-*)`), kích thước chạm ≥44 px, bố cục ở 390×844, 844×390, 1920×1080, quy tắc không che nhân vật.
5. **Hộp thoại và bàn phím:** dùng `<dialog>`, `Esc` đóng, focus vào phần tử đầu và trả focus khi đóng, `aria-labelledby`, `aria-live` cho toast.
6. **Khả năng tiếp cận:** tính tỉ lệ tương phản cho các cặp màu chữ/nền chính (script nhỏ hoặc test thuần dùng công thức WCAG), ghi bảng kết quả; cặp nào dưới 4,5:1 cho chữ thường thì LIỆT KÊ, KHÔNG tự đổi màu; hỗ trợ `prefers-reduced-motion` cho animation DOM; không chỉ dựa vào màu để báo trạng thái.
7. **Giọng văn và nội dung:** tiếng Việt có dấu, câu ngắn, ấm, động từ rõ; 15–20 câu mẫu thật trích từ game (toast, nút, tiêu đề); quy tắc thông báo lỗi nói cách khắc phục.
8. **Mẫu biểu mẫu (CHỈ định nghĩa, chưa hiện thực):** ô nhập, nhãn, lỗi, gợi ý, bật/tắt hiện mật khẩu, hàng danh sách, hộp thoại xác nhận, phục vụ đăng nhập username/mật khẩu và phòng co-op sắp tới (mã mời, danh sách người trong phòng).
9. **Chuyển động DOM:** thời lượng ngắn, easing bước hợp phong cách, tắt khi reduced-motion.

## Bước 5 — stylelint

- Thêm devDependencies `stylelint`, `stylelint-config-standard`; cấu hình (`stylelint.config.js` hoặc tương đương, ESM như repo) tương thích Prettier (không để stylelint tranh định dạng với Prettier); script `lint:css` (`stylelint "src/**/*.css"`).
- Luật: cấm màu hex/rgb/hsl trực tiếp ngoài `tokens.css` (và ngoại lệ có chú thích); `z-index` phải dùng `var(--z-*)`; cấm `linear-gradient`/`radial-gradient`, `box-shadow` có blur và `border-radius` lớn hơn mức DESIGN cho phép: CHỈ bật những luật mà `docs/STYLE.md`/`docs/DESIGN.md` ghi là "không bao giờ" VÀ phù hợp với CSS thực tế sau Bước 1. Vi phạm cũ không sửa an toàn được: hạ `warning` theo file kèm chú thích `/* legacy: dọn sau */`, liệt kê trong báo cáo; KHÔNG tắt luật toàn cục.
- Gắn `lint:css` vào `npm run check` SAU KHI nó chạy xanh trên baseline (cập nhật mô tả trong `AGENTS.md`).

## Bước 6 — Trang xem mẫu `?styleguide` (chỉ DEV)

- Dựng như `?gallery` (không lọt vào production: kiểm tra bundle bản build trong bản sao không chứa chuỗi của trang này). Nội dung: mẫu màu token CSS và mọi bảng palette (UI, ô, nền theo giờ và vùng, thực vật, nhân vật, công trình, ánh sáng) kèm tên; mẫu chữ; mọi thành phần DOM ở mọi trạng thái bằng CLASS THẬT (không viết CSS riêng cho trang); atlas toàn bộ loại ô và biến thể autotile; liên kết sang `?gallery` (nhân vật, công trình). Thêm liên kết qua lại giữa hai trang.
- Trang này là nơi AI và người dùng duyệt nhanh một thành phần mà không cần chơi tới đúng màn hình.

## Bước 7 — `AGENTS.md`

Cập nhật gọn (<170 dòng): bản đồ source đúng với repo hiện tại (domain/tilemap, lighting, backdrop, vegetation, camperRig; data/palette, data/sprites/structures; rendering và ba camera; xóa nhắc tới `night-art.ts`); thêm mục "Giao diện và phong cách" chỉ về `docs/STYLE.md` và `docs/DESIGN.md` kèm luật cứng ngắn (màu chỉ từ palette/token, CSS chỉ dùng token, vật thể ở đúng lớp camera, theo ví dụ chuẩn vàng, xem `?styleguide`/`?gallery`, chạy `npm run check`); cập nhật "Phạm vi chưa có" (đồng bộ đám mây, tài khoản, multiplayer đang được lên kế hoạch, chưa hiện thực; T8b chưa làm). Không chép nội dung STYLE/DESIGN vào AGENTS.

## Bước 8 — Kiểm chứng

- `npm run check` xanh (gồm `lint:css`), `tsc`, build trong bản sao, e2e hiện có CHẠY XONG trên bản sao và báo số thật.
- So sánh TRƯỚC/SAU bằng ảnh chụp thật ở 1920×1080 và 390×844 cho: màn chào, HUD khi chơi (có chân dung), kho đồ, dựng trại, cửa hàng, nấu ăn, rương, tạm dừng, cài đặt, thanh câu cá. "Trước" chụp ở Bước 0 trước khi sửa CSS. Hình ảnh phải giống hệt; nếu khác, sửa token cho khớp. Xem từng ảnh.
- Mở `?styleguide` ở 1920×1080 và 390×844 và xem bằng mắt.

## ĐIỂM DỪNG

Xong thì DỪNG. Báo cáo bằng tiếng Việt: file tạo/sửa/xóa; số hex đã gom (CSS, TS, `index.html`) và số còn lại kèm lý do; danh sách token mới; kết quả THẬT của từng lệnh kiểm tra (kể cả e2e đầy đủ); danh sách luật stylelint (bật, `warning` theo file) và nợ legacy; bảng tương phản màu và cặp dưới ngưỡng; ảnh trước/sau (đường dẫn đầy đủ, ảnh nào đã xem, ảnh nào chưa); phần chưa kiểm chứng; các quyết định cần người dùng duyệt (luật "không bao giờ", tên token, ngoại lệ).
