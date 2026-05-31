import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'
export const runtime = 'edge'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#0F0F12',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Letra B branca */}
        <div
          style={{
            color: '#F5F5F7',
            fontWeight: 900,
            fontSize: 26,
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: -1,
            lineHeight: 1,
          }}
        >
          B
        </div>
        {/* Faixa BJJ vermelha */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 5,
            width: 32,
            height: 5,
            background: '#CC0000',
          }}
        />
        {/* 3 listras brancas na ponta direita */}
        <div style={{ position: 'absolute', left: 22, bottom: 6, width: 1, height: 3, background: 'white' }} />
        <div style={{ position: 'absolute', left: 25, bottom: 6, width: 1, height: 3, background: 'white' }} />
        <div style={{ position: 'absolute', left: 28, bottom: 6, width: 1, height: 3, background: 'white' }} />
      </div>
    ),
    { ...size }
  )
}
