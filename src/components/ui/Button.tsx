import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { buttonClass, type ButtonSize, type ButtonVariant } from './buttonClass'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  loading,
  disabled,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={buttonClass(variant, className, size)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  )
}
