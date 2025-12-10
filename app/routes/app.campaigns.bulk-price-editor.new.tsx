import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout } from "@shopify/polaris";
import { authenticate } from "../utils/shopify.server";
import { BulkPriceEditorForm } from "../components/campaigns/forms/BulkPriceEditorForm";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  
  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
  });
}

export default function BulkPriceEditorNew() {
  return (
    <Page 
      title="Crear editor de precios masivo"
      backAction={{ url: "/app/campaigns" }}
    >
      <Layout>
        <Layout.Section variant="oneThird">
          <BulkPriceEditorForm />
        </Layout.Section>
        
        <Layout.Section variant="oneThird">
          {/* TODO: Preview component */}
          <div style={{ position: "sticky", top: "20px" }}>
            <p>Preview irá aquí</p>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}