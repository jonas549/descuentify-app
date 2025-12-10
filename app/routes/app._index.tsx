import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, Text } from "@shopify/polaris";
import { authenticate } from "../utils/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    
    return {
      shop: session.shop,
    };
  } catch (error) {
    // No hay sesión, redirigir a login desde el servidor
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    
    if (!shop) {
      throw new Response("Missing shop parameter", { status: 400 });
    }
    
    return redirect(`/auth/login?shop=${shop}`);
  }
}

export default function Index() {
  const { shop } = useLoaderData<typeof loader>();

  return (
    <Page title="Dashboard - Descuentify">
      <Layout>
        <Layout.Section>
          <Card>
            <Text as="h2" variant="headingMd">Bienvenido a Descuentify</Text>
            <Text as="p">Tienda: {shop}</Text>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}