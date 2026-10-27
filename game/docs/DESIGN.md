# Pixel Forest — hệ thống UI/UX DOM

## Mục đích và nguyên tắc

Cozy pixel: nền giấy, khung gỗ/thông, bóng cứng, chữ Nunito có dấu tiếng Việt.
UI phải đọc nhanh, nhường trung tâm màn hình cho nhân vật và hoạt động đang diễn ra.
Điện thoại ưu tiên thao tác một tay cho hành động chính; di chuyển/nhảy vẫn có thể cần hai tay.
Mở hộp thoại phải dừng mô phỏng; giao dịch trong menu không để đồng hồ trôi.
Giữ tiến trình hiện lưu trên thiết bị; chưa hứa đồng bộ đám mây.
Phong cách thế giới và camera đọc ở [STYLE.md](STYLE.md), không sao chép luật gameplay vào UI.

## Token là hợp đồng

Nguồn CSS duy nhất là `src/ui/styles/tokens.css`.
CSS thành phần chỉ dùng token cho màu, độ dài mỹ thuật, chữ, tầng và chuyển động.
Không thay số gần giống nhau bằng một số chung nếu làm khác baseline.
Giá trị cấu trúc như 0, auto, %, fr, vw/dvh, tỉ lệ, env() và breakpoint được giữ literal.
Descriptor của `@font-face` là ngoại lệ cú pháp, không dùng var() ở nơi trình duyệt không hỗ trợ.
Màu trang bị/cá động là `--swatch` và `--fish`, nguồn từ catalog/palette.
Không chèn hex tùy ý vào style HTML hoặc JavaScript khi thêm component.

| Nhóm               | Token / cách dùng                                                               |
| ------------------ | ------------------------------------------------------------------------------- |
| Nhận diện          | `--ink`, `--pine`, `--moss`, `--cream`, `--paper`, `--wood`, `--gold`           |
| Chữ                | `--text-primary`, `--text-secondary`, `--text-caption`, `--text-hint`           |
| Nền                | `--surface-paper`, `--surface-dark`, các `--surface-*` chuyên trách             |
| Nút                | `--button-primary`, `--button-secondary`, `--button-hover`, `--button-selected` |
| Trạng thái dự kiến | `--button-danger`, `--button-locked`, `--status-success/warning/error`          |
| Viền               | `--border`, `--border-color`, `--focus-ring`, các `--border-*`                  |
| Bóng               | `--edge`, `--shadow-hard`, các `--shadow-<component>-N` giữ baseline            |
| Góc                | `--radius-square: 0` — không có ngoại lệ tròn cho DOM                           |
| Khoảng cách        | `--space-*` theo CSS px gốc ở rem 16; phân số có dấu gạch                       |
| Kích thước         | `--size-*` theo rem; `--pixel-*` cho kích thước cố định                         |
| Chữ                | `--text-*`, `--text-fixed-*`, `--weight-600/800/900`, `--leading-*`             |
| Font               | `--font: Nunito, system-ui, sans-serif`                                         |
| Tầng               | `--z-hud: 3`, `--z-panel: 4`, `--z-dialog: 5`, `--z-toast: 4`, `--z-overlay: 5` |
| Chạm               | `--tap-min: 44px` cho thành phần mới                                            |
| Chuyển động        | `--duration-fast: 120ms`, `--duration-feedback: 180ms`, `--ease-pixel`          |

Tên `--space-12` có giá trị 0,75rem, không cam kết luôn là 12 CSS px trên màn hình lớn.
Không đổi `min-height: 2.75rem` cũ thành 44px cố định: root 18/24px phải giữ tỷ lệ cũ.
Các token trạng thái tương lai chỉ là alias màu hiện có, chưa tạo nút nguy hiểm hay biểu mẫu gameplay.
Màu error hiện là gỗ; phải kèm chữ/biểu tượng, không giả định đó là màu đỏ cảnh báo đã duyệt.

## Danh mục thành phần đang có

