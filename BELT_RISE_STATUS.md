# Belt Rise — Status do projeto

> Snapshot do estado atual da plataforma. Última atualização: deploy mais recente.
> 48 commits desde o início do projeto. 37 rotas no app. 28 RPCs no Postgres.

---

## 1. Auditoria de Código (resumo executivo)

| Eixo | Status | Notas |
|---|---|---|
| TypeScript | ✅ Limpo | `tsc --noEmit` 0 erros |
| `any` sem justificativa | ✅ 0 | Todos os 8 foram tipados (Bloco 1) |
| RLS Supabase | ✅ 24/24 tabelas | Última gap (`badge_catalog`) fechado |
| Build production | ✅ Passa | 37 páginas, ~3s compilação |
| Theme light/dark | ✅ 100% | CSS vars + `data-theme` + system fallback |
| Body scroll lock iOS | ✅ Sim | `useBodyScrollLock` em 4 modais |
| Inputs ≥16px (anti zoom Safari) | ✅ Sim | Aplicado globalmente em `globals.css` |
| Safe-area iPhone (notch/home) | ✅ Sim | `env(safe-area-inset-*)` em BottomNav + sheets |
| Tap targets ≥44px | ✅ Padronizado | `min-h-tap` nos botões críticos |
| Tour reaparece pós-rebrand | ✅ Sim | Storage key migrada |

### Gargalos identificados (não bloqueantes)

1. **Bundle não otimizado**: imagens de treino servidas direto do Supabase storage (sem `next/image`). Impacto em LCP no feed.
2. **N+1 raros**: já checado, todos os fetches são `Promise.all`. Mas algumas páginas server fazem 4-5 fetches sequenciais por escolha (segurança).
3. **React Query ausente**: app usa Server Components + revalidate. Funciona, mas é menos reativo que SPA equivalente.
4. **Pgcrypto desativado**: tokens IG/TikTok ficam em texto na DB.

---

## 2. Features implementadas no código mas NÃO expostas na UI

> Estas funcionalidades estão **prontas e testadas** mas precisam de um botão/rota para o usuário acessar.

| Feature | Local | Como ativar |
|---|---|---|
| **ShareSheet universal** (Stories IG/Feed/TikTok/WhatsApp/copy/download) | `src/components/sharing/ShareSheet.tsx` | Plugar em `/treino/[id]/share` (hoje usa botões antigos) e no botão "Compartilhar" do perfil |
| **Web Push subscription** | `src/lib/push.ts` + `/api/push/subscribe` | Adicionar botão "Ativar notificações" no `/profile/menu` chamando `subscribeToPush()` |
| **Streak Shield (Pro)** | `src/app/streak/actions.ts` | Botão no streak hero do dashboard chamando `useStreakShield()` |
| **Confetti em marcos** | `src/lib/celebrate.ts` `maybeCelebrate()` | Chamar após criar session em `/treino/novo` quando `total % milestone == 0` |
| **Instagram OAuth Connect** | `/api/social/instagram/connect` | Botão "Conectar Instagram" no `/profile/menu` (gated por env) |
| **TikTok Connect** | `/api/social/tiktok/connect` | Idem para TikTok |
| **Stripe Customer Portal** | `/api/stripe/portal` | Botão "Gerenciar assinatura" em `/profile/menu` para usuários Pro |
| **Sentry + PostHog** | `sentry.client.config.ts` + `src/lib/analytics.ts` | Adicionar envs `NEXT_PUBLIC_SENTRY_DSN` + `NEXT_PUBLIC_POSTHOG_KEY` (já lê automático no boot) |
| **VAPID push send (server)** | `web-push` instalado | Edge Function para enviar push (lembrete streak, oss recebido) — falta orquestrar |
| **Resend weekly recap** | RPC `weekly_recap` pronta | Edge Function cron domingo 20h + template Resend (não criado) |
| **AcademyAdminClient CSV export** | já clicável em `/academy/[id]/admin` | ✅ ativo |
| **QR check-in download** | já em `/academia/qr` | ✅ ativo |

---

## 3. Roadmap por área — Status detalhado

