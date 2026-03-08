import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import "@shopify/polaris/build/esm/styles.css";
import { addDocumentResponseHeaders } from "./utils/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const responseHeaders = new Headers();
  addDocumentResponseHeaders(request, responseHeaders);

  return json(
    { apiKey: process.env.SHOPIFY_API_KEY || "" },
    { headers: responseHeaders }
  );
}

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="shopify-api-key" content={apiKey} />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}