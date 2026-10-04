const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@App': path.resolve(__dirname, 'src/App'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@assets': path.resolve(__dirname, 'src/assets'),
    },
    configure: (webpackConfig) => {
      const sourceMapRule = webpackConfig.module.rules.find(
        (rule) => rule.loader && rule.loader.includes('source-map-loader')
      );
      if (sourceMapRule) {
        sourceMapRule.exclude = [
          ...(Array.isArray(sourceMapRule.exclude) ? sourceMapRule.exclude : [sourceMapRule.exclude]),
          /[\\/]node_modules[\\/]docx-preview[\\/]/,
        ].filter(Boolean);
      }
      return webpackConfig;
    },
  },
};