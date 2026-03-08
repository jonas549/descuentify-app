import { Card, Badge, Text, Button, InlineStack } from "@shopify/polaris";
import { Link, useFetcher } from "@remix-run/react";

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

// ─── Column widths (must match between header and rows) ───────────────────────
const GRID = "2fr 1.2fr 1fr 0.8fr 1.2fr 0.8fr 0.6fr 1fr";

const TYPE_LABELS: Record<string, string> = {
  BULK_PRICE_EDITOR: "Bulk price editor",
  QUANTITY_DISCOUNT: "Quantity discount",
  BUY_X_GET_Y: "Buy X Get Y",
};

function statusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return <Badge tone="success">Activa</Badge>;
    case "DRAFT":
      return <Badge tone="info">Borrador</Badge>;
    case "SCHEDULED":
      return <Badge tone="attention">Programada</Badge>;
    default:
      return <Badge>Expirada</Badge>;
  }
}

// ─── Individual row with its own fetcher for optimistic toggle ────────────────

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const fetcher = useFetcher<{ success?: boolean; newStatus?: string }>();

  const isSubmitting = fetcher.state !== "idle";

  // Optimistic status: flip immediately when submitting
  const optimisticStatus =
    isSubmitting
      ? campaign.status === "ACTIVE"
        ? "DRAFT"
        : "ACTIVE"
      : campaign.status;

  const willActivate = campaign.status !== "ACTIVE";

  const formattedDate = campaign.startDate
    ? new Date(campaign.startDate).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date(campaign.createdAt).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: GRID,
        padding: "12px 16px",
        borderBottom: "1px solid #e1e3e5",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {/* Nombre */}
      <Link
        to={`/app/campaigns/${campaign.id}/edit`}
        style={{ color: "#2c6ecb", textDecoration: "none", fontWeight: 500 }}
      >
        {campaign.name}
      </Link>

      {/* Tipo */}
      <Text as="span" variant="bodyMd">
        {TYPE_LABELS[campaign.type] ?? campaign.type}
      </Text>

      {/* Estado — optimista */}
      <span>{statusBadge(optimisticStatus)}</span>

      {/* Productos */}
      <Text as="span" variant="bodyMd">
        {campaign.products.length} prod.
      </Text>

      {/* Fecha */}
      <Text as="span" variant="bodyMd">
        {formattedDate}
      </Text>

      {/* Ingresos */}
      <Text as="span" variant="bodyMd" alignment="end">
        €{campaign.totalRevenue.toFixed(2)}
      </Text>

      {/* Pedidos */}
      <Text as="span" variant="bodyMd" alignment="end">
        {campaign.totalOrders}
      </Text>

      {/* Acciones */}
      <fetcher.Form method="post" action="/app/campaigns">
        <input type="hidden" name="intent" value="toggle-status" />
        <input type="hidden" name="campaignId" value={campaign.id} />
        <Button
          submit
          size="slim"
          variant={willActivate ? "primary" : "plain"}
          tone={!willActivate ? "critical" : undefined}
          loading={isSubmitting}
        >
          {willActivate ? "Activar" : "Desactivar"}
        </Button>
      </fetcher.Form>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

const HEADERS = [
  "Nombre",
  "Tipo",
  "Estado",
  "Productos",
  "Fecha",
  "Ingresos",
  "Pedidos",
  "Acciones",
];

export function CampaignTable({ campaigns }: CampaignTableProps) {
  return (
    <Card padding="0">
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: GRID,
          padding: "8px 16px",
          background: "#f6f6f7",
          borderBottom: "1px solid #e1e3e5",
          gap: "8px",
        }}
      >
        {HEADERS.map((h) => (
          <Text key={h} as="span" variant="bodySm" fontWeight="semibold" tone="subdued">
            {h}
          </Text>
        ))}
      </div>

      {/* Rows */}
      {campaigns.length === 0 ? (
        <div style={{ padding: "24px 16px", textAlign: "center" }}>
          <Text as="p" variant="bodyMd" tone="subdued">
            No hay campañas para mostrar
          </Text>
        </div>
      ) : (
        campaigns.map((campaign) => <CampaignRow key={campaign.id} campaign={campaign} />)
      )}

      {/* Footer */}
      {campaigns.length > 0 && (
        <div style={{ padding: "8px 16px", borderTop: "1px solid #e1e3e5" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Mostrando {campaigns.length} campaña{campaigns.length !== 1 ? "s" : ""}
          </Text>
        </div>
      )}
    </Card>
  );
}
