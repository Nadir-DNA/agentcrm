function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`)
  }
  return value
}

export const env = {
  SUPABASE_URL: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
}
