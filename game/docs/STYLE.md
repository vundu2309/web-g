# Pixel Forest — phong cách đồ họa

## Tầm nhìn

Một khu rừng pixel có chiều sâu, nơi ánh sáng và những vật dụng nhỏ tạo cảm giác muốn dừng chân.
Từ khóa: ấm áp · rõ khối · thủ công · nhiều lớp · bình yên · nhất quán.
Chuẩn thẩm mỹ là hai mockup đã duyệt trong `docs/style-reference/`.
`terraria-style-mockup.html` định hướng cảnh; `character-rig-mockup.html` định hướng tỉ lệ A.
Đây là hướng hình ảnh, không phải yêu cầu sao chép gameplay Terraria.
Tài liệu này mô tả source T1–T7, R1–R3, T8a; **T8b chưa hiện thực**.
Kế hoạch lịch sử ở `TERRARIA-STYLE-PLAN.md`; source và tài liệu này là chuẩn hiện tại.

## Hằng số pixel

| Đại lượng               | Giá trị / nguồn                                 |
| ----------------------- | ----------------------------------------------- |
| Pixel nghệ thuật        | `ART_PIXEL = 2`, `src/data/palette.ts`          |
| Ô địa hình              | 16×16 pixel nghệ thuật = 32×32 đơn vị           |
| Khung nhân vật          | 36×48 pixel nghệ thuật, `camperRig/types.ts`    |
| Khung công trình        | 55×37 pixel nghệ thuật, `structures/shared.ts`  |
| Hộp va chạm             | 24×74 đơn vị, `camperRig/body.ts`               |
| Chân dung HUD           | Cắt đầu-vai 16×16, phóng ×3; `data/portrait.ts` |
| Chiều cao nhìn mục tiêu | Khoảng 270 pixel nghệ thuật                     |
| Khoảng chọn gần nhất    | 240–330; cửa sổ thấp có ngoại lệ đã test        |
| Scale màn hình          | Nguyên theo pixel thiết bị, tính cả DPR         |
| Texture art             | NEAREST, không làm mịn                          |

`game/rendering/resolution.ts` chọn `pixelScale` nguyên, không kéo canvas bằng CSS FIT.
`Viewport.ts` đồng bộ backing canvas, camera zoom và mật độ chữ khi resize/DPI đổi.
Một pixel nghệ thuật có thể lớn hơn một CSS pixel; không đánh đồng hai đơn vị.
Giữ nguyên kích thước thế giới và vật lý khi thay độ phân giải.
Camera bám nhân vật cả khi nhảy; núi/rừng neo dọc vào mốc địa hình nên cuộn cùng mặt đất.
Trời/mây neo theo khung nhìn; các lớp núi/rừng vẫn có parallax ngang riêng để giữ chiều sâu.
Tiết kiệm dùng mật độ 1; Đẹp dùng DPR bị chặn trong chính sách độ phân giải.
Chữ DOM không phóng bằng transform toàn bộ HUD.

## Khối, tông và mép

- Mỗi chất liệu dùng 3–4 tông chủ đạo: sáng, nền, bóng, đậm.
- Hướng sáng cố định từ trên-trái; vùng dưới-phải nhận tông tối.
- Dùng tông đậm của chất liệu làm mép, tránh viền đen dày.
- Sel-out của rig làm tối mép khoảng ×0,66; không thêm vòng pixel viền ngoài.
- Giữ silhouette nhận ra được trước khi thêm chi tiết nhỏ.
- Đất, đá và quặng chọn biến thể theo hash tọa độ cố định.
- Mép autotile chỉ xuất hiện ở cạnh tiếp xúc không khí, không viền từng ô cùng loại.
- Dither trời dùng Bayer 4×4; không thay bằng CSS gradient mềm.
- Tông nền đổi liên tục theo trọng số ngày/hoàng hôn/đêm và năm vùng.
- `domain/tone.ts` suy tông trang bị bằng OKLab từ màu món đồ.
- `toneRamp` giữ tông gốc, điều chỉnh độ sáng/chroma thay vì thêm hex tùy tiện.

## Palette: bản đồ nguồn

