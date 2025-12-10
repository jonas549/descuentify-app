import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Button } from "@shopify/polaris";
import { authenticate } from "../utils/shopify.server";
import { prisma } from "../utils/db.server";
import { EmptyState } from "../components/campaigns/EmptyState";
import { CampaignFilters } from "../components/campaigns/CampaignFilters";
import { CampaignTable } from "../components/campaigns/CampaignTable";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  // Contar campañas de esta tienda
  const campaignCount = await prisma.campaign.count({
    where: { shopId: session.shop },
  });
  
  // Obtener campañas
  const campaigns = await prisma.campaign.findMany({
    where: { shopId: session.shop },
    orderBy: { createdAt: "desc" },
  });
  
  return json({
    campaignCount,
    campaigns,
  });
}

export default function CampaignsIndex() {
  const { campaignCount, campaigns } = useLoaderData<typeof loader>();
  
  // Empty state
  if (campaignCount === 0) {
    return (
      <Page title="Campañas">
        <EmptyState />
      </Page>
    );
  }
  
  // Con campañas
  return (
    <Page 
      title="Campañas"
      primaryAction={<Button variant="primary">Crear campaña</Button>}
    >
      <Layout>
        <Layout.Section>
          <CampaignFilters />
        </Layout.Section>
        
        <Layout.Section>
          <CampaignTable campaigns={campaigns} />
        </Layout.Section>
      </Layout>
    </Page>
  );
}