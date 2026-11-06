import crypto from "node:crypto";
function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map(part => {
    const index = part.indexOf("=");
    return index < 0 ? ["", ""] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}
function clearCookies(res) {
  res.setHeader("Set-Cookie", ["ml_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0", "ml_oauth_verifier=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"]);
}
function encryptToken(value, keyHex) {
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== 32) throw new Error("Invalid encryption key");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString("base64url")).join(".");
}
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  const params = new URL(req.url, "https://local.invalid").searchParams;
  const code = params.get("code");
  const returnedState = params.get("state");
  const cookies = parseCookies(req.headers.cookie);
  const storedState = cookies.ml_oauth_state || "";
  const verifier = cookies.ml_oauth_verifier || "";
  const parts = storedState.split(".");
  const state = parts[0];
  const signature = parts[1];
  const { ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REDIRECT_URI, ML_STATE_SECRET, ML_TOKEN_ENCRYPTION_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  const required = [ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REDIRECT_URI, ML_STATE_SECRET, ML_TOKEN_ENCRYPTION_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY];
  if (required.some(value => !value)) { clearCookies(res); return res.redirect(302, "/?ml_error=server_configuration"); }
  if (!code || !returnedState || !state || !signature || !verifier) { clearCookies(res); return res.redirect(302, "/?ml_error=invalid_callback"); }
  const expected = crypto.createHmac("sha256", ML_STATE_SECRET).update(state).digest("hex");
  const a = Buffer.from(signature); const b = Buffer.from(expected);
  const validSignature = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!validSignature || returnedState !== state) { clearCookies(res); return res.redirect(302, "/?ml_error=invalid_state"); }
  try {
    const body = new URLSearchParams({ grant_type: "authorization_code", client_id: ML_CLIENT_ID, client_secret: ML_CLIENT_SECRET, code, redirect_uri: ML_REDIRECT_URI, code_verifier: verifier });
    const tokenResponse = await fetch("https://api.mercadolibre.com/oauth/token", { method: "POST", headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" }, body });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token || !tokenData.refresh_token) throw new Error("Token exchange failed");
    const record = {
      store_key: "primary", seller_id: String(tokenData.user_id),
      access_token_encrypted: encryptToken(tokenData.access_token, ML_TOKEN_ENCRYPTION_KEY),
      refresh_token_encrypted: encryptToken(tokenData.refresh_token, ML_TOKEN_ENCRYPTION_KEY),
      expires_at: new Date(Date.now() + Number(tokenData.expires_in || 21600) * 1000).toISOString(),
      scope: tokenData.scope || "", updated_at: new Date().toISOString()
    };
    const base = SUPABASE_URL.replace(/\/$/, "");
    const saved = await fetch(base + "/rest/v1/schinayder_mercadolivre_tokens?on_conflict=store_key", {
      method: "POST", headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(record)
    });
    if (!saved.ok) throw new Error("Secure token storage failed");
    clearCookies(res); return res.redirect(302, "/?ml_connected=1");
  } catch {
    clearCookies(res); return res.redirect(302, "/?ml_error=connection_failed");
  }
}

    clearCookies(res); return res.redirect(302, "/?ml_error=connection_failed");
  }
}
