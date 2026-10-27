import pixelStyle from './tools/stylelint/pixelStyle.js';

export default {
  extends: ['stylelint-config-standard'],
  plugins: [pixelStyle],
  rules: {
    // Quy ước ID/BEM hiện có; Prettier quản lý cách viết, không đổi selector để chiều theo linter.
    'rule-empty-line-before': null,
    'at-rule-empty-line-before': null,
    'declaration-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'alpha-value-notation': null,
    'color-function-notation': null,
    'color-function-alias-notation': null,
    'color-hex-length': null,
    'color-named': 'never',
    'font-family-name-quotes': null,
    'media-feature-range-notation': null,
    'import-notation': null,
    'value-keyword-case': ['lower', {ignoreKeywords: ['crispEdges', 'currentColor', 'Nunito']}],
    'function-disallowed-list': [
      'linear-gradient',
      'radial-gradient',
      'repeating-linear-gradient',
      'repeating-radial-gradient',
    ],
    'pixel-forest/tokens': true,
  },
  overrides: [
    // legacy: dọn sau — giữ hỗ trợ chọn/chạm trên Safari, không bỏ prefix trong đợt giữ hình ảnh.
    {files: ['src/ui/styles/controls.css'], rules: {'property-no-vendor-prefix': [true, {severity: 'warning'}]}},
    // legacy: dọn sau — selector khác component; đổi thứ tự cascade không thuộc phạm vi.
    {files: ['src/ui/styles/inventory.css'], rules: {'no-descending-specificity': [true, {severity: 'warning'}]}},
    // legacy: dọn sau — thứ tự responsive theo nhóm đã có, giữ nguyên cascade.
    {files: ['src/ui/styles/responsive.css'], rules: {'no-descending-specificity': [true, {severity: 'warning'}]}},
  ],
};
