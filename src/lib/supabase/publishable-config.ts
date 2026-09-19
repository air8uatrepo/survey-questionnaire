// Next.js inlines `process.env.NEXT_PUBLIC_*` only for static member access at
// build time. A computed lookup such as `process.env[name]` survives into the
// browser bundle and reads an empty `process.env`, silently dropping the
// configuration. Keep the literal property accesses below.
export function getPublishableSupabaseConfiguration(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase Auth configuration is unavailable.');
  }

  return { url, key };
}
