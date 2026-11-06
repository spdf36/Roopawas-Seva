const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Types, the catalogue, the business rules and the sample data are shared with the website and the server
// in ../shared, outside this project's folder; Metro must watch it to bundle it. `@shared/...` imports are
// resolved through the `paths` in tsconfig.json.
const config = getDefaultConfig(__dirname);
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, '../shared')];

module.exports = config;
