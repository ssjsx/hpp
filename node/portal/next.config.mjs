const app1Url = process.env.PORTAL_APP1_URL ?? "http://127.0.0.1:3000";
const app2Url = process.env.PORTAL_APP2_URL ?? "http://127.0.0.1:3002";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer, webpack }) {
    if (!isServer && process.env.ENABLE_MF !== "false") {
      config.plugins.push(
        new webpack.container.ModuleFederationPlugin({
          name: "portal",
          remotes: {
            app1: `app1@${app1Url}/_next/static/chunks/remoteEntry.js`,
            app2: `app2@${app2Url}/_next/static/chunks/remoteEntry.js`,
          },
          shared: {
            react: { singleton: true, requiredVersion: false },
            "react-dom": { singleton: true, requiredVersion: false },
          },
        }),
      );
    }

    return config;
  },
};

export default nextConfig;
