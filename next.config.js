/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/images/**',
      },
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
    domains: ['localhost', 'access.oucsda.org'],
    unoptimized: true
  },
  // Configure API routes to handle larger file uploads
  experimental: {
    serverComponentsExternalPackages: ['sharp']
  },
  // Increase body size limit for file uploads
  async headers() {
    return [
      {
        source: '/api/upload',
        headers: [
          {
            key: 'Content-Type',
            value: 'multipart/form-data',
          },
        ],
      },
    ];
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