### 🔐 Autenticação & Onboarding
- [x] Login email/senha (`/login`)
- [x] Signup email/senha (`/signup`)
- [x] Google OAuth (`/api/auth/google`)
- [x] Magic link
- [x] Onboarding 6 passos (`/onboarding`)
- [x] Logout (server action `signOut`)
- [x] Middleware protegendo rotas privadas
- [x] Login com identidade Belt Rise (cores + logo + slogan)

### 🏠 Dashboard (`/dashboard`)
- [x] Top bar com logo Belt Rise
- [x] Slogan "Treine. Suba. Conquiste." restaurado
- [x] Botão INICIAR TREINO em rise
- [x] Atalho Check-in
- [x] Card Progresso da Graduação (X% para próxima faixa)
- [x] Streak hero suavizado
- [x] Activity rings (técnicas/treinos/sequência)
- [x] LevelProgress (nível XP logarítmico)
- [x] RadarChart8 BJJ (passagem/guarda/back/etc)
- [x] PersonalRecords cards
- [x] HeatmapYoY com toggle
- [x] MinutesBarChart
- [x] TypeBreakdown
- [x] Tour overlay primeira sessão
- [x] BottomNav 5 tabs

### 📝 Treino (`/treino/novo` + `/treino/[id]/share`)
- [x] Form completo (modalidade, tipo, duração, data, técnicas, rolos, subs, sentimento, nota, foto, visibilidade)
- [x] Treino retroativo (`?retro=1` ou `?date=YYYY-MM-DD`)
- [x] Voz pt-BR (Web Speech API)
- [x] Smart Tech Chips com busca + 70+ técnicas pt-BR
- [x] Intensity Slider com vibração
- [x] Modal de foto (3 opções: câmera/galeria/cancelar)
- [x] Compressão de avatar
- [x] Pós-treino: 7 templates Stories
- [x] Pós-treino: visibility (Público/Seguidores/Privado)
- [x] Pós-treino: apagar treino (ConfirmDialog)
- [ ] **ShareSheet universal não plugado** (já existe em `src/components/sharing/`)
- [ ] **Confetti em marcos não disparado** (lib pronta)

### 📅 Calendário (`/calendar`)
- [x] Heatmap 4 níveis de intensidade
- [x] Bottom-sheet ao tocar dia treinado
- [x] Botão "+ Treino retroativo"
- [x] Tap em dia vazio → cria treino na data
- [x] Streak hero
- [x] Stats mês/total/semana

### 👤 Perfil
- [x] `/profile` redireciona para `/profile/[username]` (perfil público)
- [x] `/profile/[username]` público com header social
- [x] ProfileHighlights (8 KPIs)
- [x] LevelBadge (XP + barra)
- [x] StatsCharts (área 28d calorias + bar 12sem)
- [x] MonthlyCalendar (animado com framer-motion)
- [x] ProfileTimeline (faixas + badges + marcos)
- [x] ProfilePosts (grid 3-col Instagram-style)
- [x] BottomNav presente
- [x] Botão Editar + Menu para owner
- [x] FollowButton para visitantes
- [x] ShareButton
- [x] Selo ✓ quando faixa verificada
- [x] `/profile/editar` com nome, faixa, graus, peso, altura, anos treinando, data nascimento, bio, avatar
- [x] `/profile/menu` com acessos: academias, conta, treino, owner, ajuda, tema, sair
- [x] **ThemeToggle (claro/escuro/sistema)** no menu

### 🥋 Módulos / Currículo
- [x] `/modules/[beltId]` com 5 faixas (white/blue/purple/brown/black)
- [x] Módulos originais + 10 módulos IBJJF best-effort
- [x] TechDetail com body scroll lock
- [x] Botão "Marcar como feita" sticky com safe-area
- [x] Botão Foco (TDAH) funcional — filtra módulo pendente
- [x] Timer 3/5/10 min
- [x] Progress bar global + por módulo
- [x] Sincronia com Supabase via `setCompletedForBelt`
- [x] +10 XP por técnica concluída (`increment_xp`)

### 🔥 Feed (`/feed`)
- [x] FeedClient com cards de treino
- [x] Oss + Super Oss (double-tap)
- [x] Sparks overlay animada
- [x] Comentários com replies 1 nível
- [x] Mentions @ com autocomplete
- [x] ReportDialog (9 razões)
- [x] Menu ⋯ com visibility/delete (owner) e report (visitor)
- [x] Realtime via Supabase Channels
- [x] ConfirmDialog para deletes

