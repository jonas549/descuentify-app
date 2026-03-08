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
  Divider,
} from "@shopify/polaris";
import { useState, useEffect } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE_PRICE = 10;
const COMPARE_PRICE = 12;

function fmt(price: number): string {
  return `€${Math.max(0, price).toFixed(2)}`;
}

function formatDateTime(date: string, time: string): string {
  if (!date) return "";
  const d = new Date(`${date}T${time || "00:00"}`);
  const datePart = d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return time ? `${datePart}, ${time}` : datePart;
}

// ─── Preview Panel ────────────────────────────────────────────────────────────

interface PreviewProps {
  campaignName: string;
  discountType: string;
  discountValue: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

function DiscountPreviewPanel({
  campaignName,
  discountType,
  discountValue,
  startDate,
  startTime,
  endDate,
  endTime,
}: PreviewProps) {
  const numericValue = parseFloat(discountValue) || 0;
  const discountedPrice =
    discountType === "percentage"
      ? BASE_PRICE * (1 - numericValue / 100)
      : Math.max(0, BASE_PRICE - numericValue);
  const saving = BASE_PRICE - discountedPrice;

  const discountLabel =
    discountType === "percentage"
      ? `${numericValue}% de descuento`
      : `${fmt(numericValue)} de descuento`;

  const startFormatted = formatDateTime(startDate, startTime);
  const endFormatted = formatDateTime(endDate, endTime);

  return (
    <BlockStack gap="400">
      {/* ── Sección 1: Vista previa ── */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Vista previa del descuento
          </Text>

          {/* En página de producto */}
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">
              En página de producto
            </Text>

            {/* Sin precio de comparación */}
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" tone="subdued">
                Sin precio de comparación
              </Text>
              <InlineStack gap="200" blockAlign="center">
                <Text as="p" variant="bodySm" tone="subdued">
                  Antes:
                </Text>
                <Text as="p" variant="bodyMd">
                  {fmt(BASE_PRICE)}
                </Text>
              </InlineStack>
              <InlineStack gap="200" blockAlign="center">
                <Text as="p" variant="bodySm" tone="subdued">
                  Después:
                </Text>
                <Text as="p" variant="bodyMd" tone="critical" fontWeight="bold">
                  {fmt(discountedPrice)}
                </Text>
                <span
                  style={{ textDecoration: "line-through", color: "#8c9196", fontSize: "14px" }}
                >
                  {fmt(BASE_PRICE)}
                </span>
              </InlineStack>
            </BlockStack>

            <Divider />

            {/* Con precio de comparación */}
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" tone="subdued">
                Con precio de comparación
              </Text>
              <InlineStack gap="200" blockAlign="center">
                <Text as="p" variant="bodySm" tone="subdued">
                  Antes:
                </Text>
                <Text as="p" variant="bodyMd">
                  {fmt(BASE_PRICE)}
                </Text>
                <span
                  style={{ textDecoration: "line-through", color: "#8c9196", fontSize: "14px" }}
                >
                  {fmt(COMPARE_PRICE)}
                </span>
              </InlineStack>
              <InlineStack gap="200" blockAlign="center">
                <Text as="p" variant="bodySm" tone="subdued">
                  Después:
                </Text>
                <Text as="p" variant="bodyMd" tone="critical" fontWeight="bold">
                  {fmt(discountedPrice)}
                </Text>
                <span
                  style={{ textDecoration: "line-through", color: "#8c9196", fontSize: "14px" }}
                >
                  {fmt(COMPARE_PRICE)}
                </span>
              </InlineStack>
            </BlockStack>
          </BlockStack>

          <Divider />

          {/* En carrito */}
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm">
              En carrito
            </Text>

            <div
              style={{
                background: "#f6f6f7",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="p" variant="bodyMd">
                    Producto A
                  </Text>
                  <InlineStack gap="200" blockAlign="center">
                    <span
                      style={{
                        textDecoration: "line-through",
                        color: "#8c9196",
                        fontSize: "14px",
                      }}
                    >
                      {fmt(BASE_PRICE)}
                    </span>
                    <Text as="p" variant="bodyMd" fontWeight="bold">
                      {fmt(discountedPrice)}
                    </Text>
                  </InlineStack>
                </InlineStack>

                <Text as="p" variant="bodySm" tone="subdued">
                  Cantidad: 1
                </Text>

                <Divider />

                <InlineStack align="space-between">
                  <Text as="p" variant="bodySm">
                    Total
                  </Text>
                  <Text as="p" variant="bodySm">
                    {fmt(discountedPrice)}
                  </Text>
                </InlineStack>

                <InlineStack align="space-between">
                  <Text as="p" variant="bodySm" tone="success">
                    Ahorro
                  </Text>
                  <Text as="p" variant="bodySm" tone="success">
                    -{fmt(saving)}
                  </Text>
                </InlineStack>

                <Divider />

                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd" fontWeight="bold">
                    Subtotal
                  </Text>
                  <Text as="p" variant="bodyMd" fontWeight="bold">
                    {fmt(discountedPrice)}
                  </Text>
                </InlineStack>
              </BlockStack>
            </div>
          </BlockStack>
        </BlockStack>
      </Card>

      {/* ── Sección 2: Resumen ── */}
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">
            Resumen
          </Text>

          <Text as="p" variant="bodyMd" fontWeight="bold">
            {campaignName.trim() || "Sin nombre de campaña aún"}
          </Text>

          <BlockStack gap="100">
            <Text as="p" variant="bodySm" tone="subdued">
              Tipo de campaña
            </Text>
            <Text as="p" variant="bodyMd">
              Edición de precios masiva y liquidación
            </Text>
            <Text as="p" variant="bodyMd">
              {discountLabel}
            </Text>
          </BlockStack>

          <BlockStack gap="100">
            <Text as="p" variant="bodySm" tone="subdued">
              Detalles
            </Text>
            <Text as="p" variant="bodyMd">
              Aplica a productos y variantes
            </Text>
            {startFormatted && (
              <Text as="p" variant="bodyMd">
                Inicio: {startFormatted}
              </Text>
            )}
            {endFormatted && (
              <Text as="p" variant="bodyMd">
                Fin: {endFormatted}
              </Text>
            )}
          </BlockStack>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface BulkPriceEditorFormProps {
  onSubmit: (data: any) => void;
  error?: string;
  initialData?: any;
  isEditing?: boolean;
}

export function BulkPriceEditorForm({
  onSubmit,
  error,
  initialData,
  isEditing = false,
}: BulkPriceEditorFormProps) {
  const [campaignName, setCampaignName] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("0");
  const [excludeProducts, setExcludeProducts] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (initialData) {
      setCampaignName(initialData.name || "");
      const config = initialData.config as any;
      if (config) {
        setDiscountType(config.discountType || "percentage");
        setDiscountValue(config.discountValue?.toString() || "0");
      }
      if (initialData.startDate) {
        const d = new Date(initialData.startDate);
        setStartDate(d.toISOString().slice(0, 10));
        setStartTime(d.toISOString().slice(11, 16));
      }
      if (initialData.endDate) {
        const d = new Date(initialData.endDate);
        setEndDate(d.toISOString().slice(0, 10));
        setEndTime(d.toISOString().slice(11, 16));
      }
    }
  }, [initialData]);

  const handleSubmit = () => {
    onSubmit({ campaignName, discountType, discountValue, excludeProducts, startDate, startTime, endDate, endTime });
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: "20px",
        alignItems: "start",
      }}
    >
      {/* ── Columna izquierda: Formulario ── */}
      <BlockStack gap="400">
        {error && (
          <Banner tone="critical">
            <p>{error}</p>
          </Banner>
        )}

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Nombre de campaña
            </Text>
            <TextField
              label=""
              value={campaignName}
              onChange={setCampaignName}
              placeholder="ej. 20% off verano"
              autoComplete="off"
              helpText="Este nombre te ayuda a identificar la campaña internamente."
            />
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Descuento
            </Text>
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
                suffix={discountType === "percentage" ? "%" : "€"}
                autoComplete="off"
              />
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Productos
            </Text>
            <Checkbox
              label="Excluir productos específicos del descuento"
              checked={excludeProducts}
              onChange={setExcludeProducts}
            />
            <Text as="p" variant="bodySm" tone="subdued">
              {initialData?.products?.length || 0} producto(s) asociado(s)
            </Text>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Programación (opcional)
            </Text>
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
            <InlineStack gap="300">
              <TextField
                label="Fecha de fin"
                type="date"
                value={endDate}
                onChange={setEndDate}
                autoComplete="off"
              />
              <TextField
                label="Hora de fin"
                type="time"
                value={endTime}
                onChange={setEndTime}
                autoComplete="off"
              />
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <InlineStack align="end" gap="300">
            <Button url="/app/campaigns">Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit}>
              {isEditing ? "Actualizar campaña" : "Guardar campaña"}
            </Button>
          </InlineStack>
        </Card>
      </BlockStack>

      {/* ── Columna derecha: Panel preview ── */}
      <DiscountPreviewPanel
        campaignName={campaignName}
        discountType={discountType}
        discountValue={discountValue}
        startDate={startDate}
        startTime={startTime}
        endDate={endDate}
        endTime={endTime}
      />
    </div>
  );
}
