<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId: number
let particles: Particle[] = []
const mouse = { x: -9999, y: -9999, radius: 120 }

interface Particle {
  x: number
  y: number
  size: number
  speedY: number
  speedX: number
  color: string
  opacity: number
}

const colors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#0ea5e9', '#6366f1']

const createParticle = (width: number, height: number): Particle => {
  return {
    x: Math.random() * width,
    y: height + Math.random() * 20,
    size: Math.random() * 4 + 2,
    speedY: -(Math.random() * 1.5 + 0.5),
    speedX: (Math.random() - 0.5) * 0.8,
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: Math.random() * 0.5 + 0.3,
  }
}

const initParticles = (width: number, height: number) => {
  particles = []
  const count = Math.min((width * height) / 5000, 150)
  for (let i = 0; i < count; i++) {
    const p = createParticle(width, height)
    p.y = Math.random() * height
    particles.push(p)
  }
}

const animate = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.clearRect(0, 0, width, height)

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]

    // Mouse interaction - push particles away
    const dx = mouse.x - p.x
    const dy = mouse.y - p.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < mouse.radius) {
      const force = (mouse.radius - distance) / mouse.radius
      const angle = Math.atan2(dy, dx)
      p.x -= Math.cos(angle) * force * 3
      p.y -= Math.sin(angle) * force * 3
    }

    // Move particle
    p.y += p.speedY
    p.x += p.speedX

    // Add slight wave motion
    p.x += Math.sin(p.y * 0.01) * 0.3

    // Reset particle when it goes off screen
    if (p.y < -20 || p.x < -20 || p.x > width + 20) {
      particles[i] = createParticle(width, height)
    }

    // Draw particle
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = p.color
    ctx.globalAlpha = p.opacity
    ctx.fill()

    // Draw glow effect
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
    gradient.addColorStop(0, p.color)
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.globalAlpha = p.opacity * 0.3
    ctx.fill()

    ctx.globalAlpha = 1
  }

  // Draw connections between nearby particles
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 80) {
        ctx.beginPath()
        ctx.strokeStyle = particles[i].color
        ctx.globalAlpha = (1 - distance / 80) * 0.15
        ctx.lineWidth = 0.5
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }
  }

  animationId = requestAnimationFrame(() => animate(ctx, width, height))
}

const handleMouseMove = (event: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  mouse.x = event.clientX - rect.left
  mouse.y = event.clientY - rect.top
}

const handleMouseLeave = () => {
  mouse.x = -9999
  mouse.y = -9999
}

const handleResize = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const parent = canvas.parentElement
  if (!parent) return
  canvas.width = parent.clientWidth
  canvas.height = parent.clientHeight
  initParticles(canvas.width, canvas.height)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  handleResize()
  animate(ctx, canvas.width, canvas.height)

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseleave', handleMouseLeave)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseleave', handleMouseLeave)
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <canvas ref="canvasRef" class="absolute inset-0"></canvas>
</template>
