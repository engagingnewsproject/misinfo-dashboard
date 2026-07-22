/** Firestore tag system keys indexed by Settings/TagSystem navigation state. */
export const tagSystems = ['default', 'Topic', 'Source', 'Labels']

/**
 * Max live (active) tags per system, keyed like `tagSystems`.
 * Topic/Source UI shows `max - 1` plus the fixed "Other" slot.
 */
export const maxActiveTags = [0, 10, 10, 7]

/** Max length for public-report custom Topic/Source text when "Other" is selected. */
export const CUSTOM_OTHER_TAG_MAX_LENGTH = 15
