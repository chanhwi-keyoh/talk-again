# Records of Resistance — Talk Again

> **Note to self (delete before submission if you want):** this draft was written by Claude Code based on our actual conversation and the AI Direction Log. The decisions and quotes are real — they came from me. Read through, rewrite in my own voice where the phrasing feels off, add anything missing, and remove this note. — Chanhwi

Six places where I refused what AI proposed (or what the default behavior would have produced) and chose something else instead. Each entry: what AI gave / defaulted to, what I chose, and why. Cross-references to `AI_Direction_Log.md` are included so a grader can verify the timing.

---

## 1. I refused voice cloning of my grandfather's voice

**AI / default would have given me:** ElevenLabs' instant voice-cloning feature is one of its headline capabilities. The default "obvious" move for a "give grandfather his voice back" project is to clone him from any samples we can find.

**I chose instead:** No cloning at all. I had Claude Code adopt ElevenLabs *Voice Design* — a synthetic voice generated from a written description ("warm Korean man in his late 60s, dignified, slightly breathy"). This voice is not my grandfather's identity. It is the voice of the tool, not the voice of the person.

**Why:** Two reasons, one practical and one ethical.
- *Practical*: my family searched and there are no clean recordings of his voice from before the surgery. The only samples are post-surgery, of him humming "도레미" — the phonetics of singing are not the phonetics of speech.
- *Ethical*: a clone built from post-surgery audio would not restore him. It would be a different identity standing in for his — a fabrication wearing his name. As I wrote in the Design Argument: voice restoration for a late-diagnosis patient is not an engineering problem, it is a research problem, and I'm not going to pretend otherwise on a class deadline.

This decision is also locked into `CLAUDE.md §5` so Claude Code can't quietly revert it in a later session.

→ See `AI_Direction_Log.md` Entry 2 for the architecture I built around this constraint.

---

## 2. I refused the default iPad voice (Yuna) as the primary speaker

**AI / default would have given me:** Web Speech API's default Korean voice on iPad is Yuna — a female system voice that sounds robotic and clinical. The path of least resistance is to ship with this voice and move on.

**I chose instead:** Pay for ElevenLabs Voice Design as the primary voice, keep Web Speech only as an offline fallback. After listening to the first build I told Claude Code directly: **"목소리가 너무 무서워서 다른 목소리 알고리즘을 찾아서 추가하자."** ("The voice is too scary, let's find and add a different voice algorithm.")

**Why:** My grandfather is supposed to use this every day to *speak for himself.* If the voice sounds cold and mechanical, the tool fails its core promise — the listener won't perceive what comes out of the speaker as *him* communicating. They will perceive a machine. The cost of a custom voice ($5/month) is trivial compared to that failure.

→ See `AI_Direction_Log.md` Entry 2 (initial swap) and Entry 3 (further tuning of pronunciation).

---

## 3. I refused the "radial picker" spec for the emotion selector

**AI / default would have given me:** My own original spec (in `INITIAL_PROMPT_FOR_CODE.md`) said the emotion selector should be a "방사형 picker" — a radial wheel with six emotions around the edges and the current emotion in the center. It's a striking visual.

**I chose instead:** A horizontal grid of seven tiles — `보통` plus six emotions, all the same rectangular size, all the same tap geometry.

**Why:** Halfway through the build I realized the radial layout would put tap targets at uneven distances from the center and at angled positions around the wheel — bad for shaky hands. The grid is plainer-looking but every tile is identical in size and predictability. For an elderly user with reduced motor precision, predictable geometry beats striking visuals. The departure is annotated in the top comment of `EmotionPicker.tsx` so anyone reading the code knows it was on purpose.

→ See `AI_Direction_Log.md` Entry 3.

---

## 4. I refused the "speak emergency three times then stop" pattern

**AI / default would have given me:** The first emergency build had a sensible-looking cap: `EMERGENCY_REPEATS = 3`. The phrase would play three times and then go quiet. This is what most "emergency broadcast" UI does — it limits noise.

**I chose instead:** Loop until I tap stop. I sent Claude Code one line: **"SOS는 멈출 때까지 반복으로 하자."** ("Make SOS repeat until I stop it.") The cap was removed and the loop was replaced with `while (!aborted)`.

**Why:** The worst failure mode of this app is: *grandfather collapses at minute 16, the app went silent at minute 1, and no one heard.* A repeat cap that looks like a safety feature is actually a danger feature. It auto-quiets exactly when continuous broadcasting matters most. Cost was not a concern — the cached audio means an hour-long broadcast bills exactly one ElevenLabs call.

→ See `AI_Direction_Log.md` Entry 6.

---

## 5. I refused to use the SOS glyph (🆘) on the everyday "Help me" button

**AI / default would have given me:** The first build of `QuickPhrasePanel` used 🆘 as the icon for "도와줘" (Help me). It is the most literal icon for "help." Claude Code didn't push back on it.

**I chose instead:** Swap the icon to 🙋 ("person raising hand") and reserve 🆘 strictly for the emergency button. My exact message was: **"도와줘 아이콘 SOS는 비상용 버튼이랑 헷갈려서 아이콘 변경하고 진짜 비상 버튼 추가하자 — 응급용으로 주소 설명 같은거."**

**Why:** Two affordances using the same iconography means the user — or worse, a helper who arrives in a real emergency — cannot tell at a glance which one to trust. The everyday "I'd like help with this jar" button should not look like the "I am collapsing, call 119" button. Once I noticed the clash, I asked for both fixes in the same turn: change the icon *and* build the real emergency button I'd been deferring.

→ See `AI_Direction_Log.md` Entry 4.

---

## 6. I refused "speak the address" as the entire emergency design

**AI / default would have given me:** The first version of the emergency button just looped the spoken message at full volume. The whole emergency interaction lived in audio.

**I chose instead:** Force the screen to also display the address as a giant red banner while the broadcast is active. I told Claude Code: **"응급버튼 누르면 화면 상단에 (지금 ai 목소리 준비됨)이라고 적혀있는 그 영역 — 다시 말해요 - ai 목소리 준비됨 그 영역에 주소를 글로도 보여주자."** The header was rebuilt to swap into an `EmergencyBanner` showing 🆘 + the full message text + the Stop button.

**Why:** Audio is a single-shot signal — once it passes, it is gone. A neighbor or 119 responder arriving mid-broadcast misses part of the address and has no way to replay it without my grandfather (who may be unconscious) doing something. The screen has to carry the same information as a steady visual reference. Audio + text = dual channel = the address survives even if the audio doesn't.

→ See `AI_Direction_Log.md` Entry 5.

---

## What this list is not

I am not listing every micro-revision (commit messages cover those). These six are the moments where the default would have produced a *working* version that I rejected for a *better* version — driven by my grandfather's specific situation, not by aesthetics.
