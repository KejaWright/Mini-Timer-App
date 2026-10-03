module.exports = {
  packagerConfig: {
    asar: true,
  },

  rebuildConfig: {},

  makers: [
    {
      name: '@electron-forge/maker-zip',
      config: {
        manufacturer: 'Keja Wright-Thompson',
        name: 'mini-timer-app',
        description: 'A customizable timer app.',
      },
    },
  ],
};