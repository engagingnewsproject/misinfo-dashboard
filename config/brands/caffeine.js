/**
 * Caffeine App brand settings (deployed from the caffeine-app-v2 repo).
 */
module.exports = {
	id: 'caffeine',
	appName: 'Caffeine App',
	shortName: 'Caffeine App',
	description: 'Report caffeinated beverage ads for review by partner organizations.',
	supportTeamName: 'Caffeine App Support Team',
	helpRequestSubjectSuffix: 'Caffeine App Help Request',
	shareReportSubject: 'Caffeine App Report',
	icon: 'coffeeCup',
	appUrl: 'https://caffeine-dashboard.netlify.app',
	firebaseProjectId: 'caffeine-app-d8cd8',
	loginBlurb: {
		en: 'Caffeine App helps people submit reports about caffeinated beverage ads they see and lets partner organizations review them.',
		es: 'Caffeine App ayuda a las personas a enviar reportes sobre anuncios de bebidas con cafeína que ven y permite que las organizaciones asociadas los revisen.',
	},
	privacyReportsPhrase: 'provide caffeine-related reports.',
	tagDisplayNames: { Topic: 'Product' },
	// Report labels every agency gets; must include 'To Investigate' and 'Other'.
	appWideLabels: [
		{ name: 'To Investigate', color: '#071f31' },
		{ name: 'Flagged', color: '#C42B47' },
		{ name: 'Not Flagged', color: '#95a8b5' },
		{ name: 'Other', color: '#d1dfea' },
	],
	defaultTopics: [
		{ id: 'Soda', labels: { en: 'Soda', es: 'Refresco' } },
		{ id: 'Coffee', labels: { en: 'Coffee', es: 'Café' } },
		{ id: 'Energy Drink', labels: { en: 'Energy Drink', es: 'Bebida energética' } },
		{ id: 'Other', labels: { en: 'Other', es: 'Otro' } },
	],
	defaultSources: null,
	features: {
		pipelineAdmin: false,
		experimentSettings: false,
	},
}