### 🏢 Academia
- [x] `/academia` (legacy — minha academia)
- [x] `/academia/alunos` adicionar/buscar alunos
- [x] `/academia/promover` graduar aluno
- [x] `/academia/frequencia` check-in admin
- [x] `/academia/qr` gerar QR code download
- [x] `/academy/[id]` página pública (read-only) com:
  - Header + cidade
  - Sobre, horários (só membros)
  - 3 stats públicos
  - Distribuição faixas (só membros)
  - Professores (só membros)
  - Mapa Google Embed (fallback se sem API key)
  - Alunos recentes (só membros)
- [x] `/academy/[id]/admin` gated por owner/coach com:
  - Editar (nome, descrição, horários, endereço, UF, site)
  - Lista de alunos com badge role + último treino
  - Export CSV

### 📍 Check-in / Geolocalização
- [x] `/checkin` com GPS watchPosition
- [x] Lista academias próximas (qualquer modalidade)
- [x] **Seletor de modalidade (BJJ/Muay Thai/Boxe/Judô)**
- [x] **Busca automática 3km filtrada por modalidade**
- [x] **Busca manual fallback** (nome/cidade)
- [x] QR check-in (`?qr=TOKEN`)
- [x] Visita aberta com timer
- [x] Auto-criar treino se ≥25min
- [x] Histórico de visitas

### 🎖 Graduação (Belt KYC)
- [x] `/graduacao` request com upload de prova (foto/PDF)
- [x] `/graduacao/revisar` para professor (gated)
- [x] Bucket `belt-proofs` privado com signed URLs
- [x] Trigger `belt_verif_apply` sincroniza profile + audit
- [x] Trigger `badge_check_belt_verified` → badge `first_verified`
- [x] Selo ✓ verde no perfil quando verified

### 🏆 Gamificação
- [x] 8 badges automáticos (`badge_catalog` + triggers)
- [x] Streak atual + recorde
- [x] Nível logarítmico (`level = floor(sqrt(min/60)/2) + 1`)
- [x] XP por técnica (+10) / treino (+25) / grau (+100) / faixa (+500)
- [x] Achievements unlocados em tempo real
- [x] Backfill aplicado para usuários existentes
- [ ] **Confetti não plugado** (lib pronta)
- [ ] **Streak Shield Pro não plugado** (action pronta)

### 🎯 Desafios
- [x] `/desafios` listar/participar
- [x] `/owner/desafios` criar/editar/deletar
- [x] Tabela `challenges` com scope (global/academy)
- [x] RPC `challenge_progress`
- [x] Leaderboard

### 📊 Wrapped (`/wrapped`)
- [x] RPC `wrapped_stats` agrega ano todo
- [x] Carousel 7 slides estilo Stories
- [x] Botão final gera imagem 9:16 (template stats)
- [x] Swipe/tap/setas
- [x] Branding Belt Rise

### 🛡 Owner / Moderação
- [x] `/owner` dashboard com KPIs
- [x] `/owner/moderacao` reports + shadow-ban
- [x] `/owner/auditoria` audit log
- [x] `/owner/usuarios` lista global
- [x] `/owner/desafios` criar/gerenciar
- [x] `/owner/academias/nova` criar
- [x] Trigger shadow-ban automático (3 reports/30d)
- [x] Trigger rate-limit reports (10/dia)
- [x] RLS shadow_banned esconde do feed/profile

### 💳 Stripe (codado, inativo por env)
- [x] `/api/stripe/checkout` com trial 14d
- [x] `/api/stripe/webhook` com 5 handlers
- [x] `/api/stripe/portal` Customer Portal
- [x] Helper `isPro` / `planFor` (bypass quando flag off)
- [x] `/pricing` com banner "Em breve"
- [x] `/pricing/sucesso` confirmação
- [ ] **Portal não linkado em `/profile/menu`**

### 📸 Integrações sociais
- [x] `social_connections` table + RLS
- [x] `/api/social/instagram/connect` + `/callback`
- [x] `/api/social/tiktok/connect` + `/callback`
- [x] `lib/social/instagram.ts` (Meta Graph API 2024+)
- [x] `lib/social/tiktok.ts` (Direct Login + Share Kit)
- [x] **ShareSheet universal** (não plugado nas telas)

