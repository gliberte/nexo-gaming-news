/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "outline": "#849495",
        "on-surface-variant": "#b9cacb",
        "surface-container": "#201f21",
        "surface-bright": "#39393b",
        "on-background": "#e5e1e4",
        "primary": "#dbfcff",
        "tertiary-container": "#33fb0a",
        "on-tertiary-fixed": "#022100",
        "surface-container-lowest": "#0e0e10",
        "background": "#131315",
        "on-secondary-fixed": "#320047",
        "tertiary-fixed": "#79ff5b",
        "secondary-container": "#cf5cff",
        "on-secondary-fixed-variant": "#74009f",
        "inverse-primary": "#006970",
        "on-error-container": "#ffdad6",
        "surface-container-low": "#1c1b1d",
        "on-tertiary-container": "#106e00",
        "error-container": "#93000a",
        "surface-container-high": "#2a2a2c",
        "on-tertiary": "#053900",
        "surface-variant": "#353437",
        "on-primary": "#00363a",
        "on-primary-fixed-variant": "#004f54",
        "on-primary-fixed": "#002022",
        "inverse-on-surface": "#313032",
        "primary-fixed": "#7df4ff",
        "on-secondary": "#520071",
        "surface-container-highest": "#353437",
        "secondary": "#ecb2ff",
        "on-surface": "#e5e1e4",
        "on-error": "#690005",
        "surface-dim": "#131315",
        "tertiary-fixed-dim": "#2ae500",
        "on-primary-container": "#006970",
        "secondary-fixed": "#f8d8ff",
        "surface-tint": "#00dbe9",
        "surface": "#131315",
        "on-secondary-container": "#480063",
        "primary-container": "#00f0ff",
        "error": "#ffb4ab",
        "primary-fixed-dim": "#00dbe9",
        "on-tertiary-fixed-variant": "#095300",
        "secondary-fixed-dim": "#ecb2ff",
        "outline-variant": "#3b494b",
        "inverse-surface": "#e5e1e4",
        "tertiary": "#e1ffd1"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "unit": "4px",
        "margin-desktop": "64px",
        "gutter": "24px",
        "margin-mobile": "20px",
        "container-max": "1440px"
      },
      fontFamily: {
        "headline-lg-mobile": ["var(--font-sora)", "sans-serif"],
        "label-caps": ["var(--font-jetbrains)", "monospace"],
        "headline-md": ["var(--font-sora)", "sans-serif"],
        "body-md": ["var(--font-inter)", "sans-serif"],
        "display-lg": ["var(--font-sora)", "sans-serif"],
        "body-lg": ["var(--font-inter)", "sans-serif"],
        "stats-num": ["var(--font-sora)", "sans-serif"],
        "headline-lg": ["var(--font-sora)", "sans-serif"]
      },
      fontSize: {
        "headline-lg-mobile": ["32px", {"lineHeight": "38px", "fontWeight": "700"}],
        "label-caps": ["12px", {"lineHeight": "16px", "letterSpacing": "0.1em", "fontWeight": "700"}],
        "headline-md": ["28px", {"lineHeight": "34px", "fontWeight": "600"}],
        "body-md": ["16px", {"lineHeight": "26px", "fontWeight": "400"}],
        "display-lg": ["72px", {"lineHeight": "80px", "letterSpacing": "-0.04em", "fontWeight": "800"}],
        "body-lg": ["18px", {"lineHeight": "30px", "fontWeight": "400"}],
        "stats-num": ["24px", {"lineHeight": "24px", "fontWeight": "800"}],
        "headline-lg": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700"}]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
};
