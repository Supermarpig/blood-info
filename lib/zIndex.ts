// Z-index values for React components and inline styles.
// tailwind.config.ts mirrors these values manually (see comment there) because
// it runs outside webpack and cannot import TypeScript modules.
export const zIndex = {
  mapAnim:  450,  // animated SVG paths inside Leaflet
  mapFloat: 500,  // floating cards / loading overlay above map
  toast:    800,
  modal:    1000, // Dialog overlay + content
  confetti: 9999,
} as const

// Always one above every named layer — use z-highest / zHighest when you need
// "above everything", so you never have to guess a magic number.
export const zHighest = Math.max(...Object.values(zIndex)) + 1
