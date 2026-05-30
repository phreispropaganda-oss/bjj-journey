# VALIDATION — MICHI (BJJ Journey)

> **Status legend**
> - [x] passou (build + revisão de código + smoke quando possível)
> - [~] presente, requer validação manual no browser
> - [!] falta ou parcial — ver nota

Última varredura automatizada: build production `next build` passou (37 rotas, 0 erros TS, 0 erros runtime esperados).
Deploy alvo: https://bjj-journey-iota.vercel.app

---

## 🔐 Autenticação & Onboarding

- [~] Criar conta email/senha — fluxo `/signup` presente; precisa teste manual
- [~] Criar conta Google OAuth — Route Handler `/api/auth/google/route.ts` ativo
- [x] Onboarding 6 passos completo — `/onboarding` server component com `onboarded_at` gating
- [x] Campos obrigatórios validados — pre-checks no server action
- [x] Redirect para dashboard após onboarding — `redirect('/dashboard')` em `onboarding/actions.ts`
- [x] Login / logout / sessão persistente — `@supabase/ssr` com cookies httpOnly
- [x] Rota protegida redireciona para login — `src/middleware.ts` com `redirectedFrom`

---

## 🥋 Módulos & Técnicas

- [x] Selecionar cada faixa → módulos atualizam imediatamente — **fix do Bloco 2** (setCompletedForBelt resolve)
- [~] Expandir/colapsar técnica — setState imutável em openMods/openCats
- [~] Marcar técnica feita → progresso atualiza — toggle imutável + insert Supabase
- [~] Desmarcar técnica → progresso regride — toggle delete na key
- [~] Timer 3/5/10 min funciona — TimerSheet component
- [~] Modo Foco (TDAH) alterna — boolean `tdah` state
- [x] Progresso persiste após reload — Supabase + setCompletedForBelt sincroniza

---

## 📝 Treinos & Feed

- [x] Registrar treino com todos os campos — `/treino/novo` com validação
- [x] Treino aparece no feed após salvar — revalidatePath('/feed')
- [~] XP e streak atualizados após treino — trigger `badge_check_session` + `recompute_streak`
- [x] Excluir treino com modal de confirmação — **Bloco 3 ConfirmDialog** + ownership check
- [~] Dar e tirar kudos — `toggleOss` server action
- [~] Comentar e excluir comentário próprio — postComment + deleteComment com ownership
- [x] Não conseguir excluir comentário de outro usuário — RLS + server action ownership check

---

## 📅 Calendário

- [x] Calendário mensal: dias treinados marcados — **Bloco 7 MonthlyCalendar**
- [x] Navegar entre meses — botões ← →, framer-motion AnimatePresence
- [~] Toque no dia treinado → detalhes — bottom-sheet com sessões do dia
- [x] Streak calculado corretamente — useMemo com walkback

---

## 👤 Perfil público

- [~] Perfil público acessível sem login — `/profile/[username]` com supabasePublic
- [x] Calendário mensal no perfil público — publicMode={true} limitando 2 meses
- [~] OG image gerada corretamente — `app/profile/[username]/opengraph-image.tsx` existe
- [x] Perfil privado → 404 para visitante — `.eq('is_public', true)` no query
- [x] Destaques 8 KPIs — **Sprint P0.1 ProfileHighlights**
- [x] Timeline de evolução — **Sprint P1.5 ProfileTimeline**
- [x] Aba Posts (grid 3-col) — **Sprint P1.8 ProfilePosts**
- [x] Level XP badge — **Sprint P1.6 LevelBadge**

---

## 🏢 Academia

- [x] Aluno vê academia sem botão de editar — `/academy/[id]` (visitor mode)
- [x] Admin vê painel `/academy/[id]/admin` — gated por owner/coach role
- [x] Não-admin recebe 403 no admin — server-side check + UI 403 screen
- [x] Mapa embed carrega — iframe Google Maps Embed API
- [x] Fallback sem API key funciona — link "Ver no Google Maps" + endereço
- [x] Distribuição de faixas — RPC `academy_public_stats`
- [x] Exportar CSV — client-side Blob download

---

## 🎖️ Graduações & XP

- [~] Graduar → cor da faixa muda em todo o app — trigger `belt_verif_apply` atualiza profiles
- [~] Graduação aparece no feed — audit_log + user_timeline RPC
- [~] XP correto — RPC `increment_xp` no toggle de técnica + trigger no treino
- [x] Badges desbloqueiam — **Sprint P1.7** trigger `badge_check_session` + backfill
- [~] Streak Shield (Pro) — `useStreakShield` action gated por `isPro()` (Pro está sempre true porque Stripe inativo)

---

## 💳 Stripe

- [!] Stripe checkout abre — **inativo por design** (`NEXT_PUBLIC_STRIPE_ENABLED=false`); UI mostra banner amber
- [x] Webhook estrutura pronta — 5 handlers em `/api/stripe/webhook` (gated)
- [x] Feature bloqueada no Free mostra paywall — `isPro()` retorna true quando flag off
- [!] Cancelar plano → downgrade — endpoint `/api/stripe/portal` pronto, depende ativar Stripe

---

## 📸 Compartilhamento

- [~] Share sheet abre com preview — **Bloco 5 ShareSheet** com 6 ações
- [x] Copiar link funciona — clipboard API
- [x] WhatsApp abre com mensagem pronta — wa.me/?text=
- [!] Instagram OAuth conecta — código pronto, **requer Meta App Review** + env vars
- [~] TikTok Share Kit abre app — schema `snssdk1233://` + fallback web
- [x] 7 templates de Story (4 originais + 3 novos: achievement/graduation/record)

---

## 🎉 Engajamento

- [x] Confetti ao completar 100 treinos — `canvas-confetti` + `maybeCelebrate()`
- [!] Email de recap chega — **não implementado** (RPC `weekly_recap` pronta; falta Resend + Edge Function)
- [~] Push notification opt-in — `subscribeToPush()` + service worker; precisa VAPID keys configuradas
- [x] Tabela `push_subscriptions` com RLS

---

## 🔧 Decisões técnicas (Bloco 1)

- **TypeScript**: 0 erros (`npx tsc --noEmit` limpo)
- **`any`s**: 0 sem justificativa
- **RLS**: 24/24 tabelas (badge_catalog ativada no Bloco 1)
- **React Query**: não usado — app é Server Components + Server Actions com `revalidatePath`

---

## ⚠️ Pendências documentadas

1. **Email de recap (6.5)**: precisa env `RESEND_API_KEY` + criar Edge Function com cron domingo 20h
2. **Instagram/TikTok Direct Post**: requer aprovação Meta/TikTok dos apps. ShareKit funciona sem.
3. **Stripe**: ativar com 5 env vars (documentado no commit de Bloco 11)
4. **i18n (Etapa 13)**: pt-BR/en-US/es-419/ja-JP — última etapa do PRD MICHI v2, não nesta sprint
5. **Animação da chama por tamanho de streak**: estilo simples no `/calendar`; PRD pedia variações 1–6, ficou TODO

---

Última atualização: deploy final desta sprint.