| File dưới `src/data/`   | Vai trò                                                  |
| ----------------------- | -------------------------------------------------------- |
| `palette.ts`            | Màu nhận diện, ô, nước, quặng, nền và màu legacy còn giữ |
| `palette/ui.ts`         | Nền công cụ xem mẫu và màu neo, kể cả alpha dev          |
| `palette/camper.ts`     | Da, tóc, giày, cần câu và chi tiết cố định               |
| `palette/camperRig.ts`  | Ánh xạ vai trò rig sang màu có sẵn, không thêm hex       |
| `palette/structures.ts` | Các vai trò `struct*` của chín công trình                |
| `palette/vegetation.ts` | Vỏ cây, tán theo vùng, cỏ/hoa/nấm/sậy/sen                |
| `palette/lighting.ts`   | Màu trời và nguồn sáng                                   |
| `backdropTones.ts`      | Bảng phối nền theo giờ, tham chiếu palette               |
| `parallax.ts`           | Hệ số cuộn, tông vùng; không chứa màu mới                |

Tên màu mới nói vai trò, ví dụ `structCanvasShade`, không đặt theo mã hex.
Các cặp base/hi/shade/deep phải thuộc cùng chất liệu và cùng quy ước hướng sáng.
Không tăng `palette.ts` quá 300 dòng; nhóm mới tách file trong `palette/` rồi gộp export.
Không import Phaser hoặc tầng UI vào data để lấy màu.
Màu catalog dùng vai trò `gear*`, `fish*` hoặc vai trò gốc tương ứng.
18 khóa legacy của catalog đã đổi tên có nghĩa, giá trị giữ nguyên.
Danh sách chính xác nằm ở phụ lục kiểm kê; không xóa khóa chỉ vì tên có chữ legacy.
`camp-art.ts` vẫn dùng một số màu cũ: phải tìm cả tham chiếu tên và khóa chuỗi trước khi xóa.

### Thêm màu

1. Tìm vai trò tương tự trong palette và bảng mẫu trước.
2. Nếu màu đang có đúng giá trị và đúng vai trò, tham chiếu lại.
3. Nếu cần mới, thêm vào bảng chuyên trách, đặt tên theo chức năng.
4. Dùng tên trong dữ liệu sprite hoặc `colorNumber(palette.role)` ở renderer.
5. Với UI DOM, khai báo vai trò ở `tokens.css` và tham chiếu `var(--role)`.
6. Bảy màu nhận diện CSS/TS được test khớp; thay đổi phải cập nhật đồng thời.
7. Xem lại ngày, đêm, bóng và trạng thái UI liên quan trước khi duyệt.

## Ba camera và lớp vẽ

| Depth hiện tại | Đối tượng                         | Camera       |
| -------------: | --------------------------------- | ------------ |
|            −10 | Trời                              | Nền          |
|           −9,5 | Sao                               | Nền          |
|             −9 | Mặt trời, trăng                   | Nền          |
|             −8 | Mây                               | Nền          |
|        −7 / −6 | Núi xa / giữa                     | Nền          |
|        −5 / −4 | Rừng xa / gần                     | Nền          |
|              8 | Chunk địa hình                    | Thế giới     |
|            8,5 | Chunk nước                        | Thế giới     |
|        9 / 9,1 | Cỏ, thân cây / tán cây            | Thế giới     |
|             10 | Thác, lối gỗ, cổng vòm cũ         | Thế giới     |
|             12 | Gỗ và đá tài nguyên               | Thế giới     |
|             16 | Thân công trình                   | Thế giới     |
|             19 | Bóng dưới chân                    | Thế giới     |
|             20 | Nhân vật                          | Thế giới     |
|             21 | Phần phát sáng công trình         | Hiệu ứng     |
|             22 | Bloom, xem trước và nhãn thế giới | Hiệu ứng     |
|             23 | Bụi từ pool                       | Hiệu ứng     |
|             24 | Dây/phao, gợn và thanh lực        | Hiệu ứng     |
|             25 | Nhãn câu cá                       | Hiệu ứng     |
|            DOM | HUD, menu, toast                  | Ngoài canvas |

`domain/lighting/layers.ts`: depth âm là nền, 0–20 là thế giới, từ 21 là hiệu ứng.
`game/rendering/cameraLayers.ts` gán cameraFilter, giữ camera cùng khung nhìn.
Camera thế giới có post-FX nhân màu; nền và hiệu ứng không nhận phép nhân đó.
UI trong canvas và vật tự phát sáng ở lớp hiệu ứng để còn đọc được khi trời tối.
Một vật vừa có thân vừa sáng phải tách hai hình, không đưa cả vật sang hiệu ứng.
`structureSprites.ts` tạo hai sprite cùng khung, cùng gốc đáy, cùng vị trí.
Lều, lửa, bếp nấu và đèn lồng có glow riêng; công trình khác không giả glow.
Thẻ công thức ghép cả hai lớp bằng `spriteLayersDataUrl`.

