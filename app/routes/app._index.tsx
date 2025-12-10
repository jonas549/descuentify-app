import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Page, Layout, Card, Text } from "@shopify/polaris";
import { authenticate } from "../utils/shopify.server";
import { useEffect } from "react";

type LoaderData = 
  | { authenticated: true; shop: string; apiKey: string }
  | { authenticated: false; apiKey: string };

export async function loader({ request }: LoaderFunctionArgs): Promise<LoaderData> {
  try {
    const { session } = await authenticate.admin(request);
    
    return {
      authenticated: true,
      shop: session.shop,
      apiKey: process.env.SHOPIFY_API_KEY || "",
    };
  } catch (error) {
    return {
      authenticated: false,
      apiKey: process.env.SHOPIFY_API_KEY || "",
    };
  }
}

export default function Index() {
  const data = useLoaderData<LoaderData>();

  useEffect(() => {
    if (!data.authenticated && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const shop = url.searchParams.get("shop");
      if (shop) {
        window.top?.location.assign(`/auth/login?shop=${shop}`);
      }
    }
  }, [data.authenticated]);

  if (!data.authenticated) {
    return null;
  }

  return (
    <Page title="Dashboard - Descuentify">
      <Layout>
        <Layout.Section>
          <Card>
            <Text as="h2" variant="headingMd">Bienvenido a Descuentify</Text>
            <Text as="p">Tienda: {data.shop}</Text>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}