import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'
export const runtime = 'edge'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#0F0F12',
          borderRadius: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            color: '#F5F5F7',
            fontWeight: 900,
            fontSize: 140,
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: -6,
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
            bottom: 28,
            width: 180,
            height: 22,
            background: '#CC0000',
          }}
        />
        {/* 3 listras brancas */}
        <div style={{ position: 'absolute', left: 122, bottom: 32, width: 5, height: 14, background: 'white' }} />
        <div style={{ position: 'absolute', left: 134, bottom: 32, width: 5, height: 14, background: 'white' }} />
        <div style={{ position: 'absolute', left: 146, bottom: 32, width: 5, height: 14, background: 'white' }} />
      </div>
    ),
    { ...size }
  )
}
