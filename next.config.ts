import type { NextConfig } from "next";
import path from "path";

// All site images are served from this Supabase Storage bucket - see lib/content.ts.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

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
