A simple example of sentry with tracing between a cloudflare worker and durable object.

When deployed, the trace looks like this:

<img src="./deployed-span.png">

But when running locally using `wrangler dev` it will look like:

<img src="./local-dev.png">

