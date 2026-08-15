/** @type {import('next').NextConfig} */
const nextConfig = {
  //  output: "export",
  output: "standalone",

  trailingSlash: false,
  // skipTrailingSlashRedirect: true,
  ///distDir: "dist",

  async redirects() {
    return [
      // Basic redirect
      {
        source: "/",
        destination: "/ai/dashboard",
        permanent: true,
      },
    ];
  },
  //Optimize build package process
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // if (!isServer) {
    //   config.optimization.splitChunks.maxInitialRequests = 10;
    //   config.optimization.splitChunks.maxAsyncRequests = 10;
    // }
    config.cache = {
      type: 'filesystem',
    };
    config.watchOptions = {
      ignored: /node_modules|\.github|\.agent/,
      // 也可以添加其他要忽略的模式
      //aggregateTimeout: 300,
      poll: 1000,
    };


    return config;
  },
  reactStrictMode: false,
  images: { domains: ["cdn.pixabay.com"] },

};

export default nextConfig;
