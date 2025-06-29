import type { SVGProps } from "react";

export function WaffleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20" />
      <path d="M2 12h20" />
      <path d="m4.93 4.93 14.14 14.14" />
      <path d="m19.07 4.93-14.14 14.14" />
    </svg>
  );
}

export function MetamaskIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 256 256"
      {...props}
    >
      <path fill="currentColor" d="M251.4 89.34l-59.2-59.2a15.86 15.86 0 0 0-22.5 0l-12.3 12.31l32.2 32.2l-32.2 32.2l-40.1-40.1a15.86 15.86 0 0 0-22.5 0l-46.9 46.9l-12.3 12.3a15.86 15.86 0 0 0 0 22.5l59.2 59.2a15.86 15.86 0 0 0 22.5 0l12.3-12.3l-32.2-32.2l32.2-32.2l40.1 40.1a15.86 15.86 0 0 0 22.5 0l46.9-46.9l12.3-12.3a15.86 15.86 0 0 0 0-22.5Z" />
    </svg>
  )
}

export function SolanaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 148 128"
      fill="none"
      {...props}
    >
      <path d="M47.793 113.811L0 90.061l47.793-23.75V113.81zM99.613 14.189L147.406 37.94l-47.793 23.75V14.19z" fill="#9945FF"/>
      <path d="M47.793 14.189l-47.793 23.75L47.793 61.69V14.19z" fill="#14F195"/>
      <path d="M99.613 113.811l47.793-23.75-47.793-23.75v47.5z" fill="#14F195"/>
      <path d="M91.08 0L47.793 21.28v37.34l43.287-21.28V0z" fill="url(#solana_a)"/>
      <path d="M91.08 69.05L47.793 90.33v37.34l43.287-21.28V69.05z" fill="url(#solana_b)"/>
      <defs>
        <linearGradient id="solana_a" x1="69.436" y1="0" x2="69.436" y2="58.62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff"/>
          <stop offset="1" stopColor="#fff" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="solana_b" x1="69.436" y1="69.05" x2="69.436" y2="127.67" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff"/>
          <stop offset="1" stopColor="#fff" stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function EvmIcon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        {...props}
      >
        <path d="M12 2L4.5 13l7.5 9l7.5-9L12 2z" />
        <path d="m12 15.5l7.5-6.5" />
        <path d="M12 15.5L4.5 9" />
        <path d="M12 2v20" />
      </svg>
    )
}
