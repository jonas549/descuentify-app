import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Page, Layout } from "@shopify/polaris";
import { authenticate } from "../utils/shopify.server";
import { QuantityDiscountForm } from "../components/campaigns/forms/QuantityDiscountForm";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  
  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
  });
}

export default function QuantityDiscountNew() {
  return (
    <Page 
      title="Crear descuento por cantidad"
      backAction={{ url: "/app/campaigns" }}
    >
      <Layout>
        <Layout.Section variant="oneThird">
          <QuantityDiscountForm />
        </Layout.Section>
        
        <Layout.Section variant="oneThird">
          <div style={{ position: "sticky", top: "20px" }}>
            <p>Preview irá aquí</p>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}