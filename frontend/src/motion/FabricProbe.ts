// One small illustration per need. It plays once on request, so nothing loops
// without a user trigger (NFR-04), and it rests on a frame that reads as a diagram.

import { onThemeChange, token } from './theme'

export type ProbeVariant = 'hot' | 'shape' | 'move' | 'soft' | 'cold' | 'layer'

const DURATION_MS = 2400
const MAX_DPR = 2
const COLS = 13
const ROWS = 7
const REST_PROGRESS = 0.5
const AIR_PARTICLES = 5

interface Point {
  x: number
  y: number
}

export class FabricProbe {
  private readonly ctx: CanvasRenderingContext2D
  private line = ''
  private accent = ''
  private background = ''
  private readonly stopTheme: () => void
  private frameId = 0
  private startedAt = 0
  private width = 0
  private height = 0

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly variant: ProbeVariant,
    private readonly onFinish: () => void,
  ) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D tidak tersedia')
    this.ctx = ctx
    this.readColors()
    this.stopTheme = onThemeChange(() => {
      this.readColors()
      if (!this.frameId) this.draw(REST_PROGRESS)
    })
  }

  private readColors() {
    this.line = token('--line-strong')
    this.accent = token('--fg')
    this.background = token('--surface')
  }

  destroy() {
    this.stop()
    this.stopTheme()
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    this.width = rect.width
    this.height = rect.height
    this.canvas.width = Math.round(rect.width * dpr)
    this.canvas.height = Math.round(rect.height * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.draw(REST_PROGRESS)
  }

  play() {
    this.stop()
    this.startedAt = performance.now()
    this.frameId = requestAnimationFrame(this.frame)
  }

  stop() {
    if (this.frameId) cancelAnimationFrame(this.frameId)
    this.frameId = 0
    this.draw(REST_PROGRESS)
  }

  private readonly frame = (now: number) => {
    const progress = (now - this.startedAt) / DURATION_MS
    if (progress >= 1) {
      this.frameId = 0
      this.draw(REST_PROGRESS)
      this.onFinish()
      return
    }
    this.draw(progress)
    this.frameId = requestAnimationFrame(this.frame)
  }

  private gridPoint(col: number, row: number, swell: number): Point {
    const stepX = this.width / (COLS + 1)
    const stepY = this.height / (ROWS + 1)
    let x = stepX * (col + 1)
    let y = stepY * (row + 1)
    const cx = this.width / 2
    const cy = this.height / 2

    if (this.variant === 'move') {
      x = cx + (x - cx) * (1 + 0.14 * swell)
      y = cy + (y - cy) * (1 + 0.14 * swell)
    } else if (this.variant === 'shape') {
      // The edges stay pinned while the middle gets pushed, then the shape holds.
      const fromEdge = Math.min(col, COLS - 1 - col) / ((COLS - 1) / 2)
      x += swell * 10 * fromEdge
    }
    return { x, y }
  }

  private drawGrid(swell: number) {
    const { ctx } = this
    ctx.beginPath()
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const point = this.gridPoint(col, row, swell)
        if (col + 1 < COLS) {
          const next = this.gridPoint(col + 1, row, swell)
          ctx.moveTo(point.x, point.y)
          ctx.lineTo(next.x, next.y)
        }
        if (row + 1 < ROWS) {
          const next = this.gridPoint(col, row + 1, swell)
          ctx.moveTo(point.x, point.y)
          ctx.lineTo(next.x, next.y)
        }
      }
    }
    ctx.strokeStyle = this.line
    ctx.lineWidth = 1
    ctx.stroke()
  }

  private drawNodes(swell: number) {
    const { ctx } = this
    const radius = this.variant === 'soft' ? 1.5 + swell * 4.5 : 1.5
    ctx.fillStyle = this.variant === 'soft' ? this.accent : this.line
    ctx.beginPath()
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const point = this.gridPoint(col, row, swell)
        ctx.moveTo(point.x + radius, point.y)
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
      }
    }
    ctx.fill()
  }

  private drawAir(progress: number) {
    const { ctx } = this
    ctx.fillStyle = this.accent
    for (let i = 0; i < AIR_PARTICLES; i++) {
      const lane = (this.height / (AIR_PARTICLES + 1)) * (i + 1)
      const travel = (progress + i * 0.17) % 1
      ctx.fillRect(travel * this.width, lane, 12, 2)
    }
  }

  private drawCover(amount: number) {
    const { ctx } = this
    const height = this.height * amount
    ctx.fillStyle = this.background
    ctx.fillRect(0, 0, this.width, height)
    ctx.fillStyle = this.accent
    ctx.fillRect(0, height, this.width, 2)
  }

  private drawShell(lift: number) {
    const { ctx } = this
    const inset = 16
    const offset = inset + (1 - lift) * 16
    ctx.strokeStyle = this.accent
    ctx.lineWidth = 2
    ctx.strokeRect(inset, offset, this.width - inset * 2, this.height - offset - inset)
  }

  private draw(progress: number) {
    const swell = Math.sin(Math.PI * progress)
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.drawGrid(swell)
    this.drawNodes(swell)
    if (this.variant === 'hot') this.drawAir(progress)
    if (this.variant === 'cold') this.drawCover(swell * 0.7)
    if (this.variant === 'layer') this.drawShell(swell)
  }
}
