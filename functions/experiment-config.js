/**
 * Shared experiment cohort defaults for Cloud Functions (CommonJS).
 * Keep in sync with utils/experiment-config.js.
 */

const DEFAULT_EXPERIMENT_CONFIG = {
  activeExperimentId: "2026-main",
  experiments: [
    {id: "2024-pilot", label: "2024 study"},
    {id: "2025-main", label: "2025 study"},
    {id: "2026-main", label: "2026 study"},
  ],
};

/** Oldest-first: first matching cutoff wins. */
const EXPERIMENT_COHORT_CUTOFFS = [
  {
    beforeMs: Date.parse("2025-01-01T00:00:00.000Z"),
    experimentId: "2024-pilot",
  },
  {
    beforeMs: Date.parse("2026-01-01T00:00:00.000Z"),
    experimentId: "2025-main",
  },
];

const DEFAULT_ARCHIVE_CUTOFF_ISO = "2026-01-01T00:00:00.000Z";

/**
 * @param {import("firebase-admin").firestore.Timestamp | undefined} createdDate
 * @param {string} activeExperimentId
 * @returns {string}
 */
function inferExperimentId(createdDate, activeExperimentId) {
  if (!createdDate || typeof createdDate.toDate !== "function") {
    return activeExperimentId;
  }
  const ms = createdDate.toDate().getTime();
  if (Number.isNaN(ms)) {
    return activeExperimentId;
  }
  for (const tier of EXPERIMENT_COHORT_CUTOFFS) {
    if (ms < tier.beforeMs) {
      return tier.experimentId;
    }
  }
  return activeExperimentId;
}

module.exports = {
  DEFAULT_EXPERIMENT_CONFIG,
  EXPERIMENT_COHORT_CUTOFFS,
  DEFAULT_ARCHIVE_CUTOFF_ISO,
  inferExperimentId,
};
