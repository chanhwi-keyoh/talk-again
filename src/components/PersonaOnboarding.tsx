import { useState } from "react";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { PERSONA_QUESTIONS, usePersona } from "@/lib/persona";

/* -----------------------------------------------------------------------------
 * PersonaOnboarding
 *
 * Full-screen 10-question flow shown on first run, when persona has never
 * been answered. The grandfather (or family helping him) walks through one
 * question per screen — never a wall of inputs.
 *
 * Rules:
 *   - Every question is skippable individually ("건너뛰기"), and the whole
 *     onboarding is skippable from the intro screen ("지금 안 함").
 *   - "Back" returns to the previous question without losing the answer.
 *   - On the last question, "다 됐어요" stamps `completedAt` and dismisses
 *     the overlay. The persona is now context for `/api/suggest`.
 *   - Re-runnable from Settings → Grandfather profile → Re-enter.
 *
 * Why no auto-advance: choice questions could be tempting to auto-advance on
 * tap, but the elderly-UX rule is "no auto-disappearing UI." Explicit Next
 * gives the user time to confirm.
 * ---------------------------------------------------------------------------*/

interface PersonaOnboardingProps {
  onDone: () => void;
}

export function PersonaOnboarding({ onDone }: PersonaOnboardingProps) {
  const { lang, t } = useI18n();
  const { persona, setField, complete } = usePersona();
  const [step, setStep] = useState(-1); // -1 = intro screen

  const total = PERSONA_QUESTIONS.length;

  const finishOnboarding = () => {
    complete();
    onDone();
  };

  if (step === -1) {
    return (
      <Shell>
        <h2 className="text-title font-bold text-ink short:text-[26px]">
          {t("persona.intro.title")}
        </h2>
        <p className="mt-gap-sm max-w-2xl text-body-lg text-muted short:mt-2 short:text-[17px]">
          {t("persona.intro.body")}
        </p>
        <div className="mt-gap flex flex-wrap gap-gap-sm short:mt-4 short:gap-2">
          <PrimaryButton onClick={() => setStep(0)}>
            {t("persona.intro.start")}
          </PrimaryButton>
          <SecondaryButton onClick={onDone}>
            {t("persona.intro.skipAll")}
          </SecondaryButton>
        </div>
      </Shell>
    );
  }

  const q = PERSONA_QUESTIONS[step];
  const fieldKey = q.key;
  const currentValue = (persona[fieldKey] as string | undefined) ?? "";
  const questionLabel = t(`persona.question.${fieldKey}` as MessageKey);
  const progress = t("persona.progress")
    .replace("{current}", String(step + 1))
    .replace("{total}", String(total));

  return (
    <Shell>
      <p className="text-body text-muted short:text-[15px]">{progress}</p>
      <h2 className="mt-2 text-title font-bold leading-tight text-ink short:mt-1 short:text-[24px]">
        {questionLabel}
      </h2>

      <div className="mt-gap short:mt-4">
        {q.kind === "text" ? (
          <textarea
            value={currentValue}
            onChange={(e) => setField(fieldKey, e.target.value)}
            rows={3}
            className="block w-full max-w-2xl rounded-tile border-4 border-border bg-canvas px-6 py-4 text-body-lg text-ink shadow-inner focus:border-ink focus:outline-none short:rounded-2xl short:border-2 short:px-4 short:py-2 short:text-[18px]"
            autoFocus
          />
        ) : (
          <div className="flex flex-wrap gap-gap-sm short:gap-2">
            {q.choices?.map((c) => {
              const selected = currentValue === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setField(fieldKey, c.value)}
                  aria-pressed={selected}
                  className={[
                    "min-h-tile-min min-w-tile-min rounded-tile border-4 px-10 py-6 text-label-lg shadow-tile",
                    "short:min-h-[60px] short:min-w-[112px] short:border-2 short:px-6 short:py-3 short:text-[20px]",
                    selected
                      ? "border-ink bg-ink text-canvas"
                      : "border-border bg-soft text-ink",
                  ].join(" ")}
                >
                  {lang === "ko" ? c.ko : c.en}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-gap flex flex-wrap gap-gap-sm short:mt-4 short:gap-2">
        {step > 0 && (
          <SecondaryButton onClick={() => setStep(step - 1)}>
            {t("persona.back")}
          </SecondaryButton>
        )}
        <SecondaryButton
          onClick={() => {
            setField(fieldKey, undefined as never);
            if (step + 1 < total) setStep(step + 1);
            else finishOnboarding();
          }}
        >
          {t("persona.skip")}
        </SecondaryButton>
        {step + 1 < total ? (
          <PrimaryButton onClick={() => setStep(step + 1)}>
            {t("persona.next")}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={finishOnboarding}>
            {t("persona.finish")}
          </PrimaryButton>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-canvas px-10 py-10 short:px-5 short:py-4"
    >
      <div className="mx-auto flex max-w-4xl flex-col">{children}</div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-tile-min rounded-tile border-4 border-ink bg-ink px-10 py-4 text-label-lg text-canvas shadow-tile active:shadow-tile-pressed short:min-h-[52px] short:border-2 short:px-6 short:py-2.5 short:text-[18px]"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-tile-min rounded-tile border-4 border-border bg-soft px-10 py-4 text-label-lg text-ink shadow-tile active:shadow-tile-pressed short:min-h-[52px] short:border-2 short:px-6 short:py-2.5 short:text-[18px]"
    >
      {children}
    </button>
  );
}
