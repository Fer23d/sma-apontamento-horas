type BrandMarkProps = {
  alt: string
  variant?: 'compact' | 'full'
  src?: string
  className?: string
}

export function BrandMark({ alt, variant = 'compact', src, className = '' }: BrandMarkProps) {
  const sizeClassName = variant === 'compact' ? 'h-11 w-11' : 'min-h-12 px-3'

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-sma-green font-extrabold text-sma-navy ${sizeClassName} ${className}`}
      data-brand-variant={variant}
      aria-label={alt}
    >
      {src ? <img src={src} alt={alt} className="max-h-10 max-w-full object-contain" /> : (
        <span aria-hidden="true">SM&amp;A</span>
      )}
      {variant === 'full' && !src && <span className="sr-only">{alt}</span>}
    </div>
  )
}
