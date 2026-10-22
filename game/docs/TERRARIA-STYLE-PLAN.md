# Kế hoạch phong cách Terraria (Mức A: chỉ hình ảnh)

Tài liệu T0: hằng số đã chốt, khảo sát hạ tầng/art và các chỗ phụ thuộc khung nhìn.
Mốc chuẩn thẩm mỹ: `docs/style-reference/terraria-style-mockup.html` (đã duyệt).

## 1. Hằng số đã chốt

| Hằng số                    | Giá trị                  | Ghi chú                                                           |
| -------------------------- | ------------------------ | ----------------------------------------------------------------- |
| `ART_PIXEL`                | 2 đơn vị thế giới        | `data/palette.ts`; 1 pixel nghệ thuật = 2 đơn vị                  |
| Ô (tile)                   | 16 pixel = 32 đơn vị     | Bước leo tự động tối đa 32 đơn vị = 1 ô (giữ nguyên)              |
| Chiều cao nhìn mục tiêu    | ~270 pixel nghệ thuật    | = 540 đơn vị (trước: 360 đơn vị = 180 pixel)                      |
| Khoảng chấp nhận chiều cao | 240–330 pixel nghệ thuật | Chọn hệ số nguyên gần nhất; xem mục 5 về ngoại lệ cửa sổ rất thấp |
| Pixel trên màn hình        | Số nguyên pixel thiết bị | `pixelScale` nguyên ≥ 1, tính trên `CSS px × DPR`                 |
| Chiều rộng nhìn            | Theo tỉ lệ cửa sổ        | Giới hạn pixel nghệ thuật được chốt ở T1 (xem `resolution.ts`)    |
| Lọc texture                | NEAREST                  | Không làm mịn, không kéo giãn bằng CSS                            |
| Vị trí nhân vật            | ~42% từ trái             | `sceneView.ts` giữ nguyên tỉ lệ                                   |
| Kích thước thế giới        | 16000 × 900 đơn vị       | `data/world.ts`; không đổi                                        |
| Bước mô phỏng              | 1/60 s cố định           | `CampingScene.ts`; physics không đổi                              |

Vật lý (trọng lực 2088, nhảy −720, vận tốc ngang 220, max 300×900) và hộp va chạm
(body 24×44 đơn vị, chân trùng đáy sprite) KHÔNG phụ thuộc chiều cao khung nhìn nên không đổi.

## 2. Baseline T0

Chạy ngày 2026-10-22 trên trạng thái trước T1:

- `npm run check`: thành công. format đạt; lint 0 lỗi, 41 cảnh báo (cảnh báo cũ:
  `no-explicit-any`, `no-console`, `max-lines` ở `CampingScene.ts` 311 dòng, `no-empty`); typecheck đạt; 46/46 unit test.
- `npm run build`: thành công; cảnh báo chunk JS 1.31 MB (Phaser, đã biết).
- `npx tsc --noEmit`: thành công.
- `npx playwright test`: 30/30 đạt, chạy trên bản sao cách ly (xem dưới).

Lưu ý môi trường: cổng 5173 đang có server của người dùng (PID 823), cổng 8000 (PID 1877) và 8002
(PID 4396) cũng đang chạy. Các e2e cố định `http://127.0.0.1:5173` và `reuseExistingServer: true`,
nên chạy trực tiếp sẽ dùng server của người dùng. Vì vậy e2e được chạy trên bản sao trong thư mục
scratchpad, cổng 8100 (vite dev) và 8101 (preview). Chỉ bản sao được đổi cổng; repo gốc không đổi.

## 3. Hạ tầng dùng lại và art cũ sẽ thay

Dùng lại (hạ tầng, không phải art):

