const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseConfig() {
  if (!url || !serviceRoleKey) throw new Error("Supabase is not configured.");
  return { url: url.replace(/\/$/, ""), serviceRoleKey };
}

export async function supabaseRequest(path: string, options: RequestInit = {}) {
  const config = getSupabaseConfig();
  const headers = new Headers(options.headers);
  headers.set("apikey", config.serviceRoleKey);
  if (!config.serviceRoleKey.startsWith("sb_")) {
    headers.set("Authorization", `Bearer ${config.serviceRoleKey}`);
  }
  const response = await fetch(`${config.url}/rest/v1/${path}`, { ...options, headers, cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}).`);
  return response;
}
