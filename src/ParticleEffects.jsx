import React, { useEffect, useState } from 'react';

export function ParticleEffect({ type = 'gold', count = 30, duration = 1500 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (Math.PI * 2 * i) / count,
      distance: 100 + Math.random() * 150,
      delay: Math.random() * 200,
      size: 4 + Math.random() * 8,
    }));
    setParticles(newParticles);
  }, [count]);

  const colors = {
    gold: ['#ffd700', '#ffed4e', '#ffa500'],
    red: ['#ff6b6b', '#ff4757', '#ff8787'],
    blue: ['#5f27cd', '#341f97', '#8e44ad'],
  };

  const particleColors = colors[type] || colors.gold;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {particles.map((p) => {
        const tx = Math.cos(p.angle) * p.distance;
        const ty = Math.sin(p.angle) * p.distance;
        const color = particleColors[Math.floor(Math.random() * particleColors.length)];

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: color,
              borderRadius: '50%',
              boxShadow: `0 0 ${p.size * 2}px ${color}`,
              animation: `particle ${duration}ms ease-out forwards`,
              animationDelay: `${p.delay}ms`,
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
            }}
          />
        );
      })}
    </div>
  );
}

export function ConfettiEffect({ duration = 3000 }) {
  const [confetti, setConfetti] = useState([]);

  useEffect(() => {
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 500,
      duration: 2000 + Math.random() * 1000,
      rotation: Math.random() * 360,
      color: ['#ffd700', '#ff6b35', '#4ade80', '#60a5fa', '#f472b6'][
        Math.floor(Math.random() * 5)
      ],
    }));
    setConfetti(pieces);

    const timer = setTimeout(() => setConfetti([]), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {confetti.map((c) => (
        <div
          key={c.id}
          style={{
            position: 'absolute',
            left: `${c.x}%`,
            top: '-20px',
            width: '10px',
            height: '10px',
            background: c.color,
            animation: `fall ${c.duration}ms linear forwards, spin ${c.duration / 2}ms linear infinite`,
            animationDelay: `${c.delay}ms`,
            transform: `rotate(${c.rotation}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(calc(100vh + 50px));
            opacity: 0;
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
