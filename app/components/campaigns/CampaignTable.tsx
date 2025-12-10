import { Card, DataTable, Badge, Text } from "@shopify/polaris";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
}

interface CampaignTableProps {
  campaigns: Campaign[];
}

export function CampaignTable({ campaigns }: CampaignTableProps) {
  const rows = campaigns.map((campaign) => [
    campaign.name,
    campaign.type,
    <Badge tone={campaign.status === "ACTIVE" ? "success" : "info"}>
      {campaign.status === "ACTIVE" ? "Activa" : campaign.status === "SCHEDULED" ? "Programada" : "Expirada"}
    </Badge>,
    "0 productos", // TODO: agregar conteo real
    new Date(campaign.createdAt).toLocaleDateString("es-ES"),
    "€0.00", // TODO: agregar revenue real
    "0", // TODO: agregar orders reales
  ]);

  return (
    <Card>
      <DataTable
        columnContentTypes={["text", "text", "text", "text", "text", "numeric", "numeric"]}
        headings={["Nombre", "Tipo", "Estado", "Productos", "Fecha", "Ingresos", "Pedidos"]}
        rows={rows}
      />
    </Card>
  );
}