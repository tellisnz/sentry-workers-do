A simple example of sentry with tracing between a cloudflare worker and durable object.

Uses as shim as outlined [here](https://github.com/getsentry/sentry-javascript/issues/15342#issuecomment-2644380021) until it can be resolved properly.

When deployed, the trace looks like this:

<img src="./deployed-span.png">

But when running locally using `wrangler dev` it will look like:

<img src="./local-dev.png">

