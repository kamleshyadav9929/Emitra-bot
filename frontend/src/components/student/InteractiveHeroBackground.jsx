import { useEffect, useRef } from "react";

export default function InteractiveHeroBackground() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: null, y: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let particles = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      initParticles();
    };

    const initParticles = () => {
      // Scale particle count dynamically with screen width
      const particleCount = Math.min(65, Math.floor(width / 20));
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35, // Slow, elegant movement
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 1.5 + 1,
          color: i % 2 === 0 ? "rgba(56, 189, 248, 0.6)" : "rgba(99, 102, 241, 0.6)", // Cyan & Indigo particles
        });
      }
    };

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const mouse = mouseRef.current;

      // Update and draw particles
      particles.forEach((p) => {
        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on boundaries
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Gentle pull towards mouse (magnetic effect)
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            // Apply a small force towards cursor
            p.x += dx * 0.006;
            p.y += dy * 0.006;
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`; // Indigo connections
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        // Draw mouse to particle connection
        if (mouse.x !== null && mouse.y !== null) {
          const dx = p1.x - mouse.x;
          const dy = p1.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.35;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`; // Cyan mouse connections
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    // Set up listeners
    window.addEventListener("resize", resize);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    // Initial setup
    resize();
    draw();

    // Clean up
    return () => {
      window.removeEventListener("resize", resize);
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto z-0"
    >
      {/* Dynamic Canvas for floating interactive particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen pointer-events-none"
      />

      {/* Decorative Center-Aligned Mesh Glow Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] rounded-full bg-gradient-to-r from-blue-600/10 to-indigo-600/10 blur-[110px]" />
        <div className="absolute top-[35%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-cyan-500/5 blur-[90px]" />
      </div>

      {/* Subtle Grid Pattern specifically styled for the Hero */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px"
        }}
      />

      {/* Vignette / Radial Mask to smoothly fade the edges into the deep theme background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(5, 5, 8, 0) 10%, rgba(5, 5, 8, 0.5) 60%, #050508 100%)"
        }}
      />
    </div>
  );
}
