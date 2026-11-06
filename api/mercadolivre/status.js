export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(200).json({
      configured: false,
      connected: false
    });
  }

  try {
    const base = SUPABASE_URL.replace(/\/$/, "");

    const response = await fetch(
      base + "/rest/v1/schinayder_mercadolivre_tokens?store_key=eq.primary&select=seller_id,expires_at,updated_at",
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY
        }
      }
    );

    if (!response.ok) {
      let supabaseCode = null;

      try {
        const body = await response.json();
        if (typeof body?.code === "string") {
          supabaseCode = body.code;
        }
      } catch {}

      return res.status(503).json({
        configured: true,
        connected: false,
        error: "supabase_request_failed",
        supabaseStatus: response.status,
        supabaseCode
      });
    }

    const rows = await response.json();
    const account = rows[0];

    return res.status(200).json({
      configured: true,
      connected: Boolean(account),
      sellerId: account?.seller_id || null,
      expiresAt: account?.expires_at || null,
      updatedAt: account?.updated_at || null
    });

  } catch (error) {
    return res.status(503).json({
      configured: true,
      connected: false,
      error: "status_unavailable",
      failureType: error?.name || "UnknownError"
    });
  }
}
