module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated plugin for animations
      'react-native-reanimated/plugin',
    ],
  };
};
