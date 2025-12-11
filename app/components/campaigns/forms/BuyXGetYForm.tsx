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
  RadioButton,
  Banner
} from "@shopify/polaris";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";

export function BuyXGetYForm() {
  const [campaignName, setCampaignName] = useState("");
  const [discountLabel, setDiscountLabel] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rewardType, setRewardType] = useState("percentage");
  const [selectionMethod, setSelectionMethod] = useState("popup");

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
            helpText="Visible solo para ti. Te ayuda a identificar la campaña internamente."
          />
          
          <Text as="p" variant="bodyMd" fontWeight="semibold">Etiqueta de descuento mostrada en el checkout</Text>
          <TextField
            label=""
            value={discountLabel}
            onChange={setDiscountLabel}
            placeholder="{{discount}} from {{campaign_name}}"
            autoComplete="off"
            helpText="Los clientes verán esto en su carrito y en el checkout. Puedes usar marcadores como {{discount}} y {{campaign_name}}."
          />
        </BlockStack>
      </Card>

      {/* Customer Buys (X) */}
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Cliente compra (X)</Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Define qué productos necesitan los clientes comprar (X) para que se aplique la campaña.
          </Text>
          
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
          
          <Checkbox label="Excluir productos específicos de esta campaña" />
          
          <TextField
            label="Cantidad mínima requerida"
            type="number"
            value="1"
            onChange={() => {}}
            autoComplete="off"
          />
          
          <RadioButton
            label="Los clientes necesitan comprar al menos 1 artículo de cualquier mezcla de productos seleccionados (Recomendado)"
            checked={true}
            onChange={() => {}}
          />
          <RadioButton
            label="Los clientes necesitan comprar al menos 1 de las mismas variantes de producto"
            checked={false}
            onChange={() => {}}
          />
          
          <Button variant="plain">Calcular conteo de artículos</Button>
          <Text as="p" variant="bodySm" tone="subdued">📝 0 Productos 0 variantes</Text>
        </BlockStack>
      </Card>

      {/* Customer Gets (Y) */}
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Cliente recibe (Y)</Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Si los clientes cumplen la condición, recibirán esta recompensa.
          </Text>
          
          <InlineStack gap="300">
            <TextField
              label="Cantidad a recibir"
              type="number"
              value="1"
              onChange={() => {}}
              autoComplete="off"
            />
            <div style={{ flex: 1 }}>
              <Select
                label="Elegir producto Y"
                options={[
                  { label: "Productos y variantes", value: "products_variants" },
                  { label: "Colecciones", value: "collections" },
                ]}
                value="products_variants"
                onChange={() => {}}
              />
            </div>
          </InlineStack>
          
          <TextField
            label=""
            placeholder="Buscar productos y variantes"
            autoComplete="off"
          />
          <Button>Explorar</Button>
          
          <Banner tone="info">
            Puedes seleccionar un máximo de 100 variantes, basado en los límites de funciones de Shopify.
          </Banner>
        </BlockStack>
      </Card>

      {/* Reward Configuration */}
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Configuración de recompensa</Text>
          
          <InlineStack gap="300">
            <div style={{ width: "200px" }}>
              <Select
                label="Tipo de recompensa (Tipo de descuento)"
                options={[
                  { label: "Porcentaje de descuento", value: "percentage" },
                  { label: "Cantidad fija", value: "fixed" },
                ]}
                value={rewardType}
                onChange={setRewardType}
              />
            </div>
            <TextField
              label="Cantidad"
              type="number"
              value="0"
              onChange={() => {}}
              suffix="%"
              autoComplete="off"
            />
          </InlineStack>
          
          <Text as="p" variant="bodyMd" fontWeight="semibold">El descuento se aplica a</Text>
          <RadioButton
            label="Producto de recompensa con precio más alto en el carrito"
            checked={true}
            onChange={() => {}}
          />
          <RadioButton
            label="Producto de recompensa con precio más bajo en el carrito"
            checked={false}
            onChange={() => {}}
          />
          
          <Text as="p" variant="bodyMd" fontWeight="semibold">Método de selección de recompensa</Text>
          <RadioButton
            label="Selección manual"
            helpText="Los clientes deben encontrar y agregar la recompensa a su carrito manualmente."
            checked={selectionMethod === "manual"}
            onChange={() => setSelectionMethod("manual")}
          />
          <RadioButton
            label="Mostrar pop-up (Personalización y vista previa 🔗)"
            helpText="Un pop-up permite a los clientes elegir y agregar su recompensa. Si se cierra, aparece un botón flotante para reabrirlo."
            checked={selectionMethod === "popup"}
            onChange={() => setSelectionMethod("popup")}
          />
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