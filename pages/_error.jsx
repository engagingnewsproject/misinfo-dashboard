import * as Sentry from "@sentry/nextjs";
import Error from "next/error";

/**
 * @fileoverview Custom Next.js Error Page - Sentry integration for error reporting
 *
 * This file customizes the Next.js error page to:
 * - Capture errors with Sentry for monitoring and debugging
 * - Display the default Next.js error UI
 * - Ensure Sentry error reporting completes before rendering
 *
 * Integrates with:
 * - Sentry for error monitoring
 * - next/error for default error UI
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
/**
 * CustomErrorComponent
 *
 * Renders the default Next.js error page and reports errors to Sentry.
 *
 * @param {Object} props
 * @param {number} props.statusCode - The HTTP status code for the error
 * @returns {JSX.Element} The rendered error page
 */
const CustomErrorComponent = (props) => {
  return <Error statusCode={props.statusCode} />;
};

CustomErrorComponent.getInitialProps = async (contextData) => {
  // In case this is running in a serverless function, await this in order to give Sentry
  // time to send the error before the lambda exits
  await Sentry.captureUnderscoreErrorException(contextData);

  // This will contain the status code of the response
  return Error.getInitialProps(contextData);
};

export default CustomErrorComponent;
