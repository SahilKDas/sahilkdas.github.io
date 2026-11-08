// The crossing. Two full-frame hyperspace jumps with a drop-out between them,
// drawn entirely in one fragment shader from a single uniform: the scroll
// progress through the pin.
//
// Polar rather than cartesian, because everything the jump needs falls out of
// polar space for free — stars converge toward the arch point, streaks elongate
// along the radius, and the tunnel throat is just the inner radius. Canvas 2D
// cannot do the two things that make it read as MOTION rather than as drawn
// lines: a per-pixel radial motion blur, and a chromatic split that grows with
// radius and speed. Those need per-pixel sampling.
//
// Nothing here reads a clock. The whole frame is a pure function of u_p, so a
// scrub landing on the same progress renders the same pixels in both directions.

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2 u_res;     // device pixels
uniform vec2 u_center;  // convergence point, y-down device pixels
uniform float u_p;      // progress through the crossing pin, 0..1

#define TAU 6.2831853

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// One star, measured in device pixels rather than in cell units: a cell is a
// wedge, so without the conversion every star would balloon with radius instead
// of holding a real size on screen.
float star(
  float au, float v, float lay, float cellsA, float cellsR,
  float rn, float reach, float streak, float tw
) {
  vec2 id = vec2(floor(au), floor(v));
  id.x = mod(id.x, cellsA); // the +x seam has to be the same cell from both sides
  float n = hash21(id + lay * 37.0);
  if (n < 0.5) return 0.0;

  vec2 gv = vec2(fract(au), fract(v)) - 0.5;
  vec2 off = vec2(fract(n * 41.0), fract(n * 97.0)) - 0.5;
  vec2 d = gv - off;
  float mag = fract(n * 313.0);

  float r = max(rn, 0.02) * reach;
  float px = d.x * (TAU / cellsA) * r;                                  // tangential
  float py = d.y * (2.0 * sqrt(max(rn, 0.004)) / cellsR) * reach;       // radial
  float wid = 0.9 + mag * 1.5;
  float len = wid + streak * r;  // outer stars whip past longer than inner ones

  float b = smoothstep(1.0, 0.0, length(vec2(px / wid, py / len)));
  return b * (0.25 + 0.75 * mag) * (0.74 + 0.26 * sin(n * 121.0 + tw));
}

// Three depth layers, each sampled five times back along its own radial trail.
// The taps double as the chromatic split: shifting each channel's weight kernel
// along the trail fringes the streak ends without paying for extra samples.
vec3 tunnel(float ang, float rn, float reach, float vel, float travel, float tw) {
  vec3 acc = vec3(0.0);
  vec3 wsum = vec3(0.0001);
  float smear = 0.04 + vel * 1.9;
  float ca = (0.03 + 0.32 * vel) * smoothstep(0.05, 0.9, rn);

  for (int L = 0; L < 3; L++) {
    float lay = float(L);
    float cellsA = 150.0 + lay * 78.0;
    float cellsR = 9.0 + lay * 3.4;
    float speed = 1.0 - lay * 0.31;
    float bright = 1.0 - lay * 0.26;
    float au = ang * cellsA;
    float base = sqrt(max(rn, 0.0)) * cellsR - travel * speed;
    float streak = vel * 0.55 * speed;

    for (int k = 0; k < 5; k++) {
      float tk = float(k) * 0.25;
      vec3 wc = vec3(
        max(0.0, 1.0 - abs(tk + ca) * 1.1),
        max(0.0, 1.0 - abs(tk) * 1.1),
        max(0.0, 1.0 - abs(tk - ca) * 1.1)
      );
      float s = star(au, base - tk * smear, lay, cellsA, cellsR, rn, reach, streak, tw + lay);
      acc += s * wc * bright;
      if (L == 0) wsum += wc;
    }
  }
  return acc / wsum;
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

// Three octaves. Cloud bands read as bands from the noise's low frequency, not
// from its detail, so paying for more would only cost fill rate.
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    s += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return s;
}

