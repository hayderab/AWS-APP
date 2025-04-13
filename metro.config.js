// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for web-specific file extensions
config.resolver.sourceExts = process.env.RN_SRC_EXT
  ? [...process.env.RN_SRC_EXT.split(',').concat(config.resolver.sourceExts), 'web.js', 'web.ts', 'web.tsx']
  : [...config.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx'];

// Ensure we check for platform-specific versions of files
config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;
