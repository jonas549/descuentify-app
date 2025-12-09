import { useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../utils/shopify.server";
import { Card, Page, Layout, Text, BlockStack } from "@shopify/polaris";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("🔵 LOADER: Starting authentication...");
  
  try {
    const { admin, session } = await authenticate.admin(request);
    
    console.log("✅ LOADER: Authentication successful");
    console.log("📦 LOADER: Shop:", session.shop);
    console.log("📦 LOADER: Session:", JSON.stringify(session, null, 2));
    
    return {
      shop: session.shop,
    };
  } catch (error) {
    console.error("❌ LOADER: Authentication failed:", error);
    throw error;
  }
}

export default function Index() {
  console.log("🎨 COMPONENT: Rendering dashboard...");
  
  const { shop } = useLoaderData<typeof loader>();
  
  console.log("🎨 COMPONENT: Shop data:", shop);

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