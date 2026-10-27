# Báo cáo thiết lập phong cách Pixel Forest

Ngày: 2026-10-26. Phạm vi: quy ước + token + guard + trang mẫu dev, giữ hình ảnh game.

## Kết quả

- STYLE 260 dòng; DESIGN 279 dòng; AGENTS 98 dòng. Mỗi file mới không quá 300 dòng.
- Token CSS có 259 custom property (10 cũ, 249 mới); giữ mọi giá trị cuối của baseline.
- `?styleguide` chỉ DEV: màu có tên, chữ, nút thật, menu thật trong iframe, thanh lực và atlas 117 ô.
- Liên kết hai chiều với `?gallery`; không hiện thực tài khoản/cloud/co-op hay T8b.
- Đã xem 40 ảnh game trước/sau và hai ảnh styleguide; không mở pane web cho người dùng.
- Không commit, push, deploy, git init, đổi Save hoặc đụng Firebase.

## File tạo / sửa / xóa

Tạo mới:

- [docs/STYLE.md](/Users/vunguyendanguy/web-g/docs/STYLE.md)
- [docs/DESIGN.md](/Users/vunguyendanguy/web-g/docs/DESIGN.md)
- [docs/STYLE-INVENTORY.md](/Users/vunguyendanguy/web-g/docs/STYLE-INVENTORY.md)
- [docs/STYLE-SETUP-REPORT.md](/Users/vunguyendanguy/web-g/docs/STYLE-SETUP-REPORT.md)
- [stylelint.config.js](/Users/vunguyendanguy/web-g/stylelint.config.js)
- [tools/stylelint/pixelStyle.js](/Users/vunguyendanguy/web-g/tools/stylelint/pixelStyle.js)
- [src/data/palette/ui.ts](/Users/vunguyendanguy/web-g/src/data/palette/ui.ts)
- [src/data/portrait.ts](/Users/vunguyendanguy/web-g/src/data/portrait.ts)
- [src/domain/design/contrast.ts](/Users/vunguyendanguy/web-g/src/domain/design/contrast.ts)
- [src/domain/design/contrast.test.ts](/Users/vunguyendanguy/web-g/src/domain/design/contrast.test.ts)
- [src/domain/tilemap/atlas.ts](/Users/vunguyendanguy/web-g/src/domain/tilemap/atlas.ts)
- [src/domain/tilemap/atlas.test.ts](/Users/vunguyendanguy/web-g/src/domain/tilemap/atlas.test.ts)
- [src/tooling/palette.guard.test.ts](/Users/vunguyendanguy/web-g/src/tooling/palette.guard.test.ts)
- [src/tooling/stylelint.guard.test.ts](/Users/vunguyendanguy/web-g/src/tooling/stylelint.guard.test.ts)
- [src/tooling/contrastReport.ts](/Users/vunguyendanguy/web-g/src/tooling/contrastReport.ts)
- [src/tooling/contrastReport.test.ts](/Users/vunguyendanguy/web-g/src/tooling/contrastReport.test.ts)
- [src/ui/styleguide.ts](/Users/vunguyendanguy/web-g/src/ui/styleguide.ts)
- [src/ui/styleguideFrame.ts](/Users/vunguyendanguy/web-g/src/ui/styleguideFrame.ts)
- [src/ui/styleguideMeters.ts](/Users/vunguyendanguy/web-g/src/ui/styleguideMeters.ts)
- [src/ui/styleguideTiles.ts](/Users/vunguyendanguy/web-g/src/ui/styleguideTiles.ts)

Sửa:

- [AGENTS.md](/Users/vunguyendanguy/web-g/AGENTS.md)
- [package.json](/Users/vunguyendanguy/web-g/package.json)
- [package-lock.json](/Users/vunguyendanguy/web-g/package-lock.json)
- [index.html](/Users/vunguyendanguy/web-g/index.html)
- [src/main.ts](/Users/vunguyendanguy/web-g/src/main.ts)
- [src/env.d.ts](/Users/vunguyendanguy/web-g/src/env.d.ts)
- [src/data/catalog.ts](/Users/vunguyendanguy/web-g/src/data/catalog.ts)
- [src/data/palette.ts](/Users/vunguyendanguy/web-g/src/data/palette.ts)
- [src/game/CampingScene.ts](/Users/vunguyendanguy/web-g/src/game/CampingScene.ts)
- [src/game/rendering/CampRenderer.ts](/Users/vunguyendanguy/web-g/src/game/rendering/CampRenderer.ts)
- [src/ui/gallery.ts](/Users/vunguyendanguy/web-g/src/ui/gallery.ts)
- [src/ui/CamperRigGallery.ts](/Users/vunguyendanguy/web-g/src/ui/CamperRigGallery.ts)
- [src/ui/CamperRigPaint.ts](/Users/vunguyendanguy/web-g/src/ui/CamperRigPaint.ts)
- [src/ui/styles/base.css](/Users/vunguyendanguy/web-g/src/ui/styles/base.css)
- [src/ui/styles/controls.css](/Users/vunguyendanguy/web-g/src/ui/styles/controls.css)
- [src/ui/styles/feedback.css](/Users/vunguyendanguy/web-g/src/ui/styles/feedback.css)
- [src/ui/styles/gallery.css](/Users/vunguyendanguy/web-g/src/ui/styles/gallery.css)
- [src/ui/styles/hud.css](/Users/vunguyendanguy/web-g/src/ui/styles/hud.css)
- [src/ui/styles/inventory.css](/Users/vunguyendanguy/web-g/src/ui/styles/inventory.css)
- [src/ui/styles/panels.css](/Users/vunguyendanguy/web-g/src/ui/styles/panels.css)
- [src/ui/styles/responsive.css](/Users/vunguyendanguy/web-g/src/ui/styles/responsive.css)
- [src/ui/styles/tokens.css](/Users/vunguyendanguy/web-g/src/ui/styles/tokens.css)

Xóa: không có. `src/style.css`, font và test Playwright gốc không thay đổi.
`data/portrait.ts` chỉ tách số đo cắt ảnh dùng chung cho HUD và trang mẫu; không đổi ảnh.

## Màu và ngoại lệ

| Nhóm                            |                Trước | Sau | Xử lý                                                   |
| ------------------------------- | -------------------: | --: | ------------------------------------------------------- |
| Hex trong CSS ngoài tokens      | 104 lần / 91 giá trị |   0 | Chuyển sang token, giữ alpha chính xác                  |
| Chuỗi hex TS ngoài palette/test |      41 lần / 5 file |   0 | Tham chiếu palette; 10 giá trị dev mới trong palette/ui |
| Chuỗi rgba dev ngoài palette    |                    3 |   0 | Chuyển nguyên chuỗi vào palette/ui                      |
| Hex index.html                  |                   10 |  10 | Giữ 9 fill SVG nhiều tông + 1 meta theme-color          |

Số CSS/TS khác 106/33 trong yêu cầu: báo cáo dùng kiểm kê source thực tế đầu lượt này.
TS theo file trước: main 1; CampingScene 1; CamperRigGallery 4; CamperRigPaint 13; catalog 22.
Bảy màu nhận diện CSS/TS có test khớp; không có ngoại lệ TS runtime ngoài bảng màu cho phép.
18 khóa catalog legacy157/159/161/163/164/165 và 166–177 đã đổi thành gear*/fish*.
Đã tìm lại source: không còn khóa cũ. Không xóa các legacy khác còn được camp-art/T8b tham chiếu.

## Token mới

Danh sách đầy đủ có giá trị ở [tokens.css](/Users/vunguyendanguy/web-g/src/ui/styles/tokens.css).
Tên vai trò nói thành phần/trạng thái; thang space/size giữ giá trị rem và pixel gốc.

