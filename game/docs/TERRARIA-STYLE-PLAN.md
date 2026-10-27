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

## 8. T3: địa hình bậc theo cột, vẽ ô và chunk

### Khảo sát (trước T3)

- `WorldRenderer` vẽ đất bằng `soil.ts` (`paintSoil`) theo từng SECTION vào chunk 512 đơn vị. Cây, dương xỉ, đá,
  nấm, sậy và gò đất được vẽ thẳng vào cùng chunk theo SECTION. Nước hồ là hình chữ nhật phủ (legacy100-102).
- Dùng `groundAt`/`groundRuns`: `WorldRenderer`, `CampRenderer`, `CamperView`, `CampSimulation` (bước leo),
  `DayNightRenderer` (đèn lồng), `CampingScene` (spawn, camera, `heightAt`), `sceneActions` (`waterAt`).

### Thiết kế

- Địa hình: `domain/tilemap/surface.ts` quy hoạch động theo CỘT (thay theo SECTION). Mục tiêu là công thức cũ
  theo SECTION cộng một gợn đồi cố định theo cột (biên độ 1,1 hàng). Ràng buộc: bước đổi ≤ 1 ô, đoạn bằng ≥ 6 cột,
  lệch so với công thức cũ ≤ 1,5 hàng. Vùng hồ (kể cả đệm 256 mỗi bên) và khoảng phẳng quanh thác
  (`flatSpans`, `WATERFALL_X = 7350`) là hàng bắt buộc. Seed `TERRAIN_SEED` không đổi; Save không đổi.
- Vẽ ô: `domain/tilemap/tileArt.ts` sinh điểm ảnh 16×16 theo `solidPix`/`wallPix`/`drawWater` của mockup:
  đất có cỏ phủ (độ sâu đổi theo cột điểm ảnh, rủ xuống mép khi có không khí), đá có vết nứt, cát, quặng đồng và
  sắt (cụm tròn), đá có mảnh pha lê tĩnh (T6 sẽ phát sáng), tường nền tối có mạch gạch mờ, không bevel. Autotile
  theo 4 cạnh: không khí phía trên làm mép sáng, phía dưới tối, trái/phải tối vừa; ô cùng loại không tạo mép.
  Biến thể chọn theo hash của tọa độ, không dùng `Math.random`.
- Tông: `domain/tilemap/tileColors.ts` gọi tên theo vai trò trong `data/palette.ts`. Tông vùng trộn 20% qua
  `regionTone`, chuyển mượt ở ranh giới vùng.
- Chunk: `domain/tilemap/tileChunks.ts` gom 16 ô (256 điểm ảnh ngang, cao 29 × 16 điểm). Vẽ MỘT LẦN vào RGBA, cache
  theo khóa `terrain-i`, phóng nguyên 2 lần, `NEAREST`. Nước là chunk riêng `water-i` (chỉ chunk có nước), depth 8,5.
- Phaser: `game/rendering/terrainLayers.ts` (chunk địa hình và nước), `game/rendering/decorLayer.ts` (cây, dương xỉ,
  đá, nấm, gò; mỗi vật lấy cao độ tại x của nó, canvas `decor-start` 512 × 520, depth 9).
- `WorldRenderer`: collider từ `groundRuns()`; giữ lối gỗ, cọc, sen, nhãn hồ, thác và cổng vòm. Bỏ khung nước cũ
  vì nước đã nằm trong chunk.
- Xóa `game/rendering/soil.ts` và `soil.test.ts` (đã `grep`: không còn chỗ dùng). Test mới: `tileArt.test.ts`,
  `tileChunks.test.ts`, `grid.test.ts`; `terrain.test.ts` cập nhật theo bậc theo cột.

### Kết quả đo

- `npm run check`: 76/76 test (trước T3: 63), format và lint đạt, 0 lỗi, 41 cảnh báo như baseline.
- `npx tsc --noEmit`: đạt. `npm run build`: đạt trong bản sao cách ly (xem dưới).
- `npx playwright test`: 30/30 đạt trên bản sao cách ly (cổng 8100/8101). Một test được đổi tiền tố `land-` thành
  `terrain-` (vẫn kiểm tra 32 chunk nền).
- Bậc: 43 lần đổi hàng trên thế giới, 33 lần nằm ngoài ranh giới SECTION cũ. Đoạn bằng ngắn nhất 6 cột.
  Lệch lớn nhất so với công thức cũ: 38 đơn vị (ngưỡng 64). T2 có 16 lần đổi hàng.
- Body va chạm: 44 (T2: 17).
- Chỗ đặt công trình hợp lệ (cùng cách đo với test, bước 32): vùng 0–4 = 14, 13, 20, 17, 30 (T2: 32, 26, 26, 27, 36).
  Vùng 1 còn 13, sát ngưỡng test 10.
- Bộ nhớ texture: địa hình 14,2 MB, nước 3,6 MB (8 chunk), trang trí 31,7 MB; tổng khoảng 49,5 MB.
  Bản cũ (land 512 × 900 cho 32 chunk) khoảng 54,9 MB. Dựng 32 chunk địa hình mất khoảng 125 ms (đo trong Node).
- Đi bộ thật (DEV, toàn thế giới 200 → 15600 rồi quay lại): không kẹt khung hình nào, không rơi xuyên đất,
  thời gian trên không dài nhất 10 khung (do rơi qua bậc).
- FPS: không đo đáng tin trên GPU phần mềm (SwiftShader).

### Màu mới (`src/data/palette.ts`, 40 tên)

terrainDirtMid/Base/Deep/Light/Pebble; terrainGrassMid/Bright/Deep/Sun; terrainStoneMid/Base/Deep/Light;
terrainSandBase/Light/Deep/Glint; terrainWallDirtShade/Base/Deep/Light; terrainWallStoneShade/Base/Deep/Light;
terrainRimLight/Dark; oreCopperBase/Glint/Deep; oreIronBase/Deep/Glint; crystalCore/Edge/Deep (mới, chưa có trong
mockup); waterBody/Deep/Glint/Foam. Tông mockup được giữ nguyên hex; các tông trộn (mép, vùng, nước sâu) tính từ
các tên này khi chạy, không có hex cứng trong `tileArt.ts`/`tileColors.ts` (có test).

### Chưa làm và cần người dùng duyệt

