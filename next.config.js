/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  env: {
    MYSQL_HOST: '192.168.72.250',
    MYSQL_DATABASE: 'oucsda',
    MYSQL_USER: 'ouc-it',
    MYSQL_PASSWORD: 'Y&U*i9o0p',
  }
}

module.exports = nextConfig 