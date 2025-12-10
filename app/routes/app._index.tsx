// app/routes/app._index.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../utils/shopify.server";
import { Card, Page, Layout, Text, BlockStack } from "@shopify/polaris";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  // Si hay sesión, simplemente devolvemos los datos de la tienda
  return {
    shop: session.shop,
  };
}

export default function Index() {
  const { shop } = useLoaderData<typeof loader>();

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