- Parser sprite và compile thuần: `domain/sprite.ts` (+ `sprite.test.ts`), `domain/poseMachine.ts`, `domain/visualState.ts`.
- Nạp và cache sprite: `game/rendering/SpriteLoader.ts`, `ClockSprite.ts`, `pixelDraw.ts`, `spriteImage.ts`.
- Điều khiển dáng nhân vật và bụi: `game/rendering/CamperView.ts` (chỉ đổi khi art đổi; body giữ nguyên).
- Gallery dev: `ui/gallery.ts`, `game/rendering/SpriteGalleryScene.ts`, `ui/styles/gallery.css` (chỉ DEV).
- Bảng màu: `data/palette.ts`; token CSS `ui/styles/tokens.css`.
- Mô phỏng và luật: `CampSimulation.ts`, `systems/ConstructionSystem.ts` (lưới đặt 32 đơn vị), `systems/FishingSystem.ts`,
  `sceneActions.ts`, `domain/*`, `storage/*`, `input/*`, HUD DOM.
- Camera theo người chơi (`sceneView.ts`), cấu trúc 4 lớp parallax và hệ số cuộn (0,04/0,14/0,30/0,55),
  cấu trúc sky/veil/stars/ánh sáng của `DayNightRenderer.ts`.

Art cũ sẽ bị thay ở giai đoạn sau:

- Nhân vật: `data/sprites/camper.ts`, `camperDetailed.ts`, `camperPoses.ts`, `camperRig.ts`, `data/sprites/outfits.ts`
  (màu trang bị giữ được, hình thì thay).
- Công trình: `data/sprites/structuresAnimated.ts`, `structuresProps.ts`, `buildings.ts` (bảng ánh xạ giữ được).
- Tài nguyên: `data/sprites/resources.ts`.
- Đất: `game/rendering/soil.ts` (`paintSoil`, được gọi từ `WorldRenderer.buildWorld`).
- Địa hình và cảnh vẽ bằng `fillRect`/`fillRoundedRect` trong `game/rendering/WorldRenderer.ts`
  (cây, suối, hồ, rừng, bụi, nấm, ranh giới). `night-art.ts` (`paintFerns`, `paintNightSky`, `paintStars`) được
  `WorldRenderer` và `DayNightRenderer` dùng.
- Nền xa: `ParallaxRenderer.paint()` (texture 256×180 vẽ bằng `fillRect`).
- `src/camp-art.ts` (`paintCamper`, `paintBuilding`) hiện KHÔNG có nơi import trong `src/`; là mã cũ, sẽ xử lý khi
  thay art (không xóa ở T0).

Không xóa gì ở T0.

## 4. Phụ thuộc vào chiều cao khung nhìn (tìm được ở T0)

| Vị trí                                         | Phụ thuộc                                                                                                                        |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `game/rendering/resolution.ts:3-16`            | `VIEW_HEIGHT=360`; `MIN/MAX_VIEW_WIDTH` 144/1100; `renderScale` dùng `ceil(fit × density)` (không ra pixel nguyên trên màn hình) |
| `main.ts:12-22`                                | Kích thước khởi tạo theo `VIEW_HEIGHT`; `Scale.FIT` làm canvas được CSS-scale không nguyên                                       |
| `game/rendering/Viewport.ts:10-11, 36-50`      | `width` mặc định 800; `height` readonly = 360; backing = `width × scale`; `setZoom(scale)`; text resolution = `scale`            |
| `game/rendering/sceneView.ts:4-5`              | Camera đặt tại `player.x + width×0.08`, `player.y − 65`                                                                          |
| `game/rendering/ParallaxRenderer.ts:14, 19-25` | Texture 256×180 nhân 2 = 360 đơn vị; tileSprite khởi tạo 1100×360; lặp dọc khi khung > 360 đơn vị gây đường nối                  |
| `game/rendering/ParallaxRenderer.ts:53-63`     | Lớp far/near tô đất tới đáy 180 (cố định theo texture)                                                                           |
| `game/rendering/DayNightRenderer.ts:23-48`     | Sky/stars/veil đặt theo `worldView` mỗi frame (đã đúng); stars texture 512×900                                                   |
| `game/rendering/DayNightRenderer.ts:63`        | Cull ánh sáng `                                                                                                                  | x − building.x | > 650`; khung rộng hơn có thể làm mất ánh sáng ở mép |
| `CampingScene.ts:92-93`                        | Camera và physics bounds 16000×900 (không đổi)                                                                                   |
| `data/world.ts:2-3, 31`                        | `WORLD_HEIGHT=900`; `groundAt` đo được: y từ 458 đến 650                                                                         |
| `game/rendering/WorldRenderer.ts:184, 206`     | `setResolution(2)` cố định (được `Viewport` ghi đè khi refresh)                                                                  |
| `game/rendering/CampRenderer.ts:190, 203`      | Nhãn câu cá đặt tại `player.y − 78`; thanh căng tại `player.y − 72` (đơn vị thế giới)                                            |
| `ui/styles/base.css:128-130`                   | `#game` inset 0; canvas `display:block`; `image-rendering: pixelated`                                                            |
| HUD/controls CSS                               | Neo mép và `env(safe-area-inset-*)`, không neo theo canvas                                                                       |
| `tests/graphics.spec.ts:46`                    | Kỳ vọng `worldView.height ≈ 360`                                                                                                 |
| `tests/rendering.spec.ts:39, 63`               | Kỳ vọng canvas cao 1080 khi 390×844; quality low tại 1920×1080 DPR2 → scale 3                                                    |