// One world, shaded in place. At this size a lit disc with a reconstructed
// sphere normal and a raymarched ball are the same pixels, so the disc wins:
// z = sqrt(1 - x² - y²) gives the normal, Lambert off a fixed sun gives the
// terminator, and the fresnel term gives both the thin limb and the outer halo.
// cov comes back as the disc's coverage so the caller can occlude the stars.
vec3 planet(
  vec2 uv, vec2 pc, float rad, float reach,
  vec3 base, vec3 atmo, float bands, float seed, out float cov
) {
  cov = 0.0;
  vec2 d = (uv - pc) / rad;
  float r = length(d);
  if (r > 2.0) return vec3(0.0);   // outside the halo bound entirely

  // Edge width in disc units, from the radius in device pixels. No derivatives:
  // OES_standard_derivatives is not guaranteed on WebGL1.
  float aa = 1.5 / max(rad * reach, 1.0);
  float disc = smoothstep(1.0 + aa, 1.0 - aa, r);

  vec3 L = normalize(vec3(-0.62, -0.46, 0.64)); // y-down, so the sun is up-left
  float z = sqrt(max(0.0, 1.0 - min(r * r, 1.0)));
  vec3 n = vec3(d, z);

  // Latitude bands, warped along longitude so they read as flow rather than
  // as stripes ruled across a ball.
  float lon = atan(n.x, max(n.z, 0.001));
  float warp = fbm(vec2(lon * 1.6 + seed, n.y * 3.0 + seed)) - 0.5;
  float band = 0.5 + 0.5 * sin(n.y * bands + warp * 2.4);
  float storm = fbm(vec2(lon * 2.4 + seed * 5.0, n.y * 5.0 + seed));
  vec3 surf = base * (0.62 + 0.5 * band) * (0.78 + 0.42 * storm);

  float lam = max(0.0, dot(n, L));
  // A hair of ambient: the night side has to sit above the ink, not vanish
  // into it, or the sphere loses its silhouette.
  vec3 col = surf * (pow(lam, 0.85) * 1.3 + 0.035);

  // Atmosphere. A thin bright limb where the air is lit edge-on, plus a soft
  // halo outside the disc that only lights on the sun side.
  float fres = pow(1.0 - z, 3.0);
  col += atmo * fres * disc * (0.2 + 1.5 * lam) * 0.85;

  float halo = (1.0 - disc) * exp(-max(0.0, r - 1.0) * 6.0);
  float sunSide = 0.3 + 0.7 * max(0.0, dot(d / max(r, 0.001), L.xy));

  cov = disc;
  return col * disc + atmo * halo * sunSide * 0.5;
}

