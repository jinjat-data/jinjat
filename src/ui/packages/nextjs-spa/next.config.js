const createMDX = require('@next/mdx');
// const remarkGfm = require('remark-gfm');
// const rehypePrettyCode = require('rehype-pretty-code');
const path = require("path");

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    remarkPlugins: [
      // remarkGfm,
      //  rehypePrettyCode
      ],
    rehypePlugins: [],
  },
})

module.exports = withMDX({
    output: 'export',
    pageExtensions: ['md', 'mdx', 'js', 'jsx', 'ts', 'tsx'],
    transpilePackages: ['@jinjat-data/core'],
    webpack: (config) => {
      config.resolve.fallback = { fs: false };
      config.resolve.alias["react"] = path.resolve("./node_modules/react");
      return config;
    },
    // experimental: {
    //   mdxRs: true,
    // },
  })




