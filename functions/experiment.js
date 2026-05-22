/**
 * Cloud Functions for experiment cohort config, bulk archive, backfill, and metrics.
 */

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const {Timestamp, FieldValue, FieldPath} = require("firebase-admin/firestore");
const {
  DEFAULT_EXPERIMENT_CONFIG,
  DEFAULT_ARCHIVE_CUTOFF_ISO,
  inferExperimentId,
} = require("./experiment-config");

const BATCH_SIZE = 500;

const db = () => admin.firestore();
const settingsRef = () =>
  db().collection("settings").doc("experiment");

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
 * @returns {Promise<typeof DEFAULT_EXPERIMENT_CONFIG>}
 */
async function getExperimentConfig() {
  const snap = await settingsRef().get();
  if (!snap.exists) {
    return {...DEFAULT_EXPERIMENT_CONFIG};
  }
  const data = snap.data();
  return {
    ...DEFAULT_EXPERIMENT_CONFIG,
    ...data,
    experiments: data.experiments ?? DEFAULT_EXPERIMENT_CONFIG.experiments,
  };
}

/**
 * @param {Date} cutoff
 * @returns {admin.firestore.Query}
 */
function bulkArchiveQuery(cutoff) {
  return db()
      .collection("reports")
      .where("archived", "==", false)
      .where("createdDate", "<", Timestamp.fromDate(cutoff));
}

exports.setActiveExperiment = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  const experimentId =
    typeof data?.experimentId === "string" ? data.experimentId.trim() : "";
  if (!experimentId) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "experimentId is required.",
    );
  }
  const config = await getExperimentConfig();
  const known = (config.experiments || []).some((e) => e.id === experimentId);
  if (!known) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        `Unknown experimentId: ${experimentId}`,
    );
  }
  await settingsRef().set(
      {
        activeExperimentId: experimentId,
        experiments: config.experiments,
      },
      {merge: true},
  );
  return {activeExperimentId: experimentId};
});

const EXPERIMENT_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

exports.addExperiment = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  const id = typeof data?.id === "string" ? data.id.trim() : "";
  const label = typeof data?.label === "string" ? data.label.trim() : "";
  const setActive = data?.setActive === true;

  if (!id || !EXPERIMENT_ID_PATTERN.test(id)) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "id must be a slug (lowercase letters, numbers, hyphens), e.g. 2027-main.",
    );
  }
  if (!label) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "label is required.",
    );
  }

  const config = await getExperimentConfig();
  if ((config.experiments || []).some((e) => e.id === id)) {
    throw new functions.https.HttpsError(
        "already-exists",
        `Experiment id already exists: ${id}`,
    );
  }

  const experiments = [...(config.experiments || []), {id, label}];
  const activeExperimentId = setActive ? id : config.activeExperimentId;

  await settingsRef().set(
      {experiments, activeExperimentId},
      {merge: true},
  );

  return {experiments, activeExperimentId, addedId: id};
});

exports.backfillReportExperimentFields =
  functions.https.onCall(async (data, context) => {
    requireAdmin(context);
    const config = await getExperimentConfig();
    const activeId = config.activeExperimentId;

    if (!(await settingsRef().get()).exists) {
      await settingsRef().set({
        activeExperimentId: activeId,
        experiments: config.experiments,
      });
    }

    let updated = 0;
    let lastDoc = null;

    // Paginate entire reports collection
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let q = db()
          .collection("reports")
          .orderBy(FieldPath.documentId())
          .limit(BATCH_SIZE);
      if (lastDoc) {
        q = q.startAfter(lastDoc);
      }
      const snapshot = await q.get();
      if (snapshot.empty) {
        break;
      }

      const batch = db().batch();
      let batchOps = 0;

      snapshot.docs.forEach((docSnap) => {
        const report = docSnap.data();
        const patch = {};

        if (report.archived === undefined) {
          patch.archived = false;
        }
        if (!report.experimentId) {
          patch.experimentId = inferExperimentId(report.createdDate, activeId);
        }

        if (Object.keys(patch).length > 0) {
          batch.update(docSnap.ref, patch);
          batchOps += 1;
          updated += 1;
        }
      });

      if (batchOps > 0) {
        await batch.commit();
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      if (snapshot.size < BATCH_SIZE) {
        break;
      }
    }

    return {updated};
  });

exports.previewBulkArchive = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  const cutoffISO =
    typeof data?.cutoffISO === "string" ?
      data.cutoffISO :
      DEFAULT_ARCHIVE_CUTOFF_ISO;
  const cutoff = new Date(cutoffISO);
  if (Number.isNaN(cutoff.getTime())) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid cutoffISO date.",
    );
  }

  const snapshot = await bulkArchiveQuery(cutoff).count().get();
  return {
    count: snapshot.data().count,
    cutoffISO: cutoff.toISOString(),
  };
});

exports.bulkArchiveReports = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  const cutoffISO =
    typeof data?.cutoffISO === "string" ?
      data.cutoffISO :
      DEFAULT_ARCHIVE_CUTOFF_ISO;
  const cutoff = new Date(cutoffISO);
  if (Number.isNaN(cutoff.getTime())) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid cutoffISO date.",
    );
  }

  const archivedBy = context.auth.uid;
  const archivedAt = FieldValue.serverTimestamp();
  let updated = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snapshot = await bulkArchiveQuery(cutoff).limit(BATCH_SIZE).get();
    if (snapshot.empty) {
      break;
    }

    const batch = db().batch();
    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        archived: true,
        archivedAt,
        archivedBy,
      });
    });
    await batch.commit();
    updated += snapshot.size;

    if (snapshot.size < BATCH_SIZE) {
      break;
    }
  }

  return {updated, cutoffISO: cutoff.toISOString()};
});

exports.getExperimentMetrics = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  const config = await getExperimentConfig();
  const experimentId =
    typeof data?.experimentId === "string" && data.experimentId.trim() ?
      data.experimentId.trim() :
      config.activeExperimentId;
  const includeArchived = data?.includeArchived === true;
  const agency =
    typeof data?.agency === "string" && data.agency.trim() ?
      data.agency.trim() :
      null;

  let submittedQuery = db().collection("reports");
  if (!includeArchived) {
    submittedQuery = submittedQuery.where("archived", "==", false);
  }
  submittedQuery = submittedQuery.where("experimentId", "==", experimentId);
  if (agency) {
    submittedQuery = submittedQuery.where("agency", "==", agency);
  }

  let scrapedQuery = submittedQuery.where("origin", "==", "scrape");

  const [submittedSnap, scrapedSnap] = await Promise.all([
    submittedQuery.count().get(),
    scrapedQuery.count().get(),
  ]);

  return {
    experimentId,
    includeArchived,
    agency,
    submittedCount: submittedSnap.data().count,
    scrapedCount: scrapedSnap.data().count,
  };
});
