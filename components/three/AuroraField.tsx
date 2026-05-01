'use client'
import {
  useRef,
  useEffect,
  useMemo,
} from 'react'
import {
  useFrame,
  useThree,
} from '@react-three/fiber'
import {
  ShaderMaterial,
  PlaneGeometry,
  Mesh,
  Color,
  AdditiveBlending,
  DoubleSide,
} from 'three'
import { useNexusStore } from '@/store/nexusStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuroraUniforms {
  [key: string]: { value: unknown }
  uTime:        { value: number  }
  uSpeed:       { value: number  }
  uTurbulence:  { value: number  }
  uOpacity:     { value: number  }
  uColorA:      { value: Color   }
  uColorB:      { value: Color   }
  uColorMix:    { value: number  }
  uResolution:  { value: [number, number] }
  uIntensity:   { value: number  }
  uQuality:     { value: number  }
}

export interface AuroraFieldProps {
  /** Z-depth position — default -1, renders behind Tesseract at 0 */
  zPosition?:     number
  /** Scale multiplier for plane — default 8, covers full viewport */
  planeScale?:    number
  /** Override mode — for testing */
  modeOverride?:  'apex' | 'haven'
  /** Quality level — default 'high' */
  quality?:       'high' | 'medium' | 'low'
}

// ─── Mode configuration ───────────────────────────────────────────────────────

interface AuroraModeConfig {
  colorA:      string   // Primary filament color
  colorB:      string   // Secondary filament color
  speed:       number   // Animation speed multiplier
  turbulence:  number   // Noise frequency scale
  opacity:     number   // Maximum fragment opacity
  intensity:   number   // Brightness multiplier
  colorMix:    number   // Color blend amount
}

const AURORA_MODES: Record<'apex' | 'haven', AuroraModeConfig> = {
  apex: {
    colorA:     '#22D3EE',   // Apex cyan — primary
    colorB:     '#0EA5E9',   // Deeper blue — secondary
    speed:      1.8,         // Fast — Commander urgency
    turbulence: 2.4,         // High frequency — tight precise filaments
    opacity:    0.15,        // Apex: slightly brighter — alert, aware
    intensity:  1.4,
    colorMix:   0.3,         // Mostly primary cyan, hint of blue
  },
  haven: {
    colorA:     '#C4A882',   // Haven warm gold — primary
    colorB:     '#92715A',   // Deeper amber — secondary
    speed:      0.4,         // Slow — Poet contemplation
    turbulence: 1.2,         // Low frequency — broad diffuse drifts
    opacity:    0.12,        // Haven: softer — ambient, warming
    intensity:  1.0,
    colorMix:   0.4,         // More color variation — warmth has texture
  },
}

// Lerp speed for uniform transitions
const LERP_FACTOR = 0.008

// ─── Shader source ────────────────────────────────────────────────────────────

const VERTEX_SHADER = /* glsl */`
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAGMENT_SHADER = /* glsl */`
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uSpeed;
uniform float uTurbulence;
uniform float uOpacity;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform float uColorMix;
uniform vec2  uResolution;
uniform float uIntensity;
uniform float uQuality;

vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j  = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

vec2 curl(vec3 p) {
  const float eps = 0.0001;
  float n1 = snoise(vec3(p.x, p.y + eps, p.z));
  float n2 = snoise(vec3(p.x, p.y - eps, p.z));
  float n3 = snoise(vec3(p.x + eps, p.y, p.z));
  float n4 = snoise(vec3(p.x - eps, p.y, p.z));
  float n5 = snoise(vec3(p.x, p.y, p.z + eps));
  float n6 = snoise(vec3(p.x, p.y, p.z - eps));
  float curlX = (n1 - n2) / (2.0 * eps) - (n5 - n6) / (2.0 * eps);
  float curlY = (n5 - n6) / (2.0 * eps) - (n3 - n4) / (2.0 * eps);
  return vec2(curlX, curlY);
}

