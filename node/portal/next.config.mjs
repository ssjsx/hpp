const app1Base = process.env.PORTAL_APP1_URL ?? "http://127.0.0.1:3000";
const app2Base = process.env.PORTAL_APP2_URL ?? "http://127.0.0.1:3002";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/app1/_next/:path*",
        destination: `${app1Base}/_next/:path*`,
      },
      {
        source: "/app1",
        destination: `${app1Base}/app1`,
      },
      {
        source: "/app1/comparison",
        destination: `${app1Base}/comparison`,
      },
      {
        source: "/app1/:path*",
        destination: `${app1Base}/app1/:path*`,
      },
      {
        source: "/app2/_next/:path*",
        destination: `${app2Base}/_next/:path*`,
      },
      {
        source: "/app2",
        destination: `${app2Base}/app2`,
      },
      {
        source: "/app2/:path*",
        destination: `${app2Base}/app2/:path*`,
      },
    ];
  },
};

export default nextConfig;
