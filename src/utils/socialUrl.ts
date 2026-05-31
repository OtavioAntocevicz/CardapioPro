export type SocialPlatform = 'instagram' | 'facebook'

/** Garante protocolo https quando o usuário omite. */
export function normalizeHttpUrl(input: string): string {
  const s = input.trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

export function isValidHttpUrl(input: string): boolean {
  const s = input.trim()
  if (!s) return true
  try {
    const u = new URL(normalizeHttpUrl(s))
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** Retorna mensagem de erro ou null se válido/vazio. */
export function validateSocialUrl(input: string, platform?: SocialPlatform): string | null {
  const s = input.trim()
  if (!s) return null
  if (!isValidHttpUrl(s)) {
    return 'Informe um link completo, começando com https://'
  }
  try {
    const host = new URL(normalizeHttpUrl(s)).hostname.replace(/^www\./, '')
    if (platform === 'instagram' && !host.endsWith('instagram.com')) {
      return 'Use um link do Instagram (ex.: https://instagram.com/seurestaurante)'
    }
    if (platform === 'facebook' && !host.endsWith('facebook.com') && !host.endsWith('fb.com')) {
      return 'Use um link do Facebook (ex.: https://facebook.com/seurestaurante)'
    }
  } catch {
    return 'Link inválido'
  }
  return null
}

export function sanitizeSocialUrlForSave(input: string): string {
  return normalizeHttpUrl(input.trim())
}