| Thành phần / selector thật                       | File CSS                   | Trạng thái đang hỗ trợ                           |
| ------------------------------------------------ | -------------------------- | ------------------------------------------------ |
| `button`                                         | base                       | mặc định, hover, active, focus-visible, disabled |
| `.primary`                                       | base                       | chính, hover, kế thừa active/focus/disabled      |
| `.quiet`                                         | base                       | nhẹ, hover, kế thừa focus/disabled               |
| `button[aria-pressed='true']`                    | panels                     | đang chọn, vẫn có chữ/aria                       |
| `.icon-button`                                   | panels                     | nút đóng, 44px theo thang rem                    |
| `.game-button`, `.direction-button`              | controls                   | chạm, `.held`, active, focus                     |
| `.direction-pad`, `.jump-button`                 | controls                   | trái/phải, nhảy vàng, hover                      |
| `#camp-tools`, `#context-action`, `#action.bite` | compact                    | lối tắt, tương tác theo ngữ cảnh, hủy            |
| `#inventory-readout`, `.hud-readout`, `#score`   | hud/compact-inventory      | tài nguyên, xu, tiến trình/tạm dừng trong kho    |
| `.portrait-frame`, `#hud-avatar`                 | hud                        | chân dung lấy từ rig đang mặc                    |
| `#chapter`, `#hud-time`                          | hud/panels                 | tên vùng, giờ; tabular numerals                  |
| `#toast`                                         | feedback                   | hiện/ẩn, thông báo qua aria-live                 |
| `article`, `#welcome`                            | panels                     | màn chào, CTA và cài đặt                         |
| `dialog`, `.dialog-content`                      | panels                     | modal và lớp backdrop                            |
| `.dialog-heading`, `.dialog-actions`             | panels                     | tiêu đề, đóng, hành động                         |
| `.pause-emblem`, `#pause-menu`                   | panels                     | biểu tượng và trạng thái tạm dừng                |
| `.setting-row`, `.quality-options`               | panels                     | hàng cài đặt, nhóm chọn chất lượng               |
| `.camp-dialog`                                   | inventory                  | kho đồ, dựng trại, hoạt động rộng                |
| `.wardrobe`, `.gear-slot`                        | inventory                  | xem trước toàn thân, từng slot                   |
| `.gear-options button`                           | inventory                  | chọn/không chọn, hover/focus kế thừa             |
| `.gear-icon`, `.gear-hat/shirt/pants/backpack`   | inventory                  | hình slot, màu catalog                           |
| `.fish-entry`, `.fish-entry.caught`              | inventory                  | chưa khám phá/đã bắt, số lượng                   |
| `.recipe`                                        | inventory                  | công thức, đủ/thiếu vật liệu, disabled           |
| `.trade-tabs`, `.trade-row`                      | panels                     | mua/bán, dòng cá/món ăn                          |
| `.chest-columns`, `.chest-items`                 | panels                     | hai kho, chuyển từng chồng/tất cả                |
| `.pixel-icon`                                    | base                       | SVG 16×16, đa số currentColor                    |
| Thanh lực và tiến độ câu cá                      | canvas, không có class DOM | vàng/đỏ lực dây, xanh tiến độ                    |

Nút khóa dùng `disabled`, không có class `.locked` riêng.
Nút nguy hiểm chưa có component riêng; chưa thêm `.danger` vào game trong nhiệm vụ này.
Tab mua/bán hiện dùng nút disabled cho tab đang mở, chưa phải ARIA tablist hoàn chỉnh.
Thanh tiến độ hiện có là canvas câu cá, không có component DOM progressbar sẵn.
Không mô tả trạng thái chưa có như đã hỗ trợ; dùng mẫu đề xuất ở phần sau.

### Hợp đồng trạng thái

- Mặc định: nhãn là động từ hoặc tên lựa chọn rõ ràng.
- Hover: đổi nền theo token của chính component, không dịch bố cục.
- Focus-visible: viền vàng có offset, không xóa outline để làm đẹp.
- Pressed: `:active` hoặc `.held`, dịch 2px và bóng cứng ngắn lại.
- Disabled: thuộc tính thật, giảm `--opacity-disabled` = 0,5, không chỉ đổi màu.
- Đang chọn: `aria-pressed`, kèm chữ “Đang mặc” hoặc “Đang dùng” nếu có.
- Thành công/lỗi: nêu kết quả và cách xử lý; không chỉ có chấm xanh/đỏ.
- Loading: mẫu tương lai, có chữ “Đang…” và ngăn gửi trùng, chưa có trong gameplay.

