import { Card, BlockStack, InlineStack, Text, Button } from "@shopify/polaris";

export function EmptyState() {
  const campaignTypes = [
    {
      title: "Editor de precios masivo",
      description: "Actualiza precios de productos y precios comparativos en masa para promociones y ventas.",
      example: "💡 20% de descuento en zapatos",
      illustration: "🏷️",
      createUrl: "/app/campaigns/bulk-price-editor/new",
    },
    {
      title: "Descuento por cantidad",
      description: "Ofrece descuentos escalonados según la cantidad de artículos comprados.",
      example: "💡 Compra 3+, Ahorra 10%",
      illustration: "📦",
      createUrl: "/app/campaigns/quantity-discount/new",
    },
    {
      title: "Compra X Lleva Y",
      description: "Ofrece artículos gratis o con descuento cuando los clientes compran productos seleccionados.",
      example: "💡 Compra 2 camisetas, lleva 1 gorra gratis",
      illustration: "🎁",
      createUrl: "/app/campaigns/buy-x-get-y/new",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "20px" }}>
      {campaignTypes.map((type) => (
        <Card key={type.title}>
          <BlockStack gap="400">
            <div style={{ fontSize: "48px", textAlign: "center" }}>
              {type.illustration}
            </div>
            
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd" alignment="center">
                {type.title}
              </Text>
              
              <Text as="p" tone="subdued" alignment="center">
                {type.description}
              </Text>
              
              <Text as="p" variant="bodySm" alignment="center">
                {type.example}
              </Text>
            </BlockStack>
            
            <InlineStack gap="200" align="center">
              <Button url={type.createUrl}>Crear</Button>
            </InlineStack>
          </BlockStack>
        </Card>
      ))}
    </div>
  );
}