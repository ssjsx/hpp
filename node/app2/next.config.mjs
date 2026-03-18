/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer, webpack }) {
    if (!isServer && process.env.ENABLE_MF !== "false") {
      config.plugins.push(
        new webpack.container.ModuleFederationPlugin({
          name: "app2",
          filename: "static/chunks/remoteEntry.js",
          exposes: {
            "./App2Remote": "./src/mf/App2Remote.tsx",
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
