/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Sử dụng biến môi trường để không hardcode URL
    const apiUrl = process.env.API_URL || `http://${process.env.API_HOST || 'localhost'}:${process.env.API_PORT || '3001'}`;
    const apiBase = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

