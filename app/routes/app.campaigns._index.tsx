import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout } from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../utils/shopify.server";
import { prisma } from "../utils/db.server";
import { EmptyState } from "../components/campaigns/EmptyState";
import { CampaignFilters } from "../components/campaigns/CampaignFilters";
import { CampaignTable } from "../components/campaigns/CampaignTable";

export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "toggle-status") {
    const campaignId = formData.get("campaignId") as string;
    if (!campaignId) return json({ error: "Campaign ID required" }, { status: 400 });

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return json({ error: "Campaign not found" }, { status: 404 });

    const newStatus = campaign.status === "ACTIVE" ? "DRAFT" : "ACTIVE";
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: newStatus as any },
    });

    return json({ success: true, newStatus });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop) {
    return json({ campaignCount: 0, campaigns: [] });
  }

  const campaignCount = await prisma.campaign.count({
    where: { shopId: shop.id },
  });

  const campaignsRaw = await prisma.campaign.findMany({
    where: { shopId: shop.id },
    include: { products: true },
    orderBy: { createdAt: "desc" },
  });

  const campaigns = campaignsRaw.map(campaign => ({
    ...campaign,
    totalRevenue: Number(campaign.totalRevenue),
    createdAt: campaign.createdAt.toISOString(),
    startDate: campaign.startDate?.toISOString() || null,
    updatedAt: campaign.updatedAt.toISOString(),
  }));

  return json({ campaignCount, campaigns });
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

  return (
    <Page title="Campañas">
      <Layout>
        <Layout.Section>
          <EmptyState />
        </Layout.Section>

        {campaignCount > 0 && (
          <>
            <Layout.Section>
              <CampaignFilters onFilterChange={handleFilterChange} />
            </Layout.Section>
            <Layout.Section>
              <CampaignTable campaigns={filteredCampaigns} />
            </Layout.Section>
          </>
        )}
      </Layout>
    </Page>
  );
}
