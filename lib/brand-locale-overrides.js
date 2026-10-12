/**
 * Per-brand wording overrides layered on top of public/locales/{lng}/{ns}.json.
 * Override files only hold the keys that differ, so the base files stay identical across brands.
 *
 * Static requires so the JSON is bundled with server code (getServerSideProps on App Hosting / Netlify).
 */
module.exports = {
	misinfo: {},
	caffeine: {
		en: {
			Home: require('../public/locales/_brands/caffeine/en/Home.json'),
			NewReport: require('../public/locales/_brands/caffeine/en/NewReport.json'),
			Welcome: require('../public/locales/_brands/caffeine/en/Welcome.json'),
		},
		es: {
			Home: require('../public/locales/_brands/caffeine/es/Home.json'),
			NewReport: require('../public/locales/_brands/caffeine/es/NewReport.json'),
			Welcome: require('../public/locales/_brands/caffeine/es/Welcome.json'),
		},
	},
}
