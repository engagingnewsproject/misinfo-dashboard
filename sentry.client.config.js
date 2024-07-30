// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://845c7860c580e1b6c2fa9ce325d1257c@o204741.ingest.us.sentry.io/4507670446931968",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,
   replayIntegration: function() {
     // Your implementation here
   },
  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  // integrations: [
  //   Sentry.replayIntegration({
  //     // Additional SDK configuration goes in here, for example:
  //     maskAllText: true,
  //     blockAllMedia: true,
  //   }),
  // ],
});
