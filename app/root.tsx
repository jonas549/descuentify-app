import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  return json({ 
    shop,
    apiKey: process.env.SHOPIFY_API_KEY 
  });
}

export default function App() {
  const { shop, apiKey } = useLoaderData<typeof loader>();

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <AppProvider i18n={{}}>
          <Outlet />
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}