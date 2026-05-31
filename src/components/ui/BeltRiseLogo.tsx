interface Props {
  size?: number
  withText?: boolean
  className?: string
  /** Variante mark-only (so o B com faixa) */
  markOnly?: boolean
  /** Cor da faixa (default = rise) */
  beltColor?: string
}

/**
 * Logo Belt Rise — letra B condensada estilo varsity + faixa horizontal vermelha
 * que atravessa a parte inferior (representa o belt de BJJ).
 *
 * Inspirado em refs de logos esportivos com letra A + faixa (Black Belt logos).
 */
export default function BeltRiseLogo({
  size = 32,
  withText = true,
  className = '',
  markOnly = false,
  beltColor = '#CC0000',
}: Props) {
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
        {/* Letra B condensada — preenchimento ink-primary */}
        <path
          d="M 8 6
             L 8 42
             L 28 42
             C 35 42 39 38 39 32
             C 39 28 36 25 33 24
             C 35 23 38 21 38 17
             C 38 11 34 6 28 6
             L 8 6 Z
             M 14 12
             L 26 12
             C 29 12 32 14 32 17
             C 32 20 29 21 26 21
             L 14 21 Z
             M 14 27
             L 27 27
             C 30 27 33 29 33 32
             C 33 35 30 36 27 36
             L 14 36 Z"
          fill="currentColor"
          className="text-ink-primary"
        />

        {/* Faixa BJJ vermelha — atravessa horizontalmente */}
        <rect
          x="0"
          y="30"
          width="48"
          height="6"
          fill={beltColor}
        />

        {/* Detalhe: 3 listras brancas na faixa (graus tipo BJJ) */}
        <rect x="38" y="31" width="1.5" height="4" fill="white" opacity="0.85" />
        <rect x="40" y="31" width="1.5" height="4" fill="white" opacity="0.85" />
        <rect x="42" y="31" width="1.5" height="4" fill="white" opacity="0.85" />
      </svg>

      {withText && !markOnly && (
        <span
          className="font-display tracking-tight leading-none"
          style={{ fontSize: size * 0.55 }}
        >
          <span className="text-ink-primary">Belt</span>
          <span className="text-rise"> Rise</span>
        </span>
      )}
    </div>
  )
}