- Màu/vài trò: `--overlay-welcome`, `--edge-dialog-light`, `--scrollbar-thumb`, `--overlay-dialog`, `--border-divider`, `--surface-pause`, `--border-setting`, `--button-selected`, `--text-selected`, `--edge-selected-light`, `--edge-selected-dark`, `--surface-portrait`, `--edge-portrait-light`, `--surface-readout`, `--border-hud-divider`, `--text-progress`, `--border-region`, `--surface-region`, `--text-region`, `--text-gallery-muted`, `--surface-wardrobe`, `--border-wardrobe`, `--edge-wardrobe`, `--surface-gear`, `--edge-gear-light`, `--edge-gear-dark`, `--gear-selected`, `--text-gear-selected`, `--border-gear-selected`, `--edge-gear-selected-light`, `--edge-gear-selected-dark`, `--border-gear-icon`, `--edge-gear-icon`, `--text-gear-hint`, `--text-gear-selected-hint`, `--border-fish-heading`, `--text-fish-count`, `--border-fish`, `--surface-undiscovered`, `--text-undiscovered`, `--surface-fish-caught`, `--border-fish-caught`, `--text-fish-hint`, `--text-fish-quantity`, `--surface-recipe`, `--edge-recipe-light`, `--edge-recipe-dark`, `--surface-recipe-hover`, `--surface-recipe-image`, `--border-recipe-image`, `--text-recipe-cost`, `--text-recipe-action`, `--surface-pad`, `--border-pad`, `--button-touch`, `--text-touch`, `--text-key-touch`, `--button-jump-hover`, `--text-key-jump`, `--surface-toolbelt`, `--button-tool`, `--edge-tool-light`, `--edge-tool-dark`, `--surface-toast`, `--text-key-tool`, `--button-action`, `--text-action`, `--button-bite`, `--border-bite`, `--text-toast`, `--surface-page`, `--button-hover`, `--edge-pressed`, `--focus-ring`, `--button-primary-hover`, `--button-quiet-hover`, `--text-title-accent`, `--text-body`, `--text-caption`, `--text-hint`, `--edge-highlight`, `--edge-shade`, `--text-primary`, `--text-secondary`, `--surface-paper`, `--surface-dark`, `--border-color`, `--accent`, `--button-primary`, `--button-secondary`, `--button-danger`, `--button-locked`, `--status-success`, `--status-warning`, `--status-error`.
- Thang khoảng cách: `--space-26`, `--space-32`, `--space-16`, `--space-4`, `--space-9`, `--space-20`, `--space-12`, `--space-24`, `--space-15`, `--space-6`, `--space-18`, `--space-10`, `--space-8`, `--space-14`, `--space-10-4`, `--space-9-6`, `--space-6-4`, `--space-5`, `--space-7`, `--space-23`, `--space-2`, `--space-1`, `--space-30`, `--space-3`, `--space-25`, `--space-27`, `--space-28`, `--space-19`, `--space-22`, `--space-1-2`.
- Kích thước: `--pixel-4`, `--pixel-3`, `--pixel-8`, `--size-420`, `--size-38`, `--size-68`, `--size-60`, `--size-58`, `--size-440`, `--size-34`, `--pixel-2`, `--size-44`, `--size-54`, `--pixel-48`, `--size-150`, `--pixel-0-2`, `--size-280`, `--pixel-1160`, `--pixel-24`, `--pixel-20`, `--pixel-32`, `--pixel-10`, `--pixel-42`, `--pixel-12`, `--pixel-16`, `--pixel-6`, `--pixel-44`, `--pixel-14`, `--size-670`, `--size-72`, `--size-96`, `--size-67`, `--size-65`, `--size-88`, `--size-84`, `--size-70`, `--size-66`, `--size-146`, `--size-36`, `--size-46`, `--pixel-36`, `--size-135`, `--size-82`, `--size-62`, `--size-76`, `--size-78`, `--size-128`, `--size-110`, `--size-133`, `--size-126`, `--size-57`, `--pixel-0-6`, `--size-42`, `--size-132`, `--size-91`, `--size-142`, `--size-115`, `--size-56`, `--size-86`, `--size-40`, `--size-130`, `--size-100`, `--size-520`.
- Chữ: `--text-10`, `--text-14`, `--text-20`, `--text-12`, `--text-13`, `--text-16`, `--text-11-2`, `--text-18`, `--text-fixed-12`, `--text-11`, `--text-15`, `--text-17`, `--text-9`, `--text-25`, `--text-36`, `--text-32`, `--text-fixed-18`, `--text-fixed-24`, `--text-42`, `--text-28`, `--weight-600`, `--weight-800`, `--weight-900`, `--leading-1-2`, `--leading-1-4`, `--leading-1-5`, `--leading-1-1`, `--leading-1-65`, `--leading-body`, `--leading-button`.
- Bóng: `--shadow-dialog-tint`, `--shadow-hud-tint`, `--shadow-ink`, `--shadow-toast-tint`, `--shadow-hard`, `--shadow-panels-1`, `--shadow-panels-2`, `--shadow-hud-1`, `--shadow-hud-2`, `--shadow-hud-3`, `--shadow-inventory-1`, `--shadow-inventory-2`, `--shadow-inventory-3`, `--shadow-inventory-4`, `--shadow-inventory-5`, `--shadow-controls-1`, `--shadow-controls-2`, `--shadow-feedback-1`, `--shadow-base-2`.
- Tầng/chuyển động/chạm/góc: `--radius-square`, `--z-hud`, `--z-panel`, `--z-dialog`, `--z-toast`, `--z-overlay`, `--duration-fast`, `--duration-feedback`, `--duration-none`, `--ease-pixel`, `--tap-min`.

