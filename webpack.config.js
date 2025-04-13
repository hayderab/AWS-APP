const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function(env, argv) {
  // Create the default Expo webpack config
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add web-specific optimizations
  
  // Optimize bundle size
  if (env.mode === 'production') {
    config.optimization.minimize = true;
    
    // Split chunks for better caching
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 20000,
      maxSize: 200000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // Get the name of the npm package
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            // Return a nice package name for better debugging
            return `npm.${packageName.replace('@', '')}`;
          },
        },
      },
    };
  }
  
  // Add support for web-specific file extensions
  config.resolve.extensions = [
    '.web.js',
    '.web.jsx',
    '.web.ts',
    '.web.tsx',
    ...config.resolve.extensions,
  ];
  
  // Add alias for platform-specific modules
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
    'react-native-maps': 'react-native-web-maps',
  };
  
  // Add support for SVG files
  config.module.rules.push({
    test: /\.svg$/,
    use: ['@svgr/webpack'],
  });
  
  // Add support for web workers
  config.module.rules.push({
    test: /\.worker\.js$/,
    use: { loader: 'worker-loader' },
  });
  
  // Improve source maps for development
  if (env.mode === 'development') {
    config.devtool = 'eval-source-map';
  }
  
  // Add the entry point for web
  config.entry = {
    app: path.resolve(__dirname, 'src/index.web.js'),
  };
  
  return config;
};
