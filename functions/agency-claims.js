/**
 * Agency Auth claim helpers: stamp agencyId / agencyName on agency users.
 */

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const {log} = require("firebase-functions/logger");

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
 * Resolves agency doc id + name for an email (and optional preferred agencyId).
 *
 * @param {string} email
 * @param {string} [preferredAgencyId]
 * @returns {Promise<{agencyId: string, agencyName: string}|null>}
 */
async function resolveAgencyMembership(email, preferredAgencyId) {
  const db = admin.firestore();
  const preferred =
    typeof preferredAgencyId === "string" ? preferredAgencyId.trim() : "";

  if (preferred) {
    const snap = await db.collection("agency").doc(preferred).get();
    if (snap.exists) {
      return {
        agencyId: snap.id,
        agencyName: String(snap.data()?.name || ""),
      };
    }
  }

  const querySnap = await db
      .collection("agency")
      .where("agencyUsers", "array-contains", email)
      .limit(1)
      .get();

  if (querySnap.empty) {
    return null;
  }

  const docSnap = querySnap.docs[0];
  return {
    agencyId: docSnap.id,
    agencyName: String(docSnap.data()?.name || ""),
  };
}

/**
 * Sets Auth custom claims for an agency user.
 *
 * @param {string} uid
 * @param {{agencyId: string, agencyName: string}} membership
 * @returns {Promise<void>}
 */
async function setAgencyClaims(uid, membership) {
  await admin.auth().setCustomUserClaims(uid, {
    agency: true,
    agencyId: membership.agencyId,
    agencyName: membership.agencyName || "",
  });
}

/**
 * Callable: grant agency role with agencyId (+ agencyName) on the Auth token.
 *
 * Accepts optional `agencyId` so claims can be stamped before/while the email
 * is written into `agency.agencyUsers` (admin promote flow).
 *
 * @param {{email?: string, agencyId?: string}} data
 */
exports.addAgencyRole = functions.https.onCall(async (data, context) => {
  const email = typeof data?.email === "string" ? data.email.trim() : "";
  if (!email) {
    log("addAgencyRole skipped: email not provided");
    return {
      message: "No email provided. Skipping agency role assignment.",
    };
  }

  const preferredAgencyId =
    typeof data?.agencyId === "string" ? data.agencyId.trim() : "";

  try {
    const user = await admin.auth().getUserByEmail(email);
    const membership = await resolveAgencyMembership(email, preferredAgencyId);
    if (!membership?.agencyId) {
      throw new functions.https.HttpsError(
          "failed-precondition",
          `No agency membership found for ${email}. Pass agencyId or add the email to an agency first.`,
      );
    }

    await setAgencyClaims(user.uid, membership);
    return {
      message: `Success! ${email} has been made an agency user`,
      agencyId: membership.agencyId,
      agencyName: membership.agencyName,
    };
  } catch (err) {
    if (err instanceof functions.https.HttpsError) {
      throw err;
    }
    log("addAgencyRole failed", err);
    throw new functions.https.HttpsError(
        "internal",
        err?.message || "Failed to assign agency role.",
    );
  }
});

/**
 * Admin callable: re-stamp agencyId/agencyName claims for every email currently
 * listed in any agency.agencyUsers array.
 *
 * @param {{dryRun?: boolean}} data
 */
exports.backfillAgencyClaims = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  const dryRun = data?.dryRun === true;

  const agenciesSnap = await admin.firestore().collection("agency").get();
  /** @type {Map<string, {agencyId: string, agencyName: string}>} */
  const emailToAgency = new Map();

  agenciesSnap.docs.forEach((docSnap) => {
    const name = String(docSnap.data()?.name || "");
    const users = Array.isArray(docSnap.data()?.agencyUsers) ?
      docSnap.data().agencyUsers :
      [];
    users.forEach((rawEmail) => {
      const email =
        typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
      if (!email) return;
      // First agency wins if an email appears in multiple (should be rare)
      if (!emailToAgency.has(email)) {
        emailToAgency.set(email, {
          agencyId: docSnap.id,
          agencyName: name,
        });
      }
    });
  });

  let updated = 0;
  let skipped = 0;
  let missingAuth = 0;
  /** @type {string[]} */
  const errors = [];

  for (const [email, membership] of emailToAgency.entries()) {
    try {
      const user = await admin.auth().getUserByEmail(email);
      const existing = user.customClaims || {};
      const already =
        existing.agency === true &&
        existing.agencyId === membership.agencyId &&
        (existing.agencyName || "") === (membership.agencyName || "");

      if (already) {
        skipped += 1;
        continue;
      }

      if (!dryRun) {
        await setAgencyClaims(user.uid, membership);
      }
      updated += 1;
    } catch (err) {
      if (err?.code === "auth/user-not-found") {
        missingAuth += 1;
      } else {
        errors.push(`${email}: ${err?.message || String(err)}`);
      }
    }
  }

  return {
    dryRun,
    agencyCount: agenciesSnap.size,
    emailCount: emailToAgency.size,
    updated,
    skipped,
    missingAuth,
    errors,
  };
});
