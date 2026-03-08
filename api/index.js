import { createRequestHandler } from "@remix-run/node";
import * as build from "../build/server/index.js";

const remixHandler = createRequestHandler(build);

export default async function handler(req, res) {
  // Vercel passes Node.js req/res. Remix needs a Web API Request with absolute URL.
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers["host"];
  const url = new URL(req.url, `${protocol}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const request = new Request(url.toString(), {
    method: req.method,
    headers,
    body: hasBody ? req : null,
    duplex: hasBody ? "half" : undefined,
  });

  const response = await remixHandler(request);

  res.statusCode = response.status;
  for (const [key, value] of response.headers.entries()) {
    res.setHeader(key, value);
  }

  if (response.body) {
    for await (const chunk of response.body) {
      res.write(chunk);
    }
  }
  res.end();
}
