import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, Tabs, DataTable, Badge, BlockStack } from "@shopify/polaris";
import { authenticate } from "../utils/shopify.server";
import { prisma } from "../utils/db.server";
import { useState, useCallback } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  // Obtener todas las campañas con sus métricas
  const campaigns = await prisma.campaign.findMany({
    where: { shopId: session.shop },
    orderBy: { createdAt: "desc" },
  });
  
  return json({
    campaigns,
  });
}

export default function Analytics() {
  const { campaigns } = useLoaderData<typeof loader>();
  const [selected, setSelected] = useState(0);

  const handleTabChange = useCallback((selectedTabIndex: number) => {
    setSelected(selectedTabIndex);
  }, []);

  const tabs = [
    { id: "all", content: "Todas", accessibilityLabel: "Todas las campañas" },
    { id: "active", content: "Activas", accessibilityLabel: "Campañas activas" },
    { id: "scheduled", content: "Programadas", accessibilityLabel: "Campañas programadas" },
    { id: "expired", content: "Expiradas", accessibilityLabel: "Campañas expiradas" },
  ];

  // Filtrar campañas según tab seleccionado
  const filterCampaigns = () => {
    if (selected === 0) return campaigns;
    if (selected === 1) return campaigns.filter(c => c.status === "ACTIVE");
    if (selected === 2) return campaigns.filter(c => c.status === "SCHEDULED");
    if (selected === 3) return campaigns.filter(c => c.status === "EXPIRED");
    return campaigns;
  };

  const filteredCampaigns = filterCampaigns();

  const rows = filteredCampaigns.map((campaign) => [
    campaign.name,
    campaign.type,
    <Badge tone={campaign.status === "ACTIVE" ? "success" : campaign.status === "SCHEDULED" ? "info" : undefined}>
      {campaign.status === "ACTIVE" ? "Activa" : campaign.status === "SCHEDULED" ? "Programada" : "Expirada"}
    </Badge>,
    new Date(campaign.createdAt).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    "€0.00",
    "0",
  ]);

  return (
    <Page title="Analíticas" backAction={{ url: "/app" }}>
      <BlockStack gap="400">
        <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange} />
        
        <Card>
          <DataTable
            columnContentTypes={["text", "text", "text", "text", "numeric", "numeric"]}
            headings={["Nombre de campaña", "Tipo", "Estado", "Fecha", "Ingresos", "Pedidos"]}
            rows={rows}
            footerContent={
              filteredCampaigns.length > 0
                ? `Mostrando ${filteredCampaigns.length} campaña${filteredCampaigns.length !== 1 ? 's' : ''}`
                : "No hay campañas para mostrar"
            }
          />
        </Card>
      </BlockStack>
    </Page>
  );
}