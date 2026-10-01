import type { NextConfig } from "next";
import path from "path";
import { SITE_INDEXABLE } from "./lib/site";

// All site images are served from this Supabase Storage bucket - see lib/content.ts.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;
const supabaseOrigin = supabaseHostname ? ` https://${supabaseHostname}` : '';

const isDev = process.env.NODE_ENV === 'development';
// Vercel sets VERCEL=1 in its build environment. HSTS and
// upgrade-insecure-requests only make sense behind real TLS: sent from a local
// `next start`, Chrome would pin https onto every port of localhost for a year.
const behindTls = process.env.VERCEL === '1';

// No nonces: every page is statically generated (generateStaticParams), and a
// nonce forces per-request rendering. 'unsafe-inline' for scripts covers the
// three beforeInteractive bootstraps in app/layout.tsx; style-src needs it for
// the inline style attributes GSAP and the components write.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  // Images normally arrive through /_next/image (same origin); video posters
  // and the hero/cinematic videos are fetched straight from the bucket.
  `img-src 'self' data: blob:${supabaseOrigin}`,
  `media-src 'self' blob:${supabaseOrigin}`,
  "font-src 'self'",
  `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
  // Google Maps embed - only ever mounted after consent (lib/consent.ts).
  'frame-src https://www.google.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(behindTls ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // No `preload`: getting onto the browser preload list is a one-way door
  // that also binds every subdomain - decide that separately, once HTTPS is
  // proven everywhere under vityillo.hu.
  ...(behindTls
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
    : []),
];

// Pre-launch noindex for every response - HTML, images, /_next/image, PDFs -
// which a <meta> tag alone cannot reach. See lib/site.ts for the switch.
const noindexHeaders = SITE_INDEXABLE
  ? []
  : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet, noimageindex' }];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  poweredByHeader: false,
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: 'https', hostname: supabaseHostname, pathname: '/storage/v1/object/public/**' }]
      : [],
    // AVIF first, WebP for everything that cannot decode it. The bucket stores
    // WebP already; re-encoding to AVIF still lands roughly 20-30% smaller at
    // the same quality, which is the cheapest win available on a slow link.
    formats: ['image/avif', 'image/webp'],
    // Required from Next 16 on. 75 is the <Image> default and the only value
    // the site asks for.
    qualities: [75],
    // Supabase Storage serves these objects with `Cache-Control: no-cache`, so
    // without an explicit TTL the optimizer would re-validate constantly. The
    // filenames are immutable content keys ("img (N).webp"), so a long TTL is
    // safe - 30 days.
    minimumCacheTTL: 2592000,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [...securityHeaders, ...noindexHeaders],
      },
      {
        // Brand marks are referenced from CSS on every page and change about
        // never; a day of hard caching plus a week of stale-while-revalidate
        // takes them off the critical path for every repeat visit without
        // pinning a stale logo for a year.
        source: '/brand/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ]
  },
};

export default nextConfig;
