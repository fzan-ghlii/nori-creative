const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Alamat dasar website lokal kita
    baseUrl: 'http://localhost:3000',
    // Nonaktifkan Chrome Web Security untuk beberapa tes (opsional tapi membantu)
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});

