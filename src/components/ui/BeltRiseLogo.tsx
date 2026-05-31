interface Props {
  size?: number
  withText?: boolean
  className?: string
  /** Variante stacked com "BR" gigante */
  stacked?: boolean
}

/**
 * Logo Belt Rise — quadrado vermelho com "BR" estilizado + seta ascendente.
 * Inspirado em logos esportivos (Strava B+seta) adaptado para artes marciais.
 */
export default function BeltRiseLogo({ size = 32, withText = true, className = '', stacked = false }: Props) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-label="Belt Rise"
        role="img"
      >
        {/* Quadrado vermelho com radius */}
        <rect width="48" height="48" rx="11" fill="var(--rise, #CC0000)" />

        {/* Faixa diagonal sutil (BJJ belt accent) */}
        <path
          d="M 0 36 L 48 4 L 48 12 L 0 44 Z"
          fill="white"
          fillOpacity="0.08"
        />

        {/* Letra B condensada */}
        <path
          d="M14 12h10.5c2.8 0 5 2 5 4.5 0 1.5-.8 2.8-2 3.5 1.7.7 2.8 2.3 2.8 4.3 0 2.8-2.5 4.7-5.5 4.7H14V12zm4 4v4.5h6c1 0 1.8-1 1.8-2.2C25.8 17 25 16 24 16h-6zm0 8.5V30h6.8c1.3 0 2.3-1.1 2.3-2.5s-1-2.5-2.3-2.5H18z"
          fill="white"
        />

        {/* Seta ascendente compacta (canto sup-direito) */}
        <g transform="translate(31, 11)">
          {/* Triangulo da seta */}
          <path d="M5 0 L0 6 L3 6 L3 11 L7 11 L7 6 L10 6 Z" fill="white" />
        </g>
      </svg>

      {withText && !stacked && (
        <span className="font-display text-ink-primary tracking-tight leading-none" style={{ fontSize: size * 0.55 }}>
          <span className="text-rise">Belt</span>
          <span className="text-ink-primary"> Rise</span>
        </span>
      )}

      {withText && stacked && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-rise tracking-tight" style={{ fontSize: size * 0.42 }}>Belt</span>
          <span className="font-display text-ink-primary tracking-tight" style={{ fontSize: size * 0.42 }}>Rise</span>
        </div>
      )}
    </div>
  )
}