- Cây, dương xỉ, đá, nấm, sậy và lối gỗ vẫn là art cũ (T5/T8); chỉ đổi vị trí theo mặt đất mới.
- Chưa phát sáng pha lê (T6); mảnh pha lê hiện tĩnh.
- Số chỗ đặt công trình vùng 1 còn 13 (ngưỡng 10); cần duyệt có nới gợn hay không.
- Chưa xem bằng mắt: ban đêm vùng 0, 390×844 ở các vùng khác, 844×390, và FPS trên máy thật.

## 9. T5: thực vật và vật trang trí

### Khảo sát (trước T5)

- Trang trí cũ: `game/rendering/decorLayer.ts` vẽ cây tán đa giác (vùng 1 và 3 thông xanh phẳng), dương xỉ và đá nhỏ
  vào canvas 512 × 520 cho mỗi chunk. Vị trí theo `groundAt` tại x của vật và SECTION cũ. Bộ nhớ đo được 31,74 MB (32 chunk).
- Dương xỉ: `night-art.ts` chỉ có `paintFerns` (10 cụm, cắt clip 10 lần mỗi đoạn). Tài liệu T0 nhắc `paintNightSky`
  và `paintStars` nhưng file không có hai hàm này.
- Sậy, sen, cọc và nhãn: sậy và sen cũ nằm trong scatter; `WorldRenderer` vẽ thêm vài ellipse xanh làm sen (đã bỏ).
- Nút tài nguyên: `CampRenderer` đặt gỗ/đá tại `groundAt(n.x)`, origin đáy.
- `camp-art.ts` giữ nguyên (T7/T8).

### Thiết kế

- Thuần (`src/domain/vegetation/`): `art.ts` (bộ đệm RGBA), `tones.ts` (tông theo tên vai trò), `trees.ts`
  (6 biến thể lá rộng, 6 biến thể thông, thân và tán), `placement.ts` (đặt cây theo bước cố định và hash),
  `groundArt.ts` (cỏ, hoa, nấm, đá), `plantArt.ts` (dương xỉ, sậy, lá sen, rễ), `decorChunks.ts` (chunk 512 đơn vị,
  vẽ một lần ở pixel nghệ thuật), `world.ts` (giao diện dữ liệu thế giới).
- Dữ liệu thế giới: `src/data/vegetationWorld.ts` (mặt nước theo cột, khoảng cấm, nút tài nguyên).
- Cây là sprite riêng (thân và tán tách hai texture), không nằm trong chunk nên không có đường nối giữa chunk.
  Tán đung đưa quanh chân tán (±0,02 rad, chu kỳ theo clock) ở chế độ Đẹp; Tiết kiệm tĩnh; thân không đung đưa.
  Đung đưa chỉ chạy trong `CampRenderer.draw`, tức khi đang chơi.
- Cây: 43 cây trong thế giới (lá rộng 22, thông 21 trước khi đổi); mỗi vùng 8–10 (vùng 1 và 3 thông).
  Đặt theo bước 200–320 đơn vị, thử thêm 30/60 đơn vị; loại cây theo vùng: vùng 1 và 3 thông.
- Chunk trang trí: 32 chunk, khung cao theo mặt đất và mặt nước của chunk. Vật không đặt trong 12 pixel đầu/cuối
  chunk để không bị cắt.

### Kết quả đo

- Bộ nhớ texture trang trí: 31,74 MB → 1,60 MB (32 chunk). Texture cây: 0,23 MB (33 texture). Tổng trang trí + cây
  khoảng 1,83 MB.
- Số đối tượng Image/Sprite trong scene: 131 → 217 (thêm 86 hình ảnh cây: thân và tán cho 43 cây).
- Đầu tiên, test: 105/105 (trước T5: 90/90).

## 10. T6: ánh sáng theo ô (đã làm; phương án D)

### Khảo sát (Bước 1)

- Depth hiện tại (`game/rendering`): trời `SkyLayers` -10 (sao -9,5; mặt trời/trăng -9); `ParallaxRenderer` mây -8, núi xa
  -7, núi giữa -6, rừng xa -5, rừng gần -4; chunk địa hình 8, chunk nước 8,5; trang trí (`decorLayer`) 9; khung cảnh
  thác/lối gỗ/cổng (`WorldRenderer`) 10; tài nguyên 12; nhãn Text hồ và vùng 12; công trình (`CampRenderer`) 16;
  bóng nhân vật 19; nhân vật (`CamperView`) 20; `DayNightRenderer.veil` 21; xem trước công trình 22; đèn `lights` 23;
  hiệu ứng câu cá 24; nhãn câu cá 25. HUD là DOM.
- `veil` (`DayNightRenderer`) là một hình chữ nhật phủ toàn khung nhìn ở depth 21, alpha = nightAmount × 0,55 (hoàng hôn
  × 0,24). Nó phủ CẢ nền trời/núi/rừng, nhân vật và công trình. Chỉ `DayNightRenderer` dùng `veil`. Tông nền đêm T4 được
  làm sáng để đọc dưới `veil`.
- Nguồn sáng hiện có: bếp lửa, bếp nấu, đèn lồng (đốm sáng bán kính 65 đơn vị, tâm `groundAt − 22`, đèn lồng −43), lều
  (tam giác, bán kính 27, chỉ đêm). Hiệu ứng lửa (`CampRenderer.draw`) vẽ ở depth 24. Lưới ô có pha lê (`crystal`,
  39 ô trên lưới hiện tại); nấm KHÔNG là loại ô (chỉ là trang trí), nên không phải nguồn trong lưới.
- Thời gian: `DAY_SECONDS` = 480 giây game = 24 giờ; `periodAt`, `nightAmount` trong `domain/dayTime.ts`; `state.time`
  tăng trong `CampSimulation.step` (đồng bộ với bước mô phỏng 1/60 s). Trọng số T4 (`domain/backdrop/periods.ts`) nối
  mượt bằng smoothstep (4,5 → 6 → 8 và 15,5 → 18 → 20,5).
- Lưới ô: `TileGrid` 500 × 29 ô, 32 đơn vị; loại ô `air/dirt/stone/sand/copper/iron/crystal`, tường nền
  `none/wallDirt/wallStone`, cờ nước. Địa hình không đổi lúc chơi (Mức A), nên trường trời tính một lần.

### Thiết kế đã làm (Bước 2: thuần, không import Phaser)

