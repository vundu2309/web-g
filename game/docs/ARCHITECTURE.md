# Kiến trúc Pixel Forest

## Luồng chạy

`main.ts` chờ font và tạo Phaser. `game/CampingScene.ts` là nơi ghép các thành phần và điều phối lệnh, bước mô phỏng cố định 1/60 giây, physics, lưu định kỳ và camera. Scene không tạo HTML hay gắn trực tiếp sự kiện DOM.

```text
Input / GameUI ── lệnh ──> CampingScene
                              ├─ FishingSystem / ConstructionSystem
                              ├─ SaveRepository
                              ├─ CampRenderer / WorldRenderer
                              └─ Viewport
CampingScene → sceneActions / bindSceneUI / CampActivities → domain/economy, domain/chest
State + view model ──────────> GameUI
```

## Trách nhiệm

| Thư mục/module            | Trách nhiệm                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| `data/catalog.ts`         | Danh mục trang bị, cá và công thức; không phụ thuộc Phaser                                  |
| `data/world.ts`           | Kích thước map, vùng, mặt nước, điểm tài nguyên và cao độ                                   |
| `domain/tilemap/`         | Lưới ô địa hình (sinh theo seed, truy vấn ô, cao độ mặt đất); thuần, không phụ thuộc Phaser |
| `domain/camping.ts`       | Kiểu bản lưu, kiểm tra dữ liệu, trang bị, thưởng cá và tiêu vật liệu                        |
| `game/systems/`           | Trạng thái câu cá và xác thực/đặt công trình; không phụ thuộc DOM hoặc Phaser               |
| `input/PlayerControls.ts` | Bàn phím, đa chạm, hủy pointer và dọn listener                                              |
| `ui/GameUI.ts`            | HUD, hộp thoại và thông báo; nhận dữ liệu, phát lệnh qua callback                           |
| `ui/styles/`              | Token, font, HUD, control, panel, inventory và responsive được chia riêng                   |
| `game/rendering/`         | Canvas assets, hình ảnh world, hiệu ứng, resize/DPI và raster chữ                           |
| `storage/`                | Đọc/ghi tiến trình, xử lý storage bị chặn và lưu lựa chọn đồ họa                            |
| `camping.ts`, `world.ts`  | Điểm export tương thích; code mới có thể import module cụ thể                               |

## Mở rộng

- Thêm loài cá hoặc trang bị trong `data/catalog.ts`. Kho đồ tự dựng từ danh mục. Khi thêm một ô trang bị mới, cập nhật kiểu Slot, trạng thái mặc định và `camp-art.ts`.
- Thêm công trình: bổ sung BuildingKind/công thức trong catalog và hình vẽ trong `camp-art.ts`. Quy tắc đặt thuộc ConstructionSystem; không xử lý trừ vật liệu ở UI.
- Thêm vùng, mặt nước hoặc tài nguyên trong `data/world.ts`; vẽ cảnh trong WorldRenderer. Không đưa logic câu cá vào renderer.
- Thêm hoạt động mới bằng một system riêng, rồi gọi từ CampingScene. UI chỉ gửi lệnh và hiển thị trạng thái.
- `SaveRepository` hiện là interface đồng bộ cho cache local. Nếu thêm đồng bộ Firebase, đặt I/O bất đồng bộ trong dịch vụ sync ngoài vòng lặp physics; không gọi mạng mỗi frame hoặc giả định Firestore là storage đồng bộ.

## Render và UI lớn

Không tăng kích thước thế giới khi tăng chất lượng. Góc nhìn cao 360 đơn vị, chiều rộng theo tỉ lệ cửa sổ (144–1.100); `resolution.ts` chọn mức supersampling nguyên dựa trên kích thước hiển thị, DPI và chất lượng. Viewport đồng bộ backing canvas, camera zoom và Text resolution, gồm cả resize lúc pause và thay đổi DPI. Giới hạn scale 8 để tránh canvas tăng không giới hạn; Tiết kiệm không nhân thêm DPI.

