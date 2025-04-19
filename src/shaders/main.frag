uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uTexture;
const float L = 0.0005;
const float S = 0.13;
const float Y_SCALE = 3.0;
const float A = 40.0;
const float F = 0.043;
const float BLUR_AMOUNT = 130.0;
const float PI = 3.14159265358979323846;

#include './modules/snoise2D.glsl';
#include './modules/snoise3D.glsl';

float calc_blur(float offset) {
  const float l = 0.0018;
  const float s = 0.1;
  const float f = 0.034;

  float time = uTime * offset * 0.001;
  float noise = snoise2D(vec2(gl_FragCoord.x * l + f * time, time * s));
  float t = (noise + 1.0) / 2.0;
  t = pow(t, 1.5);
  float blur = mix(1.0, BLUR_AMOUNT, t);

  return blur;
}

float background_noise(float offset) {
  float time = uTime + offset;
  float F = 0.11 * time;
  float x = gl_FragCoord.x;
  float y = gl_FragCoord.y * Y_SCALE;

  float noise = 0.5;
  noise += snoise3D(vec3(x * L * 1.0 + F * 1., y * L * 1.00, time * S)) * 0.30;
  noise += snoise3D(vec3(x * L * 0.6 - F * 0.6, y * L * 0.85, time * S)) * 0.26;
  noise += snoise3D(vec3(x * L * 0.4 + F * 0.8, y * L * 0.70, time * S)) * 0.22;

  return clamp(noise, 0.0, 1.0);
}

float wave_noise(float offset) {
  float x = gl_FragCoord.x;
  float y = gl_FragCoord.y * Y_SCALE;
  float time = uTime + offset;

  float noise = 0.0;
  noise += snoise2D(vec2(x * (L / 1.00) + F * time, time * S * 1.00)) * A * 0.85;
  noise += snoise2D(vec2(x * (L / 1.30) + F * time, time * S * 1.26)) * A * 1.15;
  noise += snoise2D(vec2(x * (L / 1.86) + F * time, time * S * 1.09)) * A * 0.60;
  noise += snoise2D(vec2(x * (L / 3.25) + F * time, time * S * 0.89)) * A * 0.40;

  return noise;
}

float wave_alpha(float Y, float wave_height) {
  float offset = Y * wave_height;
  float wave_y = Y + wave_noise(offset) * wave_height;
  float dist = wave_y - gl_FragCoord.y;
  float blur = calc_blur(offset);
  float alpha = smoothstep(0.0, 1.0, 0.5 + dist / blur);

  return alpha;
}

void main() {
  const float WAVE1_HEIGHT = 2.0;
  const float WAVE2_HEIGHT = 3.0;
  float WAVE1_Y = 0.8 * uResolution.y;
  float WAVE2_Y = 0.35 * uResolution.y;

  float wave1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT);
  float wave2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT);

  vec3 background_color = vec3(0.102, 0.208, 0.761);
  vec3 wave1_color = vec3(0.094, 0.502, 0.910);
  vec3 wave2_color = vec3(0.384, 0.827, 0.898);
  float bg_lightness = background_noise(0.0);
  float w1_lightness = background_noise(200.0);
  float w2_lightness = background_noise(400.0);

  float lightness = bg_lightness;
  lightness = mix(lightness, w1_lightness, wave1_alpha);
  lightness = mix(lightness, w2_lightness, wave2_alpha);

  // t = gl_FragCoord.x / (uResolution.x - 1.0);
  // vec3 color = calc_color(t);

  vec3 color = background_color;
  color = mix(color, wave1_color, wave1_alpha);
  color = mix(color, wave2_color, wave2_alpha);

  // gl_FragColor = vec4(color, 1.0);
  // gl_FragColor = vec4(lightness, lightness, lightness, 1.0);
  gl_FragColor = texture(uTexture, vec2(lightness, 0.0));
}
