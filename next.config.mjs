/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // `accounts` is an optional dependency of @wagmi/core's Tempo-chain
    // connectors. This app never creates a Tempo connector, but webpack
    // still tries to resolve the static import. Stub it out instead of
    // pulling in its very large optional dependency tree.
    config.resolve.alias = {
      ...config.resolve.alias,
      accounts: false,
    };
    return config;
  },
};

export default nextConfig;
