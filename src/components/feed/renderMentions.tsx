import Link from 'next/link'

// PRD §4.2 — Renderiza @username como link clicável

export function renderMentions(text: string) {
  const parts: (string | { username: string })[] = []
  let lastIdx = 0
  const re = /@([a-z0-9_]{3,40})/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index))
    parts.push({ username: match[1] })
    lastIdx = re.lastIndex
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx))

  return parts.map((p, i) =>
    typeof p === 'string'
      ? <span key={i}>{p}</span>
      : (
        <Link key={i} href={`/profile/${p.username}`}
          className="text-blood font-bold hover:underline">
          @{p.username}
        </Link>
      )
  )
}
