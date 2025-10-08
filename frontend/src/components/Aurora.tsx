import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Vec3 } from 'ogl';

import './Aurora.css';

interface AuroraProps {
  hue?: number;
  intensity?: number;
  speed?: number;
  forceHoverState?: boolean;
}

export default function Aurora({
  hue = 0,
  intensity = 1,
  speed = 1,
  forceHoverState = false
}: AuroraProps) {
  const ctnDom = useRef<HTMLDivElement>(null);

  const vert = /* glsl */ `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const frag = /* glsl */ `
    precision highp float;

    uniform float iTime;
    uniform vec3 iResolution;
    uniform float hue;
    uniform float intensity;
    uniform float speed;
    uniform float hover;
    varying vec2 vUv;

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for (int i = 0; i < 6; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      
      return value;
    }

    vec3 aurora(vec2 uv, float time) {
      vec2 p = uv * 2.0 - 1.0;
      p.x *= iResolution.x / iResolution.y;
      
      float t = time * speed;
      
      // Создаем несколько слоев для глубины
      vec3 color = vec3(0.0);
      
      // Основной слой
      float noise1 = fbm(p * 0.5 + vec2(t * 0.1, t * 0.05));
      float noise2 = fbm(p * 1.0 + vec2(t * 0.15, t * 0.1));
      float noise3 = fbm(p * 2.0 + vec2(t * 0.2, t * 0.15));
      
      // Создаем волнообразную форму
      float wave = sin(p.y * 3.0 + t * 0.5) * 0.5 + 0.5;
      float wave2 = sin(p.y * 5.0 + t * 0.3) * 0.3 + 0.7;
      
      // Комбинируем шум и волны
      float aurora1 = smoothstep(0.3, 0.8, noise1 * wave);
      float aurora2 = smoothstep(0.2, 0.9, noise2 * wave2);
      float aurora3 = smoothstep(0.1, 0.95, noise3);
      
      // Создаем градиент по высоте
      float heightGradient = smoothstep(-0.8, 0.8, p.y);
      
      // Базовые цвета
      vec3 baseColor1 = hsv2rgb(vec3(0.6 + hue * 0.1, 0.8, 1.0));
      vec3 baseColor2 = hsv2rgb(vec3(0.4 + hue * 0.1, 0.9, 0.8));
      vec3 baseColor3 = hsv2rgb(vec3(0.2 + hue * 0.1, 0.7, 0.6));
      
      // Смешиваем цвета
      color += baseColor1 * aurora1 * heightGradient * 0.8;
      color += baseColor2 * aurora2 * heightGradient * 0.6;
      color += baseColor3 * aurora3 * heightGradient * 0.4;
      
      // Добавляем мерцание
      float sparkle = sin(p.x * 20.0 + t * 2.0) * sin(p.y * 15.0 + t * 1.5);
      sparkle = smoothstep(0.7, 1.0, sparkle);
      color += vec3(1.0, 1.0, 1.0) * sparkle * 0.3;
      
      // Эффект hover
      if (hover > 0.0) {
        float hoverEffect = sin(p.x * 10.0 + t * 3.0) * hover * 0.5;
        color += vec3(0.5, 0.8, 1.0) * hoverEffect * hover;
      }
      
      return color * intensity;
    }

    void main() {
      vec2 uv = vUv;
      vec3 color = aurora(uv, iTime);
      
      // Добавляем виньетку
      float vignette = 1.0 - length(uv - 0.5) * 0.8;
      vignette = smoothstep(0.0, 1.0, vignette);
      color *= vignette;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  useEffect(() => {
    const container = ctnDom.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas as HTMLCanvasElement);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vert,
      fragment: frag,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Vec3(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height)
        },
        hue: { value: hue },
        intensity: { value: intensity },
        speed: { value: speed },
        hover: { value: 0 }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width * dpr, height * dpr);
      (gl.canvas as HTMLCanvasElement).style.width = width + 'px';
      (gl.canvas as HTMLCanvasElement).style.height = height + 'px';
      program.uniforms.iResolution.value.set(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    let targetHover = 0;
    let lastTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const width = rect.width;
      const height = rect.height;
      
      // Создаем зону реакции на мышь
      const centerX = width / 2;
      const centerY = height / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const maxDistance = Math.min(width, height) / 3;
      
      targetHover = Math.max(0, 1 - distance / maxDistance);
    };

    const handleMouseLeave = () => {
      targetHover = 0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    let rafId: number;
    const update = (t: number) => {
      rafId = requestAnimationFrame(update);
      const dt = (t - lastTime) * 0.001;
      lastTime = t;
      
      program.uniforms.iTime.value = t * 0.001;
      program.uniforms.hue.value = hue;
      program.uniforms.intensity.value = intensity;
      program.uniforms.speed.value = speed;

      const effectiveHover = forceHoverState ? 1 : targetHover;
      program.uniforms.hover.value += (effectiveHover - program.uniforms.hover.value) * 0.05;

      renderer.render({ scene: mesh });
    };
    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeChild(gl.canvas as HTMLCanvasElement);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [hue, intensity, speed, forceHoverState]);

  return <div ref={ctnDom} className="aurora-container" />;
}