- `src/domain/lighting/lightConfig.ts`: hệ số theo ô đích `ATTEN_SOLID` 0,76, `ATTEN_WATER` 0,80, `ATTEN_WALL` 0,82,
  `ATTEN_OPEN` 0,87; `SKY_SURFACE` 0,97; `AMBIENT` 0,08; `BLOOM_BY_PERIOD` [0,2; 0,55; 1]; nguồn `SOURCE_SPECS`:
  fire (cường độ 1,1, tầm 6 ô), stove (0,85; 5), lantern (0,95; 5), tent (0,6; 3, chỉ đêm), crystal (0,7; 4).
- `sky.ts`: trường trời vô hướng toàn lưới, lan truyền theo luật mockup và hội tụ bằng quét xuôi/ngược.
- `sources.ts`: nguồn từ công trình (`buildingSources`), nguồn pha lê cố định (`crystalSources`), trường cục bộ của một
  nguồn trên hình vuông (2·tầm + 1) ô với hàm giảm mượt theo khoảng cách (`falloffAt`).
- `compose.ts`: `composeLight` tổng hợp RGBA theo vùng ô: màu = max(trời × màuTrời(giờ), max_nguồn(trường × màuNguồn))
  theo từng kênh, kẹp trong [AMBIENT, 1]; `skyTint` và `bloomStrength` lấy từ trọng số giờ của T4.
- Màu mới trong `src/data/palette/lighting.ts` (gộp vào `palette`): `lightSkyDay` #ffffff, `lightSkyDusk` #ffcca3,
  `lightSkyNight` #4d66a8, `lightSourceFire` #ff9e40, `lightSourceStove` #ffb359, `lightSourceLantern` #ffc761,
  `lightSourceTent` #ffb352, `lightSourceCrystal` #40e6d9 (lấy từ mockup).
- Test: `src/domain/lighting/lighting.test.ts` (13 test): hệ số, trời ở không khí và suy giảm xuống sâu, đá kín tối hơn
  không khí, nguồn đơn giảm theo khoảng cách và bị đá chặn, tầm và mép cửa sổ bằng 0, hai nguồn lấy max theo kênh, màu
  trời đổi không làm đổi ô có nguồn, sàn ambient, xác định, nguồn công trình (lều chỉ đêm, vị trí theo mặt đất),
  pha lê, trọng số màu và quầng theo giờ.

### Đo lúc Bước 2 (Node; số đo cuối nằm ở Bước 3)

- Trường trời toàn thế giới: 15,2 ms một lần lúc khởi tạo, 56,6 KB.
- 49 trường nguồn (10 công trình + 39 pha lê): 3,7 ms khi dựng lại toàn bộ, 17,1 KB; dựng lại một nguồn ≈ 0,23 ms.
- `composeLight` (mỗi lần cập nhật, cửa sổ kèm đệm): 1920 × 1080 (34 × 21 = 714 ô) ≈ 0,12 ms với 49 trường (trường hợp
  xấu nhất), ≈ 0,035 ms với 10 trường; 390 × 844 (16 × 14 = 224 ô) ≈ 0,06 ms và 0,012 ms. Ban ngày cùng mức.
  Đạt mục tiêu dưới 1 ms CPU mỗi lần cập nhật, chưa đo trong trình duyệt.

### Bước 3: hiển thị (đã làm, phương án D)

- Tách camera (`game/rendering/cameraLayers.ts`): `cameras.main` là NỀN (trời, mây, núi, rừng, depth âm, có màu nền);
  camera THẾ GIỚI (trong suốt, depth 0 đến 20: địa hình, nước, trang trí, cây, công trình, nhân vật, tài nguyên) được chiếu
  sáng; camera HIỆU ỨNG (depth từ 21: lửa và bếp và đèn lồng ở depth 22, quầng, xem trước, nhãn, hiệu ứng câu cá) không
  bị chiếu sáng. `cameraFilter` gán theo depth (`domain/lighting/layers.ts`), cập nhật khi số đối tượng đổi.
- Chiếu sáng (`game/rendering/LightPipeline.ts`, PostFX trên camera thế giới): shader nhân RGB với texture ánh sáng
  (một texel = một ô, lọc tuyến tính, uv suy ra từ khung nhìn và vùng đã tổng hợp), GIỮ alpha. Vùng trong suốt của camera
  thế giới không bị đen. Khi không có WebGL (Canvas) không gắn pipeline: thế giới vẽ không chiếu sáng, không lỗi.
- Tổng hợp (`game/rendering/WorldLighting.ts`, thuần ở `domain/lighting/lightField.ts`): 10 lần/giây (Đẹp) hoặc 5 lần/giây
  (Tiết kiệm), khi dừng không chạy. Vùng tổng hợp = khung nhìn + đệm 2 ô; texture tạo lại khi kích thước đổi.
- Quầng (`game/rendering/LightBloom.ts`): pool 24 sprite (Tiết kiệm 8), texture tròn tạo một lần, cộng (ADD) trên camera
  hiệu ứng, cường độ theo trọng số giờ; lửa nhấp nháy ±4% (chỉ Đẹp, theo clock nên dừng khi pause).
- Thay `veil` và đốm sáng cũ của `DayNightRenderer` (đã xóa). Tông nền đêm T4 chỉnh về mockup (9 khóa: mây, núi, rừng).
- Nguồn nhúng: bếp lửa, bếp nấu, đèn lồng (công trình); lều chỉ đêm; pha lê (ô `crystal`, 39 ô trên lưới hiện tại;
  T2 ghi 44, chưa rõ chênh lệch, có thể do T3 đổi mặt đất: chưa kiểm lại được số cũ).
- Chỉnh theo ảnh thật: tầm lửa 6 ô giữ; ambient 0,08; bán kính quầng theo tầm nguồn × 16 đơn vị.
- Sửa lỗi phát hiện khi xem ảnh: trường nguồn lan theo 4 ô nên hình thoi và mép cửa sổ lộ ra (đã sửa: lan 8 ô, hàm giảm về 0
  đúng tại tầm).

### Đo (máy phát triển, tải hệ thống khoảng 15; Chrome SwiftShader)

