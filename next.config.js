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
    domains: ['localhost'],
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    // Ignore system files and temp files
    config.watchOptions = {
      ignored: [
        '**/.git/**',
        '**/node_modules/**',
        'C:\\DumpStack.log.tmp',
        'C:\\hiberfil.sys',
        'C:\\pagefile.sys',
        'C:\\swapfile.sys',
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