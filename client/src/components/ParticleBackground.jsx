import { useEffect, useRef } from 'react'

const PARTICLE_COUNT = 40

function random(min, max) {
  return Math.random() * (max - min) + min
}

function createParticle(w, h) {
  return {
    x: random(0, w),
    y: random(0, h),
    r: random(1, 2.2),
    dx: random(-0.3, 0.3),
    dy: random(-0.25, 0.25),
    alpha: random(0.15, 0.35),
  }
}

export default function ParticleBackground() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const particlesRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      // Re-seed particles within new bounds
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(canvas.width, canvas.height)
      )
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      particlesRef.current.forEach(p => {
        // Move
        p.x += p.dx
        p.y += p.dy

        // Wrap around edges
        if (p.x < -4) p.x = width + 4
        if (p.x > width + 4) p.x = -4
        if (p.y < -4) p.y = height + 4
        if (p.y > height + 4) p.y = -4

        // Draw
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(74, 222, 128, ${p.alpha})`
        ctx.fill()
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
