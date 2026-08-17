/**
 * Admin-only pipeline rundown from BigQuery `truth_sleuth.pipeline_runs`.
 *
 * IAM (one-time, project misinfo-5d004): grant the Functions runtime
 * service account (`misinfo-5d004@appspot.gserviceaccount.com` for v1
 * callables) BigQuery Job User plus Data Viewer on dataset `truth_sleuth`.
 */

const functions = require("firebase-functions/v1");
const {BigQuery} = require("@google-cloud/bigquery");

const PROJECT_ID = "misinfo-5d004";
const DATASET_ID = "truth_sleuth";
const TABLE_ID = "pipeline_runs";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * @param {import("firebase-functions/v1").https.CallableContext} context
 */
function requireAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be signed in.",
    );
  }
  if (!context.auth.token.admin) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "Admin privileges required.",
    );
  }
}

/**
 * Clamp the requested row count to a safe range.
 *
 * @param {unknown} raw
 * @returns {number}
 */
function parseLimit(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(n)));
}

/**
 * Turn a BigQuery cell into a JSON-safe value.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function serializeValue(value) {
  if (value == null) return null;
  const valueType = typeof value;
  if (valueType === "string" ||
      valueType === "number" ||
      valueType === "boolean") {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toNumber === "function") {
    try {
      return value.toNumber();
    } catch (_err) {
      return String(value);
    }
  }
  if (typeof value.value === "string" || typeof value.value === "number") {
    return value.value;
  }
  return String(value);
}

/**
 * Flatten one BigQuery row for the dashboard.
 *
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown>}
 */
function serializeRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row || {})) {
    out[key] = serializeValue(value);
  }
  return out;
}

/**
 * Admin callable: recent Truth Sleuth pipeline run summaries.
 *
 * @example
 * await getPipelineRuns({ limit: 20 });
 */
exports.getPipelineRuns = functions.https.onCall(async (data, context) => {
  requireAdmin(context);

  const limit = parseLimit(data && data.limit);
  const table = `\`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\``;
  const query = `
    SELECT *
    FROM ${table}
    ORDER BY COALESCE(load_timestamp, SAFE.TIMESTAMP(recorded_at)) DESC
    LIMIT @limit
  `;

  try {
    const bigquery = new BigQuery({projectId: PROJECT_ID});
    const [rows] = await bigquery.query({
      query,
      params: {limit},
      types: {limit: "INT64"},
      location: "US",
    });
    return {
      runs: (rows || []).map(serializeRow),
    };
  } catch (error) {
    console.error("Failed to query pipeline_runs:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to load pipeline runs.",
    );
  }
});
