import type { SVGProps } from 'react'

type BrandMarkProps = SVGProps<SVGSVGElement> & {
  size?: number
}

export function BrandMark({ size = 48, ...props }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect x="4" y="4" width="72" height="72" rx="18" fill="#102548" />
      <path
        fill="#ffffff"
        d="M27 16c-6.075 0-11 4.925-11 11v26c0 6.075 4.925 11 11 11h18c6.075 0 11-4.925 11-11V35.414a7 7 0 0 0-2.05-4.95l-10.414-10.414A7 7 0 0 0 38.586 18H27Z"
      />
      <path fill="#21c7d7" d="M40 18v9.5c0 3.59 2.91 6.5 6.5 6.5H56L40 18Z" />
      <rect x="24" y="34" width="18" height="4" rx="2" fill="#102548" opacity="0.95" />
      <rect x="24" y="43" width="22" height="4" rx="2" fill="#102548" opacity="0.95" />
      <rect x="24" y="52" width="12" height="4" rx="2" fill="#21c7d7" />
      <path fill="#f5b43c" d="M50 38 37 55h10l-3.5 13L64 46H53.5L58 38H50Z" />
    </svg>
  )
}
