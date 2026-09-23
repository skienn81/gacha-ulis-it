/**
 * Lightweight 0-dependency Canvas Confetti
 * Hoạt động 100% offline, 60fps, tự động dọn dẹp canvas khi kết thúc.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  shape: 'rect' | 'circle' | 'star';
}

const CONFETTI_COLORS = [
  '#ffd700', // Gold
  '#ff4b4b', // Red
  '#00f0ff', // Cyan
  '#d32ce6', // Pink
  '#8847ff', // Purple
  '#ffffff', // White
  '#4ade80', // Green
];

export function fireConfetti(durationMs = 3500) {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.id = 'gacha-confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const resize = () => {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  };
  resize();

  const particles: Particle[] = [];
  const particleCount = 140;

  // Tạo particles bắn từ 2 bên và chính giữa
  for (let i = 0; i < particleCount; i++) {
    const fromLeft = Math.random() < 0.5;
    const originX = fromLeft ? window.innerWidth * 0.15 : window.innerWidth * 0.85;
    const originY = window.innerHeight * 0.65;

    const angle = fromLeft
      ? (Math.random() * 60 - 75) * (Math.PI / 180)
      : (Math.random() * 60 - 165) * (Math.PI / 180);

    const speed = Math.random() * 18 + 12;

    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 10 + 6,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      alpha: 1,
      shape: Math.random() > 0.4 ? 'rect' : Math.random() > 0.5 ? 'circle' : 'star',
    });
  }

  const startTime = performance.now();
  let animationFrameId: number;

  const render = (now: number) => {
    const elapsed = now - startTime;
    if (elapsed > durationMs) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45; // Trọng lực
      p.vx *= 0.98; // Lực cản không khí
      p.rotation += p.rotationSpeed;

      // Giảm dần độ trong suốt ở 1/3 thời gian cuối
      if (elapsed > durationMs * 0.65) {
        p.alpha = Math.max(0, 1 - (elapsed - durationMs * 0.65) / (durationMs * 0.35));
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Vẽ ngôi sao nhỏ
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          ctx.lineTo(Math.cos(((18 + j * 72) * Math.PI) / 180) * (p.size / 2), -Math.sin(((18 + j * 72) * Math.PI) / 180) * (p.size / 2));
          ctx.lineTo(Math.cos(((54 + j * 72) * Math.PI) / 180) * (p.size / 4), -Math.sin(((54 + j * 72) * Math.PI) / 180) * (p.size / 4));
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    animationFrameId = requestAnimationFrame(render);
  };

  animationFrameId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animationFrameId);
    canvas.remove();
  };
}
