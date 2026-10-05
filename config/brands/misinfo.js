/**
 * Truth Sleuth Local (misinfo-dashboard) brand settings.
 * Default brand when NEXT_PUBLIC_BRAND is unset.
 */
module.exports = {
	id: 'misinfo',
	appName: 'Truth Sleuth Local',
	shortName: 'Truth Sleuth',
	description: 'Report misinformation in your location for submission to news agencies near that location.',
	supportTeamName: 'Truth Sleuth Support Team',
	helpRequestSubjectSuffix: 'Truth Sleuth Help Request',
	shareReportSubject: 'Misinfo Report',
	icon: 'magnifyingGlass',
	appUrl: 'https://truthsleuthlocal--misinfo-5d004.us-central1.hosted.app',
	firebaseProjectId: 'misinfo-5d004',
	loginBlurb: {
		en: 'Truth Sleuth helps people submit reports about local election information they think might be inaccurate and lets partner organizations review.',
		es: 'Truth Sleuth ayuda a las personas a enviar reportes sobre información electoral local que consideran inexacta y permite que las organizaciones asociadas los revisen.',
	},
	privacyReportsPhrase: 'provide reports or assessments of potential misinformation.',
	tagDisplayNames: {},
	// Report labels every agency gets; must include 'To Investigate' and 'Other'.
	appWideLabels: [
		{ name: 'To Investigate', color: '#071f31' },
		{ name: 'Misinfo', color: '#C42B47' },
		{ name: 'Not Misinfo', color: '#95a8b5' },
		{ name: 'Other', color: '#d1dfea' },
	],
	defaultTopics: null,
	defaultSources: null,
	features: {
		pipelineAdmin: true,
		experimentSettings: true,
	},
}
