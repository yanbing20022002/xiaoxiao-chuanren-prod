/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    // 强制输出独立目录，提升 Vercel 国内访问速度
    serverActions: true,
  }
};

module.exports = nextConfig;
