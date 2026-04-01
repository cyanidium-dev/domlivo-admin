/**
 * Shared Sanity field groups for landing page builder sections (consistent UX).
 * Map: settings → enabled; content → titles, subtitles, CTAs; media → images/video;
 * data → mode, lists, filters; layout → presentation, variants, structure.
 */
export const PAGE_BUILDER_GROUPS = [
  {name: 'settings', title: 'Settings'},
  {name: 'layout', title: 'Layout'},
  {name: 'content', title: 'Content', default: true},
  {name: 'media', title: 'Media'},
  {name: 'data', title: 'Data'},
] as const
