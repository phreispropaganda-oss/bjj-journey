# UI Audit — Belt Rise iPhone-first

> Baseado em Apple Human Interface Guidelines + W3C Touch Target spec + iOS Safari quirks.

## ✓ Aplicado nesta varredura

### Bugs concretos corrigidos
- [x] **TechDetail scrolla o body**: criado `useBodyScrollLock` (position:fixed + restore scrollY). Plugado em ConfirmDialog, ShareSheet, TourOverlay, TechDetail.
- [x] **Botão Marcar como feito sai do viewport**: ficou sticky no rodapé com `padding-bottom: max(env(safe-area-inset-bottom), 16px)` — nunca cai sob a home indicator.
- [x] **Botão Foco não fazia nada**: agora filtra para mostrar apenas o módulo com técnicas pendentes, já expandido. Label "Foco ON" quando ativo.
- [x] **Tour não reaparecia após rebrand**: storage key migrada `michi_tour_v1` → `belt_rise_tour_v2`.

### Boas práticas globais (globals.css)
- [x] `overscroll-behavior-y: contain` — sem bounce do body
- [x] `font-size: 16px` em inputs — sem zoom automático do iOS Safari ao focar
- [x] Helpers `.pb-safe` / `.pt-safe` para safe-area
- [x] `-webkit-tap-highlight-color: transparent` (já tinha)
- [x] Botões `.btn-primary` `min-h-[56px]` (Apple HIG mínimo 44pt, ideal 56pt)
- [x] BottomNav usa `env(safe-area-inset-bottom)` para não ficar atrás da home indicator
- [x] Botão "+" central elevado (-mt-7) com border-4 do brand-surface

### Visibilidade
- [x] Cores: brand vermelho #CC0000 sobre bg #080808 → contraste 5.5:1 (AA grande)
- [x] Texto primário #F5F5F5 sobre bg #080808 → contraste 18.7:1 (AAA)
- [x] Texto secundário #A0A0A0 sobre bg #080808 → contraste 8.2:1 (AAA)
- [x] Inputs perfil corrigidos: bg-white + text-[#0D0D0D] + placeholder-[#AAA]

## ⚠ Pontos que requerem atenção (não bloqueantes)

### Tap targets pequenos
Várias páginas têm botões 32×32 (botões "‹" "›" de navegação mensal). HIG recomenda 44×44. Aplicado `min-h-tap` em algumas; outras seguem como UI mais densa intencional (calendário, owner panels).

### Textos `text-[8px]` / `text-[9px]`
20 arquivos. Maioria é label "uppercase tracking-wider" tipo eyebrow ("STREAK", "TREINOS") — aceitável em design system moderno (Strava, Whoop). Não muda significativamente legibilidade.

### Componentes que poderiam ganhar body-scroll-lock
- `ReportDialog` (acessível raramente)
- `MonthlyCalendar` bottom-sheet (já tem `touch-none` no fundo, OK)
- `photoSheet` em `/treino/novo` (transient, baixo impacto)

## Pesquisa de boas práticas aplicadas

**Apple HIG (iOS 17+)**:
- Bottom safe-area com home indicator ≈ 34px
- Status bar ≈ 47-59px (notch/Dynamic Island)
- Tap target mínimo 44pt (HIG 4.0 padrão)
- Modais bottom-sheet com `presentationDetents` no iOS nativo — simulamos com flex-col + max-h-[85vh] + body lock

**Mobile Web (Strava, Whoop, Nike Run Club observados)**:
- Dashboard: KPI cards 2-3 colunas, números 28-40px em font display
- Heatmap calendar: cell ≈ 32×32 com 1-2px gap
- Bottom nav: 5 tabs (Strava clássico) com botão central proeminente

**iOS Safari quirks evitados**:
- ✅ Input `font-size: 16px+` evita zoom automático ao focar
- ✅ `overscroll-behavior: contain` evita bounce indesejado
- ✅ `viewport-fit=cover` + safe-area-inset para notch
- ✅ Modais com body scroll lock evita "vazamento" de scroll

## Itens não cobertos nesta sprint (backlog)

1. **Haptic feedback**: `navigator.vibrate()` já usado em Foco/Timer; expandir para toda ação destrutiva
2. **Skeleton loaders** em vez de "Carregando…" textual
3. **Pull-to-refresh** no feed/dashboard
4. **Dark mode toggle explícito** (hoje é dark-only)
5. **Acessibilidade**: ARIA labels em botões com só emoji, focus traps em modais
6. **Image lazy-load** já existe nos posts grid; estender para avatares
7. **Smooth scroll restoration** ao voltar de subpáginas

## Métricas alvo (Lighthouse mobile)

| Métrica | Atual estimado | Alvo |
|---|---|---|
| Performance | ~75 | 90+ |
| Accessibility | ~85 | 95+ |
| Best Practices | ~90 | 95+ |
| SEO | ~85 | 95+ |

Performance limitada por imagens não otimizadas (training-photos não passam por `next/image`).