## Hộp thoại đang có

| Màn       | ID               | Điểm mở / nội dung                               |
| --------- | ---------------- | ------------------------------------------------ |
| Tạm dừng  | `pause-menu`     | P/nút pause; tiếp tục, cài đặt, về đầu đường mòn |
| Cài đặt   | `settings-menu`  | chất lượng, toàn màn hình, câu cá dễ             |
| Kho đồ    | `inventory-menu` | ba nhóm vật liệu, trang bị và cá                 |
| Dựng trại | `build-menu`     | danh mục công thức, đủ/thiếu vật liệu            |
| Cửa hàng  | `activity-menu`  | markup `ActivityUI.ts`, mua/bán                  |
| Nấu ăn    | `activity-menu`  | cá nướng, canh, ăn món có sẵn                    |
| Rương     | `activity-menu`  | markup `ChestUI.ts`, chuyển hai chiều            |

Cửa hàng/nấu ăn/rương dùng chung vỏ modal và thay tiêu đề/nội dung, không là ba bản dialog.
GameUI chỉ hiển thị và phát lệnh; kiểm tra giao dịch thuộc domain/system.
Không sao chép HTML menu để xây một phiên bản gameplay thứ hai.
Trang `?styleguide` dựng mẫu bằng GameUI/ActivityUI/ChestUI thật với dữ liệu tạm.
Iframe mẫu không nạp game, không lưu localStorage và không gọi Firebase.
Nút lựa chọn ngoài iframe cho phép mở từng modal mà không cần chơi đến công trình.

## Responsive và cảm ứng

HUD gọn đã áp dụng theo `HUD-COMPACT-PROPOSAL.md`; `compact.css` và `compact-inventory.css`
là lớp cuối sau các component gốc. Token `--hud-*` dùng CSS pixel, không tăng theo root font.

| Điều kiện                          | Bố cục                                                          |
| ---------------------------------- | --------------------------------------------------------------- |
| PC thông thường                    | Hai ô Kho đồ/Dựng trại 40×40 góc trái; đồng hồ và menu góc phải |
| `pointer: coarse` hoặc rộng ≤600px | Ô menu 44×44; trái/phải, nhảy và tương tác 56×56                |
| Cao ≤500px và rộng ≤1024px         | Dùng điều khiển chạm cho điện thoại nằm ngang                   |
| ≥1600×800 / ≥2560×1200             | Root font menu 18px / 24px; HUD vẫn giữ kích thước cố định      |

PC ẩn các nút di chuyển cảm ứng, giữ A/D, mũi tên, Space, E/I/B/P.
PC chỉ hiện nút E khi có ngữ cảnh; vị trí theo chân nhân vật trong camera, chặn gần mép màn hình.
Điện thoại giữ nút tương tác phía trên Nhảy; nút Hủy hiện khi câu cá hoặc đặt công trình.
Hủy có vùng bấm tối thiểu 44×44. Các nút giữ pointer capture và hỗ trợ nhiều ngón tay.
Không có belt lớn giữa đáy màn hình. Cài đặt mở từ menu tạm dừng hoặc màn chào.
Tên vùng/hồ hiện 2,6 giây khi đổi vùng trong lúc chơi; đồng hồ luôn ở góc phải.
Timer UI được dọn khi scene hủy, không điều khiển thời gian mô phỏng.

Kho đồ là dialog cạnh trái, bắt đầu dưới lối tắt; rộng tối đa 352px, chừa 12px quanh màn hình.
Nội dung dài cuộn trong dialog, kể cả màn 844×390; không làm trang tràn ngang.
Chân dung, gỗ/đá/xu và trạng thái tạm dừng nằm trong kho đồ.
Ba nút nhóm Vật liệu/Trang bị/Cá có `aria-pressed`, dùng Tab + Enter/Space bản địa.
Trang bị xếp sáu cột bằng hình slot và màu catalog, vẫn có tên truy cập/title.
Chọn để mặc ngay, giữ focus sau cập nhật DOM; dòng chi tiết đọc tên và trạng thái đang mặc.
Cá xếp ba cột, giữ số lượng hiện có và thống kê bộ sưu tập/lớn nhất; không đổi sức chứa Save.
Bảng dựng trại và hoạt động giữ danh mục/giao dịch hiện có.