void main() {
  // y-down, so every uniform can be passed straight from layout space.
  vec2 frag = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec2 rel = frag - u_center;
  float reach = length(u_res) * 0.5;
  float rn = length(rel) / reach;
  float ang = atan(rel.y, rel.x) / TAU + 0.5;

  float p = clamp(u_p, 0.0, 1.0);

  // The beats, all shaped off p alone:
  //   0.00–0.38  jump one — gather, ignite, then decelerate hard back to points
  //   0.38–0.84  the drop-out — calm starfield, worlds drifting past
  //   0.84–1.00  jump two — re-ignition, shockwave, white flood full at p = 1
  float appear = smoothstep(0.0, 0.023, p);
  float gather = smoothstep(0.0, 0.05, p) * (1.0 - smoothstep(0.045, 0.10, p));

  // Two ignitions. The first is cut off sharply over 0.34–0.40, and that fall
  // IS the exit: streak length rides vel, so the trails snap back into points.
  // The second is a shorter, harder window — the jump has to slam, not ramp.
  float ign1 = pow(smoothstep(0.055, 0.34, p), 2.2);
  float ign2 = pow(smoothstep(0.84, 0.97, p), 1.5);
  float vel = max(ign1 * (1.0 - smoothstep(0.34, 0.40, p)), ign2);

  // Travel accumulates rather than tracking vel: when the first jump brakes the
  // field has to stop, not reverse back down the tunnel.
  float travel = ign1 * 10.0 + ign2 * 20.0 - gather * 0.9;  // negative = inward

  float blow = smoothstep(0.86, 1.0, p);
  // The drop-out flash, one frame-wide bloom as the streaks collapse.
  float drop = max(0.0, 1.0 - abs(p - 0.372) / 0.038);
  drop *= drop;
  // The planet beat, faded in behind that flash and out under the second one.
  float pw = smoothstep(0.36, 0.44, p) * (1.0 - smoothstep(0.79, 0.86, p));

  vec3 chan = tunnel(ang, rn, reach, vel, travel, p * 24.0);

  // Deep indigo points at rest, cyan-white streaks mid, white-hot at peak. The
  // hot end leans off green so the chromatic split fringes violet, not gold.
  vec3 tint = mix(vec3(0.44, 0.56, 1.14), vec3(0.72, 0.92, 1.0), smoothstep(0.02, 0.4, vel));
  tint = mix(tint, vec3(1.0, 0.95, 1.0), smoothstep(0.35, 0.95, vel));
  vec3 col = chan * tint * appear * (1.0 - 0.4 * gather);

  // Depth fog: the throat stays dark until the blowout lights it from inside.
  col *= smoothstep(0.0, 0.3, rn) + blow * 0.9;
  col += mix(vec3(0.5, 0.7, 1.0), vec3(1.0, 0.97, 0.92), smoothstep(0.2, 0.8, vel))
    * pow(max(0.0, 1.0 - rn), 4.0) * (0.12 * vel + 1.7 * blow);

  // Vignette, tightening as speed builds so the eye is compressed toward centre.
  col *= mix(1.0, smoothstep(1.35, 0.3, rn), 0.3 + 0.4 * vel);

  // Dropping out. The tunnel blows out once as it brakes, and the frame is left
  // on a near-still starfield.
  col += vec3(0.82, 0.92, 1.0) * drop * (0.16 + 1.3 * pow(max(0.0, 1.0 - rn), 3.0));

  // Then the worlds, composited far to near so the giant occludes the rest.
  // Their positions are functions of p, so a scrub drifts them deterministically.
  if (pw > 0.001) {
    vec2 uv = rel / reach;
    float q = clamp((p - 0.38) / 0.46, 0.0, 1.0);
    float cov;
    vec3 world;

    world = planet(uv, vec2(-0.10 + q * 0.05, 0.45 - q * 0.03), 0.045, reach,
      vec3(0.36, 0.42, 0.56), vec3(0.50, 0.70, 1.0), 7.0, 3.7, cov);
    col = col * (1.0 - cov * pw) + world * pw;

    world = planet(uv, vec2(-0.62 + q * 0.10, -0.28 + q * 0.03), 0.115 + q * 0.012, reach,
      vec3(0.55, 0.58, 0.66), vec3(0.58, 0.75, 1.0), 4.0, 11.3, cov);
    col = col * (1.0 - cov * pw) + world * pw;

    // The gas giant: big enough to own its side of frame, drifting across and
    // approaching slightly, which is the whole establishing shot.
    world = planet(uv, vec2(0.86 - q * 0.42, 0.20 - q * 0.06), 0.52 + q * 0.10, reach,
      vec3(0.80, 0.63, 0.42), vec3(0.45, 0.68, 1.0), 13.0, 1.9, cov);
    col = col * (1.0 - cov * pw) + world * pw;
  }

  // Shockwave, out of the centre ahead of the flood: a hard front with the glow
  // trailing behind it, rather than a symmetrical band that reads as a ring.
  float ringR = pow(blow, 0.42) * 1.9;
  float ringAmp = smoothstep(0.0, 0.12, blow) * (1.0 - smoothstep(0.34, 0.8, blow));
  float rd = ringR - rn;
  col += vec3(0.9, 0.95, 1.0) * smoothstep(0.0, 0.03, rd) * smoothstep(0.3, 0.0, rd) * ringAmp * 0.7;

  // Then the frame floods white from the core outward, full-frame by p = 1.
  float floodR = smoothstep(0.55, 1.0, blow) * 2.1;
  col = mix(col, vec3(1.0), smoothstep(0.0, 1.0, (floodR - rn) / 0.6));

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    // A silent failure here just quietly demotes the scene to its 2D painter,
    // which is exactly the sort of thing that ships unnoticed.
    if (import.meta.env.DEV) {
      console.warn("hyperspace shader:", gl.getShaderInfoLog(sh));
    }
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/**
 * Returns null when WebGL is unavailable, so the scene can fall back to its 2D
 * painter rather than showing an empty frame.
 */
export function createHyperspace(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const loc = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = {
    res: gl.getUniformLocation(prog, "u_res"),
    center: gl.getUniformLocation(prog, "u_center"),
    p: gl.getUniformLocation(prog, "u_p"),
  };

  let w = 0;
  let h = 0;
  let dpr = 1;

  return {
    /** `p` is the pin progress. Nothing else: the frame is a function of it. */
    draw(p: number) {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw === 0 || ch === 0) return;

      // 0.8x of a capped DPR. The radial blur is doing more smoothing than any
      // sampling rate would, so the missing pixels never surface.
      if (cw !== w || ch !== h) {
        w = cw;
        h = ch;
        dpr = Math.min(window.devicePixelRatio || 1, 2) * 0.8;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      // Camera shake, peaking on the two jumps — the drop-out and the second
      // ignition — and quiet through the planet beat between them. Driven off p
      // rather than a clock so reverse scrub shakes identically.
      const amp =
        (Math.max(0, 1 - Math.abs(p - 0.36) / 0.09) * 1.9 +
          Math.max(0, 1 - Math.abs(p - 0.9) / 0.1) * 2.6) *
        dpr;
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform2f(
        u.center,
        w * 0.5 * dpr + Math.sin(p * 80) * amp,
        h * 0.46 * dpr + Math.cos(p * 67) * amp * 0.7,
      );
      gl.uniform1f(u.p, p);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    // The context itself is deliberately left alive: a canvas only ever hands
    // out one context, so losing it would leave a remount (StrictMode's second
    // pass) with neither WebGL nor a 2D fallback.
    destroy() {
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    },
  };
}
