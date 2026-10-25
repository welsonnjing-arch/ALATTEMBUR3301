/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
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
};

export default nextConfig;
