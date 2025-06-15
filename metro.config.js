const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for Expo
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  ...config.resolver.alias,
}
// Disable package exports to avoid module resolution issues
config.resolver.unstable_enablePackageExports = false;

// Add .cjs extension support
config.resolver.sourceExts.push('cjs');

module.exports = config;