Dùng `env(safe-area-inset-*)` cho các cụm mép màn hình; không scale cả lớp DOM bằng transform.
Các điều kiện media giữ literal vì custom property không dùng được như breakpoint CSS chuẩn.
Chưa kiểm Safari hoặc điện thoại cảm ứng thật; Chrome mô phỏng viewport không thay thế kiểm thiết bị.

## Bàn phím và khả năng tiếp cận

Dùng `<dialog>.showModal()` để có top layer, backdrop và focus trap bản địa.
Mỗi modal có `aria-labelledby` trỏ tiêu đề; nút đóng dùng aria-label có nghĩa.
`Esc` đi qua callback đóng của GameUI để đồng bộ trạng thái pause.
Modal đóng quay về menu tạm dừng theo luồng hiện có; nút Tiếp tục mới chạy game lại.
Focus vào phần tử autofocus hoặc phần tử tương tác đầu tiên; trả focus về điểm mở khi đóng.
Trình duyệt cung cấp phục hồi focus; nội dung động cần kiểm lại khi điểm mở bị thay DOM.
Không tự tuyên bố mọi đường focus đã đạt WCAG nếu chưa kiểm từng đường.
Toast `role=status`, `aria-live=polite`; không cướp focus khi báo kết quả.
Icon trang trí dùng `aria-hidden`; ảnh chân dung có alt phù hợp.
Chữ không tràn bằng cách giảm nhỏ vô hạn; ưu tiên ngắt dòng và cuộn modal.

### Tương phản đo từ token thực tế

Công thức WCAG sRGB: tuyến tính hóa từng kênh, tính Y = 0,2126R + 0,7152G + 0,0722B.
Tỉ lệ = (Y sáng + 0,05)/(Y tối + 0,05); chữ thường cần tối thiểu 4,5:1.
Hàm thuần và test: `domain/design/contrast.ts`; báo cáo lặp lại bằng `tooling/contrastReport.ts`.
Bảng dưới dùng màu đục; không tính trạng thái disabled hoặc nền alpha chồng cảnh động.

| Cặp đang dùng                                                                             | Token chữ / nền                                  |  Tỉ lệ | Chữ thường   |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------ | -----: | ------------ |
| Chữ chính / giấy                                                                          | `--ink` / `--paper`                              | 7.61:1 | Đạt          |
| Nút phụ                                                                                   | `--cream` / `--pine`                             | 5.62:1 | Đạt          |
| Nút chính                                                                                 | `--ink` / `--gold`                               | 6.21:1 | Đạt          |
| Mô tả / giấy                                                                              | `--text-body` / `--paper`                        | 4.46:1 | **Dưới 4,5** |
| Chú thích / giấy                                                                          | `--text-caption` / `--paper`                     | 3.22:1 | **Dưới 4,5** |
| Gợi ý / giấy                                                                              | `--text-hint` / `--paper`                        | 3.27:1 | **Dưới 4,5** |
| Đã trang bị                                                                               | `--text-gear-selected` / `--gear-selected`       | 4.06:1 | **Dưới 4,5** |
| Gợi ý trang bị                                                                            | `--text-gear-hint` / `--surface-gear`            | 3.74:1 | **Dưới 4,5** |
| Cá chưa khám phá                                                                          | `--text-undiscovered` / `--surface-undiscovered` | 2.82:1 | **Dưới 4,5** |
| Gợi ý cá                                                                                  | `--text-fish-hint` / `--surface-undiscovered`    | 3.29:1 | **Dưới 4,5** |
| Tên vùng                                                                                  | `--text-region` / `--surface-region`             | 4.64:1 | Đạt          |
| Thông báo                                                                                 | `--text-toast` / `--surface-toast`               | 7.38:1 | Đạt          |
| Những cặp dưới ngưỡng là nợ hiện có, **không tự đổi màu trong đợt này**.                  |
| Chữ lớn có ngưỡng khác, nhưng nhiều dòng phụ hiện nhỏ nên không áp dụng ngoại lệ chữ lớn. |
| Màu nhiều tông trong icon không thay thế nhãn chữ; dùng thêm trạng thái bằng văn bản.     |
| Cần đo riêng nền alpha trên cảnh tối/sáng trước khi kết luận tương phản cho nút cảm ứng.  |

