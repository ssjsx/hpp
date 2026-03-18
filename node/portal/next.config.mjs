const app1Base = process.env.PORTAL_APP1_URL;
const app2Base = process.env.PORTAL_APP2_URL;

if (!app1Base || !app2Base) {
  throw new Error(
    "PORTAL_APP1_URL and PORTAL_APP2_URL must be configured in .env.",
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/app1/:path*",
        destination: `${app1Base}/api/app1/:path*`,
      },
      {
        source: "/api/app2/:path*",
        destination: `${app2Base}/api/app2/:path*`,
      },
      {
        source: "/app1/_next/:path*",
        destination: `${app1Base}/_next/:path*`,
      },
      {
        source: "/app1",
        destination: `${app1Base}/app1`,
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