- `composeLight` (thuần, Node): 1920×1080 (714 ô) ≈0,12 ms; 390×844 (224 ô) ≈0,06 ms; ban ngày cùng mức.
- Trình duyệt, Đẹp, cảnh trại đêm (cửa sổ 35×22 ô, 49 trường): tổng hợp kèm tải texture ≈0,2–0,4 ms; `update` của
  ánh sáng trung bình 0,05–0,11 ms, p95 0,2–0,4 ms; quầng 0,004–0,02 ms. Đạt mục tiêu dưới 1 ms CPU mỗi lần cập nhật.
- Bộ nhớ: texture ánh sáng 3 KB; trường trời 56,6 KB; trường nguồn 17,1 KB; pool quầng 24 sprite.
- FPS: KHÔNG đáng tin trên SwiftShader (rAF khoảng 4–10 fps cả khi bật và tắt ánh sáng). Chi phí GPU của lượt
  hậu xử lý và hai camera thêm chưa đo được trên GPU thật. Lưu ý: "tắt ánh sáng" chỉ gỡ pipeline, tổng hợp vẫn chạy.

### Kiểm chứng bằng ảnh (bản sao cách ly, cổng 8100, nhân vật đứng trên mặt đất: `blocked.down` đúng, y = mặt đất)

Ảnh trong scratchpad `shots/`: `1-day-1920.png` (ban ngày, lòng đất tối dần), `2-dusk-camp-1920.png` (hoàng hôn,
lửa + bếp + lều), `3-night-camp-1920.png` (đêm sâu, lửa + bếp + đèn lồng + lều), `3b-night-camp-1920-OFF.png` (cùng
cảnh, tắt ánh sáng), `4-night-nosource-1920.png` (đêm không nguồn sáng), `5-dawn-camp-1920.png` (bình minh),
`6-night-camp-phone-390x844.png` (điện thoại dọc đêm), `7-night-camp-saving-1920.png` (Tiết kiệm đêm),
`8-night-vale-x3900-1920.png` (rừng thông, lửa + đèn), `9-night-lake-x3560-1920.png` (cạnh hồ, bếp nấu),
`12-canvas-fallback-night-1920.png` (không WebGL).

- So sánh pixel bật/tắt (cảnh 3 và 3b): núi xa bên phải (1500..1900, 380..460): trung bình 0,00, lớn nhất 0 (không nhân);
  núi bên trái (230..700, 350..460): lớn nhất 3; vùng trời (400..1400, 100..330): trung bình 0,08, lớn nhất 56 (do mây
  và sao chuyển động giữa hai lần chụp). Nhân vật: trung bình 48; đất sâu (0..340, 880..1000): trung bình 46. Nền không bị
  chiếu, vật thể và đất bị chiếu.
- Đã xem bằng mắt: toàn bộ ảnh liệt kê ở trên (kể cả 12). Chưa xem: ban ngày ở vùng khác và cạnh hồ ban ngày.
- So với mockup: khớp về màu trời đêm, sàn ánh sáng, lửa và quầng, đất tối dần theo độ sâu. Khác: nhân vật đêm xa lửa hơi tối
  (chỉ nhận ánh sáng xanh của sàn); không có đom đóm, sương hay cá nhảy (ngoài phạm vi T6). Pha lê: là nguồn sáng trong
  lưới, nhưng không có pha lê trong khung chụp nên chưa kiểm bằng ảnh.

### Kiểm tra đã chạy (cuối T6)

- `npm run check`: 122/122 test (105 cũ + 17 mới trong `lighting.test.ts`), format đạt, lint 0 lỗi và 41 cảnh báo như
  baseline (không có cảnh báo từ file mới), typecheck đạt.
- `npx tsc --noEmit`: đạt. `npm run build`: đạt trong bản sao cách ly.
- `npx playwright test`: 30/30 đạt trong bản sao cách ly (cổng 8100/8101), sau thay đổi cuối.
- Canvas (WebGL tắt): không lỗi trang, 3 camera, không pipeline; thấy được vài lỗi hiển thị có sẵn cần kiểm chứng riêng
  (vạch nối chunk nước và nhãn to hơn trong Canvas), chưa so với bản trước T6.

### Quyết định cần người dùng duyệt

- Tông nền đêm T4 đã chỉnh về mockup (9 khóa). Xem `3-night-camp-1920.png`: đọc được núi và rừng.
- Ambient 0,08, tầm lửa 6 ô, quầng 0,5 nhân cường độ, nhấp nháy ±4%.
- Nhân vật ban đêm xa lửa khá tối (`4-night-nosource-1920.png`): có thể cần sáng xanh nhẹ cho nhân vật.
- Bếp nấu xem là nguồn tự phát sáng (không bị chiếu): có thể cần đổi nếu muốn bếp đậm bóng hơn.

### Nợ kỹ thuật mới

- Số pha lê 39 khác T2 (44), chưa đối chiếu được.
- Chưa đo FPS trên GPU thật; SwiftShader không đáng tin.
- Vạch nối chunk nước và nhãn to trong Canvas: có sẵn, chưa xác nhận.

## 11. T7a: nhân vật 20×36, giai đoạn 1 (chờ người dùng duyệt)

### Khảo sát (Bước 1)

- Định dạng sprite: lưới ký tự, bảng `colors` (ký tự → tên vai trò), màu vai trò lấy từ `slotColors` rồi `palette`
  (`domain/sprite.ts`). Parser đã nhận kích thước bất kỳ, nên KHÔNG đổi parser.
- Nhân vật cũ (`data/sprites/camper.ts`): 24×32, 33 frame, 11 animation (idle, run, jump, fall, land, cast, fish-wait,
  bite, reel, gather, build). Pose do `PoseMachine`, theo game clock qua `ClockSprite`.
- Trang bị: `camperSlotColors(state)` lấy màu món đang mặc theo vai trò hat, shirt, pants, bag. Bộ trang bị từ `gear`:
  2 mũ × 2 áo × 2 quần × 2 balo (mỗi món có `color`). Dữ liệu `gear` không đổi.
- Đặt trong cảnh: `CamperView`, origin (0.5, 1), scale `ART_PIXEL` = 2, chân tại `groundAt(x) - 1`, hộp va chạm 12×22
  đơn vị nghệ thuật có đáy tại hàng 32 của khung 24×32.
- Gallery (`?gallery`, chỉ DEV): 6 ô (3 trạng thái × 2 bộ), đổi bộ, tốc độ, đảo hướng, tạm dừng, mật độ.

