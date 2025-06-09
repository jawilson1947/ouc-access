/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
    domains: ['localhost', 'access.ouctv.org', 'ouctv.org'],
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    // Ignore system files and temp files (cross-platform)
    config.watchOptions = {
      ignored: [
        '**/.git/**',
        '**/node_modules/**',
        '**/DumpStack.log.tmp',
        '**/hiberfil.sys',
        '**/pagefile.sys',
        '**/swapfile.sys'
      ]
    };
    config.module.rules.push({
      test: /\.(png|jpg|gif|svg)$/i,
      type: 'asset/resource'
    });
    return config;
  }
};

module.exports = nextConfig; 