type PublicSocialFloatProps = {
  instagramUrl?: string
  facebookUrl?: string
}

export function PublicSocialFloat({ instagramUrl, facebookUrl }: PublicSocialFloatProps) {
  const links = [
    instagramUrl?.trim() ? { href: instagramUrl.trim(), label: 'Instagram', short: 'IG' } : null,
    facebookUrl?.trim() ? { href: facebookUrl.trim(), label: 'Facebook', short: 'FB' } : null,
  ].filter(Boolean) as { href: string; label: string; short: string }[]

  if (!links.length) return null

  return (
    <div
      className="fixed bottom-20 right-4 z-30 flex flex-col gap-2 lg:bottom-6"
      aria-label="Redes sociais"
    >
      {links.map(({ href, label, short }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-slate-800 shadow-lg ring-1 ring-slate-200/80 backdrop-blur transition hover:scale-105 hover:bg-white dark:bg-slate-900/90 dark:text-slate-100 dark:ring-slate-700"
          aria-label={label}
        >
          {short}
        </a>
      ))}
    </div>
  )
}