### Thiết kế

- Khung 20×36 nghệ thuật, origin giữa-đáy, bàn chân ở hàng 35. Vẽ một hướng (nhìn phải).
- Thân trên (hàng 0–22) vẽ tay theo lối đếm lặp (`"7.1Z3A"` = 7 ô trong suốt, 1 Z, 3 A), kiểm độ rộng 20 khi nạp.
  Chân, giày, tay và balo do rig (`camper20Rig.ts`) ghép theo tư thế.
- Run (8 frame): pha bước theo đường tròn. Chân sau và chân trước lệch π; biên độ bước 3 ô, nhấc 2 ô; tay vung ngược
  chân, biên độ 3 ô; thân nhấp nhô ±1 ô hai lần mỗi bước; balo trễ một nhịp. Chu kỳ tuần hoàn và kiểm bằng test.
- Idle (4 frame): đứng, thở (đầu nhô 1 ô), chớp mắt, liếc mắt. Jump (2 frame): lên (tay giơ, chân co) và rơi/chuẩn bị đáp.
- Tông trang bị (`domain/tone.ts`): OKLab. Tông nền giữ đúng màu `gear`; hi = L+0,10; shade = L−0,10; deep = L−0,20
  (chroma ×0,96, ×1,02, ×1,05). Test: thứ tự độ sáng đúng cho mọi món.
- Vai trò tông trang bị (16, suy tự động): hat0–3, shirt0–3, pants0–3, bag0–3.
- Màu cố định MỚI (`data/palette/camper.ts`, 17 màu): camperSkinHi, camperSkin, camperSkinShade, camperSkinDeep,
  camperBlush, camperHairHi, camperHair, camperHairShade, camperHairDeep, camperEye, camperGlint, camperMouth,
  camperLeather, camperBootHi, camperBoot, camperBootShade, camperBootSole. Khóa khuy và dây dùng `gold` có sẵn.

### File

- Tạo: `src/domain/tone.ts`, `src/domain/tone.test.ts`, `src/data/palette/camper.ts`, `src/data/sprites/camper20Art.ts`,
  `src/data/sprites/camper20Rig.ts`, `src/data/sprites/camper20Poses.ts`, `src/data/sprites/camper20.ts`,
  `src/data/sprites/camper20.test.ts`, `src/game/rendering/Camper20Gallery.ts`, `src/game/rendering/camperVariant.ts`,
  `src/game/rendering/camper20Dev.ts`.
- Sửa: `src/data/palette.ts` (gộp palette nhân vật), `src/game/rendering/SpriteGalleryScene.ts` (chế độ
  `camper20`, phóng to), `src/ui/gallery.ts` (tùy chọn chế độ và phóng to), `src/game/rendering/CamperView.ts` (đổi
  sprite theo biến thể dev; hộp va chạm căn theo kích thước khung, với sprite cũ giá trị vẫn là (6, 10)),
  `src/main.ts` (nhập động cờ `?newcamper` chỉ khi DEV).
- Xóa: không có.

### Cờ dev và gallery

- Gallery: chọn "Nhân vật mới 20 × 36" trong danh sách hiển thị. Ba cột: bản cũ ban ngày, bản mới ban ngày, bản mới
  ban đêm có lửa giả lập. Hàng là trạng thái (idle, run, jump), hoặc một hàng nếu chọn trạng thái. Phóng to 1×, 3×, 6×.
- Cờ `?newcamper` (chỉ DEV, module chỉ nạp động khi có cờ): đổi sprite nhân vật trong cảnh thật, giữ hộp va chạm, HUD
  và chân dung. Trạng thái khác idle/run/jump rơi về trạng thái gần nhất. Vị trí tay cầm cần câu vẫn lấy bảng cũ
  (chỉ ảnh hưởng chế độ dev).
- Kiểm production: `dist/` của bản build không chứa "newcamper", "camper-20x36", "Nhân vật mới", "đêm có lửa",
  "useCamper20", "camperVariant", "toneRamp".

### Kiểm tra đã chạy

- `npm run check` trong repo: đạt, 132/132 test (122 cũ + 10 mới), format đạt, lint 0 lỗi và 41 cảnh báo như nền T6.
- `npx tsc --noEmit` trong repo: đạt. `npm run build` trong bản sao cách ly: đạt.
- `npx playwright test` trong bản sao cách ly (cổng 8101/8102, không đụng 5173): lần 1 28/30 (timeout ở câu cá và đo
  FPS, tải máy khoảng 17); chạy riêng hai file đó: 14/14 đạt; lần 2 toàn bộ 29/30 (câu cá timeout); chạy riêng câu cá
  hai lần: một đạt, một lỗi. Lỗi là timing dưới tải, đường đi mặc định không đổi hành vi; chưa tách được bằng A/B.

### Quyết định cần người dùng duyệt

- Tỉ lệ đầu và thân (đầu ~13 hàng/36), hình mũ rộng vành có dải, màu da và tóc, mức chi tiết (nẹp áo, khóa, quai balo).
- Độ nổi bật của trang bị: hai bộ đã nhận ra được trên cơ thể (mũ, áo, quần, balo).
- Ban đêm: thân và quần của nhân vật bị đổi tông tím gần lửa (xem ảnh đêm), có thể cần sáng xanh nhẹ.
- Nợ kỹ thuật: tay cầm cần câu trong `?newcamper` còn dùng bảng cũ; chân dung HUD còn sprite cũ; chưa vẽ fall, land,
  cast, fish-wait, bite, reel, gather, build (giai đoạn sau, theo điểm dừng).

## 12. R1: bộ xương có khớp (phương án A), giai đoạn duyệt

### Khảo sát (Bước 1)

- `PoseMachine`: 11 trạng thái (idle, run, jump, fall, land, cast, fish-wait, bite, reel, gather, build), thời gian theo
  game clock; số frame hiện có của `camper20`: 4, 8, 2, 2, 2, 4, 3, 3, 4, 3, 3 (tổng 38), khớp `RIG_FRAME_COUNTS`.
- Trang bị: `gear` có 2 mũ, 2 áo, 2 quần, 2 balo, mỗi món có `color`; tông suy qua `domain/tone.ts` (OKLab).

### Thiết kế

