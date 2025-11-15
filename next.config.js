/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure we use Node.js runtime for database operations
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
  // Suppress pg-native warning (it's optional and not needed)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('pg-native');
    }
    return config;
  },
};

module.exports = nextConfig;

