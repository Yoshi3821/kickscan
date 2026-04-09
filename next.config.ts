import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/the-verdict',
        destination: '/verdicts',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
/* force rebuild */
