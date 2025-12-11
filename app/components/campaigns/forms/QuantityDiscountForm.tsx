import { 
  Card, 
  BlockStack, 
  TextField, 
  Select, 
  Checkbox,
  Button,
  Text,
  InlineStack,
  Collapsible,
  Icon,
  RadioButton
} from "@shopify/polaris";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";

export function QuantityDiscountForm() {
  const [campaignName, setCampaignName] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [conditionType, setConditionType] = useState("mix");

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
          <Text as="p" variant="bodySm" tone="subdued">Descuento/Precio</Text>
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
              value="0"
              onChange={() => {}}
              suffix="%"
              autoComplete="off"
            />
            <TextField
              label=""
              type="number"
              placeholder="Cantidad mínima de artículos"
              value="0"
              onChange={() => {}}
              autoComplete="off"
            />
          </InlineStack>
          <Button variant="primary" tone="success">Agregar nivel de descuento</Button>
        </BlockStack>
      </Card>

      {/* Discount Conditions */}
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Condiciones de descuento</Text>
          <RadioButton
            label="Mezcla de productos"
            helpText="Los clientes pueden calificar para el descuento agregando cualquier combinación de productos elegibles."
            checked={conditionType === "mix"}
            onChange={() => setConditionType("mix")}
          />
          <RadioButton
            label="Mismas variantes"
            helpText="Los clientes deben agregar la misma variante de un producto para calificar para el descuento."
            checked={conditionType === "same"}
            onChange={() => setConditionType("same")}
          />
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
          <Checkbox label="Excluir productos específicos" />
          <Checkbox label="Actualizar automáticamente los productos de la campaña cuando se agreguen o eliminen artículos de tu tienda" />
          <Button variant="plain">Calcular conteo de artículos</Button>
          <Text as="p" variant="bodySm" tone="subdued">📝 0 Productos 0 variantes</Text>
        </BlockStack>
      </Card>

      {/* Schedule */}
      <Card>
        <BlockStack gap="300">
          <button
            onClick={() => setScheduleOpen(!scheduleOpen)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">Programación</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Establece la programación de la campaña.
                </Text>
              </BlockStack>
              <Icon source={scheduleOpen ? ChevronUpIcon : ChevronDownIcon} />
            </InlineStack>
          </button>
          
          <Collapsible open={scheduleOpen} id="schedule-collapsible">
            <BlockStack gap="300">
              <InlineStack gap="300">
                <TextField
                  label="Fecha de inicio"
                  type="date"
                  value=""
                  onChange={() => {}}
                  autoComplete="off"
                />
                <TextField
                  label="Hora de inicio"
                  type="time"
                  value=""
                  onChange={() => {}}
                  autoComplete="off"
                />
              </InlineStack>
              <Checkbox label="Establecer fecha de finalización" />
            </BlockStack>
          </Collapsible>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}