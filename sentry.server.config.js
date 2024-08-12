// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
if (process.env.NODE_ENV !== 'development') {
  Sentry.init({
    dsn: "https://845c7860c580e1b6c2fa9ce325d1257c@o204741.ingest.us.sentry.io/4507670446931968",

    // Dynamically set the environment based on the Netlify environment variable
    environment: process.env.SENTRY_ENVIRONMENT || 'dev',  // Default to 'development' if not set
    
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
    // spotlight: process.env.NODE_ENV === 'development',
  
  })
}