## Nguồn sáng

| Nguồn    | Tầm (ô) | Cường độ |   Tâm cao khỏi đất |
| -------- | ------: | -------: | -----------------: |
| Bếp lửa  |       6 |      1,1 |          30 đơn vị |
| Bếp nấu  |       5 |     0,85 |          19 đơn vị |
| Đèn lồng |       5 |     0,95 |          35 đơn vị |
| Lều      |       3 |      0,6 | 24 đơn vị, chỉ đêm |
| Pha lê   |       4 |      0,7 |              Tâm ô |

Thông số ở `domain/lighting/lightConfig.ts`, vị trí ở `sources.ts` (`BUILDING_LIFT`).
Đăng ký nguồn mới bằng dữ liệu và luật thuần, không vẽ vòng tròn thay trường sáng.
`LightField` giữ trường vô hướng; `composeLight` phối màu theo kênh và ambient.
Post-FX giữ alpha để vùng camera trong suốt không trở thành đen.
Khi lấy mẫu trường sáng canvas từ UV framebuffer, đảo Y trước khi áp dụng transform cửa sổ.
Nếu thiếu bước này, ánh sáng dưới đất bị áp nhầm lên tán cây và nguồn sáng lệch theo chiều dọc.
Texture ánh sáng lọc tuyến tính là ngoại lệ kỹ thuật; art vẫn NEAREST.
Bloom dùng phép cộng trên camera hiệu ứng, không thay phép nhân chiếu sáng.
Không có WebGL thì không gắn pipeline; fallback Canvas không mô phỏng đủ chiếu sáng.
Đây là giới hạn hiện có, không tuyên bố Canvas giống WebGL.

## Chất lượng và hoạt hình

| Hạng mục    | Đẹp                | Tiết kiệm          |
| ----------- | ------------------ | ------------------ |
| Nền         | Đủ năm lớp         | Núi xa và rừng gần |
| Mật độ      | DPR theo giới hạn  | 1                  |
| Tán cây     | Đung đưa nhẹ       | Tĩnh               |
| Sao         | Có nhấp nháy       | Ẩn                 |
| Trường sáng | 10 lần/giây game   | 5 lần/giây game    |
| Bloom       | Pool tối đa 24     | Pool tối đa 8      |
| Gợn hồ      | 8 mỗi hồ đang thấy | 3                  |

- Map dựng chunk theo camera qua `WorldStreamer`, giữ đệm và gỡ texture chunk xa; sprite cây dùng cache chung.
- Chỉ cập nhật tán cây giao khung nhìn, tính cả tán vươn từ ngoài camera; Tiết kiệm trả góc về 0 một lần.
- Animation gameplay lấy `scene.clock`, không dùng đồng hồ hệ thống.
- Pause giữ frame nhân vật, glow, gợn và nguồn nhấp nháy đứng yên.
- `ClockSprite` lấy frame theo nhịp trong sheet thay vì timer riêng cho từng sprite.
- Không cấp phát mảng/buffer/texture mới trong đường vẽ thường xuyên.
- Dùng buffer tái sử dụng và pool cho hiệu ứng có vòng đời ngắn.
- Texture sprite dùng chung cache theo dữ liệu/khóa bộ trang bị; texture chunk được tái tạo khi quay lại vùng đã gỡ.
- `outfitsReady` báo nạp sẵn các bộ gốc; không đợi tạo PNG trong nhịp vẽ.
- Không dùng `Math.random` hoặc `Date.now` trong art; dùng hash/seed cố định.
- RNG trong luật câu cá không phải art; không thay RNG gameplay trong nhiệm vụ đồ họa.
- Gallery rig cũ có timer xem mẫu; đó là ngoại lệ dev, không sao chép vào game.

## Nhân vật và trang bị

Bộ xương hiện tại ở `domain/camperRig/`, không còn nhân vật prototype đang chơi song song.
`types.ts` định nghĩa khung, vai trò và 13 trạng thái; tổng 46 frame.
`poses.ts`, `poseBase.ts`, `poseTasks.ts` cung cấp tư thế; raster xử lý khối và sel-out.
Đầu là lưới vẽ tay `data/camperHead.ts`, không tự đổi tỉ lệ khi thêm động tác.
Mỗi slot có hai hình dáng cơ bản; màu lấy từ `gear[].color` qua `wear.ts` và `tone.ts`.
Món mua thêm hiện mượn hình dáng gốc cùng slot; chưa có silhouette riêng.

