/**
 * Server-side OAuth client credentials.
 *
 * Environment values are accessed dynamically so Next.js cannot inline private
 * credentials into browser bundles that import provider metadata.
 */

function readPrivateEnv(name) {
  if (typeof process === "undefined" || !process?.env) return "";
  return String(process.env[name] || "").trim();
}

function createOAuthClient(clientIdEnv, clientSecretEnv) {
  return Object.freeze({
    clientId: readPrivateEnv(clientIdEnv),
    clientSecret: readPrivateEnv(clientSecretEnv),
  });
}

export const GOOGLE_OAUTH_CLIENT = createOAuthClient(
  "GEMINI_OAUTH_CLIENT_ID",
  "GEMINI_OAUTH_CLIENT_SECRET"
);

export const ANTIGRAVITY_OAUTH_CLIENT = createOAuthClient(
  "ANTIGRAVITY_OAUTH_CLIENT_ID",
  "ANTIGRAVITY_OAUTH_CLIENT_SECRET"
);

/**
 * Fail before starting an OAuth request when deployment credentials are absent.
 */
export function requireOAuthClient(client, providerName, envPrefix) {
  const missing = [];
  if (!client?.clientId) missing.push(`${envPrefix}_CLIENT_ID`);
  if (!client?.clientSecret) missing.push(`${envPrefix}_CLIENT_SECRET`);

  if (missing.length) {
    throw new Error(
      `${providerName} OAuth is not configured. Set ${missing.join(" and ")} in the server environment.`
    );
  }

  return client;
}