Không gộp màu gần nhau, không đổi các giá trị rem thành px cố định.
Giá trị cấu trúc/media và font descriptor là ngoại lệ cú pháp, không phải lỗ hổng màu.

Token trạng thái bổ sung: `--opacity-disabled: 0.5`, giữ nguyên độ mờ nút khóa.

## Luật tự động

| Luật                                                     | Mức        | Phạm vi                                                                  |
| -------------------------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| pixel-forest/tokens: màu hex/rgb/hsl và hệ màu trực tiếp | error      | CSS ngoài tokens                                                         |
| Kích thước/thời lượng và thang chữ phải dùng token       | error      | Ngoại trừ font descriptor/giá trị cấu trúc                               |
| z-index phải var(--z-*)                                  | error      | Mọi CSS                                                                  |
| border-radius chỉ 0 / radius-square                      | error      | Kể cả token bán kính                                                     |
| Bóng cứng, blur bằng 0                                   | error      | box-shadow, --shadow-*, --edge; giải alias từ tokens chung và stylesheet |
| function-disallowed-list: gradient tuyến tính/tròn/lặp   | error      | Mọi CSS, kể cả tokens                                                    |
| color-named: never                                       | error      | Không thêm màu tên trực tiếp                                             |
| Palette TS guard                                         | error/test | Quét token chuỗi bằng TypeScript scanner                                 |
| Bảy màu CSS/TS khớp, var() phải có khai báo              | error/test | Unit test thuần                                                          |
| Bảng tương phản DESIGN khớp tính toán                    | error/test | Không tự sửa màu dưới ngưỡng                                             |

Giữ các kiểm tra semantic của stylelint-config-standard; chỉ bỏ các quy tắc định dạng tranh với Prettier.
Không tắt semantic rule toàn cục để che legacy. Ngoại lệ warning đóng theo file:

| File           | Rule                      | Số warning | Lý do                                      |
| -------------- | ------------------------- | ---------: | ------------------------------------------ |
| controls.css   | property-no-vendor-prefix |          1 | Giữ -webkit-user-select cho Safari         |
| inventory.css  | no-descending-specificity |          2 | Selector khác component, không đổi cascade |
| responsive.css | no-descending-specificity |          1 | Giữ thứ tự nhóm breakpoint                 |

Mỗi file trên có chú thích `legacy: dọn sau`; không phát sinh warning mới ngoài danh sách.
ESLint giữ 41 warning legacy (any/no-empty/max-lines...) theo cấu hình cũ; 0 lỗi.

