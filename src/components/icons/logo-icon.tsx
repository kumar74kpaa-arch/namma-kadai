import type { SVGProps } from 'react';

export function LogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2v2" />
      <path d="M12 10v1" />
      <path d="M12 17v2" />
      <path d="M5.5 12.5h13" />
      <path d="M9 7.5a2.5 2.5 0 0 1 6 0" />
      <path d="M9 14.5a2.5 2.5 0 0 1 6 0" />
      <path d="M7 22h10" />
      <path d="M9 19h6" />
    </svg>
  );
}
