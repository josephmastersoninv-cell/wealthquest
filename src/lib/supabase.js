const SB_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isConfigured = SB_URL.length > 0 && SB_KEY.length > 0;

export async function sbFetch(path, options = {}) {
  const res = await fetch(`${SB_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}
