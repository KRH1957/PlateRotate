const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Needed for expo-sqlite on web — wa-sqlite ships a .wasm file that Metro
// must treat as a static asset (served at a URL) rather than a JS module.
config.resolver.assetExts.push('wasm');

module.exports = config;