- Khung 36 × 48 pixel nghệ thuật, tâm cột 17, hàng mặt đất 45 (hàng chứa đáy giày thấp nhất khi đứng). Chiều cao
  nhân vật khoảng 42 hàng (đỉnh mũ ở hàng 4 khi đứng).
- Mô-đun thuần `src/domain/camperRig/`: `types.ts` (hằng số, tham số tư thế), `raster.ts` (viên nang, ellipse,
  đường, làm tối mép bằng hệ số 0,66/0,7, không thêm viền), `skeleton.ts` (động học thuận, làm tròn khớp tới nửa pixel),
  `parts.ts` (vẽ theo thứ tự xa → gần), `poses.ts` (thư viện tham số), `geometry.ts` (đặt chân bằng cách đo pixel,
  tính neo), `build.ts` (palette trang bị, cache, băm FNV-1a).
- Đặt chân: dựng thử, đo hàng giày thấp nhất rồi dịch hông đúng một lần; pose trên không dùng `lift` nguyên px.
- Neo: `hand` (tâm bàn tay gần), `rodTip` (đầu cần, null khi không cầm), `head` (tâm đầu), `headTop` (hàng trên cùng
  của mũ), `feet` ([cổ chân gần, cổ chân xa]), `ground` (hàng 45).
- Màu: `src/data/palette/camperRig.ts` chỉ ánh xạ vai trò sang màu có tên sẵn, KHÔNG thêm hex mới.
- Gallery dev: chế độ "Bộ xương (A) · R1" trong `?gallery` (`src/ui/CamperRigGallery.ts`), chỉ nạp khi DEV.

### Kiểm tra đã chạy

- `npm run check` (repo): 155/155 test đạt, format và lint không lỗi; 41 cảnh báo, đều của nền cũ.
- `npx tsc --noEmit`: đạt. `npm run build` trong bản sao cách ly: đạt; chuỗi gallery không có trong `dist/`.
- e2e trong bản sao cách ly (cổng 8101/8102): lần 1 30/30, lần 2 30/30, lần 3 29/30 (timeout câu cá ở
  `camping.spec.ts:21`); chạy riêng test câu cá 3 lần: 3/3 đạt.
- Hiệu năng dựng toàn bộ 38 frame của một bộ trang bị trong Node: khoảng 7 ms khi dựng lạnh.
- Test rig: 11 test (kích thước, lề 1 px cho 16 bộ × mọi pose, chạm đất, chu kỳ chạy, neo, băm).

### Quyết định cần người dùng duyệt

- Sải chân chạy: bàn chân nhảy tới 11 px giữa hai frame kề (ngưỡng test 12 px); chọn góc đùi ±40° giữ cảm giác sải dài.
- Tỉ lệ đầu và thân, kích thước khung 36 × 48, hàng mặt đất 45.
- Pose nhặt đồ (gather) đã giảm độ cúi xuống 22°–28°; cần xem lại.

### Nợ kỹ thuật

- Đầu là hình procedural, chưa có mặt vẽ tay (R2). Mái tóc và mắt đã đặt để mắt không bị mũ che.
- Chưa nối vào game: `CamperView`, `camper20*.ts` và hộp va chạm giữ nguyên (R3).
- Hằng băm `0xce0e1f04` trong `camperRig.test.ts` phải cập nhật khi art đổi ở R2.

## 13. R2: đầu vẽ tay, hai hình dáng trang bị, khung chạy và nhặt đồ (chưa nối game)

### Khảo sát (Bước 1)

- Đầu R1 là hình procedural (ellipse tóc, mặt, mũ vành), neo `head` tính từ khớp, `headTop` lấy hàng trên cùng của pixel mũ.
- Mỗi pose đặt đầu bằng `head` lệch trong `PoseParams`; mặt chỉ có `open`, `blink`, `glance`.
- Trang bị R1 chỉ đổi màu: áo, quần, balo là capsule có tông từ `gear`; mũ là ellipse và dải.
- Khung gượng: chạy khung 2 và 6 (cẳng chân sau thẳng, đá ngang ~50°); nhặt (`gather`) tay chỉ xuống khoảng 16 px trên mặt đất; kéo cá (`reel`) cần 8 px sát thân.

### Thiết kế

- Mô-đun mới: `src/data/camperHead.ts` (lưới đầu 14 × 14 vẽ tay, sáu biến thể mặt và hai lưới mũ, khóa ký tự `KEY_ROLE`),
  `src/domain/camperRig/head.ts` (đóng dấu lưới, neo ô `(7, 7)` trùng tâm đầu), `outfit.ts` (hình dáng áo, quần, balo),
  `poseBase.ts` (tư thế nền, tránh vòng import), `poseTasks.ts` (cast, fish-wait, bite, reel, gather, build).
- Biến thể mặt: `open`, `blink` (mắt nhắm), `glance` (đồng tử lệch), `strain` (mày nhíu, miệng mím), `bow` (cúi), `air` (miệng hé).
  Pose: idle dùng open/blink/glance; jump, fall dùng air; land, reel, bite dùng strain; gather dùng bow.
- Mũ: `hat-ranger` (chóp tròn, dải tối, vành rộng đổ bóng xuống trán); `hat-knit` (ôm đầu, gân len, bông ở đỉnh).
- Hình dáng: linen (cổ mở, cổ tay áo sáng), pine (cổ đứng, khóa kéo, túi ngực, bo gấu tối); trail (miếng đệm gối,
  túi đùi, dây ở gấu); denim (đường chỉ, gấu xắn sáng); canvas (hộp chữ nhật, nắp, khóa); moss (bầu tròn, cuộn túi ngủ, dây rút).
- Bàn tay: bán kính 1,6, ngón cái, khe ngón. Cánh tay: `armR` 1,25 → 1,45. Chiều dài và tỉ lệ R1 giữ nguyên.
- Khung chạy: biên độ đùi 40° giữ nguyên R1; gối gập theo pha (`f = 5 + 22 × r`), cẳng nằm trong [-56°, +24°], nhỏ hơn giới hạn 65°.
- Nhặt đồ: gối gập sâu (đùi 58–62°, gối 108–112°), thân nghiêng 36–40°, tay xuống gần mặt đất (cách ~8 px).
- Cần câu dài 11 px (kéo cá 9 px), góc chỉnh để đầu cần nằm trong khung với biên ≥1 px.
- Màu: thêm `glint` và `pom` (cùng `camperGlint`); không thêm hex mới.
- Gallery dev: chọn từng slot (16 tổ hợp), đầu 12× (6 mặt × 2 mũ), so sánh hai bộ mặc định, neo, lưới ô 16, đêm có lửa.
  Nhãn chế độ đổi thành "Bộ xương (A) · R2".