Kiểm tra vật lý với khung 540 đơn vị (tính bằng mã, không đổi physics):

- Camera theo `player.y − 65`: khung trên = ground − 335, khung dưới = ground + 205. Với ground trong [458, 650]
  thì khung trên luôn ≥ 123 và khung dưới ≤ 855 < 900, nên bounds không bị kẹp khi đi qua toàn map.
- Đất ngầm đến đáy thế giới 900; khung dưới chỉ thấy tối đa ~205 đơn vị dưới mặt đất.
- Đặt công trình dựa trên x và `groundAt` nên không đổi hành vi (`ConstructionSystem.error`).

## 5. Đo hiện trạng: hệ số trên màn hình không nguyên

Dùng `resolution.ts` hiện tại (quality high). `cssPerArtPx` là số pixel CSS cho một pixel nghệ thuật sau FIT:

| Cửa sổ (CSS) × DPR | scale | cssPerArtPx | Pixel nghệ thuật trên màn hình |
| ------------------ | ----: | ----------: | ------------------------------ |
| 1920×1080 ×1       |     3 |       6,000 | đều (6)                        |
| 2560×1440 ×1       |     4 |       8,000 | đều (8)                        |
| 1440×900 ×1        |     3 |       5,000 | đều (5)                        |
| 1024×768 ×1        |     3 |       4,267 | KHÔNG nguyên                   |
| 390×844 ×3         |     8 |       4,689 | KHÔNG nguyên                   |
| 844×390 ×3         |     4 |       2,167 | KHÔNG nguyên                   |
| 390×844 ×1         |     3 |       4,689 | KHÔNG nguyên                   |
| 844×390 ×1         |     2 |       2,167 | KHÔNG nguyên                   |

Hiện tại mọi cảnh chỉ có 180 pixel nghệ thuật chiều cao nhìn thấy (360 đơn vị), thấp hơn mục tiêu 240–330.
Lý do pixel không đều: `Scale.FIT` co canvas theo tỉ lệ không nguyên sau khi render. T1 sẽ bỏ FIT,
chọn `pixelScale` nguyên và đặt CSS size = backing / DPR.

## 6. Quyết định và rủi ro cần người dùng duyệt

- Khung cao 540 đơn vị làm vị trí chân nhân vật trong khung đổi từ ~68% xuống ~62% chiều cao. Giữ offset 65 đơn vị.
  Mockup đặt mặt đất khoảng 53% chiều cao; nếu muốn khớp mockup thì offset cần ~0 đơn vị. Cần người dùng chọn.
- Nhân vật (64 đơn vị cao) chiếm ~12% chiều cao khung, trước là ~18%. Đây là hệ quả của mục tiêu 270 pixel nghệ thuật.
- Cửa sổ rất thấp (ví dụ 844×390 ở DPR 1) không đạt khoảng 240–330 với hệ số nguyên; xem kết quả T1.
- Cần thêm ghi chú: `Scale.FIT` đổi sang chế độ NONE; hiệu năng phải đo lại ở T1.

