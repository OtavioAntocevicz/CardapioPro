import { describe, expect, it } from 'vitest'
import { normalizeHttpUrl, validateSocialUrl } from './socialUrl'

describe('socialUrl', () => {
  it('normaliza URL sem protocolo', () => {
    expect(normalizeHttpUrl('instagram.com/foo')).toBe('https://instagram.com/foo')
  })

  it('aceita URL vazia', () => {
    expect(validateSocialUrl('')).toBeNull()
  })

  it('rejeita URL sem protocolo válido', () => {
    expect(validateSocialUrl('not a url')).toMatch(/https/i)
  })

  it('valida host do Instagram', () => {
    expect(validateSocialUrl('https://instagram.com/bar', 'instagram')).toBeNull()
    expect(validateSocialUrl('https://twitter.com/x', 'instagram')).toMatch(/Instagram/i)
  })
})
