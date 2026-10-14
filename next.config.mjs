/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // These are optional peer/dynamic dependencies of @wagmi/connectors and
    // @reown/appkit-adapter-wagmi that BitSwap never uses (AppKit's own modal
    // handles wallet connections). Aliasing them to `false` keeps the build
    // from failing on unresolvable optional imports.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@metamask/connect-evm": false,
      "@walletconnect/ethereum-provider": false,
      accounts: false,
    };
    return config;
  },
};

export default nextConfig;
