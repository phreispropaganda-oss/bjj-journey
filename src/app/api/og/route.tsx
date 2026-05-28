import { ImageResponse } from '@vercel/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const BELT_COLOR: Record<string, string> = {
  white:'#E8E8E8', blue:'#2563EB', purple:'#7C3AED', brown:'#92400E', black:'#1A1A1A',
}
const BELT_NAME: Record<string, string> = {
  white:'Branca', blue:'Azul', purple:'Roxa', brown:'Marrom', black:'Preta',
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username') ?? 'atleta'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('profiles')
    .select('name, belt_id, degrees, xp, streak, academy_name')
    .eq('username', username)
    .eq('is_public', true)
    .single()

  const p = data as { name:string; belt_id:string; degrees:number; xp:number; streak:number; academy_name:string|null } | null
  const name       = p?.name ?? username
  const beltId     = p?.belt_id ?? 'white'
  const beltColor  = BELT_COLOR[beltId] ?? '#E8E8E8'
  const beltLabel  = BELT_NAME[beltId]  ?? 'Branca'

  return new ImageResponse(
    (
      <div style={{ width:1200, height:630, display:'flex', flexDirection:'column',
        background:'#0D0D0D', fontFamily:'sans-serif', position:'relative', overflow:'hidden' }}>
        {/* bg accents */}
        <div style={{ position:'absolute', top:-140, right:-140, width:420, height:420,
          borderRadius:'50%', background:'rgba(204,0,0,0.14)' }} />
        <div style={{ position:'absolute', bottom:-100, left:-100, width:320, height:320,
          borderRadius:'50%', background:'rgba(204,0,0,0.07)' }} />
        {/* logo */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'40px 60px 0' }}>
          <div style={{ width:48, height:48, borderRadius:12, background:'#CC0000',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'white', fontWeight:900, fontSize:16 }}>BR</span>
          </div>
          <span style={{ color:'white', fontWeight:900, fontSize:22, letterSpacing:-0.5 }}>Belt Rise</span>
        </div>
        {/* main */}
        <div style={{ display:'flex', flex:1, padding:'28px 60px 40px', gap:40 }}>
          {/* left */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'#CC0000',
              display:'flex', alignItems:'center', justifyContent:'center',
              marginBottom:16, border:'3px solid rgba(255,255,255,0.15)' }}>
              <span style={{ color:'white', fontWeight:900, fontSize:32 }}>{name.charAt(0).toUpperCase()}</span>
            </div>
            <div style={{ fontSize:52, fontWeight:900, color:'white', lineHeight:1.1, marginBottom:8 }}>{name}</div>
            {p?.academy_name && (
              <div style={{ fontSize:20, color:'rgba(255,255,255,0.4)', marginBottom:20 }}>{p.academy_name}</div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:100, height:24, borderRadius:5, background:beltColor }} />
              <span style={{ color:beltColor, fontWeight:900, fontSize:22 }}>Faixa {beltLabel}</span>
              {(p?.degrees ?? 0) > 0 && (
                <span style={{ color:'rgba(255,255,255,0.35)', fontSize:16 }}>· {p?.degrees}° grau</span>
              )}
            </div>
          </div>
          {/* right stats */}
          <div style={{ display:'flex', flexDirection:'column', gap:12, justifyContent:'center', minWidth:220 }}>
            {[
              { emoji:'⚡', value: String(p?.xp ?? 0), label:'XP Total' },
              { emoji:'🔥', value: `${p?.streak ?? 0} dias`, label:'Sequência' },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.06)', borderRadius:16,
                padding:'16px 20px', display:'flex', gap:12, alignItems:'center',
                border:'1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize:28 }}>{s.emoji}</span>
                <div style={{ display:'flex', flexDirection:'column' }}>
                  <span style={{ color:'#CC0000', fontWeight:900, fontSize:26, lineHeight:1 }}>{s.value}</span>
                  <span style={{ color:'rgba(255,255,255,0.35)', fontSize:13, marginTop:2 }}>{s.label}</span>
                </div>
              </div>
            ))}
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.2)', marginTop:4 }}>belt-rise.app</div>
          </div>
        </div>
      </div>
    ),
    { width:1200, height:630 }
  )
}
