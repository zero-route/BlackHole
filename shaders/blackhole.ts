export const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const fragmentShader = `
precision highp float;

varying vec2 vUv;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uCamPos;
uniform float uDiskInner;
uniform float uDiskOuter;
uniform float uBlackHoleRadius;

#define STEPS 220
#define STEP_SIZE 0.12
#define PI 3.14159265359

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p *= 2.02;
    amp *= 0.5;
  }
  return v;
}

vec3 diskColor(vec3 p, float r) {
  float t = uTime * 0.05;
  float angle = atan(p.z, p.x);
  vec2 swirlUv = vec2(angle * 2.0 + r * 0.6 - t * 3.0, r * 3.0);
  float n = fbm(swirlUv * 2.0);

  float band = smoothstep(uDiskInner, uDiskInner + 0.4, r) *
               (1.0 - smoothstep(uDiskOuter - 1.0, uDiskOuter, r));

  vec3 hot = vec3(1.0, 0.95, 0.9);
  vec3 mid = vec3(0.95, 0.35, 0.85);
  vec3 cool = vec3(0.35, 0.25, 0.9);

  float innerMix = smoothstep(uDiskInner, uDiskInner + 1.5, r);
  vec3 col = mix(hot, mid, innerMix);
  col = mix(col, cool, smoothstep(uDiskOuter * 0.5, uDiskOuter, r));

  float intensity = band * (0.6 + 0.8 * n);
  return col * intensity * 2.2;
}

vec3 traceRay(vec3 ro, vec3 rd, vec2 screenUv) {
  vec3 pos = ro;
  vec3 dir = normalize(rd);
  vec3 accum = vec3(0.0);

  // dither the step size per-pixel so raymarch quantization turns into
  // fine grain noise instead of visible concentric rings (moiré banding)
  float jitter = hash(screenUv * uResolution.xy + uTime);
  float stepSize = STEP_SIZE * (0.85 + 0.3 * jitter);

  for (int i = 0; i < STEPS; i++) {
    float r = length(pos);

    if (r < uBlackHoleRadius) {
      return accum;
    }

    vec3 toCenter = -pos;
    float pull = uBlackHoleRadius * 2.2 / (r * r * r + 0.001);
    dir = normalize(dir + toCenter * pull * stepSize);

    pos += dir * stepSize;

    float diskHeight = 0.06 + 0.02 * sin(uTime * 0.3 + r);
    if (abs(pos.y) < diskHeight && r > uDiskInner && r < uDiskOuter) {
      vec3 c = diskColor(pos, r);
      float density = 1.0 - abs(pos.y) / diskHeight;
      accum += c * density * stepSize * 1.6;
    }

    if (r > uDiskOuter * 3.0) {
      break;
    }
  }

  return accum;
}

void main() {
  vec2 uv = (vUv - 0.5) * 2.0;

  // fit-to-screen: landscape widens X, portrait widens Y — keeps framing
  // consistent instead of cropping/zooming on tall phone screens
  float aspect = uResolution.x / uResolution.y;
  if (aspect < 1.0) {
    uv.y /= aspect;
  } else {
    uv.x *= aspect;
  }

  vec3 ro = uCamPos;
  vec3 forward = normalize(-ro);
  vec3 worldUp = vec3(0.0, 1.0, 0.0);
  vec3 right = normalize(cross(forward, worldUp));
  vec3 up = cross(right, forward);

  float fov = 1.1;
  vec3 rd = normalize(forward + uv.x * fov * right + uv.y * fov * up);

  vec3 color = traceRay(ro, rd, vUv);

  float star = pow(fbm(uv * 40.0 + uTime * 0.01), 20.0);
  color += vec3(star);

  color = color / (color + vec3(1.0));
  color = pow(color, vec3(0.85));

  gl_FragColor = vec4(color, 1.0);
}
`;