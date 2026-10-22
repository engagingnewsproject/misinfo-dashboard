/**
 * Study-site temporary passwords.
 *
 * An admin generates a one-time password for a participant. The participant
 * must replace it on the next login. The password itself is not stored.
 */

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const crypto = require("crypto");
const {requireAdmin} = require("./agency-claims");

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const TEMP_PASSWORD_LENGTH = 12;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Readable password with no look-alike characters (0/O, 1/l).
 *
 * @param {number} [length]
 * @returns {string}
 */
function generateTemporaryPassword(length = TEMP_PASSWORD_LENGTH) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return out;
}

/**
 * Admin-only. Sets a random password and marks the account so the next
 * login must replace it.
 */
exports.setTemporaryPassword = functions.https.onCall(async (data, context) => {
  requireAdmin(context);

  const uid = typeof data?.uid === "string" ? data.uid.trim() : "";
  if (!uid) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "User id is required.",
    );
  }

  const ref = admin.firestore().collection("mobileUsers").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError(
        "not-found",
        "User profile was not found.",
    );
  }

  const password = generateTemporaryPassword();
  await admin.auth().updateUser(uid, {password});
  await ref.set({mustChangePassword: true}, {merge: true});
  return {password};
});

/**
 * Signed-in participant replaces the temporary password. Only works while
 * the account is marked mustChangePassword.
 */
exports.replaceTemporaryPassword = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be signed in.",
    );
  }

  const password = typeof data?.password === "string" ? data.password : "";
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Password must be at least 8 characters.",
    );
  }

  const uid = context.auth.uid;
  const ref = admin.firestore().collection("mobileUsers").doc(uid);
  const snap = await ref.get();
  if (snap.data()?.mustChangePassword !== true) {
    throw new functions.https.HttpsError(
        "failed-precondition",
        "This account does not need a new password.",
    );
  }

  await admin.auth().updateUser(uid, {password});
  await ref.set({mustChangePassword: false}, {merge: true});
  return {ok: true};
});
