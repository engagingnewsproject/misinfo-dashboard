// next-i18next.config.js
/**
 * @type {import('next-i18next').UserConfig}
 */

const path = require('path')

module.exports = {
  debug: process.env.NODE_ENV === 'development',
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en'
  },
    /** To avoid issues when deploying to some paas (vercel...) */

  localePath: path.resolve('./public/locales'),
  localeStructure: '{{lng}}/{{ns}}',

};