Pixel sprite dùng nearest filtering. Chữ canvas dùng texture ở đúng mật độ render; ảnh đại diện HUD được vẽ riêng ở 288 × 384, hình công trình ở 440 × 296. Chữ DOM vẫn là Nunito gốc. UI dùng rem và tăng kích thước layout tại màn hình lớn; không dùng transform để phóng to toàn bộ HUD.

## Vòng đời và bản lưu

Mỗi instance UI/input/viewport sở hữu listener qua AbortController hoặc disposer. Shutdown/destroy dọn timer, ResizeObserver, DPI media query, callback resize và listener. Texture sprite dùng chung được cache; texture chunk world được giải phóng khi ra xa hoặc restart scene. HUD chỉ cập nhật text/icon khi giá trị thay đổi; việc đặt công trình không dựng lại tất cả công trình cũ.

Giữ khóa `forest-camping-v1`, nâng schema lên version 2 và migrate v1. `saveTypes.ts` định nghĩa dữ liệu; `saveCodec.ts`/`storageCodec.ts` làm sạch dữ liệu. `fish` là sưu tầm trọn đời; `fishBag` là cá có thể bán/nấu/chuyển rương. Mỗi công trình có id ổn định; rương và đồng hồ nằm trong bản lưu. Repo không ghi tài khoản hoặc khóa Admin vào client. Refactor không thay đổi các dịch vụ Firebase.

## Kiểm tra

- `npm test`: domain, hệ thống câu cá/xây dựng, repository và chính sách độ phân giải.
- `npm run test:e2e`: build production rồi kiểm tra gameplay, bản lưu, offline, UI điện thoại, Full HD/Retina/4K, resize lúc pause và restart scene.
- `npm run format:check`: kiểm tra định dạng; `npm run format` sửa định dạng source.
- `npm run build`: kiểm tra toàn bộ source TypeScript, build Vite và tạo cache PWA.

## Các hệ thống camping v2

- `data/rods.ts`: giá, vật liệu và thông số bốn cấp cần; `catalog.ts`: giá cá/món ăn và thời gian hoạt động.
- `domain/economy.ts`: mua, bán, nấu, ăn; kiểm tra trước khi thay đổi trạng thái.
- `domain/chest.ts`: kho 20 ô; chuyển trên bản sao rồi commit cả hai kho khi mọi điều kiện hợp lệ.
- `domain/dayTime.ts`: đồng hồ 480 giây/ngày, phân kỳ và mức tối, không phụ thuộc render.
- `FishingSystem.update(dt, pulling, easy)`: chờ → cắn → kéo → thắng/thoát/đứt; RNG tiêm được.
- `game/CampActivities.ts`: adapter nối giao dịch với modal đang pause. HTML nằm trong `ui/ActivityUI.ts`, `ui/ChestUI.ts`.
- `DayNightRenderer`: sky/stars cache một lần, overlay đổi alpha/tint, ánh sáng cull trong 650 đơn vị.
- Hook dev `window.forest.fps.average` cập nhật số frame/giây theo cửa sổ một giây; không bật trong production.

## Đồ họa dữ liệu — đang chờ duyệt mẫu nhân vật

`data/palette.ts` gom màu cũ; `data/parallax.ts` hòa tông vùng. `ParallaxRenderer` giữ bốn
TileSprite có hệ số cuộn khác nhau, chỉ đổi UV/tint theo clock. `domain/tilemap/tileArt.ts` vẽ điểm ảnh
các ô và `tileChunks.ts` gom 16 ô thành một chunk, vẽ một lần. `sceneView.ts` đặt camera để nhân vật ở khoảng 42% chiều rộng khi không
bị giới hạn biên; resize đồng bộ sky/stars/veil. Viewport chỉ lấy VIEW_HEIGHT=360 cố định.

`domain/sprite.ts` là parser lưới/màu thuần; `data/sprites/` chứa mẫu và hai bộ trang bị.
`SpriteLoader` cache sheet native, đăng ký frame/animation Phaser; `ClockSprite` lấy frame
bằng clock game. `ui/gallery.ts`/`SpriteGalleryScene` chỉ được import trong nhánh DEV.
Production không chứa gallery, CSS gallery hoặc mẫu thử.

