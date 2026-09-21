const createSvg = (path, {
  color = "#5865F2",
  size = 24,
} = {}) => `
<svg xmlns="http://www.w3.org/2000/svg"
  width="${size}"
  height="${size}"
  viewBox="0 0 24 24"
  fill="none"
  stroke="${color}"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round">
  ${path}
</svg>`.trim();

const badges = {
  STAFF: (options) => createSvg(`
    <path d="M12 3 19 6v5c0 4-3 8-7 10-4-2-7-6-7-10V6l7-3Z"/>
    <path d="m8 12 3 3 5-6"/>
  `, options),

  PARTNER: (options) => createSvg(`
    <path d="m10 13.5 4-4"/>
    <path d="m7.5 15.5-1 1a3 3 0 0 1-4-4l3-3a3 3 0 0 1 4 0"/>
    <path d="m16.5 8.5 1-1a3 3 0 0 1 4 4l-3 3a3 3 0 0 1-4 0"/>
  `, {
    color: "#F47FFF",
    ...options,
  }),

  HYPESQUAD: (options) => createSvg(`
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>
  `, {
    color: "#FFCC4D",
    ...options,
  }),

  BUG_HUNTER_LEVEL_1: (options) => createSvg(`
    <path d="M9 8h6a2 2 0 0 1 2 2v4a5 5 0 0 1-10 0v-4a2 2 0 0 1 2-2Z"/>
    <path d="M12 8V5M8 11H5M16 11h3M8 15H5M16 15h3"/>
  `, {
    color: "#3BA55D",
    ...options,
  }),

  BUG_HUNTER_LEVEL_2: (options) => createSvg(`
    <path d="M9 8h6a2 2 0 0 1 2 2v4a5 5 0 0 1-10 0v-4a2 2 0 0 1 2-2Z"/>
    <path d="M12 8V5M8 11H5M16 11h3M8 15H5M16 15h3"/>
  `, {
    color: "#F04747",
    ...options,
  }),

  PREMIUM_EARLY_SUPPORTER: (options) => createSvg(`
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>
  `, {
    color: "#F47FFF",
    ...options,
  }),

  VERIFIED_BOT: (options) => createSvg(`
    <path d="M12 3 19 6v5c0 4-3 8-7 10-4-2-7-6-7-10V6l7-3Z"/>
    <path d="m8 12 3 3 5-6"/>
  `, options),

  VERIFIED_DEVELOPER: (options) => createSvg(`
    <path d="M12 3 19 6v5c0 4-3 8-7 10-4-2-7-6-7-10V6l7-3Z"/>
    <path d="m8 12 3 3 5-6"/>
  `, {
    color: "#57F287",
    ...options,
  }),

  CERTIFIED_MODERATOR: (options) => createSvg(`
    <path d="M12 3 19 6v5c0 4-3 8-7 10-4-2-7-6-7-10V6l7-3Z"/>
    <path d="M12 8v8M8 12h8"/>
  `, {
    color: "#5B8DEF",
    ...options,
  }),

  BOT_HTTP_INTERACTIONS: (options) => createSvg(`
    <path d="M5 6h14M5 18h14"/>
    <path d="m10 9 5 3-5 3V9Z"/>
  `, {
    color: "#00B0F4",
    ...options,
  }),

  ACTIVE_DEVELOPER: (options) => createSvg(`
    <path d="M13 2 5 13h6l-1 9 8-11h-6l1-9Z"/>
  `, {
    color: "#23A559",
    ...options,
  }),

  HYPESQUAD_ONLINE_HOUSE_1: (options) => createSvg(`
    <path d="M12 3 19 7v5c0 4-3 8-7 9-4-1-7-5-7-9V7l7-4Z"/>
    <path d="M12 8v7M9 11h6"/>
  `, {
    color: "#F47FFF",
    ...options,
  }),

  HYPESQUAD_ONLINE_HOUSE_2: (options) => createSvg(`
    <circle cx="12" cy="12" r="8"/>
    <path d="M12 8v8M8 12h8"/>
  `, {
    color: "#45DDC0",
    ...options,
  }),

  HYPESQUAD_ONLINE_HOUSE_3: (options) => createSvg(`
    <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>
  `, {
    color: "#9B84EE",
    ...options,
  }),
};

export default badges;
