# Nâng cấp đồ họa — giai đoạn 1 và điểm duyệt đầu giai đoạn 2

## Trạng thái

Giai đoạn 1 hoàn tất. Giai đoạn 2 hiện chỉ có hạ tầng sprite và mẫu nhân vật idle/run/jump,
hai bộ trang bị, gallery để duyệt. Dừng theo điểm 2 trong yêu cầu của người dùng;
chưa thay nhân vật đang chơi, chưa làm phần còn lại của 2.3–2.4.
Không commit/push, thêm dependency hoặc thay đổi Save/Firebase.

## Khảo sát bắt buộc

- Trước sửa: VIEW_WIDTH=800, VIEW_HEIGHT=360, Scale.FIT; tại 1440×900, canvas hiển thị
  1440×648, cách trên/dưới 126 px. renderScale là số nguyên, camera zoom cùng hệ số.
- Phụ thuộc khung nhìn ở main, resolution, Viewport và centerCamera. Nhãn hồ/vùng và
  nhãn câu cá là tọa độ world; Viewport cập nhật độ phân giải chữ khi resize.
  Sky/stars/veil trước đây phủ world 16.000×900. HUD/control là DOM cố định theo mép/vùng an toàn.
- Body kiểm chứng bằng Chrome: texture nguồn 96×128, display 48×64, scale 0,5;
  setSize(48,88) cho hộp world 24×44. Offset nguồn (24,40), bottom=player.y=650 khi đứng.
  Vì vậy không có lỗi hộp cao hơn sprite: giữ nguyên body/physics trong lần này.
- paintCamper chỉ được CampRenderer dùng để tạo atlas và portrait; paintBuilding tạo
  ảnh công trình/preview. Resource wood/stone được CampRenderer tạo và dùng tại resourceNodes.
  gear[].color quyết định bốn màu hat/shirt/pants/backpack.
- Chưa có palette; màu nằm trong camp-art, night-art, các renderer, catalog và token CSS.
  Đã gom 177 giá trị cũ thành palette; không thêm mã màu mới. Màu nội suy giữa vùng là màu dẫn xuất.

## Giai đoạn 1

Cao world nhìn thấy 360, rộng thích nghi 144–1.100. Cần thấp hơn 560 để phủ màn hình dọc
390×844 mà không tạo dải trống trên/dưới; đây là điều chỉnh giới hạn đề xuất, không đổi hình học world.
Dải hai bên chỉ xuất hiện ở tỉ lệ vượt giới hạn. Không kéo méo sprite.
Camera giữ player khoảng 42% từ trái, bù y 65; bounds ngăn cuộn ngoài world.
Sky/stars/veil phủ khung nhìn và cập nhật khi resize, kể cả lúc pause.
HUD và các nút giữ CSS neo mép/safe-area hiện có; đã kiểm tra không chồng nhân vật tại các cảnh chụp.

Mây, núi xa, núi gần, rừng nền dùng bốn TileSprite, hệ số 0,04/0,14/0,30/0,55;
texture 256×180 vẽ một lần và phóng 2×, NEAREST. Mây theo clock game.
Màu hòa trong 320 đơn vị mỗi phía ranh giới. Lớp phủ ngày/đêm vẫn phủ cả nền.
Tiết kiệm chỉ giữ núi xa và rừng, bỏ mây/núi gần. Đất có tầng màu, rễ và đá cache theo chunk.
Camera/nền cập nhật một lần sau vòng physics, không vẽ lặp ở từng bước 1/60.

Kiểm tra cuối giai đoạn: npm test 30/30; npx tsc --noEmit, npm run build và npm run check xanh.
Bộ npm run test:e2e khi đó 27/27. Sau tách hàm camera đã chạy lại 5/5 kiểm tra góc nhìn.
Đã mở bản dev bằng Chrome ẩn, xem ảnh thật tại 1920×1080, 1440×900, 1024×768,
390×844 và 844×390; cảnh qua ranh giới Ao Sen → rừng thông. Không tự mở browser pane.

## Mẫu sprite và hạ tầng giai đoạn 2

- Lưới 24×32, ART_PIXEL=2. Dữ liệu 12 frame nguồn, dùng tên màu palette và bốn role màu trang bị.
- Parser thuần trả RGBA, dấu chấm trong suốt; lỗi gồm tên sprite/frame/dòng/cột,
  kiểm tra kích thước, màu, glyph và chỉ số animation. Không import Phaser.
- Loader tạo sheet native 288×32, cache theo sprite/bộ màu, đăng ký animation qua scene.anims.
  ClockSprite lấy frame đã đăng ký bằng clock thay vì thời gian thật.
- Mẫu idle có thở nhẹ và liếc; run 6 frame, jump 2 frame; hai bộ vải bố/rừng thông.
  Chỉ là mẫu cần duyệt tỉ lệ, outline, hình dáng mũ/tay/chân/balo và mức độ thô.
- Gallery dev có chọn trạng thái, tốc độ, bộ trang bị, đảo hướng, pause; cuộn được trên điện thoại.
  URL: http://localhost:5173/?gallery . Link game thường: http://localhost:5173/ .
