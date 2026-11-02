// Canvas 2D knit grid: the pointer stretches nearby points, a damped spring brings them back.

import { onThemeChange, token } from './theme'

const SPACING_DESKTOP = 22
const SPACING_MOBILE = 28
const LIMIT_DESKTOP = 1800
const LIMIT_MOBILE = 600
const MOBILE_WIDTH = 768
const MAX_DPR = 2
const RADIUS = 120
const PULL = 0.9
const SPRING = 0.06
const DAMPING = 0.84
const REST_EPSILON = 0.02

export class KnitField {
  private readonly ctx: CanvasRenderingContext2D
  private lineColor = ''
  private nodeColor = ''
  private nearColor = ''
  private stopTheme: (() => void) | null = null

  private width = 0
  private height = 0
  private cols = 0
  private rows = 0
  private restX = new Float32Array(0)
  private restY = new Float32Array(0)
  private x = new Float32Array(0)
  private y = new Float32Array(0)
  private vx = new Float32Array(0)
  private vy = new Float32Array(0)

  private pointerX = 0
  private pointerY = 0
  private pointerActive = false
  private frameId = 0
  private inViewport = true

  private resizeObserver: ResizeObserver | null = null
  private viewportObserver: IntersectionObserver | null = null

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly host: HTMLElement,
    private readonly reducedMotion: boolean,
  ) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D tidak tersedia')
    this.ctx = ctx
  }

  start() {
    this.readColors()
    this.resize()
    this.stopTheme = onThemeChange(() => {
      this.readColors()
      this.draw()
    })
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.host)
    if (this.reducedMotion) return

    this.viewportObserver = new IntersectionObserver(([entry]) => {
      this.inViewport = entry.isIntersecting
      if (this.inViewport) this.wake()
      else this.sleep()
    })
    this.viewportObserver.observe(this.host)

    this.host.addEventListener('pointerdown', this.onPointerMove)
    this.host.addEventListener('pointermove', this.onPointerMove)
    this.host.addEventListener('pointerleave', this.onPointerEnd)
    this.host.addEventListener('pointerup', this.onPointerUp)
    this.host.addEventListener('pointercancel', this.onPointerEnd)
    document.addEventListener('visibilitychange', this.onVisibility)
  }

  destroy() {
    this.sleep()
    this.stopTheme?.()
    this.resizeObserver?.disconnect()
    this.viewportObserver?.disconnect()
    this.host.removeEventListener('pointerdown', this.onPointerMove)
    this.host.removeEventListener('pointermove', this.onPointerMove)
    this.host.removeEventListener('pointerleave', this.onPointerEnd)
    this.host.removeEventListener('pointerup', this.onPointerUp)
    this.host.removeEventListener('pointercancel', this.onPointerEnd)
    document.removeEventListener('visibilitychange', this.onVisibility)
  }

  private readColors() {
    this.lineColor = token('--line')
    this.nodeColor = token('--line-strong')
    this.nearColor = token('--fg')
  }

  private readonly onPointerMove = (event: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    this.pointerX = event.clientX - rect.left
    this.pointerY = event.clientY - rect.top
    this.pointerActive = true
    this.wake()
  }

  private readonly onPointerEnd = () => {
    this.pointerActive = false
  }

  // A mouse stays over the field after release, only a finger leaves it.
  private readonly onPointerUp = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') this.pointerActive = false
  }

  private readonly onVisibility = () => {
    if (document.hidden) this.sleep()
    else this.wake()
  }

  private wake() {
    if (this.frameId || document.hidden || !this.inViewport) return
    this.frameId = requestAnimationFrame(this.frame)
  }

  private sleep() {
    if (this.frameId) cancelAnimationFrame(this.frameId)
    this.frameId = 0
  }

  private resize() {
    const rect = this.host.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    this.width = rect.width
    this.height = rect.height
    this.canvas.width = Math.round(rect.width * dpr)
    this.canvas.height = Math.round(rect.height * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const mobile = rect.width < MOBILE_WIDTH
    const limit = mobile ? LIMIT_MOBILE : LIMIT_DESKTOP
    let spacing = mobile ? SPACING_MOBILE : SPACING_DESKTOP
    let cols = Math.ceil(rect.width / spacing) + 1
    let rows = Math.ceil(rect.height / spacing) + 1
    while (cols * rows > limit) {
      spacing += 2
      cols = Math.ceil(rect.width / spacing) + 1
      rows = Math.ceil(rect.height / spacing) + 1
    }

    this.cols = cols
    this.rows = rows
    const count = cols * rows
    this.restX = new Float32Array(count)
    this.restY = new Float32Array(count)
    this.vx = new Float32Array(count)
    this.vy = new Float32Array(count)
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col
        this.restX[i] = col * spacing
        this.restY[i] = row * spacing
      }
    }
    this.x = this.restX.slice()
    this.y = this.restY.slice()
    this.draw()
  }

  private readonly frame = () => {
    this.frameId = 0
    const moving = this.step()
    this.draw()
    // No frames while nothing moves, so an idle hero costs nothing (NFR-04).
    if (moving || this.pointerActive) this.wake()
  }

  private step(): boolean {
    let moving = false
    for (let i = 0; i < this.x.length; i++) {
      let ax = (this.restX[i] - this.x[i]) * SPRING
      let ay = (this.restY[i] - this.y[i]) * SPRING

      if (this.pointerActive) {
        const dx = this.pointerX - this.x[i]
        const dy = this.pointerY - this.y[i]
        const distance = Math.hypot(dx, dy)
        if (distance > 1 && distance < RADIUS) {
          const force = (1 - distance / RADIUS) ** 2 * PULL
          ax += (dx / distance) * force
          ay += (dy / distance) * force
        }
      }

      this.vx[i] = (this.vx[i] + ax) * DAMPING
      this.vy[i] = (this.vy[i] + ay) * DAMPING
      this.x[i] += this.vx[i]
      this.y[i] += this.vy[i]

      if (
        Math.abs(this.vx[i]) > REST_EPSILON ||
        Math.abs(this.vy[i]) > REST_EPSILON ||
        Math.abs(this.restX[i] - this.x[i]) > REST_EPSILON ||
        Math.abs(this.restY[i] - this.y[i]) > REST_EPSILON
      ) {
        moving = true
      }
    }
    return moving
  }

  private draw() {
    const { ctx, cols, rows, x, y } = this
    ctx.clearRect(0, 0, this.width, this.height)

    ctx.beginPath()
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col
        if (col + 1 < cols) {
          ctx.moveTo(x[i], y[i])
          ctx.lineTo(x[i + 1], y[i + 1])
        }
        if (row + 1 < rows) {
          ctx.moveTo(x[i], y[i])
          ctx.lineTo(x[i + cols], y[i + cols])
        }
      }
    }
    ctx.strokeStyle = this.lineColor
    ctx.lineWidth = 1
    ctx.stroke()

    for (let i = 0; i < x.length; i++) {
      const near =
        this.pointerActive && Math.hypot(this.pointerX - x[i], this.pointerY - y[i]) < RADIUS
      ctx.fillStyle = near ? this.nearColor : this.nodeColor
      ctx.fillRect(x[i] - 1, y[i] - 1, 2, 2)
    }
  }
}
