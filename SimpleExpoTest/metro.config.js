const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .epub as asset extension
config.resolver.assetExts.push('epub');

module.exports = config;