### Kiểm tra

- `npm run check`: 165/165 test đạt (155 cũ + 10 mới), 0 lỗi, 41 cảnh báo cũ. `npx tsc --noEmit`: đạt.
- `npm run build` trong bản sao cách ly: đạt; chuỗi "Bộ xương" và "rig-review" không có trong `dist/`.
- e2e trong bản sao cách ly (cổng 8101/8102): 30/30 đạt ở lần chạy cuối (code cuối); lần chạy trước đó trên art trung gian cũng 30/30, không có timeout nên không chạy lại riêng..
- Băm kỳ vọng `0x6384e079` (`camperRig.test.ts`) cập nhật theo art R2.
- Dựng đầy đủ một bộ trang bị (38 frame, lạnh): dưới 50 ms (test kiểm tra).

### Quyết định cần người dùng duyệt

- Đầu R2 nhỏ (14 × 14 gồm tóc, lưới đầu thực tế ~11 × 11 px) để giữ tỉ lệ R1; lưới 12 × 13 trong kế hoạch là gần đúng.
- Gather: tay còn cách mặt đất khoảng 8 px (không chạm đất); sải chân và tỉ lệ R1 giữ nguyên.
- Mũ len: bông còn nhỏ và hơi nhạt ở 1×.

### Nợ kỹ thuật

- Chưa nối vào game: `CamperView`, `camper20*.ts`, hộp va chạm vẫn là nhân vật cũ (R3).
- Cặp đầu biến thể `bow` dùng cùng lưới mũ; cúi chưa có mũ riêng.
- Chưa so sánh pixel với mockup A bằng số liệu; so bằng mắt (ảnh chạy ở mục kiểm tra).

## 14. R3: nối bộ xương vào game, xóa nhân vật cũ

### Luồng và file

- Trang bị của save → `domain/camperRig/wear.ts` (`outfitOf`; món mua thêm mượn hình dáng gốc cùng slot, giữ màu món;
  `starterOutfits` liệt kê 16 tổ hợp gốc) → `build.ts` (cache theo `outfitKey`) → `game/rendering/CamperSheet.ts`
  (một canvas texture 38 frame, animation đăng ký theo `domain/camperRig/sheet.ts` `SHEET_ANIMATIONS`) → `CamperView`
  (sprite, `ClockSprite` theo đồng hồ game, `PoseMachine` không đổi) → hiển thị.
- Tạo mới: `camperRig/sheet.ts`, `wear.ts`, `body.ts`, `figure.ts` (+ test), `game/rendering/CamperSheet.ts`, `frameImage.ts`.
- Sửa: `CamperView.ts`, `ClockSprite.ts` (nhận bảng animation, không cần `SpriteDefinition`), `CampRenderer.ts`, `SpriteGalleryScene.ts`,
  `ui/gallery.ts`, `ui/CamperRigGallery.ts`, `ui/CamperRigPaint.ts`, `docs/ARCHITECTURE.md`, các test e2e gallery/graphics.
- Xóa: `data/sprites/camper20*.ts` (gồm test), `game/rendering/Camper20Gallery.ts`, `domain/camperRod.ts` (+ test). Giữ:
  `domain/sprite.ts` và `sprites.test.ts`, dữ liệu công trình/tài nguyên, `camp-art.ts`, palette `camperPalette` (dùng cho `camperRig`).

### Origin, lật hướng, hộp va chạm

- Khung 36 × 48; origin `(0.5; 46/48)`: đáy khung của hàng mặt đất đặt đúng `groundAt(x) − 1` như nhân vật cũ.
- Lật: `flipX` của sprite; neo đổi bằng `mirrorColumn(c) = 35 − c` (trục thân). Test kiểm khớp với lật của Phaser.
- Hộp va chạm `body.ts`: 12 × 37 pixel = 24 × 74 đơn vị, đáy đúng hàng chân, căn giữa khung. Logic đi/nhảy, bước leo 32 đơn vị
  không đổi (bước leo dựa trên đất, không dựa trên chiều cao hộp). Đã kiểm đi bộ toàn bản đồ hai chiều: đích, không kẹt, không lún.
- Camera giữ công thức cũ (`FEET_BELOW_CENTER` = 65). Đỉnh mũ không bị cắt khi nhảy: đo ở apex, cách mép trên ≥178 px ở
  844×390, ≥496 px ở 1920×1080, 388 px ở 390×844.

### Neo cần, dây, nhãn, khối HUD

- Cần: vẽ sẵn trong frame cast/fish-wait/bite/reel; dây bắt đầu từ `rodTip` của frame hiện tại (đã lật). Phao đặt về phía
  hướng nhìn (`flipX ? −55 : 55`), tránh dây cắt ngang thân khi quay trái.
- Nhãn câu cá đặt cách đỉnh mũ frame hiện tại `LABEL_GAP` = 14 đơn vị (`fishLabelBottom`). Khối HUD câu cá là `figureBox`:
  khối pixel thật của nhân vật và cần, nên lớp mờ nhãn khớp hình.
- Bụi chạy/đáp đặt tại cổ chân thấp hơn (`ankle`). Thanh lực vẫn dưới chân.

### Chân dung HUD, kho đồ, gallery

- Chân dung: `frameDataUrl` cắt 16 × 16 pixel quanh đầu-vai từ frame idle (`PORTRAIT_CROP` x 9, y 3), phóng ×3 (48 × 48),
  CSS `img` 48 px (36 px ở màn hình hẹp), `image-rendering: pixelated`.
- Kho đồ: toàn thân idle phóng ×8. Chân dung và hình kho đồ được mã hóa PNG một lần rồi giữ theo khóa bộ (`lookOf`);
  mã hóa PNG là phần chậm nhất, nên bộ gốc được nạp sẵn.
- Gallery DEV: trang mặc định là bộ xương (`CamperRigGallery`); chế độ công trình là `SpriteGalleryScene`. Bản production không chứa
  chuỗi gallery (đã kiểm `dist/`).

### Món mua thêm