void main() {
  vec2 uv = vUv;
  uv.x *= uResolution.x / uResolution.y;

  float t = uTime * uSpeed * 0.1;

  vec3 noiseCoord1 = vec3(uv * uTurbulence, t);
  vec2 flow1 = curl(noiseCoord1);

  vec2 flow2 = vec2(0.0);
  vec2 flow3 = vec2(0.0);

  if (uQuality > 0.4) {
    vec3 noiseCoord2 = vec3(uv * uTurbulence * 2.1 + flow1 * 0.3, t * 1.3);
    flow2 = curl(noiseCoord2) * 0.5;
  }

  if (uQuality > 0.8) {
    vec3 noiseCoord3 = vec3(uv * uTurbulence * 4.3 + flow2 * 0.2, t * 1.7);
    flow3 = curl(noiseCoord3) * 0.25;
  }

  vec2 totalFlow = flow1 + flow2 + flow3;
  float magnitude = length(totalFlow);
  float filament = exp(-magnitude * 4.0) * magnitude * 3.0;

  float colorNoise = 0.5;
  if (uQuality > 0.4) {
    colorNoise = snoise(vec3(uv * uTurbulence * 1.5, t * 0.7)) * 0.5 + 0.5;
  }

  vec3 color = mix(uColorA, uColorB, colorNoise * uColorMix);

  float cx = vUv.x - 0.5;
  float cy = vUv.y - 0.5;
  float dist = sqrt(cx*cx + cy*cy);
  float vignette = 1.0 - smoothstep(0.2, 0.8, dist);

  vec3 finalColor = color * filament * uIntensity * vignette;
  gl_FragColor = vec4(finalColor, filament * uOpacity * vignette);
}
`

// ─── Component ────────────────────────────────────────────────────────────────

export function AuroraField({
  zPosition  = -1,
  planeScale = 8,
  modeOverride,
  quality    = 'high',
}: AuroraFieldProps): React.JSX.Element {
  const mode         = useNexusStore(state => state.mode)
  const resolvedMode = modeOverride ?? mode
  const { size }     = useThree()

  // Quality to float map
  const qualityValue = useMemo((): number => {
    if (quality === 'low') return 0.0
    if (quality === 'medium') return 0.5
    return 1.0
  }, [quality])

  // Current lerp targets — mutable without re-render
  const targetConfig = useRef<AuroraModeConfig>(AURORA_MODES[resolvedMode])

  // Pre-allocated Color objects for lerp targets
  const targetColorARef = useRef(new Color(AURORA_MODES[resolvedMode].colorA))
  const targetColorBRef = useRef(new Color(AURORA_MODES[resolvedMode].colorB))

  // Build uniforms once — mutated in useFrame
  const uniforms = useMemo<AuroraUniforms>((): AuroraUniforms => {
    const cfg = AURORA_MODES[resolvedMode]
    return {
      uTime:       { value: 0 },
      uSpeed:      { value: cfg.speed },
      uTurbulence: { value: cfg.turbulence },
      uOpacity:    { value: cfg.opacity },
      uColorA:     { value: new Color(cfg.colorA) },
      uColorB:     { value: new Color(cfg.colorB) },
      uColorMix:   { value: cfg.colorMix },
      uResolution: { value: [size.width, size.height] as [number, number] },
      uIntensity:  { value: cfg.intensity },
      uQuality:    { value: qualityValue },
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Build material once
  const material = useMemo((): ShaderMaterial => new ShaderMaterial({
    vertexShader:   VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms,
    transparent:    true,
    blending:       AdditiveBlending,
    depthWrite:     false,
    depthTest:      false,
    side:           DoubleSide,
  }), [uniforms])

  // Geometry
  const geometry = useMemo((): PlaneGeometry => new PlaneGeometry(planeScale, planeScale), [planeScale])

  // Stable mesh ref
  const meshRef = useRef<Mesh>(new Mesh(geometry, material))

  // Dispose on unmount
  useEffect((): (() => void) => {
    const mat = material
    const geo = geometry
    return (): void => { mat.dispose(); geo.dispose() }
  }, [material, geometry])

  // React to mode changes
  useEffect((): void => {
    const cfg = AURORA_MODES[resolvedMode]
    targetConfig.current = cfg
    targetColorARef.current.set(cfg.colorA)
    targetColorBRef.current.set(cfg.colorB)
  }, [resolvedMode])

  // React to quality changes
  useEffect((): void => {
    uniforms.uQuality.value = qualityValue
  }, [qualityValue, uniforms])

  // Viewport resize
  useEffect((): void => {
    uniforms.uResolution.value = [size.width, size.height]
  }, [size.width, size.height, uniforms])

  useFrame((_, delta): void => {
    const dt = Math.min(delta, 0.05)
    const cfg = targetConfig.current
    const u   = uniforms

    // Advance time uniform
    u.uTime.value += dt

    // Lerp scalars
    const factor = LERP_FACTOR * 60 * dt
    u.uSpeed.value      += (cfg.speed      - u.uSpeed.value)      * factor
    u.uTurbulence.value += (cfg.turbulence - u.uTurbulence.value) * factor
    u.uOpacity.value    += (cfg.opacity    - u.uOpacity.value)    * factor
    u.uIntensity.value  += (cfg.intensity  - u.uIntensity.value)  * factor
    u.uColorMix.value   += (cfg.colorMix   - u.uColorMix.value)   * factor

    // Lerp colors
    u.uColorA.value.lerp(targetColorARef.current, factor)
    u.uColorB.value.lerp(targetColorBRef.current, factor)
  })

  return (
    // @ts-ignore
    <primitive
      object={meshRef.current}
      position={[0, 0, zPosition]}
    />
  )
}
