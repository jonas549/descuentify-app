import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { AppProvider } from "@shopify/polaris";
import { authenticate } from "../utils/shopify.server";
import { AppLayout } from "../components/layout/AppLayout";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  
  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
  });
}

export default function AppLayoutRoute() {
  const { apiKey } = useLoaderData<typeof loader>();
  
  return (
    <AppProvider i18n={{}}>
      <AppLayout />
    </AppProvider>
  );
}