| Neo       | Cách dùng                               |
| --------- | --------------------------------------- |
| `hand`    | Điểm cầm của bàn tay gần                |
| `rodTip`  | Đầu cần, null khi không cầm             |
| `head`    | Tâm đầu                                 |
| `headTop` | Pixel trên cùng của mũ ở frame hiện tại |
| `feet`    | Cặp neo chân                            |
| `ground`  | Hàng mặt đất 45                         |

Dùng `cellCorner`/`cellCenter` để quy về thế giới, có lật qua `mirrorColumn`.
Không tự cộng tọa độ sprite cũ 24×32 khi đặt nhãn hoặc dây câu.
Nhãn theo `headTop`, khoảng cách theo `fishLabelBottom` và `LABEL_GAP`.
`WorldLabelFader` làm mờ tên vùng/hồ khi chồng lên HUD câu cá.
Thêm pose phải cập nhật counts, sheet, neo và test grounded/air/lật.
Thêm hình dáng phải kiểm cả 16 tổ hợp bộ gốc và biên frame.
Xem `?gallery`: từng slot, đầu, neo, lưới, animation, thân/glow công trình.

## Ví dụ chuẩn vàng — mở file thật để làm theo

| Việc               | Ví dụ                                                                  | Điều cần giữ                    |
| ------------------ | ---------------------------------------------------------------------- | ------------------------------- |
| Thêm loại ô        | `src/domain/tilemap/tileArt.ts`                                        | Hash tọa độ, mask cạnh, palette |
| Cây / thực vật     | `src/domain/vegetation/trees.ts`, `plantArt.ts`                        | Thân-tán, biến thể, mặt đất     |
| Pose               | `src/domain/camperRig/poseTasks.ts`                                    | Neo và bàn chân                 |
| Hình dáng trang bị | `src/domain/camperRig/outfit.ts`                                       | Bốn tông và cùng bộ xương       |
| Công trình có glow | `src/data/sprites/structures/fire.ts`                                  | Hai lớp cùng 55×37              |
| Lớp nền            | `src/game/rendering/backdropSky.ts`, `ParallaxRenderer.ts`             | Bayer, cache, scroll factor     |
| Nguồn sáng         | `src/domain/lighting/sources.ts`                                       | id ổn định, trường theo ô       |
| Nhãn canvas        | `src/game/rendering/WorldLabelFader.ts`, `src/domain/fishingLabels.ts` | Mờ theo clock, né nhân vật      |

Atlas trong `?styleguide` dùng `tilePixel` thật: bảy loại ×16 mask, hai tường, ba tầng nước.
Trang mẫu không lưu dữ liệu và không hiện thực tính năng game mới.
Mẫu thanh lực mô phỏng hình học hiện có của `CampRenderer.drawTension`, không chạy mô phỏng câu cá.

## KHÔNG BAO GIỜ — luật cho phần mới

- Ghi màu hex trực tiếp ngoài palette hoặc tokens; test và stylelint sẽ chặn.
- Thêm gradient mềm, bóng có blur hoặc bo góc tròn lớn vào CSS/game art.
- Scale art không nguyên hoặc bật smoothing cho sprite.
- Vẽ viền đen dày thay tông đậm của chất liệu.
- Đặt toàn bộ vật cần chiếu sáng ở camera hiệu ứng.
- Đặt toàn bộ vật phát sáng trong camera thế giới rồi để đêm làm tắt glow.
- Dùng thời gian thực cho animation gameplay.
- Hiển thị chữ tiếng Việt không dấu.
- Tự thêm dependency; nhiệm vụ này chỉ được phép hai devDependency stylelint.

Ngoại lệ kỹ thuật và legacy có chủ đích phải ghi ở cuối tài liệu, không lén mở rộng.
Đổi luật cần sửa tài liệu, test và duyệt ảnh cùng nhau; không tắt rule toàn cục để qua check.

## Checklist thêm nội dung

