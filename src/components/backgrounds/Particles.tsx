import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

interface ParticlesProps {
  particleCount?: number;
  particleColor?: string;
  particleSize?: number;
  speed?: number;
  connectionDistance?: number;
  showConnections?: boolean;
  backgroundColor?: string;
}

export default function Particles({
  particleCount = 80,
  particleColor = '#5227FF',
  particleSize = 2,
  speed = 0.5,
  connectionDistance = 120,
  showConnections = true,
  backgroundColor = 'transparent'
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    };

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          radius: Math.random() * particleSize + 1,
          opacity: Math.random() * 0.5 + 0.5
        });
      }
    };

    // Draw particle
    const drawParticle = (particle: Particle) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = particleColor;
      ctx.globalAlpha = particle.opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    // Draw connection between particles
    const drawConnection = (p1: Particle, p2: Particle, distance: number) => {
      const opacity = (1 - distance / connectionDistance) * 0.5;
      ctx.beginPath();
      ctx.strokeStyle = particleColor;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = 0.5;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    // Update particle position
    const updateParticle = (particle: Particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Bounce off edges
      if (particle.x < 0 || particle.x > canvas.width) {
        particle.vx = -particle.vx;
      }
      if (particle.y < 0 || particle.y > canvas.height) {
        particle.vy = -particle.vy;
      }

      // Keep within bounds
      particle.x = Math.max(0, Math.min(canvas.width, particle.x));
      particle.y = Math.max(0, Math.min(canvas.height, particle.y));
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const particles = particlesRef.current;

      // Update and draw particles
      particles.forEach((particle, i) => {
        updateParticle(particle);
        drawParticle(particle);

        // Draw connections
        if (showConnections) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[j].x - particle.x;
            const dy = particles[j].y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
              drawConnection(particle, particles[j], distance);
            }
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Initialize
    window.addEventListener('resize', resize);
    resize();
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount, particleColor, particleSize, speed, connectionDistance, showConnections, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}

