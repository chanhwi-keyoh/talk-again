# Research Documentation — Talk Again

This document collects the specific research that grounds the design — both interview / family observations of my grandfather, and the elderly-UX literature that shaped the UI numbers.

---

## 1. Primary research — the person

### Who I talked to
- **My mother** — primary informant. She is the one who sees my grandfather most often and who first flagged the communication problem.
- **My grandmother** — lives with my grandfather. She is his current "translator" — she reads what he writes on paper and relays it to the rest of the family.

### What I learned

- **Daily routine:** mostly at home — walking, watching TV, conversation with grandmother. No yard work anymore. (Source: mom)
- **Workaround in use:** writes Korean on paper, hands the paper over. Conversations "never really land" because the other person has to wait. He ends up not having most conversations at all. (Source: grandfather, relayed via mom — in Design Argument §2)
- **Family worry:** grandmother and grandfather live alone together in rural Korea. If something happens to grandmother, grandfather cannot call for help and explain the situation or the address. (Source: mom — direct quote in Design Argument §2)
- **Pre-surgery personality:** prickly, talkative, loved to sing more than anything. He cannot sing now. (Source: mom)
- **Surgical history:** late-diagnosed tongue cancer ~7 years ago, full tongue resection. No clean recordings of his pre-surgery voice exist; the family searched. Post-surgery audio is humming "도레미" only — not speech phonetics.

### Primary artifacts

- [`evidence/Messages.JPG`](./evidence/Messages.JPG) — KakaoTalk thread with my mother about my grandfather's daily life and the communication workaround he currently uses.
- [`evidence/Video call.png`](./evidence/Video%20call.png) — video call with family — context for the in-home environment and how my grandparents communicate today.

---

## 2. Secondary research — elderly UX literature

The Tailwind design tokens in this project are direct translations of published guidelines. Every number in `tailwind.config.ts` traces back to one of these:

| Design token | Value | Source |
|---|---|---|
| Body text size | ≥ 24 px | W3C WAI — Older Users Accessibility Considerations |
| Button label size | 36–44 px | Touch Screen User Interfaces for Older Adults: Button Size and Spacing (Springer, 2014) |
| Line height | ≥ 1.5 | W3C WCAG 2.1 §1.4.12; Nielsen Norman Group — Reading on the Web |
| Text contrast | ≥ 7:1 | WCAG 2.1 AAA (`#1A1A1A` on `#F5F3EF` → 15.6:1, well above) |
| Primary tile minimum | ≥ 120 × 120 px | Touchscreen Design Guidelines for Older Adults (arXiv 2017) |
| Tap-target spacing | 24–32 px | Touch Screen User Interfaces for Older Adults (Springer, 2014) |
| Sans-serif Korean font | Pretendard | Avoids the rendering issues with thin / decorative Hangul faces in elderly vision research |
| No blue-vs-purple-only differentiation | (palette rule) | Cataract / lens yellowing research summarized by Nielsen Norman Group — UX for Seniors |
| One task per screen | (interaction rule) | Designing for Older Adults (Pew Research Center 2017) + NN/g |
| Tablet > phone for tremor users | (platform rule) | Studies on older adults' tablet vs. smartphone input speed and accuracy |

### Key takeaways that *directly* shaped what shipped

- **Tablet > phone for tremor users** — drove iPad as the deployment target (see `Platform_Rationale.md`).
- **Color alone is never enough** — every Quick Phrase tile carries color + icon + label simultaneously, in `QuickPhrasePanel.tsx`.
- **No hidden gestures, no IT jargon, no auto-disappearing UI** — three rules from elderly UX research that are pinned in `CLAUDE.md §4` so Claude Code defaults to them in every component.
- **Avoid blue-vs-purple-only distinctions** — `colors.phrase.*` palette deliberately uses high-saturation greens/reds/oranges/teals, no "is this dark blue or dark purple" decisions required.

---

## 3. Research → design mapping

| Research finding | Where it appears in the build |
|---|---|
| Tablet input speed + accuracy in tremor users | iPad as deployment target (`Platform_Rationale.md`) |
| Older adults read 24 px+ at performance comparable to young adults | `tailwind.config.ts` `fontSize.body = 24px` |
| Lens yellowing reduces blue / purple discrimination | `colors.phrase.*` palette (no blue-only tiles) |
| Hand tremor needs gap ≥ button size between targets | `spacing.gap = 32px`, `tile-min = 160px` |
| Confirmation dialogs frustrate elderly users | No confirmation modals on quick phrases or SOS |
| Hidden gestures are inaccessible | All actions are visible buttons, no swipe-only behavior |
| Auto-disappearing UI causes errors | EmergencyBanner stays visible until user taps Stop |
| Elderly users do better with one task per screen | Settings is full-screen overlay, not a corner dropdown |

---

*Citations: W3C WAI — Older Users Accessibility Considerations; Nielsen Norman Group — UX for Seniors; "Designing for older adults: Review of touchscreen design guidelines" (arXiv 2017); "Touch Screen User Interfaces for Older Adults: Button Size and Spacing" (Springer 2014); Pew Research Center 2017 — Technology Use Among Older Adults. Full annotated bibliography in `ELDERLY_UX_RESEARCH.md` (referenced from `CLAUDE.md §4`).*
