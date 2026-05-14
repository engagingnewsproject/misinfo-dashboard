// Client-only Sentry init — runs before React hydration (Next.js 15.3+ convention).
// Replaces the old root-level `sentry.client.config.js` import from `_app`.
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

if (process.env.NODE_ENV !== 'development') {
	Sentry.init({
		dsn: 'https://845c7860c580e1b6c2fa9ce325d1257c@o204741.ingest.us.sentry.io/4507670446931968',

		tracesSampleRate: 1,

		debug: false,

		replaysOnErrorSampleRate: 1.0,
		replaysSessionSampleRate: 0.1,

		integrations: [Sentry.replayIntegration()],
	})
}

// Breadcrumbs / tracing for client-side navigations (Pages Router)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
