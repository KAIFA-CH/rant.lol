/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'seccdn.libravatar.org',
        port: '',
        pathname: '/avatar/**',
      },
      {
        protocol: 'https',
        hostname: 'seccdn.libravatar.org',
        port: '',
        pathname: '/static/img/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        port: '',
        pathname: '/gh/mar0xy/fluentui-twemoji-emojis@main/unicode/3d/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/:param',
        destination: '/api/.well-known/:param'
      }
    ]
  },
}

module.exports = nextConfig