Nhân vật đang chơi là bộ xương (R3): `domain/camperRig/` dựng 46 frame 36 × 48 pixel cho mỗi bộ trang bị, thuần không Phaser.
Luồng: trang bị của save → `wear.ts` (`outfitOf`, món mua thêm mượn hình dáng gốc, giữ màu) → `build.ts` (cache theo `outfitKey`)
→ `CamperSheet.ts` (một canvas texture chứa 46 frame, đăng ký animation theo `sheet.ts` `SHEET_ANIMATIONS`, nhịp theo đồng hồ game)
→ `CamperView` (sprite origin giữa-đáy tại `ORIGIN_X/ORIGIN_Y`, đáy khung đặt đúng mặt đất, nhìn trái bằng `flipX`).
Neo (`hand`, `rodTip`, `headTop`, `feet`) quy về thế giới bằng `cellCorner/cellCenter` có lật quanh trục `mirrorColumn`;
hộp va chạm `body.ts` 12 × 37 pixel (24 × 74 đơn vị), đáy đúng hàng chân; khối bao nhân vật và cần `figure.ts` dùng cho lớp mờ nhãn;
nhãn câu cá đặt cách đỉnh mũ frame hiện tại `LABEL_GAP`. Chân dung HUD và xem trước kho đồ lấy `idleFrame()` qua `frameImage.ts`.
Gallery DEV (`?gallery`): bộ xương là trang mặc định (`CamperRigGallery`); chế độ công trình là `SpriteGalleryScene`. Production không chứa gallery.

## Camera khi nhảy và lấy mẫu ánh sáng

`sceneView.centerCamera()` bám `player.y` khi nhảy, không khóa camera vào mặt đất.
`ParallaxRenderer` neo chân texture núi/rừng vào đường cao độ địa hình làm mượt (`terrainAnchor.ts`),
không phụ thuộc chiều cao viewport. Mỗi lớp có khoảng nâng cố định để tạo chiều sâu;
với scrollFactorY=1: vị trí tương đối với mặt đất giữ nguyên trong cú nhảy. Trời/mây neo theo khung nhìn.
Theo chiều ngang vẫn dùng parallax riêng cho từng lớp; không đổi vật lý nhảy hoặc shader ánh sáng đã sửa.

`LightPipeline` nhận UV framebuffer có gốc dưới-trái; canvas trường sáng có gốc trên-trái.
Shader đổi `y` thành `1-y` trước phép biến đổi UV cửa sổ, giữ đúng tương ứng sáng trời/lòng đất.
Không đổi palette, độ sáng ban đêm hoặc tông art của tán cây để che lỗi lấy mẫu.
`tests/cameraLighting.spec.ts` kiểm ba viewport khi nhảy và đọc pixel render thật cho ngày/đêm/lòng đất.

## Map tải theo camera

`WorldStreamer` được scene tạo trước `Viewport`; `sceneView.centerCamera()` đồng bộ chunk trước nền/ánh sáng.
`ChunkWindow` giữ vùng nhìn cộng đệm tán cây 256 đơn vị, nạp trước một chunk/frame và giữ đệm ba chunk
để tránh dựng/gỡ liên tục ở ranh giới. Mỗi chunk dài 512 đơn vị gồm địa hình, nước nếu có, trang trí và cây.
Chunk mới trong vùng nhìn được dựng ngay (kể cả khi dịch chuyển xa); chỉ prefetch có ngân sách một chunk/frame.
Đây là sinh texture từ dữ liệu local theo nhu cầu, không tải bản đồ qua mạng.

Khi ra xa: hủy sprite trước, rồi gỡ texture `terrain-*`, `water-*`, `decor-*` khỏi TextureManager.
Texture biến thể cây dùng chung được giữ trong cache hữu hạn; gỡ cây không gỡ nhầm texture cây khác đang dùng.
Metadata địa hình/thực vật, static collider, mốc cảnh, tài nguyên và công trình vẫn giữ nguyên để bảo toàn gameplay.
WorldStreamer không sở hữu Save. Restart/shutdown giải phóng chunk; quay lại dựng đúng art từ dữ liệu xác định.
`LayerCameras` theo dõi thêm/xóa display object, kể cả trường hợp đổi chunk nhưng tổng số object bằng nhau.