- [ ] Ô: đủ mask cạnh, pixel 16×16, hash xác định, test tiếp giáp.
- [ ] Sprite: palette có vai trò, đúng khung, chân đúng nền, NEAREST.
- [ ] Nhân vật: đủ frame/neo, không cắt biên, thử lật và trang bị.
- [ ] Công trình: cùng gốc hai lớp, ánh sáng đúng tâm, ảnh công thức ghép đúng.
- [ ] Hiệu ứng: pool, lớp effects, clock game và giảm ở Tiết kiệm.
- [ ] Nguồn sáng: dữ liệu thuần, phạm vi cull/cache, không phát sinh texture mỗi frame.
- [ ] Màu: đúng nhóm palette, CSS/TS không lệch, ghi lại tương phản nếu dùng cho chữ.
- [ ] Xem mẫu ở 1× và phóng nguyên, ngày/đêm, desktop/điện thoại.
- [ ] `npm run check` xanh; build/e2e theo phạm vi thay đổi.

## T8b phải tuân theo — chưa làm

Nước, thác và cổng vòm sẽ dùng lưới pixel và màu theo vai trò.
Thân đá/nước thuộc camera thế giới; bọt/lấp lánh tự sáng tách sang hiệu ứng khi cần.
Không lấy gradient mềm làm bản thay thế art đã duyệt.
Cá nhảy, nước bắn, phao, nhặt và dựng dùng pool hạt có giới hạn.
Tất cả lấy clock game, đứng yên khi pause, giảm số lượng ở Tiết kiệm.
Giữ nguyên luật câu cá, nhặt đồ và đặt công trình khi chỉ đổi hình ảnh.
Chưa ghi bất kỳ hiệu ứng tương lai nào là đã hiện thực.

## Phụ lục — Kiểm kê

Bản kiểm kê đầy đủ giá trị, số lần và vai trò: [STYLE-INVENTORY.md](STYLE-INVENTORY.md).
Baseline 2026-10-26: CSS ngoài tokens 104 hex/91 giá trị, TS ngoài palette 41 chuỗi/5 file.
Đây là số đọc source thật, khác số 106/33 trong yêu cầu đã đo ở thời điểm khác.
Sau chuyển: 0 hex CSS ngoài tokens; 0 chuỗi hex TS ngoài bảng cho phép/test.
HTML giữ 10 hex: một meta theme-color và chín nét SVG nhiều tông.
7 z-index đã thành token; 3 radius đều 0; 16 bóng đều cứng; 0 gradient CSS.
Chưa xóa màu legacy không thuộc catalog: `camp-art.ts` và art T8b còn tham chiếu.
18 khóa catalog đổi tên: legacy157/159/161/163/164/165 và legacy166–177.
Các khóa cũ không còn xuất hiện trong source sau tìm kiếm, nhưng màu giữ nguyên.

### Ngoại lệ có chủ đích

- `CamperRigPaint.ts` giữ gradient canvas xem mẫu cũ; không áp dụng cho art gameplay.
- Texture trường sáng lọc tuyến tính và bloom cộng là kỹ thuật T6 đã duyệt.
- Mockup HTML là tài liệu chuẩn thẩm mỹ, không nằm trong lint CSS của src.
- Descriptor font, breakpoint, phần trăm/tỉ lệ, grid count, 0 và env() không phải token mỹ thuật.
- Kích thước canvas/iframe dev là hình học xem mẫu; màu vẫn lấy palette/token.
- `palette.guard.test.ts` cho phép màu dữ liệu thử trong file test; không có ngoại lệ TS runtime.
- SVG nhiều tông và meta theme-color giữ nguyên; danh sách đóng ở DESIGN.
- CSS còn 3 warning: prefix Safari ở controls, specificity ở inventory.
- Không tắt rule semantic toàn cục; ESLint legacy là nhóm riêng trong báo cáo kiểm chứng.

## Bơi, lặn và cá sống

`poseSwimming.ts` thêm bốn frame bơi và bốn frame lặn, giữ trang bị theo rig hiện có.
Các frame trên cạn giữ nguyên thứ tự và pixel. Cá dùng `domain/aquatic/fishArt.ts`: bốn
frame vẫy đuôi, thân tròn/thon/dài, vây và sọc theo `data/fishBehavior.ts`, tông từ palette/catalog.
`FishRenderer` dùng texture chung mỗi loài, chỉ dựng sprite gần màn hình, depth 14 trong camera thế giới.
Cá không còn được vẽ tĩnh vào chunk. Rong, san hô và đá vẫn là chunk tĩnh.
Bóng chân tắt khi bơi; bọt khí và thanh hơi thở nằm trong lớp hiệu ứng hiện có.
