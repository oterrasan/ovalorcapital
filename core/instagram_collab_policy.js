const DEFAULT_SOURCES = ["ovalorcapital", "obrasilon"];
const DEFAULT_RECIPIENTS = ["souabetaferreira", "adriana.ferreirasp", "amichelefroes"];
const NEVER_AUTO_ACCEPT = new Set(["oterrasan"]);

export function normalizeInstagramUsername(value) {
  return String(value || "").trim().replace(/^@+/, "").toLowerCase();
}

function uniqueUsernames(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(normalizeInstagramUsername).filter(Boolean))];
}

export function normalizeCollabPolicy(raw) {
  const value = raw && typeof raw === "object" ? raw : {};
  const sources = Array.isArray(value.sources) ? value.sources : DEFAULT_SOURCES;
  const recipients = Array.isArray(value.recipients) ? value.recipients : DEFAULT_RECIPIENTS;
  return {
    sources: uniqueUsernames(sources).filter(username => DEFAULT_SOURCES.includes(username)),
    recipients: uniqueUsernames(recipients)
      .filter(username => !NEVER_AUTO_ACCEPT.has(username)),
    autoLike: value.autoLike !== false
  };
}

export function shouldAutoAcceptCollab({ recipient, source, policy }) {
  const normalized = normalizeCollabPolicy(policy);
  const recipientUsername = normalizeInstagramUsername(recipient);
  const sourceUsername = normalizeInstagramUsername(source);
  if (!recipientUsername || !sourceUsername || NEVER_AUTO_ACCEPT.has(recipientUsername)) return false;
  return normalized.recipients.includes(recipientUsername) && normalized.sources.includes(sourceUsername);
}

export const COLLAB_POLICY_DEFAULTS = Object.freeze({
  sources: DEFAULT_SOURCES,
  recipients: DEFAULT_RECIPIENTS,
  autoLike: true
});