Tán cây chỉ cập nhật góc khi hộp bao có tính độ nghiêng giao khung nhìn. Tiết kiệm chỉ trả góc về 0 một lần.
Nhịp animation dùng clock game; pause vẫn giữ tĩnh. `worldStreamer.stats` cho biết số chunk/cây giữ và tán cập nhật.
Kiểm thử: `ChunkWindow.test.ts` kiểm vùng đệm, biên, dispose và culling; `tests/streaming.spec.ts` kiểm texture,
quay lại, cameraFilter, tiến trình và restart trong Chrome. Không dùng tổng texture bất biến khi đổi vị trí:
chunk được gỡ/nạp, còn cache biến thể cây sẽ tăng đến khi đủ biến thể đã gặp.

## Thế giới mở rộng

`data/worldLayout.ts` định nghĩa map 32.000 × 1.536 đơn vị, 10 vùng. `expandedTerrain.ts`
giữ nguyên ô địa hình trong khu 16.000 × 900 cũ, nối rừng/thảo nguyên/hồ mới, bờ cát tại
25.600 và biển tại 28.160. Mặt biển cố định 640; đáy sâu dần tới 1.376. Save v2 giữ nguyên
cấu trúc, mở giới hạn vị trí và công trình theo kích thước mới.

`sceneryArt.ts` vẽ bụi quả, gỗ mục, đá rêu, hoa, cọ, vỏ sò, cua, rong và san hô
vào texture chunk; không thêm vòng cập nhật từng đối tượng. Lưới cache mặt nước và đáy nước
để truy vấn khi dựng chunk. Biển không tạo cầu hồ; cá biển dùng habitat `sea`.
Rong, san hô và đá dưới nước là trang trí tĩnh; cá dùng hệ thống mô phỏng riêng.

## Hệ thống nước và cá

`AquaticLife` phối hợp `SwimmingSystem`, `FishSchoolSystem`, physics và `FishRenderer`.
`waterColumn` đọc mặt/đáy từ lưới; khi bơi, tắt dịch chuyển Arcade và bỏ collider mặt sàn cũ,
hệ thống thuần giới hạn thân theo bờ/đáy. Lối gỗ hồ vẫn đi bộ được; giữ xuống để chui xuống nước.
Bơi có tốc độ ngang 145, dọc 115, cân bằng lực nổi; hơi thở 24 giây giảm khi đầu chìm.
Hết hơi sẽ cưỡng bức nổi và chờ hồi đầy + nhả nút lặn; không có chết/mất vật phẩm.
Nhảy ở mặt nước trở lại physics thường. Save vẫn v2: hơi thở và trạng thái bơi là tạm thời;
nạp lại ở biển cho nhân vật nổi trên mặt thay vì đặt dưới đáy.

Cá có id, loài, chiều dài, vị trí, hướng, vùng sinh sống, điểm tuần tra và trạng thái
cruise/flee/lure/hooked/rest. Sinh theo seed trong vùng nước thật; chỉ mô phỏng chuyển động
trong camera cộng biên 256, cộng riêng cá mục tiêu nếu ở ngoài biên. Hẹn giờ hồi đàn chạy theo thời gian game, dừng khi pause.
Chọn cá trong 450 đơn vị quanh mồi theo giờ hoạt động, khoảng cách và độ may mắn của cần.
`FishingSystem` nhận cá mục tiêu, đợi cá tới gần mồi mới cắn, giữ nguyên đấu lực dây.
Cá thắng cuộc vào kho đúng loài/kích thước một lần; cá thể đó ẩn 40 giây trước khi sinh cá mới (loài/kích thước chọn lại theo habitat và giờ hoạt động).
Đàn cá không lưu vĩnh viễn và không cần dịch vụ AI hoặc backend.