## Kiểm chứng đã chạy thật

| Lệnh / kiểm tra                         | Kết quả cuối                                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| npm run check (repo)                    | Xanh: format + ESLint + lint:css + typecheck + 187/187 unit test                             |
| npm run lint:css                        | 0 lỗi, 4 warning legacy theo file                                                            |
| npx tsc --noEmit                        | Thành công (repo và bản sao)                                                                 |
| npm run build (bản sao cách ly)         | Thành công; không ghi dist của repo                                                          |
| npx playwright test (bản sao, 1 worker) | 30/30 đạt ở cả hai lần chạy toàn bộ, mỗi lần 1,9 phút; không timeout, không cần retry riêng  |
| Production bundle                       | Không có marker/styleguide/gallery hoặc CSS xưởng                                            |
| Kiểm tra hiển thị trước/sau             | 20 cặp: các thuộc tính màu, font, padding, margin, gap, viền, bóng, z, kích thước không khác |
| Console các lần chụp game/guide         | Không có pageerror                                                                           |
| Trang guide 1920/390                    | Không tràn ngang; đã xem cả hai ảnh cuối                                                     |

Bản sao ở `/tmp/pf-style-task/isolate`; rsync trừ node_modules/dist/test-results/playwright.config.ts/.git.
node_modules là symlink tới bộ đã cài. Chỉ tests của bản sao đổi 5173→8101, 4173→8102 bằng perl -pi -e, không tạo backup.
Playwright config bản sao dùng strictPort, reuseExistingServer=false. Không dùng server của người dùng.
Build cảnh báo chunk lớn hơn 500kB (Phaser, hiện có), không phải lỗi build.
FPS SwiftShader của e2e chỉ chứng minh phép đo còn chạy; không đại diện GPU/điện thoại thật.
Log kiểm tra đặt cùng thư mục ảnh bên dưới.

## Bảng tương phản

Chữ thường yêu cầu 4,5:1; chỉ đo màu đục, không suy kết quả cho nền alpha.

| Cặp              | Token chữ / nền                                  |  Tỉ lệ | Kết quả      |
| ---------------- | ------------------------------------------------ | -----: | ------------ |
| Chữ chính / giấy | `--ink` / `--paper`                              | 7.61:1 | Đạt          |
| Nút phụ          | `--cream` / `--pine`                             | 5.62:1 | Đạt          |
| Nút chính        | `--ink` / `--gold`                               | 6.21:1 | Đạt          |
| Mô tả / giấy     | `--text-body` / `--paper`                        | 4.46:1 | **Dưới 4,5** |
| Chú thích / giấy | `--text-caption` / `--paper`                     | 3.22:1 | **Dưới 4,5** |
| Gợi ý / giấy     | `--text-hint` / `--paper`                        | 3.27:1 | **Dưới 4,5** |
| Đã trang bị      | `--text-gear-selected` / `--gear-selected`       | 4.06:1 | **Dưới 4,5** |
| Gợi ý trang bị   | `--text-gear-hint` / `--surface-gear`            | 3.74:1 | **Dưới 4,5** |
| Cá chưa khám phá | `--text-undiscovered` / `--surface-undiscovered` | 2.82:1 | **Dưới 4,5** |
| Gợi ý cá         | `--text-fish-hint` / `--surface-undiscovered`    | 3.29:1 | **Dưới 4,5** |
| Tên vùng         | `--text-region` / `--surface-region`             | 4.64:1 | Đạt          |
| Thông báo        | `--text-toast` / `--surface-toast`               | 7.38:1 | Đạt          |

7/12 cặp dưới ngưỡng đã được ghi nhận, không đổi màu theo yêu cầu giữ diện mạo.

## Ảnh trước / sau — đã xem từng ảnh

Mọi ảnh trong bảng đều đã mở xem bằng mắt, gồm cả thanh câu cá và chân dung thật.
Không thêm test ảnh hoặc so sánh pixel tự động; hoạt hình có thể khác thời điểm chụp.
Đánh giá giữ nguyên diện mạo dựa trên ảnh, giá trị CSS cuối và việc không đổi dữ liệu art.