## 7. T2: mô hình ô và sinh địa hình

### Khảo sát (trước T2)

- Cao độ cũ `groundAt` = `650 − round((sin(s·0,19)·65 + s·3,1)/16)·16` với `s = floor(x/256)`; hồ phẳng hóa trong
  `[x−256, x+w+256)`. Phạm vi 458–650 đơn vị (hàng 14,3–20,3), đổi tối đa 48 đơn vị (1,5 ô) giữa hai SECTION kề nhau.
- Chỗ dùng `groundAt`/`waterAt`/`SECTION`: `WorldRenderer` (collider và vẽ đất theo SECTION), `ConstructionSystem`
  (qua `CampingScene`: `heightAt`, `isWet`), `CampSimulation` (bước leo), `CampRenderer`, `CamperView`, `DayNightRenderer`,
  `CampingScene` (spawn, camera), `sceneActions` (`waterAt`, `regionAt`).
- `WORLD_HEIGHT = 900` ⇒ 29 hàng ô (`ceil(900/32)`); hàng 28 chỉ nằm một phần trong thế giới. Không đổi kích thước thế giới.

### Thiết kế

- `src/domain/tilemap/`: `types.ts` (ô 32 đơn vị, loại ô, tường, `TerrainData`), `random.ts` (băm và mulberry32),
  `surface.ts` (cao độ theo SECTION bằng quy hoạch động), `terrain.ts` (sinh lưới, lòng hồ), `features.ts` (hang,
  quặng, pha lê), `cells.ts`, `grid.ts` (`TileGrid`: truy vấn ô, `groundAt`, `solidRuns`).
- Cao độ đổi chỉ tại ranh giới SECTION (8 cột). Mỗi bước 1 ô, mỗi đoạn bằng tối thiểu 8 cột. Lệch khỏi công thức cũ tối đa
  10 đơn vị (ngưỡng 64). Vì cao độ hằng số trong mỗi SECTION, vẽ đất/trang trí theo SECTION cũ vẫn khớp, nên art cũ
  không đổi.
- Lòng hồ: mặt phẳng ở hàng D (lối gỗ, người chơi đi như cũ), nước ở D+1..D+3 theo hình chảo (cờ nước), đáy cát. Nước
  nằm dưới mặt phẳng nên không lộ ra hang và không ngã xuống hồ.
- Hang elip kín (24 lần thử, bỏ qua vùng hồ): đỉnh cách mặt đất cao nhất ≥ 2 ô đất. Quặng đồng (24 cụm) và sắt (16 cụm).
  Pha lê chỉ trên vách đá tiếp giáp hang.
- Collider: `groundRuns()` gộp các cột cùng độ cao, 17 body thay cho 63 body cũ.
- Seed hằng số `TERRAIN_SEED = 2026`. Dữ liệu lưu không đổi, không nâng version.

### Kết quả đo

- Cột ô: 500 × 29. Hàng mặt đất 14–20. Hồ: pond hàng 19, lake 18, river 20, mirror 15, spring 16.
- Ô: 244 ô hang, 44 pha lê, 121 đồng, 8 sắt, 96 cát, 226 ô nước (chỉ trong hồ).
- Đoạn bằng: 17 đoạn, ngắn nhất 8 cột, dài nhất 72 cột.
- Chỗ đặt công trình hợp lệ theo vùng (không có công trình, không tính bếp): 32, 26, 26, 27, 36.
- Số nút tài nguyên: 54 (72 trừ các nút trong vùng hồ, id `node-i` giữ nguyên).

### Quyết định cần duyệt

- Cao độ đổi theo bậc 8 ô (256 đơn vị) để khớp SECTION cũ, không theo từng 6–9 ô. Nếu muốn bậc theo cột, T3 phải vẽ
  đất và trang trí theo cột thay vì SECTION.
- Lòng hồ là mặt lối gỗ phẳng với nước bên dưới, không phải hồ lõm có mặt nước dưới mặt đất như mockup.
- Quặng sắt còn ít (8 ô); cần tăng số cụm nếu muốn thấy sắt ở T3.
