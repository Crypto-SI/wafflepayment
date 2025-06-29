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
