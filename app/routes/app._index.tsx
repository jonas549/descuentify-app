import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Page, Layout, Card, Text, Button, ProgressBar, BlockStack, InlineStack, Badge } from "@shopify/polaris";
import { authenticate } from "../utils/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    
    // TODO: Obtener datos reales de la BD
    const stats = {
      activeVariants: 421,
      maxVariants: 10000,
      createdCampaigns: 9,
      maxCampaigns: 100,
      allCampaigns: { count: 9, products: 421, variants: 421, revenue: 6774.07, orders: 191 },
      activeCampaigns: { count: 9, products: 421, variants: 421, revenue: 6774.07, orders: 191 },
      scheduledCampaigns: { count: 0 },
      expiredCampaigns: { count: 0 },
      totalRevenue: 6783,
      totalOrders: 181,
    };
    
    return json({
      shop: session.shop,
      stats,
    });
  } catch (error) {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    
    if (!shop) {
      throw new Response("Missing shop parameter", { status: 400 });
    }
    
    return redirect(`/auth/login?shop=${shop}`);
  }
}

export default function Index() {
  const { shop, stats } = useLoaderData<typeof loader>();

  return (
    <Page title="Inicio">
      <Layout>
        {/* Hero Card */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingLg">¿Listo para impulsar tus ventas?</Text>
                  <Text as="p" tone="subdued">
                    Lanza nuevas campañas fácilmente y ofrece descuentos especiales a tus clientes.
                  </Text>
                </BlockStack>
                <Button variant="primary" url="/app/campaigns">
                  Crear campaña
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Plan Stats */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="p" fontWeight="semibold">Plan actual: Discounty</Text>
              </InlineStack>
              
              <InlineStack gap="800" wrap={false}>
                <div style={{ flex: 1 }}>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="p" variant="bodySm">Variantes con descuento activas</Text>
                      <Text as="p" variant="bodySm" fontWeight="semibold">
                        {stats.activeVariants}/{stats.maxVariants.toLocaleString()}
                      </Text>
                    </InlineStack>
                    <ProgressBar progress={(stats.activeVariants / stats.maxVariants) * 100} size="small" />
                  </BlockStack>
                </div>
                
                <div style={{ flex: 1 }}>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="p" variant="bodySm">Campañas creadas</Text>
                      <Text as="p" variant="bodySm" fontWeight="semibold">
                        {stats.createdCampaigns}/{stats.maxCampaigns}
                      </Text>
                    </InlineStack>
                    <ProgressBar progress={(stats.createdCampaigns / stats.maxCampaigns) * 100} size="small" />
                  </BlockStack>
                </div>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Campaign Status List */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <CampaignStatusRow
                icon="⚙️"
                label="Todas las campañas"
                count={stats.allCampaigns.count}
                products={stats.allCampaigns.products}
                variants={stats.allCampaigns.variants}
                revenue={stats.allCampaigns.revenue}
                orders={stats.allCampaigns.orders}
              />
              
              <CampaignStatusRow
                icon="✓"
                label="Activas"
                count={stats.activeCampaigns.count}
                products={stats.activeCampaigns.products}
                variants={stats.activeCampaigns.variants}
                revenue={stats.activeCampaigns.revenue}
                orders={stats.activeCampaigns.orders}
                badge="success"
              />
              
              <CampaignStatusRow
                icon="🕐"
                label="Programadas"
                count={stats.scheduledCampaigns.count}
              />
              
              <CampaignStatusRow
                icon="⊘"
                label="Expiradas"
                count={stats.expiredCampaigns.count}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Metrics */}
        <Layout.Section>
          <InlineStack gap="400">
            <div style={{ flex: 1 }}>
              <Card>
                <BlockStack gap="200">
                  <Text as="p" tone="subdued">Ingresos totales</Text>
                  <Text as="h2" variant="headingXl">€{stats.totalRevenue.toLocaleString()}</Text>
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
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function CampaignStatusRow({ 
  icon, 
  label, 
  count, 
  products, 
  variants, 
  revenue, 
  orders,
  badge 
}: { 
  icon: string;
  label: string;
  count: number;
  products?: number;
  variants?: number;
  revenue?: number;
  orders?: number;
  badge?: "success";
}) {
  return (
    <InlineStack align="space-between" blockAlign="center" wrap={false}>
      <InlineStack gap="300" blockAlign="center">
        <span style={{ fontSize: "20px" }}>{icon}</span>
        <Text as="p" fontWeight="semibold">{count} {label}</Text>
        {products && variants && (
          <Text as="p" tone="subdued" variant="bodySm">
            {products} Productos ({variants} variantes)
          </Text>
        )}
      </InlineStack>
      
   {revenue !== undefined && orders !== undefined && (
  <InlineStack gap="200" blockAlign="center">
    <Badge tone="success">
      {`+ €${revenue.toFixed(2)} ingresos (${orders} pedidos)`}
    </Badge>
    <span>›</span>
  </InlineStack>
      )}
    </InlineStack>
  );
}