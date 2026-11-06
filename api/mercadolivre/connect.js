import crypto from "node:crypto";
function cookie(name, value, maxAge) { return name + "=" + value + "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=" + maxAge; }
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  const { ML_CLIENT_ID, ML_REDIRECT_URI, ML_STATE_SECRET } = process.env;
  if (!ML_CLIENT_ID || !ML_REDIRECT_URI || !ML_STATE_SECRET) return res.redirect(302, "/?ml_error=server_configuration");
  const state = crypto.randomBytes(32).toString("hex");
  const signature = crypto.createHmac("sha256", ML_STATE_SECRET).update(state).digest("hex");
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  res.setHeader("Set-Cookie", [cookie("ml_oauth_state", state + "." + signature, 600), cookie("ml_oauth_verifier", verifier, 600)]);
  const authorization = new URL("https://auth.mercadolivre.com.br/authorization");
  authorization.searchParams.set("response_type", "code");
  authorization.searchParams.set("client_id", ML_CLIENT_ID);
  authorization.searchParams.set("redirect_uri", ML_REDIRECT_URI);
  authorization.searchParams.set("state", state);
  authorization.searchParams.set("code_challenge", challenge);
  authorization.searchParams.set("code_challenge_method", "S256");
  return res.redirect(302, authorization.toString());
}
