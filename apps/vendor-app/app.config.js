const { existsSync } = require("node:fs");
const config = require("./app.json").expo;

module.exports = {
  expo: {
    ...config,
    android: {
      ...config.android,
      ...(existsSync("./google-services.json") ? { googleServicesFile: "./google-services.json" } : {}),
    },
  },
};
