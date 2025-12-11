import { 
  Card, 
  BlockStack, 
  TextField, 
  Select, 
  Checkbox,
  Button,
  Text,
  InlineStack,
  Banner,
  Collapsible,
  Icon
} from "@shopify/polaris";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";

interface BulkPriceEditorFormProps {
  onSubmit: (data: any) => void;
  error?: string;
}

export function BulkPriceEditorForm({ onSubmit, error }: BulkPriceEditorFormProps) {
  const [campaignName, setCampaignName] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("0");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  
  // Collapsibles state
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const handleSubmit = () => {
    onSubmit({
      campaignName,
      discountType,
      discountValue,
      startDate,
      startTime,
    });
  };

  return (
    <BlockStack gap="400">
      {/* Error banner */}
      {error && (
        <Banner tone="critical">
          <p>{error}</p>
        </Banner>
      )}

      {/* Alert amarillo */}
      <Banner tone="warning" onDismiss={() => {}}>
        <p>
          Activar <strong>price rules</strong> actualizará los precios de tus productos. Si usas otras apps que también ajustan precios, sus cambios pueden superponerse.
        </p>
      </Banner>

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

      {/* Advanced Features - Collapsible */}
      <Card>
        <BlockStack gap="300">
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
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
              <Text as="h2" variant="headingMd">Funciones avanzadas de cambio de precio</Text>
              <Icon source={advancedOpen ? ChevronUpIcon : ChevronDownIcon} />
            </InlineStack>
          </button>
          
          <Collapsible open={advancedOpen} id="advanced-collapsible">
            <BlockStack gap="300">
              <Checkbox label="Establecer terminaciones de precio específicas" />
              <Checkbox label="Para productos ya con descuento, calcular descuento basado en precio de comparación" />
              <Checkbox label="Mantener precio actual y establecer un precio de comparación más alto" />
            </BlockStack>
          </Collapsible>
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
          <Checkbox label="Actualizar automáticamente los productos de la campaña" />
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
                  value={startDate}
                  onChange={setStartDate}
                  autoComplete="off"
                />
                <TextField
                  label="Hora de inicio"
                  type="time"
                  value={startTime}
                  onChange={setStartTime}
                  autoComplete="off"
                />
              </InlineStack>
              <Checkbox label="Establecer fecha de finalización" />
            </BlockStack>
          </Collapsible>
        </BlockStack>
      </Card>

      {/* Submit Button */}
      <Card>
        <InlineStack align="end" gap="300">
          <Button url="/app/campaigns">Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit}>
            Guardar campaña
          </Button>
        </InlineStack>
      </Card>
    </BlockStack>
  );
}