import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  TextField,
  Select,
  Button,
  BlockStack,
  InlineStack,
  Banner,
  Checkbox,
  Text,
  Thumbnail,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "~/utils/shopify.server";
import { prisma } from "~/utils/db.server";
import { useState, useCallback } from "react";

// ─── Loader ──────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  return json({ shop: session.shop });
}

// ─── Action ──────────────────────────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const campaignName = formData.get("campaignName") as string;
  const discountType = formData.get("discountType") as string;
  const discountValue = parseFloat(formData.get("discountValue") as string);
  const applyTo = formData.get("applyTo") as string;
  const selectedProducts = formData.get("selectedProducts") as string;
  const excludeProducts = formData.get("excludeProducts") === "true";
  const startDate = formData.get("startDate") as string;
  const startTime = formData.get("startTime") as string;
  const endDate = formData.get("endDate") as string;
  const endTime = formData.get("endTime") as string;
  const saveAs = formData.get("saveAs") as string;

  if (!campaignName || !campaignName.trim()) {
    return json({ error: "El nombre de campaña es requerido" }, { status: 400 });
  }
  if (discountValue < 0 || discountValue > 100) {
    return json({ error: "El descuento debe estar entre 0 y 100" }, { status: 400 });
  }
  if (applyTo !== "all_store" && !selectedProducts) {
    return json(
      { error: "Debes seleccionar al menos un producto, variante o colección" },
      { status: 400 },
    );
  }

  try {
    let shop = await prisma.shop.findUnique({ where: { shopDomain: session.shop } });
    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          shopDomain: session.shop,
          accessToken: session.accessToken || "",
          scope: session.scope || "",
        },
      });
    }

    const productsData = selectedProducts ? JSON.parse(selectedProducts) : [];
    const status = saveAs === "active" ? "ACTIVE" : "DRAFT";

    const campaign = await prisma.campaign.create({
      data: {
        shopId: shop.id,
        name: campaignName,
        type: "BULK_PRICE_EDITOR",
        status: status as any,
        startDate: startDate && startTime ? new Date(`${startDate}T${startTime}`) : null,
        endDate: endDate && endTime ? new Date(`${endDate}T${endTime}`) : null,
        config: {
          discountType,
          discountValue,
          applyTo,
          excludeProducts,
        },
      },
    });

    for (const product of productsData) {
      await prisma.campaignProduct.create({
        data: {
          campaignId: campaign.id,
          productId: product.id,
          variantIds: product.variants?.map((v: any) => v.id || v) || [],
          isExcluded: excludeProducts,
          role: applyTo,
        },
      });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    return redirect(`/app/campaigns${searchParams ? `?${searchParams}` : ""}`);
  } catch (error) {
    console.error("ERROR creating campaign:", error);
    return json({ error: "Error al crear la campaña" }, { status: 500 });
  }
}

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

interface Product {
  id: string;
  title: string;
  images?: Array<{ originalSrc: string }>;
  variants?: string[];
  type?: string;
}

function BulkPriceEditorFormComplete() {
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const [campaignName, setCampaignName] = useState("");
  const [discountValue, setDiscountValue] = useState("0");
  const [discountType, setDiscountType] = useState("percentage");
  const [applyTo, setApplyTo] = useState("products");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [excludeProducts, setExcludeProducts] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleOpenPicker = useCallback(async () => {
    let resourceType: "product" | "collection" | "variant" = "product";
    if (applyTo === "collections") resourceType = "collection";
    else if (applyTo === "variants") resourceType = "variant";

    if (typeof window !== "undefined" && (window as any).shopify) {
      try {
        const selection = await (window as any).shopify.resourcePicker({
          type: resourceType,
          multiple: true,
        });
        if (selection) setSelectedProducts(selection);
      } catch (error) {
        console.error("Error opening picker:", error);
      }
    }
  }, [applyTo]);

  const handleSubmit = (saveAs: "draft" | "active") => {
    const formData = new FormData();
    formData.append("campaignName", campaignName);
    formData.append("discountType", discountType);
    formData.append("discountValue", discountValue);
    formData.append("applyTo", applyTo);
    formData.append("selectedProducts", JSON.stringify(selectedProducts));
    formData.append("excludeProducts", excludeProducts.toString());
    formData.append("startDate", startDate);
    formData.append("startTime", startTime);
    formData.append("endDate", endDate);
    formData.append("endTime", endTime);
    formData.append("saveAs", saveAs);
    submit(formData, { method: "post" });
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
        {actionData?.error && (
          <Banner tone="critical">
            <p>{actionData.error}</p>
          </Banner>
        )}

        {/* Nombre */}
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

        {/* Descuento */}
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

        {/* Aplicar a */}
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Aplicar descuento a
            </Text>
            <Select
              label=""
              options={[
                { label: "Productos", value: "products" },
                { label: "Variantes", value: "variants" },
                { label: "Colecciones", value: "collections" },
                { label: "Toda la tienda", value: "all_store" },
              ]}
              value={applyTo}
              onChange={setApplyTo}
            />

            {applyTo !== "all_store" && (
              <>
                <Button onClick={handleOpenPicker}>Explorar y seleccionar</Button>

                {selectedProducts.length > 0 && (
                  <BlockStack gap="300">
                    <Text as="p" variant="bodyMd">
                      {selectedProducts.length}{" "}
                      {applyTo === "collections" ? "colección(es)" : "producto(s)"} seleccionado(s)
                    </Text>
                    <Card>
                      <BlockStack gap="200">
                        {selectedProducts.map((item) => (
                          <InlineStack key={item.id} gap="300" blockAlign="center">
                            {item.images?.[0] && (
                              <Thumbnail
                                source={item.images[0].originalSrc}
                                alt={item.title}
                                size="small"
                              />
                            )}
                            <Text variant="bodyMd" fontWeight="bold" as="span">
                              {item.title}
                            </Text>
                          </InlineStack>
                        ))}
                      </BlockStack>
                    </Card>
                  </BlockStack>
                )}

                <Checkbox
                  label="Excluir estos productos del descuento"
                  checked={excludeProducts}
                  onChange={setExcludeProducts}
                />
              </>
            )}
          </BlockStack>
        </Card>

        {/* Programación */}
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

        {/* Botones */}
        <Card>
          <InlineStack align="end" gap="300">
            <Button url="/app/campaigns">Cancelar</Button>
            <Button onClick={() => handleSubmit("draft")}>Guardar como borrador</Button>
            <Button variant="primary" onClick={() => handleSubmit("active")}>
              Guardar y activar
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BulkPriceEditorNew() {
  return (
    <Page title="Crear editor de precios masivo" backAction={{ url: "/app/campaigns" }}>
      <Layout>
        <Layout.Section>
          <BulkPriceEditorFormComplete />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
