import { DurableObject } from '@cloudflare/workers-types';
import * as Sentry from '@sentry/cloudflare';
import { CloudflareOptions } from '@sentry/cloudflare';

type DOFetch = DurableObject['fetch'];
type Fetch<Env> = Parameters<ExportedHandlerFetchHandler<Env>>[0];

/**
 * Creates an instrumented fetch handler for Durable Objects that is compatible with Sentry error monitoring.
 *
 * As of February 2025, @sentry/cloudflare only supports the fetch handler signature used in Cloudflare Workers runtime.
 * However, Durable Objects use a different fetch signature that does not include the environment and context parameters
 * required by the Sentry SDK at runtime. This utility creates a compatibility layer between the two signatures.
 * @example
 * ```ts
 * class MyDurableObject implements DurableObject {
 *   constructor(private state: DurableObjectState, private env: Environment) {}
 *
 *   fetch = createInstrumentedFetch(
 *     async (request, env, ctx) => {
 *       // Your fetch handler logic here
 *       return new Response("OK");
 *     },
 *     (env) => ({
 *       dsn: env.SENTRY_DSN,
 *       environment: env.ENVIRONMENT
 *     }),
 *     this.env,
 *     this.ctx
 *   );
 * }
 * ```
 */
export function createFetchWithSentry(
	fetch: ExportedHandlerFetchHandler<Env>,
	optionsCallback: (env: Env) => CloudflareOptions,
	env: Env,
	ctx: DurableObjectState
): DOFetch {
	const stubContext: ExecutionContext = {
		waitUntil: (promise) => ctx.waitUntil(promise),
		passThroughOnException() {},
		props: {},
	};

	// Note: although @cloudflare/sentry does expose wrapRequestHandler, it does
	// not correctly set up the AsyncLocalStorage context or expose any means to
	// do so, so we need to use the slightly more complex withSentry method.
	// See: https://github.com/getsentry/sentry-javascript/issues/15342
	const instrumentedHandler = Sentry.withSentry(optionsCallback, { fetch });

	const instrumentedFetch = (req: Fetch<Env>) =>
		instrumentedHandler.fetch(req, env, stubContext);

	return instrumentedFetch;
}
