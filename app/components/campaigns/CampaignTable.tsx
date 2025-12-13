import { Card, DataTable, Badge } from "@shopify/polaris";

interface CampaignProduct {
  id: string;
  productId: string;
  variantIds: string[];
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  startDate: string | null;
  totalRevenue: number;
  totalOrders: number;
  products: CampaignProduct[];
}

interface CampaignTableProps {
  campaigns: Campaign[];
}

export function CampaignTable({ campaigns }: CampaignTableProps) {
  const rows = campaigns.map((campaign) => {
    // Determinar el tipo legible
    const typeLabel = 
      campaign.type === "BULK_PRICE_EDITOR" ? "Bulk price editor" :
      campaign.type === "QUANTITY_DISCOUNT" ? "Quantity discount" :
      campaign.type === "BUY_X_GET_Y" ? "Buy X Get Y" :
      campaign.type;

    // Determinar el badge del estado
    const statusBadge = 
      campaign.status === "ACTIVE" ? <Badge tone="success">Activa</Badge> :
      campaign.status === "DRAFT" ? <Badge tone="info">Borrador</Badge> :
      campaign.status === "SCHEDULED" ? <Badge tone="attention">Programada</Badge> :
      <Badge>Expirada</Badge>;

    // Formatear fecha
    const formattedDate = campaign.startDate 
      ? new Date(campaign.startDate).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      : new Date(campaign.createdAt).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });

    return [
      campaign.name,
      typeLabel,
      statusBadge,
      `${campaign.products.length} producto${campaign.products.length !== 1 ? 's' : ''}`,
      formattedDate,
      `€${campaign.totalRevenue.toFixed(2)}`,
      campaign.totalOrders.toString(),
    ];
  });

  return (
    <Card>
      <DataTable
        columnContentTypes={["text", "text", "text", "text", "text", "numeric", "numeric"]}
        headings={["Nombre", "Tipo", "Estado", "Productos", "Fecha", "Ingresos", "Pedidos"]}
        rows={rows}
        footerContent={
          campaigns.length > 0
            ? `Mostrando ${campaigns.length} campaña${campaigns.length !== 1 ? 's' : ''}`
            : "No hay campañas para mostrar"
        }
      />
    </Card>
  );
}