const variants = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20 disabled:opacity-50',
  secondary:
    'bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600 dark:hover:bg-slate-700',
  ghost:
    'text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800/80',
  danger: 'bg-red-600/90 text-white hover:bg-red-600 disabled:opacity-50',
} as const

const sizes = {
  md: 'px-4 py-2.5 text-sm',
  sm: 'px-3 py-1.5 text-xs',
  icon: 'h-9 w-9 p-0',
} as const

export type ButtonVariant = keyof typeof variants
export type ButtonSize = keyof typeof sizes

/** Classes do botão, para aplicar em `<Link>`/`<a>` sem aninhar um `<button>` dentro do link. */
export function buttonClass(
  variant: ButtonVariant = 'primary',
  className = '',
  size: ButtonSize = 'md',
): string {
  return `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed dark:focus-visible:ring-offset-slate-950 ${sizes[size]} ${variants[variant]} ${className}`
}