## Giọng văn

Tiếng Việt có dấu, câu ngắn, ấm và trực tiếp; ưu tiên động từ trước đối tượng.
Thông báo lỗi phải nói người chơi có thể làm gì tiếp theo, tránh chỉ ghi “Lỗi”.
Không dùng thuật ngữ shader, texture, DOM hoặc database trong hành trình chơi thông thường.

| Câu thật trong game                            | Vai trò / nguồn               |
| ---------------------------------------------- | ----------------------------- |
| “Dừng chân. Dựng trại.”                        | Màn chào, index.html          |
| “Bước vào khu rừng →”                          | CTA bắt đầu                   |
| “Cài đặt”                                      | Nút menu                      |
| “Đang tạm dừng”                                | Tiêu đề pause                 |
| “Chuyến đi sẽ tiếp tục khi bạn sẵn sàng.”      | Nội dung pause                |
| “Tiến trình được lưu trên thiết bị này.”       | Cam kết lưu hiện có           |
| “Tiếp tục”                                     | Hành động pause               |
| “Về đầu đường mòn”                             | Hành động quay lại            |
| “Kho đồ”                                       | Tiêu đề kho                   |
| “Trang bị của bạn”                             | Xem trước nhân vật            |
| “Đang mặc”                                     | Trạng thái trang bị           |
| “Trang bị”                                     | Hành động đổi món             |
| “Dựng trại”                                    | Mở công thức                  |
| “Thiếu”                                        | Công thức thiếu vật liệu      |
| “Chưa có cá để bán.”                           | Trạng thái trống cửa hàng     |
| “Bán tất cả trừ cá kỷ lục”                     | Thao tác bán có phạm vi       |
| “Đã chuyển vật phẩm.”                          | Toast thành công              |
| “Chưa thể thực hiện. Kiểm tra xu và vật phẩm.” | Toast lỗi có cách khắc phục   |
| “Giữ KÉO · Thả để chùng dây”                   | Hướng dẫn câu cá trong canvas |
| “Đang chờ cá…”                                 | Trạng thái câu cá             |

Các dòng có dữ liệu động phải giữ đúng đơn vị: xu, gỗ, đá, cm, ô.
Không thêm thông báo tài khoản/cloud khi chức năng chưa tồn tại.

## Mẫu biểu mẫu tương lai — chỉ định nghĩa

Chưa có đăng nhập username/mật khẩu, lưu đám mây hoặc co-op trong game.
Không thêm Firebase Auth, endpoint hay lưu mật khẩu để làm mẫu.
Các mẫu sau là hợp đồng cho đợt triển khai sau, chưa có class/CSS runtime riêng.

| Mẫu dự kiến  | Cấu trúc và trạng thái phải có                                                    |
| ------------ | --------------------------------------------------------------------------------- |
| Ô nhập       | label hiển thị, input có id/name; bình thường, focus, disabled, lỗi               |
| Gợi ý        | đoạn text nối `aria-describedby`, nói định dạng và giới hạn                       |
| Lỗi ô        | text có dấu, `aria-invalid=true`, giữ giá trị đã nhập                             |
| Mật khẩu     | autocomplete đúng; nút “Hiện mật khẩu” / “Ẩn mật khẩu”, aria-pressed              |
| Username     | nhãn “Tên đăng nhập”; không tự đổi thành email nếu yêu cầu chưa đổi               |
| Gửi biểu mẫu | CTA rõ, “Đang đăng nhập…” khi chờ, chống gửi trùng                                |
| Danh sách    | hàng có tên, mô tả, trạng thái và thao tác; không chỉ icon                        |
| Xác nhận     | tiêu đề nói hậu quả, nút Hủy và động từ cụ thể; focus ưu tiên Hủy nếu mất dữ liệu |
| Mã phòng     | label “Mã mời”, gợi ý định dạng, lỗi giải thích cách nhập lại                     |
| Thành viên   | tên, chủ phòng/sẵn sàng/đang chờ bằng chữ; nút có nhãn đầy đủ                     |
| Đồng bộ      | “Đang lưu…” / “Đã lưu” / “Chưa lưu được. Thử lại.”, không báo sai thành công      |

