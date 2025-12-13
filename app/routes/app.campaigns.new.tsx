import { Page, Layout } from "@shopify/polaris";
import { EmptyState } from "~/components/campaigns/EmptyState";

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