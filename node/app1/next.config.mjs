/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer, webpack }) {
    if (!isServer && process.env.ENABLE_MF !== "false") {
      config.plugins.push(
        new webpack.container.ModuleFederationPlugin({
          name: "app1",
          filename: "static/chunks/remoteEntry.js",
          exposes: {
            "./App1Remote": "./src/mf/App1Remote.tsx",
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
