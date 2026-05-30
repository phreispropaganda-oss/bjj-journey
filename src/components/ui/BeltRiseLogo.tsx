interface Props {
  size?: number
  withText?: boolean
  className?: string
}

/** Logo Belt Rise: letra B com seta ascendente laranja */
export default function BeltRiseLogo({ size = 32, withText = true, className = '' }: Props) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Belt Rise">
        {/* Quadrado base */}
        <rect width="48" height="48" rx="12" fill="#FF6B2B" />
        {/* Letra B estilizada */}
        <path d="M14 12h11c3.3 0 6 2.4 6 5.5 0 1.8-1 3.4-2.5 4.3 2.1.8 3.5 2.8 3.5 5.2 0 3.4-2.9 6-6.5 6H14V12zm5 4.5v5h5.5c1.4 0 2.5-1.1 2.5-2.5S25.9 16.5 24.5 16.5H19zm0 9.5v6h6.5c1.7 0 3-1.3 3-3s-1.3-3-3-3H19z" fill="white" />
        {/* Seta ascendente sobre o B */}
        <path d="M34 8l-3 5h2v4h2v-4h2l-3-5z" fill="white" />
      </svg>
      {withText && (
        <span className="font-display text-ink-primary tracking-tight" style={{ fontSize: size * 0.55 }}>
          <span className="text-rise">Belt</span> Rise
        </span>
      )}
    </div>
  )
}
