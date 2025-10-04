import { useEffect, useRef } from 'react';

interface GalaxyProps {
  className?: string;
  /** Intensidade geral do efeito (0 a 1). Padrão: 0.15 (bem leve) */
  opacity?: number;
  /** Máximo de estrelas em 1920x1080. Escala por área. Padrão: 90 */
  maxStars?: number;
  /** Cor base das estrelas. Padrão: #ffffff */
  color?: string;
  /** Habilita cintilação lenta. Padrão: true (leve) */
  twinkle?: boolean;
  /** Velocidade do drift imperceptível (px/s). Padrão: 2 */
  driftSpeed?: number;
}

type Star = {
  x: number;
  y: number;
  r: number; // raio em px
  baseA: number; // alpha base
  twPhase: number; // fase de cintilação
  twSpeed: number; // velocidade da cintilação
};

/**
 * Fundo Galaxy extremamente leve: canvas 2D com poucas estrelas, cintilação sutil
 * e drift quase imperceptível. Sem dependências. Pensado para -z-10 e pointer-events-none.
 */
export default function Galaxy({
  className = '',
  opacity = 0.15,
  maxStars = 90,
  color = '#ffffff',
  twinkle = true,
  driftSpeed = 2
}: GalaxyProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const driftOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Estrelas escaladas pela área, limitadas por maxStars
      const areaRef = 1920 * 1080;
      const currentArea = Math.max(1, w * h);
      const targetCount = Math.max(20, Math.floor((currentArea / areaRef) * maxStars));

      const stars: Star[] = [];
      for (let i = 0; i < targetCount; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 0.9 + 0.4, // 0.4–1.3 px
          baseA: 0.4 + Math.random() * 0.6, // base alpha antes do opacity global
          twPhase: Math.random() * Math.PI * 2,
          twSpeed: 0.2 + Math.random() * 0.4 // bem lento
        });
      }
      starsRef.current = stars;
    };

    const draw = (t: number) => {
      if (!canvas) return;
      const ctx2 = ctx;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // Throttle leve (cerca de ~45fps máx)
      const dtMs = t - lastTimeRef.current;
      if (dtMs < 22) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      lastTimeRef.current = t;

      // Drift quase imperceptível para dar vida
      const dtSec = dtMs / 1000;
      const drift = prefersReducedMotion ? 0 : driftSpeed;
      driftOffsetRef.current.x = (driftOffsetRef.current.x + drift * dtSec) % (w + 50);
      driftOffsetRef.current.y = (driftOffsetRef.current.y + drift * 0.5 * dtSec) % (h + 50);

      ctx2.clearRect(0, 0, w, h);

      // Vignette muito sutil para "galaxy" (radial gradient quase invisível)
      const g = ctx2.createRadialGradient(w * 0.6, h * 0.3, Math.min(w, h) * 0.1, w * 0.5, h * 0.5, Math.max(w, h));
      g.addColorStop(0, 'rgba(80, 140, 255, ' + (0.04 * opacity).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx2.fillStyle = g;
      ctx2.fillRect(0, 0, w, h);

      // Desenho das estrelas
      const stars = starsRef.current;
      ctx2.fillStyle = color;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        let a = s.baseA;
        if (twinkle && !prefersReducedMotion) {
          a = s.baseA * (0.75 + 0.25 * Math.sin(s.twPhase + t * 0.001 * s.twSpeed));
        }
        const finalA = Math.max(0, Math.min(1, a * opacity));
        ctx2.globalAlpha = finalA;

        // Leve blur via shadow para suavizar
        ctx2.shadowColor = color;
        ctx2.shadowBlur = 2;

        // Drift wrapped
        const dx = (s.x + driftOffsetRef.current.x) % (w + 50);
        const dy = (s.y + driftOffsetRef.current.y) % (h + 50);
        ctx2.beginPath();
        ctx2.arc(dx, dy, s.r, 0, Math.PI * 2);
        ctx2.fill();
      }
      ctx2.globalAlpha = 1;
      ctx2.shadowBlur = 0;

      rafRef.current = requestAnimationFrame(draw);
    };

    const cleanup = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      window.removeEventListener('resize', resize);
    };

    resize();
    window.addEventListener('resize', resize);
    rafRef.current = requestAnimationFrame(draw);

    return cleanup;
  }, [maxStars, opacity, color, twinkle, driftSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className={[
        'w-full h-full block pointer-events-none',
        className
      ].join(' ')}
      style={{
        // Garantir que fique atrás do conteúdo
        position: 'fixed',
        inset: 0 as unknown as number,
        zIndex: -10
      }}
    />
  );
}


