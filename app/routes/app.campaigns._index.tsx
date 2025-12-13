import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Page, Layout, Button } from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../utils/shopify.server";
import { prisma } from "../utils/db.server";
import { EmptyState } from "../components/campaigns/EmptyState";
import { CampaignFilters } from "../components/campaigns/CampaignFilters";
import { CampaignTable } from "../components/campaigns/CampaignTable";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop) {
    return json({
      campaignCount: 0,
      campaigns: [],
    });
  }
  
  const campaignCount = await prisma.campaign.count({
    where: { shopId: shop.id },
  });
  
  const campaignsRaw = await prisma.campaign.findMany({
    where: { shopId: shop.id },
    include: {
      products: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const campaigns = campaignsRaw.map(campaign => ({
    ...campaign,
    totalRevenue: Number(campaign.totalRevenue),
    createdAt: campaign.createdAt.toISOString(),
    startDate: campaign.startDate?.toISOString() || null,
    updatedAt: campaign.updatedAt.toISOString(),
  }));
  
  return json({
    campaignCount,
    campaigns,
  });
}

export default function CampaignsIndex() {
  const { campaignCount, campaigns } = useLoaderData<typeof loader>();
  const [currentFilter, setCurrentFilter] = useState("all");
  
  const filteredCampaigns = campaigns.filter((campaign) => {
    if (currentFilter === "all") return true;
    if (currentFilter === "active") return campaign.status === "ACTIVE";
    if (currentFilter === "scheduled") return campaign.status === "SCHEDULED";
    if (currentFilter === "expired") return campaign.status === "EXPIRED";
    return true;
  });

  const handleFilterChange = useCallback((filter: string) => {
    setCurrentFilter(filter);
  }, []);
  
  if (campaignCount === 0) {
    return (
      <Page title="Campañas">
        <EmptyState />
      </Page>
    );
  }
  
  return (
    <Page title="Campañas">
      <Layout>
        <Layout.Section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "600" }}>Campañas</h1>
            <Link to="/app/campaigns/new">
              <Button variant="primary">Crear campaña</Button>
            </Link>
          </div>
        </Layout.Section>

        <Layout.Section>
          <CampaignFilters onFilterChange={handleFilterChange} />
        </Layout.Section>
        
        <Layout.Section>
          <CampaignTable campaigns={filteredCampaigns} />
        </Layout.Section>
      </Layout>
    </Page>
  );
}