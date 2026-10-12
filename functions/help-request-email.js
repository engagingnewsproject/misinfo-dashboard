/**
 * Emails new help requests to the Center for Media Engagement inbox.
 *
 * Sent through SendGrid from the authenticated mediaengagement.org domain.
 * The utexas.edu domain is not authorized for SendGrid, so it can only be
 * the recipient, never the sender.
 */

const sgMail = require("@sendgrid/mail");

const HELP_EMAIL_TO = "mediaengagement@austin.utexas.edu";
const HELP_EMAIL_FROM = {
  email: "noreply@mediaengagement.org",
  name: process.env.BRAND_NAME || "Misinfo Dashboard",
};

/**
 * @param {string} value
 * @return {string}
 */
function escapeHtml(value) {
  return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
}

/**
 * Firestore Timestamp, Date, or missing -> readable US Central time string.
 *
 * @param {unknown} createdDate
 * @return {string}
 */
function formatCreatedDate(createdDate) {
  let date = null;
  if (createdDate && typeof createdDate.toDate === "function") {
    date = createdDate.toDate();
  } else if (createdDate instanceof Date) {
    date = createdDate;
  }
  if (!date || isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  }) + " CT";
}

/**
 * @typedef {Object} HelpRequestEmailInput
 * @property {string} requestId
 * @property {string} userID
 * @property {string} userName
 * @property {string} userEmail
 * @property {string} userRole
 * @property {string} subject
 * @property {string} messageText
 * @property {string[]} images
 * @property {unknown} createdDate
 */

/**
 * @param {HelpRequestEmailInput} input
 * @return {import("@sendgrid/mail").MailDataRequired}
 */
function buildHelpRequestEmail(input) {
  const images = Array.isArray(input.images) ? input.images : [];
  const created = formatCreatedDate(input.createdDate);
  const fields = [
    ["Name", input.userName],
    ["Email", input.userEmail],
    ["Role", input.userRole],
    ["User ID", input.userID],
    ["Submitted", created],
    ["Request ID", input.requestId],
  ];

  const text = [
    `Subject: ${input.subject}`,
    "",
    ...fields.map(([label, value]) => `${label}: ${value}`),
    "",
    "Message:",
    input.messageText,
    "",
    "Images:",
    ...(images.length ? images : ["None"]),
  ].join("\n");

  const html = `
    <h2>${escapeHtml(input.subject)}</h2>
    <table cellpadding="4">
      ${fields.map(([label, value]) =>
    `<tr><td><strong>${label}</strong></td>` +
    `<td>${escapeHtml(value)}</td></tr>`).join("")}
    </table>
    <h3>Message</h3>
    <p style="white-space: pre-wrap;">${escapeHtml(input.messageText)}</p>
    <h3>Images</h3>
    ${images.length ?
      `<ul>${images.map((url) =>
        `<li><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></li>`,
      ).join("")}</ul>` :
      "<p>None</p>"}
  `;

  const isRealEmail = /\S+@\S+\.\S+/.test(input.userEmail || "");
  return {
    to: HELP_EMAIL_TO,
    from: HELP_EMAIL_FROM,
    ...(isRealEmail ? {replyTo: input.userEmail} : {}),
    subject: `Help request: ${input.subject}`,
    text,
    html,
    // Tracking would rewrite the image links through SendGrid redirects.
    trackingSettings: {
      clickTracking: {enable: false, enableText: false},
      openTracking: {enable: false},
    },
  };
}

/**
 * @param {HelpRequestEmailInput} input
 * @param {string} apiKey
 * @return {Promise<void>}
 */
async function sendHelpRequestEmail(input, apiKey) {
  sgMail.setApiKey(apiKey);
  await sgMail.send(buildHelpRequestEmail(input));
}

module.exports = {
  HELP_EMAIL_TO,
  HELP_EMAIL_FROM,
  buildHelpRequestEmail,
  sendHelpRequestEmail,
};
