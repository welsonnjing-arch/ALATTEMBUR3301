/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
      allowedOrigins: [
        'workspace.fynux.co',
        '*.fynux.co',
        'localhost:3000',
        '127.0.0.1:3000',
      ],
    },
    serverComponentsExternalPackages: [
      '@whiskeysockets/baileys',
      'ws',
      'pino',
      'qrcode',
      'libsignal',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/avatars/:filename*',
        destination: '/api/avatar/:filename*',
      },
    ];
  },
};

export default nextConfig;
