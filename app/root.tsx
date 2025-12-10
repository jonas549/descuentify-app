import { Outlet, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import "@shopify/polaris/build/esm/styles.css";

export async function loader({ request }: LoaderFunctionArgs) {
  return {
    apiKey: process.env.SHOPIFY_API_KEY!,
  };
}

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider apiKey={apiKey}>
      <Outlet />
    </AppProvider>
  );
}
