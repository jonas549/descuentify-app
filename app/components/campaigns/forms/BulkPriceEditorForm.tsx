import { 
  Card, 
  BlockStack, 
  TextField, 
  Select, 
  Checkbox,
  Button,
  Text,
  InlineStack
} from "@shopify/polaris";
import { useState } from "react";

export function BulkPriceEditorForm() {
  const [campaignName, setCampaignName] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("0");

  return (
    <BlockStack gap="400">
      {/* Campaign Name */}
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Nombre de campaña</Text>
          <TextField
            label=""
            value={campaignName}
            onChange={setCampaignName}
            placeholder="ej. 20% off"
            autoComplete="off"
            helpText="Este nombre te ayuda a identificar la campaña internamente."
          />
        </BlockStack>
      </Card>

      {/* Discount */}
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Descuento</Text>
          <InlineStack gap="300">
            <div style={{ width: "200px" }}>
              <Select
                label=""
                options={[
                  { label: "Porcentaje", value: "percentage" },
                  { label: "Cantidad fija", value: "fixed" },
                ]}
                value={discountType}
                onChange={setDiscountType}
              />
            </div>
            <TextField
              label=""
              type="number"
              value={discountValue}
              onChange={setDiscountValue}
              suffix="%"
              autoComplete="off"
            />
          </InlineStack>
        </BlockStack>
      </Card>

      {/* Advanced Features */}
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Funciones avanzadas de cambio de precio</Text>
          <Checkbox label="Establecer terminaciones de precio específicas" />
          <Checkbox label="Para productos ya con descuento, calcular descuento basado en precio de comparación" />
          <Checkbox label="Mantener precio actual y establecer un precio de comparación más alto" />
        </BlockStack>
      </Card>

      {/* Products */}
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Productos</Text>
          <Select
            label=""
            options={[
              { label: "Productos y variantes", value: "products_variants" },
              { label: "Colecciones", value: "collections" },
            ]}
            value="products_variants"
            onChange={() => {}}
          />
          <TextField
            label=""
            placeholder="Buscar productos y variantes"
            autoComplete="off"
          />
          <Button>Explorar</Button>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}