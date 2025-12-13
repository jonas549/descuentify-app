import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Page, Layout } from "@shopify/polaris";
import { authenticate } from "../utils/shopify.server";
import { EmptyState } from "../components/campaigns/EmptyState";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  return json({});
}

export default function CampaignsNew() {
  return (
    <Page 
      title="Crear campaña"
      backAction={{ url: "/app/campaigns" }}
    >
      <Layout>
        <Layout.Section>
          <EmptyState />
        </Layout.Section>
      </Layout>
    </Page>
  );
}