| Màn       | 1920 trước                                                                                                                                              | 1920 sau                                                                                                                                              | 390 trước                                                                                                                                             | 390 sau                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| welcome   | [before 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/1920-welcome.png)   | [after 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/1920-welcome.png)   | [before 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/390-welcome.png)   | [after 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/390-welcome.png)   |
| hud       | [before 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/1920-hud.png)       | [after 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/1920-hud.png)       | [before 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/390-hud.png)       | [after 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/390-hud.png)       |
| inventory | [before 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/1920-inventory.png) | [after 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/1920-inventory.png) | [before 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/390-inventory.png) | [after 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/390-inventory.png) |
| build     | [before 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/1920-build.png)     | [after 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/1920-build.png)     | [before 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/390-build.png)     | [after 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/390-build.png)     |
| shop      | [before 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/1920-shop.png)      | [after 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/1920-shop.png)      | [before 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/390-shop.png)      | [after 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/390-shop.png)      |
| cook      | [before 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/1920-cook.png)      | [after 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/1920-cook.png)      | [before 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/390-cook.png)      | [after 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/390-cook.png)      |
| chest     | [before 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/1920-chest.png)     | [after 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/1920-chest.png)     | [before 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/390-chest.png)     | [after 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/390-chest.png)     |
| pause     | [before 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/1920-pause.png)     | [after 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/1920-pause.png)     | [before 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/390-pause.png)     | [after 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/390-pause.png)     |
| settings  | [before 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/1920-settings.png)  | [after 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/1920-settings.png)  | [before 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/390-settings.png)  | [after 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/390-settings.png)  |
| fishing   | [before 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/1920-fishing.png)   | [after 1920](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/1920-fishing.png)   | [before 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/before/390-fishing.png)   | [after 390](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/after/390-fishing.png)   |

Ảnh trang mẫu cuối (cả hai đã xem):

- [Styleguide desktop](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/styleguide-1920.png)
- [Styleguide điện thoại](/Users/vunguyendanguy/.codex/visualizations/2026/10/20/01a15892-b36d-77d2-9975-43d9fc863527/pixel-forest-style/styleguide-390.png)

Không có ảnh được dùng để kết luận nhưng chưa xem. Ảnh e2e tự sinh không được dùng làm bằng chứng thị giác ở báo cáo này.

## Giới hạn và các quyết định để duyệt

- Chưa kiểm GPU thật, Safari/iOS, màn notch thật hoặc trình đọc màn hình.
- Chưa đo tương phản các lớp alpha trên mọi cảnh; chưa sửa 7 cặp dưới ngưỡng.
- Nút hủy hẹp/checkbox nhỏ, tab mua/bán và focus với DOM động vẫn là nợ hiện có, đã ghi DESIGN.
- Nút nguy hiểm và biểu mẫu tài khoản/co-op chỉ được định nghĩa trong tài liệu, chưa hiện thực.
- Thanh lực trang mẫu dùng phép vẽ canvas theo drawTension; không giả mô phỏng câu cá.
- Hai gradient canvas dev của CamperRigPaint là ngoại lệ đóng; T8b vẫn chưa làm.
- Luật mới cần duyệt: DOM chỉ góc vuông, không gradient/blur, màu và kích thước qua token.
- Tên token role/space/size/text và alias màu danger/error hiện tại cần duyệt trước khi áp dụng UI tương lai.
- Ngoại lệ SVG/theme-color, font/media/geometry, lọc trường sáng, dev gradient và 4 warning CSS đã ghi rõ.
- Các luật bảo vệ đang bật; thay đổi quyết định phải sửa tài liệu, guard và duyệt hình cùng nhau.

Đã dừng server tự khởi chạy 8100; Playwright đã dừng 8101/8102, kiểm tra lsof không còn listener.
Server của người dùng không bị dừng. Không còn file backup/rác trong repo.