- Build production được tìm chuỗi và xác nhận không có marker gallery, CSS gallery,
  camper-prototype hoặc review-outfit. Production tại ?gallery vẫn là game thường.

Kiểm tra hiện tại: npm test 34/34, npx tsc --noEmit, npm run build và npm run check xanh.
Toàn bộ E2E với gallery: 29/29. Sau chỉnh gallery cuộn dọc và mẫu thở, đã chạy lại
2/2 gallery test, build/check và 34 unit test đều xanh. Không có lỗi lint mới;
41 cảnh báo legacy vẫn còn. Build còn cảnh báo bundle Phaser lớn hơn 500 KB.

Đã xem gallery desktop/điện thoại, hai bộ màu, ba trạng thái; xác minh pause, thay màu cache,
đảo hướng, chọn tốc độ/state bằng tương tác trình duyệt. Đã xem các vùng Ao Sen, Thông,
Thác Ngân Hà, Đèo Trăng, Phế Tích và cảnh đêm có bếp lửa, đèn, lều.

## Hiệu năng và giới hạn

Đo riêng bằng hook dev, cùng viewport 1280×720, scale 2, Chrome macOS ẩn / GPU phần mềm
SwiftShader, cảnh đêm có 3 công trình, đợi ít nhất 3 cửa sổ đo một giây:

| Chế độ    | FPS cửa sổ cuối | Số texture |
| --------- | --------------: | ---------: |
| Đẹp       |            21,3 |         66 |
| Tiết kiệm |            34,1 |         66 |

Đây là số đo dev bằng GPU phần mềm, không phải cam kết tốc độ trên GPU thật.
Số FPS giữa các lần chạy thay đổi theo tải máy. Chưa đo điện thoại thật, pin hoặc bộ nhớ dài hạn.
Các texture/đối tượng nền không tăng khi cuộn/resize trong phép thử.

## File mới

- src/data/palette.ts; parallax.ts; parallax.test.ts; sprites/camper.ts; sprites/outfits.ts.
- src/domain/sprite.ts; sprite.test.ts; visualState.ts.
- src/game/rendering/ParallaxRenderer.ts; soil.ts; sceneView.ts; SpriteLoader.ts;
  ClockSprite.ts; SpriteGalleryScene.ts.
- src/ui/gallery.ts; src/ui/styles/gallery.css.
- tests/graphics.spec.ts; tests/gallery.spec.ts; docs/GRAPHICS-REVIEW.md.

## File sửa

src/main.ts; src/game/CampingScene.ts; src/game/rendering/CampRenderer.ts,
WorldRenderer.ts, DayNightRenderer.ts, Viewport.ts, resolution.ts, resolution.test.ts;
src/camp-art.ts; src/night-art.ts; tests/rendering.spec.ts; README.md; docs/ARCHITECTURE.md.
Camp-art cũ hiện chỉ chuyển tham chiếu màu sang palette, chưa đổi sprite công trình.

## Phần chờ duyệt và nợ kỹ thuật

Chưa làm fall/land/cast/fish-wait/reel/gather/build, bụi/bóng, chuyển portrait và nhân vật chơi,
sprite công trình/tài nguyên/dây câu hay animation mở rương. Các mục này tiếp tục sau khi duyệt mẫu.
Chưa playtest các animation chưa được làm; gameplay hiện tại vẫn dùng sprite cũ.
Palette giữ tên legacy đánh số cho các màu cũ chưa đặt vai trò; có thể đặt lại tên khi chuyển từng sprite.
Source body dùng kích thước trước scale dễ gây hiểu nhầm; khi đổi nguồn sprite cần quy đổi,
không sao chép nguyên setSize(48,88) sang texture 24×32. Chi tiết nằm trong ARCHITECTURE.md.

## Chỉnh mẫu sau phản hồi thiếu nét pixel

Thêm `src/data/sprites/camperDetailed.ts`: lưới 48×64, 12 frame, 4 lần số pixel của bản 24×32.
Các ô lớn được bổ sung nét 1 pixel thật: lông mày/mắt, tai/má/miệng, sợi tóc, chỉ mũ,
đường may/cúc/túi áo, vải và khóa balo, quần và dây giày. Test kiểm tra có nhiều ô 2×2
được chia chi tiết để tránh chỉ phóng lớn mẫu cũ. Các tên màu chi tiết dùng lại swatch có sẵn.
Gallery mặc định 48×64, cho đổi về 24×32; hai mức cùng display 144×192 trong gallery.
Texture/animation cache riêng cho mỗi mật độ và bộ màu. Mẫu mới vẫn chỉ dùng trong dev.
ART_PIXEL=2 của game hiện tại giữ nguyên; mật độ 48×64 là đề xuất mới chờ duyệt trước khi tích hợp world.
Không đổi Save, gameplay, collider hoặc công trình. Check: 35 unit test, build/TypeScript/lint xanh;
2 luồng gallery qua, gồm chuyển qua lại mật độ và tái dùng cache. Không đo lại FPS game vì
mẫu vẫn chưa tích hợp vào game; số FPS trước đó không phải số đo nhân vật 48×64 trong world.
