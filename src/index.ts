import { DurableObject } from "cloudflare:workers";
import * as Sentry from "@sentry/cloudflare";
import { createFetchWithSentry } from "./do-shim";

/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

/** A Durable Object's behavior is defined in an exported Javascript class */
export class MyDurableObject extends DurableObject<Env> {
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	fetch = createFetchWithSentry(async (request: Request): Promise<Response> => {
		await fetch('https://httpbin.org/delay/3')
		return new Response("Hello world!");
	}, (env) => ({
		dsn: "https://8603c6b850705ebcf28d2d2be5ceaa9c@o1034556.ingest.us.sentry.io/4508863259672576",
		// Set tracesSampleRate to 1.0 to capture 100% of spans for tracing.
		// Learn more at
		// https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
		tracesSampleRate: 1.0,
		debug: true,
	}),
		this.env,
		this.ctx
	);
}

export default Sentry.withSentry((env) => ({
	dsn: "https://8603c6b850705ebcf28d2d2be5ceaa9c@o1034556.ingest.us.sentry.io/4508863259672576",
		// Set tracesSampleRate to 1.0 to capture 100% of spans for tracing.
		// Learn more at
		// https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
		tracesSampleRate: 1.0,
	debug: true,
}), {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request, env, ctx): Promise<Response> {
		await fetch('https://httpbin.org/delay/1')

		// We will create a `DurableObjectId` using the pathname from the Worker request
		// This id refers to a unique instance of our 'MyDurableObject' class above
		let id: DurableObjectId = env.MY_DURABLE_OBJECT.idFromName(new URL(request.url).pathname);

		// This stub creates a communication channel with the Durable Object instance
		// The Durable Object constructor will be invoked upon the first call for a given id
		let stub = env.MY_DURABLE_OBJECT.get(id);

		// We call the `sayHello()` RPC method on the stub to invoke the method on the remote
		// Durable Object instance
		const traceData = Sentry.getTraceData()
		return await stub.fetch(request, {
			headers: {
				baggage: traceData.baggage!,
				"sentry-trace": traceData["sentry-trace"]!
			}
		});
	},
} satisfies ExportedHandler<Env>);
