'use client'

// PRD §3.2 — Radar Chart de 8 eixos para BJJ
// SVG nativo, sem libs externas. Suporta modo daltônico (texto + cor).

interface RadarPoint { category: string; score: number; raw_count: number }

const LABELS: Record<string, { label: string; emoji: string }> = {
  passage:      { label: 'Passagem',      emoji: '⚡' },
  guard_open:   { label: 'Guarda Aberta', emoji: '🕷️' },
  guard_closed: { label: 'Guarda Fechada', emoji: '🛡️' },
  back:         { label: 'Costas',        emoji: '🎯' },
  mount:        { label: 'Montada',       emoji: '👑' },
  side_control: { label: '100 Quilos',    emoji: '🪨' },
  takedown:     { label: 'Quedas',        emoji: '🥋' },
  submission:   { label: 'Finalização',   emoji: '🏆' },
}

export default function RadarChart8({ data }: { data: RadarPoint[] }) {
  const size = 260
  const cx = size / 2
  const cy = size / 2
  const maxRadius = (size / 2) - 40

  // 8 vértices em circunferência (começa no topo)
  const angles = data.map((_, i) => (Math.PI * 2 * i) / data.length - Math.PI / 2)

  function pointFor(score: number, angle: number) {
    const r = (score / 100) * maxRadius
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r }
  }

  // Polígono de dados
  const polygonPath = data.map((d, i) => {
    const p = pointFor(d.score, angles[i])
    return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  }).join(' ') + ' Z'

  // Grids concêntricos (25%, 50%, 75%, 100%)
  const grids = [0.25, 0.5, 0.75, 1.0]

  const hasData = data.some(d => d.raw_count > 0)

  return (
    <div className="card-elev">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary">
          Radar técnico — últimos 90 dias
        </p>
      </div>

      {!hasData ? (
        <div className="text-center py-8">
          <p className="text-4xl mb-2">🥋</p>
          <p className="text-ink-secondary font-bold text-sm">Sem dados ainda</p>
          <p className="text-ink-muted text-xs mt-1">
            Marque posições treinadas para ver seu radar técnico.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            {/* Grid radial */}
            {grids.map((g, i) => {
              const points = angles.map(a => {
                const r = maxRadius * g
                return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`
              }).join(' ')
              return (
                <polygon key={i} points={points} fill="none"
                  stroke={i === grids.length - 1 ? 'var(--border)' : 'var(--border-soft)'}
                  strokeWidth={i === grids.length - 1 ? 1.5 : 1}
                />
              )
            })}

            {/* Linhas radiais */}
            {angles.map((a, i) => (
              <line key={`spoke-${i}`}
                x1={cx} y1={cy}
                x2={cx + Math.cos(a) * maxRadius}
                y2={cy + Math.sin(a) * maxRadius}
                stroke="var(--border-soft)" strokeWidth={1}
              />
            ))}

            {/* Polígono de dados — vermelho com glow */}
            <path d={polygonPath} fill="var(--blood)" fillOpacity={0.25}
              stroke="var(--blood)" strokeWidth={2} strokeLinejoin="round"
              filter="drop-shadow(0 0 8px rgba(158,11,19,0.4))"
            />

            {/* Pontos dos dados */}
            {data.map((d, i) => {
              if (d.score === 0) return null
              const p = pointFor(d.score, angles[i])
              return (
                <circle key={`pt-${i}`} cx={p.x} cy={p.y} r={4}
                  fill="var(--volt)" stroke="var(--blood)" strokeWidth={2}
                />
              )
            })}

            {/* Labels nos vértices */}
            {data.map((d, i) => {
              const a = angles[i]
              const labelR = maxRadius + 22
              const x = cx + Math.cos(a) * labelR
              const y = cy + Math.sin(a) * labelR
              const meta = LABELS[d.category] ?? { label: d.category, emoji: '•' }
              const align: 'start' | 'middle' | 'end' =
                Math.abs(Math.cos(a)) < 0.3 ? 'middle' :
                Math.cos(a) > 0 ? 'start' : 'end'
              return (
                <g key={`lbl-${i}`}>
                  <text x={x} y={y - 6} textAnchor={align}
                    className="font-bold fill-ink-primary"
                    fontSize={11}>
                    {meta.emoji}
                  </text>
                  <text x={x} y={y + 8} textAnchor={align}
                    className="fill-ink-secondary"
                    fontSize={9}>
                    {meta.label}
                  </text>
                  <text x={x} y={y + 18} textAnchor={align}
                    className="fill-volt font-black"
                    fontSize={9}>
                    {d.score}
                  </text>
                </g>
              )
            })}
          </svg>

          <p className="text-[10px] text-ink-muted mt-3 text-center max-w-[240px]">
            Cada eixo mostra sua atividade na posição. Marque mais técnicas no registro para
            expandir o radar.
          </p>
        </div>
      )}
    </div>
  )
}
