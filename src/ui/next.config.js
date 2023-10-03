
module.exports = {
  output: 'export',
  distDir: 'dist',
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
}