Các món `*-adventure` và `*-summit` không có hình dáng riêng trong rig. Hiện tại mượn hình dáng gốc cùng slot (đỉnh núi
dùng hình thứ hai, còn lại dùng hình thứ nhất), giữ màu của chính món. Cần người dùng duyệt: hình dáng riêng hay cách mượn này.

### Nhịp animation

Giữ nhịp của nhân vật cũ theo code: run 9 khung/giây (prompt ghi 12, không khớp code cũ; chấp nhận 9), idle 1,5, jump 6,
fall 6, land 12, cast 12, fish-wait 3, bite 12, reel 9, gather 9, build 8. Nhịp theo đồng hồ game, đóng băng khi tạm dừng.

### Kiểm tra đã chạy

- `npm run check` (repo): đạt; số test ghi theo lần chạy cuối.
- `npx tsc --noEmit`: đạt. `npm run build` trong bản sao cách ly: đạt.
- `npx playwright test` trong bản sao cách ly (cổng 8101/8102): đạt (ghi theo lần chạy cuối).
- Ảnh đã xem (đường dẫn trong scratchpad): đứng, chạy phải/trái, cast/fight/bite, đêm có lửa đứng và chạy, bờ hồ/lối gỗ,
  nhìn trái khi câu, chân dung 1920 và 390, kho đồ 1920 và 390, nhảy 390/844×390/1920.

### Tồn đọng

- Equip bộ mới chưa từng có trong cache (món mua thêm) lần đầu tốn ~365 ms trong Chrome SwiftShader (phần lớn là mã hóa PNG
  chân dung); các lần sau ~6 ms; bộ gốc đã nạp sẵn nên ~0 ms. Trên máy thật có thể nhanh hơn; cần đo lại.
- Chân lơ lửng 32 đơn vị trong vài chục đơn vị đường khi bước lên bậc 1 ô: đây là cơ chế bước leo cũ (dịch lên trước 18 đơn vị), không đổi.
- Nhãn vùng "Ao Sen · Câu cá [E]" đứng đè lên nhân vật khi không câu (không bị mờ vì không có HUD câu cá): bố cục cũ, chưa đổi.
- Ban đêm, thân và quần nhân vật bị đổi sắc tím do ánh sáng T6 (đã ghi ở T7a), chưa chỉnh.
- Chưa kiểm: đo FPS và bộ nhớ texture; chân qua bậc 1 ô và lối gỗ đã xem bằng ảnh tĩnh, chưa đo số.
- Chưa duyệt: hình dáng món mua thêm, vị trí nhãn/thanh lực, kích thước chân dung.

## 15. T8a: vẽ lại 9 công trình, tách thân và lớp phát sáng (chờ người dùng duyệt; T8b chưa làm)

### Thiết kế

- Thân và lớp phát sáng là hai sprite cùng khung 55 × 37, cùng gốc đáy. Thân (`buildingSprites`) ở depth 16,
  thuộc lớp thế giới, được chiếu sáng. Lớp phát sáng (`buildingGlows`) ở `EFFECTS_DEPTH` 21, không bị chiếu sáng.
  Công trình có lớp phát sáng: lều (cửa), bếp lửa, bếp nấu, đèn lồng.
- Art sinh bằng code thuần, xác định: `src/domain/pixelGrid.ts` (lưới ký tự, vẽ đường, vùng, hình chữ nhật)
  và `src/data/sprites/structures/*.ts` (mỗi công trình một file, `shared.ts` có bảng ký tự → vai trò màu).
- Màu: `src/data/palette/structures.ts` (52 vai trò `struct*`, không hex trong dữ liệu sprite).
- `structuresAnimated.ts` và `structuresProps.ts` đã xóa. Bốn khóa palette chỉ còn dùng cho công trình cũ (`hairLight`,
  `skinLight`, `legacy130`, `legacy153`) đã xóa; các khóa `legacy013`–`049` và `tentCanvas`/`tentDoor` còn được
  `src/camp-art.ts` dùng nên giữ lại.
- Hoạt hình: lều `flutter` (2 frame, cờ), lửa `burn` (4 frame, lớp sáng), bếp nấu `glow` (3 frame, ô cửa lò),
  đèn lồng `glow` (3 frame, kính), rương `open`/`close` (3 frame, nắp lên 0/3/6 pixel). Lều chỉ có 1 frame cho cửa
  và độ mờ theo `nightAmount(time)`.
- `CampRenderer` tạo hai sprite cho công trình phát sáng (`structureSprites.ts`: `createStructure`, `drawStructure`),
  xem trước có lớp sáng riêng, thẻ công thức ghép thân và sáng (`spriteLayersDataUrl`).
- Nguồn sáng: `BUILDING_LIFT` đổi theo tâm phần sáng mới: lửa 22→30, bếp nấu 22→19, đèn 43→35, lều 22→24 (đơn
  vị thế giới). Tầm, màu và cường độ không đổi.
- Gallery `?gallery` chế độ công trình: phóng 1×/3×/6×, lớp (ghép / chỉ thân / chỉ sáng), nền ngày/đêm.

### Kiểm tra đã chạy

- `npm test`: 178/178. `npm run check` (format, lint, typecheck, test): đạt; 41 cảnh báo lint như nền.
- `npx tsc --noEmit`: đạt. `npm run build` trong bản sao cách ly: đạt; bundle không chứa chuỗi gallery.
- e2e trong bản sao cách ly (cổng 8101/8102): 30/30 đạt, hai lần chạy liên tiếp (lần 2 trên bản build cuối).
- Test mới: `pixelGrid.test.ts` (4), `structures.test.ts` (kích thước, màu trong nhóm `struct`, không chạm mép,
  chân chạm hàng cuối, lớp sáng nhỏ và không chạm đất, đúng 4 công trình có lớp sáng, số frame, băm xác định).

### Điểm còn tồn đọng

- Chưa duyệt bằng mắt của người dùng: tỉ lệ công trình, độ sáng lớp phát sáng, màu đêm.
- Bàn dã ngoại và quầy còn đơn giản; rương mở còn khoảng hở giữa nắp và thân khi mở hết.
- Khói bếp nấu chưa vẽ (tùy chọn trong kế hoạch).
- FPS và bộ nhớ texture trên GPU thật chưa đo; SwiftShader không đáng tin.
- Ban đêm nền gallery chỉ là màu nền, không mô phỏng ánh sáng theo ô.
