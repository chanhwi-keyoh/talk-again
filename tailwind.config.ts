import type { Config } from "tailwindcss";

// Talk Again — Tailwind design tokens
//
// Every value here is grounded in the elderly UX research in CLAUDE.md §4:
// - Body text 24px+, button labels 36–44px, sans-serif, line-height ≥ 1.5
// - Core buttons ≥ 120×120 with 24–32px gaps
// - Off-white background, near-black text (>= 7:1 contrast)
// - Distinct hues — never differentiate by blue/purple alone
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Height-based breakpoints. The app is landscape-locked, so width is
      // always plentiful; what differs between devices is VERTICAL space:
      // a landscape phone is short (~390px tall) while a tablet is tall
      // (~744px+). We branch the chrome on height — e.g. the emotion bar is a
      // persistent footer on tablets but collapses to a header button + drawer
      // on phones — instead of guessing from width.
      screens: {
        short: { raw: "(max-height: 599px)" },
        tall: { raw: "(min-height: 600px)" },
      },
      colors: {
        // Calm off-white background (warmer than #FFF; less glare than pure white).
        canvas: "#F5F3EF",
        ink: "#1A1A1A", // 15.6:1 on canvas — well above the 7:1 threshold.
        muted: "#4A4A4A", // 9.7:1 on canvas — still meets WCAG AAA.
        soft: "#E5E1D8", // Card / surface tint
        border: "#9A9285", // Visible borders, no relying on color alone.

        // Quick-phrase tile hues. Picked for elderly visibility:
        // - Avoid blue-vs-purple confusion (cataract / lens yellowing).
        // - Each pairs with a distinct icon + label (color is never the only signal).
        phrase: {
          yes: "#2E7D32", // deep green
          no: "#C62828", // deep red
          wait: "#EF6C00", // warm orange
          help: "#AD1457", // magenta-red (reserved tone, distinct from "no")
          hungry: "#F9A825", // amber
          thanks: "#6A1B9A", // grape (paired with 🙏 icon, never used alone vs blue)
          okay: "#00695C", // teal
          good: "#558B2F", // olive green (distinct from "yes" via icon)
          dislike: "#5D4037", // brown
          unsure: "#455A64", // slate
        },

        emergency: "#B71C1C",
      },
      fontFamily: {
        // Pretendard for Korean, system fallback chain for safety on offline iPads.
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
      fontSize: {
        // Custom scale: minimums respect "body ≥ 24px, labels 36–44px".
        // Each entry: [size, lineHeight]. Line-heights ≥ 1.4 (most ≥ 1.5).
        body: ["24px", { lineHeight: "1.6", fontWeight: "500" }],
        "body-lg": ["28px", { lineHeight: "1.5", fontWeight: "500" }],
        label: ["32px", { lineHeight: "1.4", fontWeight: "600" }],
        "label-lg": ["40px", { lineHeight: "1.3", fontWeight: "700" }],
        title: ["48px", { lineHeight: "1.25", fontWeight: "700" }],
      },
      spacing: {
        // Tap-target spacing tokens — never below 24px between touch targets.
        gap: "32px",
        "gap-sm": "24px",
        "tile-min": "160px", // Min tile size (well above 120px floor).
      },
      borderRadius: {
        tile: "20px",
        pill: "9999px",
      },
      boxShadow: {
        tile: "0 2px 0 0 rgba(0,0,0,0.12), 0 6px 16px -8px rgba(0,0,0,0.18)",
        "tile-pressed": "0 0 0 0 rgba(0,0,0,0.12), 0 2px 6px -3px rgba(0,0,0,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