### 📊 Observability
- [x] Sentry config (server + client)
- [x] PostHog em `src/lib/analytics.ts`
- [x] `AnalyticsBoot` plugado no layout
- [x] Audit log endpoint
- [ ] Sem envs setadas em prod (graceful — não quebra)

### 🌐 i18n
- [ ] **Pendente** (Etapa 13 do PRD MICHI v2) — pt-BR/en-US/es-419/ja-JP
- Tudo em pt-BR hoje

---

## 4. Checklist de Padronização UI/UX (Frente 1 do briefing)

### ✅ Aplicado nesta sprint
- [x] Tokens semânticos (rise/blood/volt/ink) substituem hex literais nos componentes principais
- [x] Tipografia: Archivo Black (display) + Urbanist (body) padronizadas
- [x] Light/dark theme com CSS vars
- [x] Spacing scale documentada (`--space-1` a `--space-12`)
- [x] Border radius scale (`--radius-sm` a `--radius-2xl`)
- [x] Elevation scale (3 níveis)
- [x] Dashboard suavizado (cores leves + ícones menores)
- [x] Slogan restaurado na home
- [x] Logo Belt Rise consistente em login/dashboard/templates Stories
- [x] BottomNav 5 tabs Strava-style

### 🟡 Padronização parcial
- [ ] Páginas legacy ainda têm cores hex hardcoded:
  - `/academia/*` (cores `#CC0000`, `#F8F7F5` em vez de tokens)
  - `/admin` (cor laranja antiga `#FF6B2B`)
  - `/owner/academias/nova`
  - `/treino/novo` (vários hex)
  - Esses funcionam no dark mas no light theme têm contraste subótimo
- [ ] Algumas páginas têm bg branco `#F8F7F5` que conflita com dark mode
- [ ] Texto `text-[8px]` / `text-[9px]` em 20 arquivos (label uppercase OK, mas tem casos limite)

---

## 5. Próximos passos sugeridos (priorizados)

### P0 — Plugar features ocultas (1-2 dias)
1. **ShareSheet** em `/treino/[id]/share` substituindo botões manuais
2. **Confetti** em `/treino/novo` após save quando atinge marco
3. **Streak Shield** botão no streak hero do dashboard
4. **Stripe Portal** link em `/profile/menu` (gate Pro)
5. **Push notifications** botão opt-in em `/profile/menu`

### P1 — Padronização completa (2-3 dias)
1. Auditoria página por página migrando hex → tokens
2. Light theme polish (acessibilidade WCAG AA confirmada)
3. Suavizar gradients agressivos remanescentes
4. Aplicar design tokens (`--space-*`, `--radius-*`) onde ainda houver número mágico

### P2 — Performance + observability (3-5 dias)
1. Migrar `<img>` para `<Image>` do Next nas fotos de treino
2. Sentry DSN + PostHog key em prod
3. Edge Function para envio push (lembrete streak)
4. Edge Function semanal de recap via Resend
5. Otimizar bundle (analyze + lazy-load charts)

### P3 — i18n (Etapa 13 PRD) — 4-7 dias
1. Setup `next-intl` ou similar
2. Extract strings + traduzir pt-BR/en-US/es-419
3. JP-JP depende de demanda

---

## 6. Métricas rápidas

- **Tabelas no DB**: 24 (todas com RLS)
- **RPCs Postgres**: 28
- **Triggers**: ~15 (calorias, streak, shadow-ban, badges, belt verify)
- **Rotas Next**: 37 páginas + 18 API routes
- **Componentes React**: 50+
- **Dependências runtime**: framer-motion, canvas-confetti, web-push, posthog-js, @sentry/nextjs, stripe, @supabase/ssr, lucide-react, zustand
- **Commits desta sessão**: 48+

---

Documento gerado automaticamente. Para detalhes de uma área específica, ver arquivos:
- `VALIDATION.md` — checklist funcional original
- `UI_AUDIT.md` — auditoria iPhone-first
- `CLAUDE.md` (raiz) — instruções para futuras sessões IA
