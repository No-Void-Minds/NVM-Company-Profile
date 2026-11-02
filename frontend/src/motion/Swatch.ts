// Procedural fabric swatch per tech (SRS 14.5), an illustration and not a test result.
// Density comes from the generation, the stitch from the needs, and small variations from
// the key, so two techs with the same needs still look different. It draws one still
// frame and only moves when asked: a demo on hover or focus, or a re-weave on tech change.

import { onThemeChange, token } from './theme'

export interface SwatchSource {
  key: string
  generation: number
  needs: string[]
}

const DEMO_MS = 1200
const WEAVE_MS = 400
const MAX_DPR = 2
const AIR_PARTICLES = 4

// FNV-1a, enough to turn a key into stable variation
function hash(text: string, salt: number): number {
  let h = 0x811c9dc5 ^ salt
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0) / 0xffffffff
}

interface Frame {
  // 0 at rest, 1 at the peak of the demo
  deform: number
  // Demo progress, used by the air that crosses a porous knit
  progress: number
  // Share of the width already woven, 1 when complete
  reveal: number
}

const REST: Frame = { deform: 0, progress: 0, reveal: 1 }

export class Swatch {
  private readonly ctx: CanvasRenderingContext2D
  private width = 0
  private height = 0
  private frameId = 0
  private startedAt = 0
  private mode: 'demo' | 'weave' | null = null
  private inViewport = true
  private colors = { stitch: '', accent: '', back: '', surface: '' }

  private readonly porous: boolean
  private readonly ribbed: boolean
  private readonly stretchy: boolean
  private readonly lofty: boolean
  private readonly backed: boolean
  private readonly shelled: boolean
  private readonly pitch: number
  private readonly slant: number
  private readonly wave: number
  private readonly waveFrequency: number
  private readonly loopAspect: number
  private readonly poreEvery: number

  private readonly stopTheme: () => void
  private readonly viewport: IntersectionObserver

  constructor(
    private readonly canvas: HTMLCanvasElement,
    source: SwatchSource,
    private readonly reducedMotion: boolean,
  ) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D tidak tersedia')
    this.ctx = ctx

    const needs = new Set(source.needs)
    this.porous = needs.has('hot')
    this.ribbed = needs.has('shape')
    this.stretchy = needs.has('move')
    this.lofty = needs.has('soft')
    this.backed = needs.has('cold')
    this.shelled = needs.has('layer')
    // A later generation is a finer, denser knit
    this.pitch = Math.max(6, 10 - 2 * (source.generation - 1))
    this.slant = (hash(source.key, 1) - 0.5) * 0.5
    this.wave = this.stretchy ? 1 + hash(source.key, 2) * 2.5 : 0
    this.waveFrequency = 0.08 + hash(source.key, 3) * 0.12
    this.loopAspect = 0.7 + hash(source.key, 4) * 0.8
    this.poreEvery = 3 + Math.floor(hash(source.key, 5) * 2)

    this.readColors()
    this.stopTheme = onThemeChange(() => {
      this.readColors()
      if (!this.frameId) this.draw(REST)
    })
    this.viewport = new IntersectionObserver(([entry]) => {
      this.inViewport = entry.isIntersecting
      if (!this.inViewport) this.stop()
    })
    this.viewport.observe(canvas)
    document.addEventListener('visibilitychange', this.onVisibility)
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    this.width = rect.width
    this.height = rect.height
    this.canvas.width = Math.round(rect.width * dpr)
    this.canvas.height = Math.round(rect.height * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (!this.frameId) this.draw(REST)
  }

  // Plays the fabric's behavior once (hover or focus)
  play() {
    this.start('demo')
  }

  // Redraws the threads left to right (Re-weave, tech change)
  weave() {
    this.start('weave')
  }

  stop() {
    if (this.frameId) cancelAnimationFrame(this.frameId)
    this.frameId = 0
    this.mode = null
    this.draw(REST)
  }

  destroy() {
    this.stop()
    this.stopTheme()
    this.viewport.disconnect()
    document.removeEventListener('visibilitychange', this.onVisibility)
  }

  private readonly onVisibility = () => {
    if (document.hidden) this.stop()
  }

  private start(mode: 'demo' | 'weave') {
    // Reduced motion keeps the still frame, the end state is already what it shows.
    if (this.reducedMotion || !this.inViewport || document.hidden) return
    if (this.mode === mode) return
    if (this.frameId) cancelAnimationFrame(this.frameId)
    this.mode = mode
    this.startedAt = performance.now()
    this.frameId = requestAnimationFrame(this.frame)
  }

