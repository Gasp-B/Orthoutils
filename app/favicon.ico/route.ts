import { NextResponse } from 'next/server';

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="12" fill="#0EA5E9" />
  <path d="M20 40.5C20 33.5964 25.5964 28 32.5 28H44" stroke="#ECFEFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M20 23.5C20 30.4036 25.5964 36 32.5 36H44" stroke="#ECFEFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

export function GET() {
  return new NextResponse(svgIcon, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
