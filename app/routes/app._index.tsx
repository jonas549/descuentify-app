import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../utils/shopify.server";
import { Card, Page, Layout, Text, BlockStack } from "@shopify/polaris";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { admin, session } = await authenticate.admin(request);
    
    console.log("✅ Authentication successful:", session.shop);
    
    return json({
      shop: session.shop,
    });
  } catch (error) {
    console.error("❌ Authentication error:", error);
    throw error;
  }
}

export default function Index() {
  const { shop } = useLoaderData<typeof loader>();

  console.log("🎨 Rendering dashboard for:", shop);

  return (
    <Page title="Dashboard">
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  ¡Bienvenido a Descuentify! 🎉
                </Text>
                <Text as="p" variant="bodyMd">
                  Tienda: {shop}
                </Text>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}