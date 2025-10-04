import React, { useRef } from 'react';

type MagicBentoGridProps = {
  children: React.ReactNode;
  className?: string;
};

export function MagicBentoGrid({ children, className }: MagicBentoGridProps) {
  return (
    <div
      className={
        "grid gap-6 " +
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 " +
        (className ? className : '')
      }
    >
      {children}
    </div>
  );
}

type MagicBentoCardProps = {
  children: React.ReactNode;
  accent?: 'primary' | 'accent';
  className?: string;
  spotlight?: boolean;
  spotlightRadius?: number; // px
  magnetism?: boolean;
  magnetStrength?: number; // px
  clickEffect?: boolean;
  contentClassName?: string;
  tilt?: boolean;
  tiltStrength?: number; // deg
  stars?: boolean;
  disableAnimations?: boolean;
};

export function MagicBentoCard({
  children,
  accent = 'primary',
  className,
  spotlight = true,
  spotlightRadius = 400,
  magnetism = true,
  magnetStrength = 10,
  clickEffect = true,
  contentClassName,
  tilt = false,
  tiltStrength = 8,
  stars = true,
  disableAnimations = false,
}: MagicBentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  let scaleOnPress = 1;
  let translateX = 0;
  let translateY = 0;
  let rotateX = 0;
  let rotateY = 0;

  function applyTransform(element: HTMLDivElement | null) {
    if (!element) return;
    const rotate = ` rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    element.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)` + rotate + ` scale(${scaleOnPress})`;
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const element = cardRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    // Spotlight position via CSS variables
    if (spotlight) {
      const xPct = (localX / rect.width) * 100;
      const yPct = (localY / rect.height) * 100;
      element.style.setProperty('--spot-x', `${xPct}%`);
      element.style.setProperty('--spot-y', `${yPct}%`);
      element.style.setProperty('--spot-opacity', '1');
      element.style.setProperty('--spot-radius', `${spotlightRadius}px`);
    }

    // Magnetism translate towards cursor
    if (magnetism) {
      const normalizedX = (localX - rect.width / 2) / (rect.width / 2);
      const normalizedY = (localY - rect.height / 2) / (rect.height / 2);
      translateX = Math.max(-1, Math.min(1, normalizedX)) * magnetStrength;
      translateY = Math.max(-1, Math.min(1, normalizedY)) * magnetStrength;
      const parallaxX = -Math.max(-1, Math.min(1, normalizedX)) * 6;
      const parallaxY = -Math.max(-1, Math.min(1, normalizedY)) * 6;
      const el = element as HTMLDivElement;
      el.style.setProperty('--parallax-x', `${parallaxX}px`);
      el.style.setProperty('--parallax-y', `${parallaxY}px`);
      applyTransform(element);
    }

    // Tilt effect
    if (tilt) {
      const normalizedX = (localX - rect.width / 2) / (rect.width / 2);
      const normalizedY = (localY - rect.height / 2) / (rect.height / 2);
      rotateY = Math.max(-1, Math.min(1, normalizedX)) * tiltStrength;
      rotateX = -Math.max(-1, Math.min(1, normalizedY)) * tiltStrength;
      applyTransform(element);
    }
  }

  function handleMouseLeave() {
    const element = cardRef.current;
    if (!element) return;
    element.style.setProperty('--spot-opacity', '0');
    element.style.setProperty('--parallax-x', '0px');
    element.style.setProperty('--parallax-y', '0px');
    translateX = 0;
    translateY = 0;
    scaleOnPress = 1;
    rotateX = 0;
    rotateY = 0;
    applyTransform(element);
  }

  function handleMouseDown() {
    if (!clickEffect) return;
    const element = cardRef.current;
    if (!element) return;
    scaleOnPress = 0.98;
    applyTransform(element);
  }

  function handleMouseUp() {
    if (!clickEffect) return;
    const element = cardRef.current;
    if (!element) return;
    scaleOnPress = 1;
    applyTransform(element);
  }
  const gradient =
    accent === 'primary'
      ? 'from-primary/20 via-primary/10 to-transparent'
      : 'from-accent/20 via-accent/10 to-transparent';

  return (
    <div
      ref={cardRef}
      className={
        "relative overflow-hidden rounded-xl border border-border " +
        (disableAnimations ? "" : "will-change-transform ") +
        // Glass look
        "bg-card/30 backdrop-blur-md supports-[backdrop-filter]:bg-card/20 " +
        "transition-all duration-300 ease-out hover:shadow-[0_0_0_2px_hsl(var(--primary))] " +
        "hover:translate-y-[-2px] " +
        (className ? className : '')
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className={"pointer-events-none absolute inset-0 bg-gradient-to-br " + gradient} />
      {spotlight && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[var(--spot-opacity,0)] transition-opacity duration-200"
          style={{
            background: `radial-gradient(var(--spot-radius, ${spotlightRadius}px) circle at var(--spot-x, 50%) var(--spot-y, 50%), hsl(var(--primary)/0.35), transparent 60%)`,
          } as React.CSSProperties}
        />
      )}
      {stars && (
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            transform: 'translate3d(var(--parallax-x,0px), var(--parallax-y,0px), 0)',
            backgroundImage: `radial-gradient(2px 2px at 20% 30%, hsl(var(--primary)/0.25) 50%, transparent 51%),
              radial-gradient(1.5px 1.5px at 70% 60%, hsl(var(--primary)/0.2) 50%, transparent 51%),
              radial-gradient(1.2px 1.2px at 40% 80%, hsl(var(--primary)/0.18) 50%, transparent 51%),
              radial-gradient(1.2px 1.2px at 80% 25%, hsl(var(--primary)/0.22) 50%, transparent 51%)`,
            backgroundRepeat: 'no-repeat',
          } as React.CSSProperties}
        />
      )}
      <div className={"relative " + (contentClassName ? contentClassName : "p-5") }>
        {children}
      </div>
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
        style={{ transform: 'translate3d(var(--parallax-x,0px), var(--parallax-y,0px), 0)' }}
      />
    </div>
  );
}


