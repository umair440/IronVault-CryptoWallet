import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable Next.js route-aware href typing across Link/router usage.
  typedRoutes: true,
  // Avoid dev-only segment explorer RSC bug (SegmentViewNode client manifest).
  experimental: {
    devtoolSegmentExplorer: false,
  },
};

export default nextConfig;