Component mới dùng `--tap-min`, `--border`, `--surface-paper`, `--text-primary`, `--focus-ring`.
Nút nguy hiểm chỉ cho hành động có hậu quả; không làm mọi nút phụ trông như cảnh báo.
Phải duyệt màu error/danger trước khi áp dụng thật; alias hiện tại không phải thiết kế cuối.

### Ví dụ cấu trúc cho đợt triển khai sau

Đây là ví dụ trong tài liệu, chưa gắn vào DOM game; class `field` là tên đề xuất.

```html
<div class="field">
  <label for="username">Tên đăng nhập</label>
  <input id="username" name="username" autocomplete="username" aria-describedby="username-help" />
  <p id="username-help">Nhập tên đăng nhập của bạn.</p>
</div>
<div class="field">
  <label for="password">Mật khẩu</label>
  <input id="password" name="password" type="password" autocomplete="current-password" />
  <button type="button" aria-controls="password" aria-pressed="false">Hiện mật khẩu</button>
</div>
```

Mã mời dùng cùng cấu trúc label/input/gợi ý, không dùng placeholder thay label.
Hộp xác nhận dùng vỏ dialog thật, tiêu đề và hai nút “Hủy” / động từ nêu hậu quả.

## Chuyển động DOM và bảo vệ tự động

Baseline không có transition/animation DOM; đợt này không tự thêm chuyển động.
Nếu thêm sau: 120–180ms, `steps(2, end)`, không dùng blur/zoom toàn màn hình.
`prefers-reduced-motion: reduce` tắt animation/transition DOM và cuộn mượt.
Game clock và lựa chọn Đẹp/Tiết kiệm là cơ chế khác, không sửa cùng CSS media.
`lint:css` chạy trong check: màu trực tiếp, z-index cứng, kích thước mỹ thuật cứng bị chặn.
Gradient CSS, góc không vuông và bóng blur kể cả qua token bị chặn.
Prettier quyết định định dạng; stylelint không tranh dấu nháy, dòng trống, hex rút gọn hay media range.
CSS còn 3 warning legacy: controls (prefix Safari), inventory (specificity); override responsive không còn phát sinh warning.
Chú thích `legacy: dọn sau` và override đều chỉ đúng file/rule; ESLint legacy được báo riêng.

## Ngoại lệ và duyệt thay đổi

HTML giữ chín fill SVG: gỗ ba tông, đá hai tông, lều/cá/ghim/bánh răng có nét tối riêng.
Giá trị đóng: a77a4b, e8c98b, 6c4b32, 7f9589, c4d2b4, 354e3c (ba lần), 273d32.
Meta theme-color giữ 233d36 để không đổi màu thanh trình duyệt/PWA.
Không đổi các nét đó sang currentColor làm mất độ nổi khối của icon.
Đổi luật “không bao giờ”, tên vai trò hoặc thêm ngoại lệ phải cập nhật tài liệu và guard cùng nhau.
Duyệt bằng `?styleguide` và `?gallery`; cả hai chỉ DEV, không có trong bundle production.
Đợt này không thay gameplay, Save, Firebase hoặc tính năng tương lai.

## Điều khiển dưới nước

Giữ S/↓ để lặn, W/↑/Space để nổi. Nhấn lên khi đã ở mặt nước để nhảy ra bờ/lối gỗ.
Điện thoại có nút Lặn chỉ xuất hiện trong vùng nước; nút Nhảy đổi thành Nổi lên khi đang bơi.
Hai nút hỗ trợ giữ đồng thời với trái/phải, dọn trạng thái khi pointercancel, mất capture hoặc mở menu.
`#water-status` là chỉ dẫn nhỏ phía trên, không chặn pointer. Thanh hơi thở pixel nằm trên nhân vật
khi đầu chìm; hết hơi có chữ cảnh báo và tự nổi, không chỉ báo bằng màu.
Tương tác câu cá/công trình bị khóa khi bơi, nút có nhãn Đang bơi; lên bờ/lối gỗ để dùng lại.
Cài đặt, kho đồ và pause vẫn dừng mô phỏng gồm hơi thở, cá và thời gian hồi đàn.
