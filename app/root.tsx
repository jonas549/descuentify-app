import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    host: url.searchParams.get("host") || "",
    polarisTranslations: {},
  };
}

export default function App() {
  const { apiKey, host, polarisTranslations } = useLoaderData<typeof loader>();

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="shopify-api-key" content={apiKey} />
        <script
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          data-api-key={apiKey}
          data-host={host}
        />
        <Meta />
        <Links />
      </head>
      <body>
        <AppProvider i18n={polarisTranslations}>
          <Outlet />
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}