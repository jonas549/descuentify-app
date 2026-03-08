import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Card,
  Tabs,
  DataTable,
  Badge,
  BlockStack,
  InlineStack,
  Text,
} from "@shopify/polaris";
import { authenticate } from "../utils/shopify.server";
import { prisma } from "../utils/db.server";
import { useState, useCallback } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop) {
    return json({
      stats: { totalRevenue: 0, totalOrders: 0, activeCampaigns: 0, campaignCount: 0 },
      topCampaigns: [],
      allCampaigns: [],
    });
  }

  const [aggregate, activeCampaigns, topCampaigns, allCampaigns] = await Promise.all([
    prisma.campaign.aggregate({
      where: { shopId: shop.id },
      _sum: { totalRevenue: true, totalOrders: true },
    }),
    prisma.campaign.count({
      where: { shopId: shop.id, status: "ACTIVE" },
    }),
    prisma.campaign.findMany({
      where: { shopId: shop.id },
      orderBy: { totalRevenue: "desc" },
      take: 5,
    }),
    prisma.campaign.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const serialize = (c: any) => ({
    ...c,
    totalRevenue: Number(c.totalRevenue),
    createdAt: c.createdAt.toISOString(),
    startDate: c.startDate?.toISOString() || null,
    updatedAt: c.updatedAt.toISOString(),
  });

  return json({
    stats: {
      totalRevenue: Number(aggregate._sum.totalRevenue || 0),
      totalOrders: aggregate._sum.totalOrders || 0,
      activeCampaigns,
      campaignCount: allCampaigns.length,
    },
    topCampaigns: topCampaigns.map(serialize),
    allCampaigns: allCampaigns.map(serialize),
  });
}

const TYPE_LABELS: Record<string, string> = {
  BULK_PRICE_EDITOR: "Bulk price editor",
  QUANTITY_DISCOUNT: "Descuento por cantidad",
  BUY_X_GET_Y: "Compra X Lleva Y",
};

const STATUS_BADGE: Record<string, { label: string; tone: "success" | "info" | "attention" | undefined }> = {
  ACTIVE: { label: "Activa", tone: "success" },
  SCHEDULED: { label: "Programada", tone: "attention" },
  DRAFT: { label: "Borrador", tone: "info" },
  EXPIRED: { label: "Expirada", tone: undefined },
  PAUSED: { label: "Pausada", tone: undefined },
};

export default function Analytics() {
  const { stats, topCampaigns, allCampaigns } = useLoaderData<typeof loader>();
  const [selected, setSelected] = useState(0);

  const handleTabChange = useCallback((idx: number) => setSelected(idx), []);

  const tabs = [
    { id: "all", content: "Todas", accessibilityLabel: "Todas las campañas" },
    { id: "active", content: "Activas", accessibilityLabel: "Campañas activas" },
    { id: "scheduled", content: "Programadas", accessibilityLabel: "Campañas programadas" },
    { id: "expired", content: "Expiradas", accessibilityLabel: "Campañas expiradas" },
  ];

  const filteredCampaigns = allCampaigns.filter((c) => {
    if (selected === 0) return true;
    if (selected === 1) return c.status === "ACTIVE";
    if (selected === 2) return c.status === "SCHEDULED";
    if (selected === 3) return c.status === "EXPIRED";
    return true;
  });

  const buildRows = (list: typeof allCampaigns) =>
    list.map((c) => {
      const badge = STATUS_BADGE[c.status] ?? { label: c.status, tone: undefined };
      return [
        c.name,
        TYPE_LABELS[c.type] ?? c.type,
        <Badge tone={badge.tone}>{badge.label}</Badge>,
        new Date(c.createdAt).toLocaleDateString("es-ES", {
          year: "numeric", month: "short", day: "numeric",
        }),
        `€${c.totalRevenue.toFixed(2)}`,
        c.totalOrders.toString(),
      ];
    });

  return (
    <Page title="Analíticas" backAction={{ url: "/app" }}>
      <BlockStack gap="500">
        {/* Summary cards */}
        <InlineStack gap="400">
          <div style={{ flex: 1 }}>
            <Card>
              <BlockStack gap="200">
                <Text as="p" tone="subdued">Ingresos totales</Text>
                <Text as="h2" variant="headingXl">€{stats.totalRevenue.toFixed(2)}</Text>
              </BlockStack>
            </Card>
          </div>
          <div style={{ flex: 1 }}>
            <Card>
              <BlockStack gap="200">
                <Text as="p" tone="subdued">Pedidos totales</Text>
                <Text as="h2" variant="headingXl">{stats.totalOrders}</Text>
              </BlockStack>
            </Card>
          </div>
          <div style={{ flex: 1 }}>
            <Card>
              <BlockStack gap="200">
                <Text as="p" tone="subdued">Campañas activas</Text>
                <Text as="h2" variant="headingXl">{stats.activeCampaigns}</Text>
              </BlockStack>
            </Card>
          </div>
          <div style={{ flex: 1 }}>
            <Card>
              <BlockStack gap="200">
                <Text as="p" tone="subdued">Total campañas</Text>
                <Text as="h2" variant="headingXl">{stats.campaignCount}</Text>
              </BlockStack>
            </Card>
          </div>
        </InlineStack>

        {/* Top 5 by revenue */}
        {topCampaigns.length > 0 && (
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Top 5 campañas por ingresos</Text>
              <DataTable
                columnContentTypes={["text", "text", "text", "numeric", "numeric"]}
                headings={["Nombre", "Tipo", "Estado", "Ingresos", "Pedidos"]}
                rows={topCampaigns.map((c) => {
                  const badge = STATUS_BADGE[c.status] ?? { label: c.status, tone: undefined };
                  return [
                    c.name,
                    TYPE_LABELS[c.type] ?? c.type,
                    <Badge tone={badge.tone}>{badge.label}</Badge>,
                    `€${c.totalRevenue.toFixed(2)}`,
                    c.totalOrders.toString(),
                  ];
                })}
              />
            </BlockStack>
          </Card>
        )}

        {/* All campaigns with filter tabs */}
        <BlockStack gap="0">
          <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange} />
          <Card>
            <DataTable
              columnContentTypes={["text", "text", "text", "text", "numeric", "numeric"]}
              headings={["Nombre", "Tipo", "Estado", "Fecha", "Ingresos", "Pedidos"]}
              rows={buildRows(filteredCampaigns)}
              footerContent={
                filteredCampaigns.length > 0
                  ? `Mostrando ${filteredCampaigns.length} campaña${filteredCampaigns.length !== 1 ? "s" : ""}`
                  : "No hay campañas para mostrar"
              }
            />
          </Card>
        </BlockStack>
      </BlockStack>
    </Page>
  );
}