  private readonly frame = (now: number) => {
    const duration = this.mode === 'weave' ? WEAVE_MS : DEMO_MS
    const progress = Math.min(1, (now - this.startedAt) / duration)
    if (this.mode === 'weave') {
      this.draw({ deform: 0, progress: 0, reveal: progress })
    } else {
      this.draw({ deform: Math.sin(Math.PI * progress), progress, reveal: 1 })
    }
    if (progress >= 1) {
      this.frameId = 0
      this.mode = null
      return
    }
    this.frameId = requestAnimationFrame(this.frame)
  }

  private readColors() {
    this.colors = {
      stitch: token('--line-strong'),
      accent: token('--fg'),
      back: token('--line'),
      surface: token('--surface'),
    }
  }

  private place(col: number, row: number, deform: number) {
    const stepX = this.pitch
    const stepY = this.pitch * 0.8
    let x = col * stepX + (row % 2) * (stepX / 2) + row * stepY * this.slant
    let y = row * stepY
    if (this.wave) x += Math.sin(y * this.waveFrequency) * this.wave
    if (this.stretchy) {
      // Move: stretches in four directions around the middle
      const cx = this.width / 2
      const cy = this.height / 2
      x = cx + (x - cx) * (1 + 0.14 * deform)
      y = cy + (y - cy) * (1 + 0.14 * deform)
    } else if (this.ribbed) {
      // Shape: a stiff knit barely gives when pushed
      x += deform * 1.5
    }
    return { x, y }
  }

  private drawStitches(color: string, offsetY: number, frame: Frame) {
    const { ctx } = this
    const stepY = this.pitch * 0.8
    const cols = Math.ceil(this.width / this.pitch) + 4
    const rows = Math.ceil(this.height / stepY) + 3
    const half = this.pitch * 0.42
    const limit = frame.reveal * this.width
    const loop = this.lofty ? half * (0.55 + 0.35 * frame.deform) : 0

    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let row = -2; row < rows; row++) {
      for (let col = -3; col < cols; col++) {
        // Hot: some stitches are left open, which reads as pores
        if (
          this.porous &&
          ((row % this.poreEvery) + this.poreEvery) % this.poreEvery === 0 &&
          col % 2 === 0
        )
          continue
        const { x, y } = this.place(col, row, frame.deform)
        if (x > limit) continue
        const top = y + offsetY - stepY * 0.55
        const bottom = y + offsetY + stepY * 0.55
        if (loop > 0) {
          // Soft: rounded loops that swell during the demo
          ctx.moveTo(x + loop, y + offsetY)
          ctx.ellipse(x, y + offsetY, loop, loop * this.loopAspect, 0, 0, Math.PI * 2)
        } else {
          // Jersey knit: each stitch is a small V
          ctx.moveTo(x - half, top)
          ctx.lineTo(x, bottom)
          ctx.lineTo(x + half, top)
        }
      }
      if (this.ribbed && row % 2 === 0) {
        const y = row * stepY + offsetY + stepY * 0.6
        ctx.moveTo(0, y)
        ctx.lineTo(Math.min(limit, this.width), y)
      }
    }
    ctx.stroke()
  }

  private drawAir(progress: number) {
    const { ctx } = this
    ctx.fillStyle = this.colors.accent
    for (let i = 0; i < AIR_PARTICLES; i++) {
      const lane = (this.height / (AIR_PARTICLES + 1)) * (i + 1)
      const travel = (progress * 1.4 + i * 0.23) % 1
      ctx.fillRect(travel * this.width, lane, 8, 2)
    }
  }

  private drawShell(lift: number) {
    const { ctx } = this
    const inset = 8
    const top = inset - lift * 6
    const bottom = this.height * 0.45 - lift * 6
    ctx.fillStyle = this.colors.surface
    ctx.fillRect(inset, top, this.width - inset * 2, bottom - top)
    ctx.strokeStyle = this.colors.accent
    ctx.lineWidth = 1.5
    ctx.strokeRect(inset, top, this.width - inset * 2, bottom - top)
  }

  private draw(frame: Frame) {
    const { ctx } = this
    if (this.width === 0 || this.height === 0) return
    ctx.fillStyle = this.colors.surface
    ctx.fillRect(0, 0, this.width, this.height)

    // Cold: a second layer behind, which slides into place during the demo
    if (this.backed) {
      this.drawStitches(this.colors.back, this.pitch * 0.4 + frame.deform * this.pitch, frame)
    }
    this.drawStitches(this.colors.stitch, 0, frame)
    if (this.porous && frame.progress > 0) this.drawAir(frame.progress)
    if (this.shelled) this.drawShell(frame.deform)

    // The shuttle line marks where the weave has reached
    if (frame.reveal < 1) {
      ctx.fillStyle = this.colors.accent
      ctx.fillRect(frame.reveal * this.width, 0, 1.5, this.height)
    }
  }
}
