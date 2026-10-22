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

Mỗi instance UI/input/viewport sở hữu listener qua AbortController hoặc disposer. Shutdown/destroy dọn timer, ResizeObserver, DPI media query, callback resize và listener. Texture world đã cache được dùng lại khi restart scene. HUD chỉ cập nhật text/icon khi giá trị thay đổi; việc đặt công trình không dựng lại tất cả công trình cũ.

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
TileSprite có hệ số cuộn khác nhau, chỉ đổi UV/tint theo clock. `soil.ts` vẽ tầng đất/rễ/đá
một lần vào chunk. `sceneView.ts` đặt camera để nhân vật ở khoảng 42% chiều rộng khi không
bị giới hạn biên; resize đồng bộ sky/stars/veil. Viewport chỉ lấy VIEW_HEIGHT=360 cố định.

`domain/sprite.ts` là parser lưới/màu thuần; `data/sprites/` chứa mẫu và hai bộ trang bị.
`SpriteLoader` cache sheet native, đăng ký frame/animation Phaser; `ClockSprite` lấy frame
bằng clock game. `ui/gallery.ts`/`SpriteGalleryScene` chỉ được import trong nhánh DEV.
Production không chứa gallery, CSS gallery hoặc mẫu thử.

Mẫu chưa tích hợp vào nhân vật đang chơi, chưa chuyển công trình/tài nguyên sang lưới.
Điểm dừng hiện tại: duyệt idle/run/jump trước khi làm các động tác còn lại.
Khi tích hợp texture 24×32 hiển thị 48×64 (scale 2), cần quy đổi body source sang 12×22,
offset 6×10 để giữ hộp world 24×44, đáy trùng chân như texture cũ 96×128 (scale 0,5).
Đây là việc sau duyệt, chưa thay đổi collider trong bản hiện tại.
