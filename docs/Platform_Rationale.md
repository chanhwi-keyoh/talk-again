# Platform Rationale — Talk Again

## Conclusion

Talk Again is a Progressive Web App (PWA), designed to be installed on an iPad (10th generation) at the grandfather's home.

## Why iPad

The grandfather spends most of his time at home — walking, watching TV, talking with his wife. He rarely does mobility-heavy activities like outdoor yard work. For this person, **screen size and legibility matter more than portability**.

Elderly UX research directly supports this choice. Older users with hand tremor achieve higher input speed and accuracy on tablets than on smartphones, because the keys are larger. A large screen makes big buttons, large type, and generous spacing possible — all of which compensate for reduced vision and unsteady hands at the same time.

The iPad also supports the Apple Pencil. The grandfather currently communicates by writing on paper. An iPad with an Apple Pencil can carry that familiar habit into the digital tool — handwritten input is recognized and spoken aloud — rather than asking him to abandon what already works for him.

## Rejected alternatives

- **Smartphone**: Screen is too small for elderly legibility and touch accuracy. Big-button, big-type design becomes impossible.
- **Laptop / PC**: Depends on keyboard input. The grandfather is not a typist, and a laptop is awkward to use naturally on a couch or at the dinner table.
- **Paper card system (non-digital)**: Cannot offer context-aware suggested replies or speech output. It reproduces the exact limitation he already has with paper.
- **Voice-assistant device (smart speaker)**: Depends on the user being able to speak. The grandfather cannot.

## Why a PWA, not a native app

- Buildable and shippable within the 9-day class deadline.
- A single live URL — family members can reach the same app from anywhere to help configure or debug it.
- "Add to Home Screen" on iPad Safari runs it full-screen, indistinguishable from a native app to the user.
- The Web Speech API gives Korean speech synthesis and recognition without any extra install.
- Clean migration path: in Production v2 we can move to a native iOS shell and/or a local LLM without throwing away the design system or the UX logic.

## Limits and what comes next

- The current build uses cloud APIs (ElevenLabs for voice, Claude for AI-suggested replies in a later step). Both depend on internet — a real limit in a rural Korean home.
- Production v2: integrate a local LLM so the app works fully offline. If iPad alone cannot host it, consider a small in-home server (e.g. a Raspberry Pi running Ollama) co-located with the iPad.
- Voice: the iOS Web Speech API offers very limited choice over voices. As a stand-in for the system fallback, the app relies on whatever Korean voice the iPad has installed; the elder-male persona is delivered by ElevenLabs Voice Design (a designed synthetic voice, not a clone of the grandfather's own voice — see Design Argument §6 and Records of Resistance #1).

## In one line

This tool lives on an iPad not because React is convenient, but because the grandfather needs to use it at home, on a large screen, with shaky hands, alongside the handwriting habit he already trusts.

---

*Sources: W3C WAI — Older Users; Nielsen Norman Group — UX for Seniors; "Designing for older adults: Review of touchscreen design guidelines" (arXiv 2017); "Touch Screen User Interfaces for Older Adults: Button Size and Spacing" (Springer). Further detail in `ELDERLY_UX_RESEARCH.md`.*
