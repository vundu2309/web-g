import Phaser from 'phaser';

/** Tên pipeline hậu xử lý ánh sáng; đăng ký một lần cho game. */
export const LIGHT_PIPELINE = 'TerrariaLightFX';

/**
 * Nhân màu sáng lên camera thế giới. Chỉ nhân RGB; alpha giữ nguyên để vùng trong suốt không thành đen.
 * UV framebuffer có gốc dưới-trái, canvas trường sáng có gốc trên-trái: đảo Y trước khi ánh xạ.
 * uLightXform = (sx, sy, ox, oy): uv của texture ánh sáng = uv của camera × (sx, sy) + (ox, oy).
 */
const LIGHT_FRAG = [
  '#define SHADER_NAME TERRARIA_LIGHT_FS',
  'precision highp float;',
  'uniform sampler2D uMainSampler;',
  'uniform sampler2D uLight;',
  'uniform vec4 uLightXform;',
  'varying vec2 outTexCoord;',
  'void main ()',
  '{',
  '    vec4 col = texture2D(uMainSampler, outTexCoord);',
  '    vec2 screenUV = vec2(outTexCoord.x, 1.0 - outTexCoord.y);',
  '    vec2 luv = screenUV * uLightXform.xy + uLightXform.zw;',
  '    vec3 light = texture2D(uLight, luv).rgb;',
  '    gl_FragColor = vec4(col.rgb * light, col.a);',
  '}',
].join('\n');

export class LightPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  private texture: Phaser.Renderer.WebGL.Wrappers.WebGLTextureWrapper | null = null;
  private readonly xform = new Float32Array([1, 1, 0, 0]);

  constructor(game: Phaser.Game) {
    super({game, fragShader: LIGHT_FRAG});
  }

  /** Gán texture ánh sáng (null là dùng texture trắng: không đổi màu) và phép biến đổi uv. */
  setLight(texture: Phaser.Renderer.WebGL.Wrappers.WebGLTextureWrapper | null, xform: Float32Array) {
    this.texture = texture;
    this.xform.set(xform);
  }

  onDraw(renderTarget: Phaser.Renderer.WebGL.RenderTarget) {
    this.bind();
    this.set1i('uLight', 1);
    this.set4f('uLightXform', this.xform[0], this.xform[1], this.xform[2], this.xform[3]);
    this.bindTexture(this.texture ?? this.renderer.whiteTexture, 1);
    this.bindAndDraw(renderTarget);
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0);
  }
}
