/** Firestore tag system keys indexed by Settings/TagSystem navigation state. */
export const tagSystems = ['default', 'Topic', 'Source', 'Labels']

/**
 * Max live (active) tags per system, keyed like `tagSystems`.
 * Topic/Source UI shows `max - 1` plus the fixed "Other" slot.
 */
export const maxActiveTags = [0, 7, 10, 7]
