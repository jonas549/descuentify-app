import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
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
  Text,
  RadioButton,
  Thumbnail,
  Checkbox,
} from "@shopify/polaris";
import { authenticate } from "~/utils/shopify.server";
import { prisma } from "~/utils/db.server";
import { useState } from "react";

// ─── Loader ─────────────────────────────────────────────────────────────────

export async function loader({ request, params }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  const { id } = params;
  if (!id) throw new Response("Campaign ID required", { status: 400 });

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      products: true,
      tiers: { orderBy: { order: "asc" } },
    },
  });

  if (!campaign) throw new Response("Campaign not found", { status: 404 });

  return json({
    campaign: {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      discountLabel: campaign.discountLabel,
      config: campaign.config as Record<string, any>,
      startDate: campaign.startDate?.toISOString() || null,
      products: campaign.products.map((p) => ({
        id: p.id,
        productId: p.productId,
        variantIds: p.variantIds,
        isExcluded: p.isExcluded,
        role: p.role,
      })),
      tiers: campaign.tiers.map((t) => ({
        minQuantity: t.minQuantity,
        discountType: t.discountType,
        discountValue: Number(t.discountValue),
        order: t.order,
      })),
    },
  });
}

// ─── Action ──────────────────────────────────────────────────────────────────

export async function action({ request, params }: ActionFunctionArgs) {
  await authenticate.admin(request);
  const { id } = params;
  if (!id) return json({ error: "Campaign ID required" }, { status: 400 });

  const formData = await request.formData();
  const campaignType = formData.get("campaignType") as string;
  const campaignName = formData.get("campaignName") as string;
  const startDate = formData.get("startDate") as string;
  const startTime = formData.get("startTime") as string;
  const saveAs = formData.get("saveAs") as string;
  const status = saveAs === "active" ? "ACTIVE" : "DRAFT";

  if (!campaignName?.trim()) {
    return json({ error: "El nombre de campaña es requerido" }, { status: 400 });
  }

  try {
    if (campaignType === "BULK_PRICE_EDITOR") {
      const discountType = formData.get("discountType") as string;
      const discountValue = parseFloat(formData.get("discountValue") as string) || 0;
      const applyTo = formData.get("applyTo") as string;
      const selectedProductsJson = formData.get("selectedProducts") as string;
      const excludeProducts = formData.get("excludeProducts") === "true";

      await prisma.campaign.update({
        where: { id },
        data: {
          name: campaignName,
          status: status as any,
          startDate: startDate && startTime ? new Date(`${startDate}T${startTime}`) : null,
          config: {
            discountType,
            discountValue,
            applyTo,
            excludeProducts,
          },
        },
      });

      const productsData = selectedProductsJson ? JSON.parse(selectedProductsJson) : [];
      if (productsData.length > 0) {
        await prisma.campaignProduct.deleteMany({ where: { campaignId: id } });
        for (const product of productsData) {
          await prisma.campaignProduct.create({
            data: {
              campaignId: id,
              productId: product.id,
              variantIds: product.variants?.map((v: any) => v.id || v) || [],
              isExcluded: excludeProducts,
              role: applyTo,
            },
          });
        }
      }
    } else if (campaignType === "QUANTITY_DISCOUNT") {
      const tiersJson = formData.get("tiers") as string;
      const conditionType = formData.get("conditionType") as string;
      const selectedProductsJson = formData.get("selectedProducts") as string;
      const tiers = JSON.parse(tiersJson || "[]");

      if (tiers.length === 0) {
        return json({ error: "Debes agregar al menos un nivel de descuento" }, { status: 400 });
      }

      await prisma.campaign.update({
        where: { id },
        data: {
          name: campaignName,
          status: status as any,
          startDate: startDate && startTime ? new Date(`${startDate}T${startTime}`) : null,
          config: { conditionType },
        },
      });

      await prisma.discountTier.deleteMany({ where: { campaignId: id } });
      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        await prisma.discountTier.create({
          data: {
            campaignId: id,
            minQuantity: parseInt(tier.minQuantity) || 1,
            discountType: tier.discountType === "percentage" ? "PERCENTAGE" : "FIXED_AMOUNT",
            discountValue: parseFloat(tier.discountValue) || 0,
            order: i,
          },
        });
      }

      const productsData = selectedProductsJson ? JSON.parse(selectedProductsJson) : [];
      if (productsData.length > 0) {
        await prisma.campaignProduct.deleteMany({ where: { campaignId: id } });
        for (const product of productsData) {
          await prisma.campaignProduct.create({
            data: {
              campaignId: id,
              productId: product.id,
              variantIds: product.variants?.map((v: any) => v.id || v) || [],
              isExcluded: false,
              role: "discount",
            },
          });
        }
      }
    } else if (campaignType === "BUY_X_GET_Y") {
      const discountLabel = formData.get("discountLabel") as string;
      const buyerProductsJson = formData.get("buyerProducts") as string;
      const rewardProductsJson = formData.get("rewardProducts") as string;
      const rewardQuantity = formData.get("rewardQuantity") as string;
      const rewardType = formData.get("rewardType") as string;
      const rewardValue = formData.get("rewardValue") as string;
      const applyTo = formData.get("applyTo") as string;
      const selectionMethod = formData.get("selectionMethod") as string;

      await prisma.campaign.update({
        where: { id },
        data: {
          name: campaignName,
          status: status as any,
          discountLabel: discountLabel || null,
          startDate: startDate && startTime ? new Date(`${startDate}T${startTime}`) : null,
          config: {
            rewardQuantity: parseInt(rewardQuantity) || 1,
            rewardType,
            rewardValue: parseFloat(rewardValue) || 0,
            applyTo,
            selectionMethod,
          },
        },
      });

      const buyerData = buyerProductsJson ? JSON.parse(buyerProductsJson) : [];
      const rewardData = rewardProductsJson ? JSON.parse(rewardProductsJson) : [];

      if (buyerData.length > 0) {
        await prisma.campaignProduct.deleteMany({ where: { campaignId: id, role: "buyer" } });
        for (const product of buyerData) {
          await prisma.campaignProduct.create({
            data: {
              campaignId: id,
              productId: product.id,
              variantIds: product.variants?.map((v: any) => v.id || v) || [],
              isExcluded: false,
              role: "buyer",
            },
          });
        }
      }

      if (rewardData.length > 0) {
        await prisma.campaignProduct.deleteMany({ where: { campaignId: id, role: "reward" } });
        for (const product of rewardData) {
          await prisma.campaignProduct.create({
            data: {
              campaignId: id,
              productId: product.id,
              variantIds: product.variants?.map((v: any) => v.id || v) || [],
              isExcluded: false,
              role: "reward",
            },
          });
        }
      }
    }

    return redirect("/app/campaigns");
  } catch (error) {
    console.error("Error updating campaign:", error);
    return json({ error: "Error al actualizar la campaña" }, { status: 500 });
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductLike {
  id: string;
  title: string;
  images?: Array<{ originalSrc: string }>;
  variants?: Array<{ id: string }>;
}

interface TierForm {
  discountType: "percentage" | "fixed";
  discountValue: string;
  minQuantity: string;
}

/** Convert a DB CampaignProduct into a ProductLike for form state */
function dbProductToForm(p: { productId: string; variantIds: string[] }): ProductLike {
  return {
    id: p.productId,
    title: `Producto (${p.productId.slice(-8)})`,
    variants: p.variantIds.map((vid) => ({ id: vid })),
  };
}

function extractDateParts(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const date = d.toISOString().slice(0, 10);
  const time = d.toISOString().slice(11, 16);
  return { date, time };
}

function ProductList({ products }: { products: ProductLike[] }) {
  if (products.length === 0) return null;
  return (
    <BlockStack gap="200">
      <Text as="p" variant="bodySm">
        {products.length} producto(s) seleccionado(s)
      </Text>
      {products.map((p) => (
        <InlineStack key={p.id} gap="300" blockAlign="center">
          {p.images?.[0] && (
            <Thumbnail source={p.images[0].originalSrc} alt={p.title} size="small" />
          )}
          <Text as="span" variant="bodyMd">
            {p.title}
          </Text>
        </InlineStack>
      ))}
    </BlockStack>
  );
}

// ─── Bulk Price Editor Form ───────────────────────────────────────────────────

function BulkPriceEditorEditForm({
  campaign,
}: {
  campaign: ReturnType<typeof useLoaderData<typeof loader>>["campaign"];
}) {
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const config = campaign.config as any;
  const { date: initDate, time: initTime } = extractDateParts(campaign.startDate);

  const [campaignName, setCampaignName] = useState(campaign.name);
  const [discountType, setDiscountType] = useState(config.discountType || "percentage");
  const [discountValue, setDiscountValue] = useState(String(config.discountValue ?? "0"));
  const [applyTo, setApplyTo] = useState(config.applyTo || "products");
  const [excludeProducts, setExcludeProducts] = useState(config.excludeProducts ?? false);
  const [selectedProducts, setSelectedProducts] = useState<ProductLike[]>(
    campaign.products.map(dbProductToForm),
  );
  const [startDate, setStartDate] = useState(initDate);
  const [startTime, setStartTime] = useState(initTime);

  const handleOpenPicker = async () => {
    if (typeof window !== "undefined" && (window as any).shopify) {
      try {
        let resourceType: "product" | "collection" | "variant" = "product";
        if (applyTo === "collections") resourceType = "collection";
        else if (applyTo === "variants") resourceType = "variant";

        const selection = await (window as any).shopify.resourcePicker({
          type: resourceType,
          multiple: true,
        });
        if (selection) setSelectedProducts(selection);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = (saveAs: "draft" | "active") => {
    const fd = new FormData();
    fd.append("campaignType", "BULK_PRICE_EDITOR");
    fd.append("campaignName", campaignName);
    fd.append("discountType", discountType);
    fd.append("discountValue", discountValue);
    fd.append("applyTo", applyTo);
    fd.append("selectedProducts", JSON.stringify(selectedProducts));
    fd.append("excludeProducts", excludeProducts.toString());
    fd.append("startDate", startDate);
    fd.append("startTime", startTime);
    fd.append("saveAs", saveAs);
    submit(fd, { method: "post" });
  };

  return (
    <BlockStack gap="400">
      {actionData?.error && (
        <Banner tone="critical">
          <p>{actionData.error}</p>
        </Banner>
      )}

      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Nombre de campaña</Text>
          <TextField
            label=""
            value={campaignName}
            onChange={setCampaignName}
            autoComplete="off"
            helpText="Este nombre te ayuda a identificar la campaña internamente."
          />
        </BlockStack>
      </Card>

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
              suffix={discountType === "percentage" ? "%" : "€"}
              autoComplete="off"
            />
          </InlineStack>
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Aplicar descuento a</Text>
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
              <ProductList products={selectedProducts} />
              <Checkbox
                label="Excluir estos productos del descuento"
                checked={excludeProducts}
                onChange={setExcludeProducts}
              />
            </>
          )}
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Programación (opcional)</Text>
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
        </BlockStack>
      </Card>

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
  );
}

// ─── Quantity Discount Form ───────────────────────────────────────────────────

function QuantityDiscountEditForm({
  campaign,
}: {
  campaign: ReturnType<typeof useLoaderData<typeof loader>>["campaign"];
}) {
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const config = campaign.config as any;
  const { date: initDate, time: initTime } = extractDateParts(campaign.startDate);

  const initialTiers: TierForm[] = campaign.tiers.map((t) => ({
    discountType: t.discountType === "PERCENTAGE" ? "percentage" : "fixed",
    discountValue: String(t.discountValue),
    minQuantity: String(t.minQuantity),
  }));

  const [campaignName, setCampaignName] = useState(campaign.name);
  const [tiers, setTiers] = useState<TierForm[]>(initialTiers);
  const [currentDiscountType, setCurrentDiscountType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [currentDiscountValue, setCurrentDiscountValue] = useState("10");
  const [currentMinQuantity, setCurrentMinQuantity] = useState("2");
  const [conditionType, setConditionType] = useState(config.conditionType || "mix");
  const [selectedProducts, setSelectedProducts] = useState<ProductLike[]>(
    campaign.products.filter((p) => p.role === "discount").map(dbProductToForm),
  );
  const [startDate, setStartDate] = useState(initDate);
  const [startTime, setStartTime] = useState(initTime);

  const handleAddTier = () => {
    if (!currentDiscountValue || !currentMinQuantity) return;
    setTiers([
      ...tiers,
      { discountType: currentDiscountType, discountValue: currentDiscountValue, minQuantity: currentMinQuantity },
    ]);
    setCurrentMinQuantity((parseInt(currentMinQuantity) + 1).toString());
  };

  const handleOpenPicker = async () => {
    if (typeof window !== "undefined" && (window as any).shopify) {
      try {
        const selection = await (window as any).shopify.resourcePicker({ type: "product", multiple: true });
        if (selection) setSelectedProducts(selection);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = (saveAs: "draft" | "active") => {
    const fd = new FormData();
    fd.append("campaignType", "QUANTITY_DISCOUNT");
    fd.append("campaignName", campaignName);
    fd.append("tiers", JSON.stringify(tiers));
    fd.append("conditionType", conditionType);
    fd.append("selectedProducts", JSON.stringify(selectedProducts));
    fd.append("startDate", startDate);
    fd.append("startTime", startTime);
    fd.append("saveAs", saveAs);
    submit(fd, { method: "post" });
  };

  return (
    <BlockStack gap="400">
      {actionData?.error && (
        <Banner tone="critical">
          <p>{actionData.error}</p>
        </Banner>
      )}

      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Nombre de campaña</Text>
          <TextField
            label=""
            value={campaignName}
            onChange={setCampaignName}
            autoComplete="off"
          />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Niveles de descuento</Text>

          {tiers.length > 0 && (
            <BlockStack gap="200">
              {tiers.map((tier, i) => (
                <InlineStack key={i} gap="300" blockAlign="center" align="space-between">
                  <Text as="p">
                    Compra {tier.minQuantity}+ → {tier.discountValue}
                    {tier.discountType === "percentage" ? "%" : "€"} descuento
                  </Text>
                  <Button
                    tone="critical"
                    variant="plain"
                    onClick={() => setTiers(tiers.filter((_, idx) => idx !== i))}
                  >
                    Eliminar
                  </Button>
                </InlineStack>
              ))}
            </BlockStack>
          )}

          <InlineStack gap="300" wrap={false}>
            <div style={{ width: "180px" }}>
              <Select
                label="Tipo"
                options={[
                  { label: "Porcentaje", value: "percentage" },
                  { label: "Cantidad fija", value: "fixed" },
                ]}
                value={currentDiscountType}
                onChange={(v) => setCurrentDiscountType(v as "percentage" | "fixed")}
              />
            </div>
            <TextField
              label="Descuento"
              type="number"
              value={currentDiscountValue}
              onChange={setCurrentDiscountValue}
              suffix={currentDiscountType === "percentage" ? "%" : "€"}
              autoComplete="off"
            />
            <TextField
              label="Cantidad mín."
              type="number"
              value={currentMinQuantity}
              onChange={setCurrentMinQuantity}
              autoComplete="off"
            />
          </InlineStack>
          <Button variant="primary" tone="success" onClick={handleAddTier}>
            Agregar nivel de descuento
          </Button>
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Condiciones de descuento</Text>
          <RadioButton
            label="Mezcla de productos"
            helpText="Los clientes pueden calificar con cualquier combinación de productos."
            checked={conditionType === "mix"}
            onChange={() => setConditionType("mix")}
          />
          <RadioButton
            label="Mismas variantes"
            helpText="Los clientes deben agregar la misma variante para calificar."
            checked={conditionType === "same"}
            onChange={() => setConditionType("same")}
          />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Productos</Text>
          <Button onClick={handleOpenPicker}>Explorar y seleccionar</Button>
          <ProductList products={selectedProducts} />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Programación (opcional)</Text>
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
        </BlockStack>
      </Card>

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
  );
}

// ─── Buy X Get Y Form ────────────────────────────────────────────────────────

function BuyXGetYEditForm({
  campaign,
}: {
  campaign: ReturnType<typeof useLoaderData<typeof loader>>["campaign"];
}) {
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const config = campaign.config as any;
  const { date: initDate, time: initTime } = extractDateParts(campaign.startDate);

  const [campaignName, setCampaignName] = useState(campaign.name);
  const [discountLabel, setDiscountLabel] = useState(campaign.discountLabel || "");
  const [buyerProducts, setBuyerProducts] = useState<ProductLike[]>(
    campaign.products.filter((p) => p.role === "buyer").map(dbProductToForm),
  );
  const [rewardProducts, setRewardProducts] = useState<ProductLike[]>(
    campaign.products.filter((p) => p.role === "reward").map(dbProductToForm),
  );
  const [rewardQuantity, setRewardQuantity] = useState(String(config.rewardQuantity ?? "1"));
  const [rewardType, setRewardType] = useState(config.rewardType || "percentage");
  const [rewardValue, setRewardValue] = useState(String(config.rewardValue ?? "100"));
  const [applyTo, setApplyTo] = useState(config.applyTo || "highest");
  const [selectionMethod, setSelectionMethod] = useState(config.selectionMethod || "popup");
  const [startDate, setStartDate] = useState(initDate);
  const [startTime, setStartTime] = useState(initTime);

  const handleOpenPicker = async (target: "buyer" | "reward") => {
    if (typeof window !== "undefined" && (window as any).shopify) {
      try {
        const selection = await (window as any).shopify.resourcePicker({ type: "product", multiple: true });
        if (selection) {
          if (target === "buyer") setBuyerProducts(selection);
          else setRewardProducts(selection);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = (saveAs: "draft" | "active") => {
    const fd = new FormData();
    fd.append("campaignType", "BUY_X_GET_Y");
    fd.append("campaignName", campaignName);
    fd.append("discountLabel", discountLabel);
    fd.append("buyerProducts", JSON.stringify(buyerProducts));
    fd.append("rewardProducts", JSON.stringify(rewardProducts));
    fd.append("rewardQuantity", rewardQuantity);
    fd.append("rewardType", rewardType);
    fd.append("rewardValue", rewardValue);
    fd.append("applyTo", applyTo);
    fd.append("selectionMethod", selectionMethod);
    fd.append("startDate", startDate);
    fd.append("startTime", startTime);
    fd.append("saveAs", saveAs);
    submit(fd, { method: "post" });
  };

  return (
    <BlockStack gap="400">
      {actionData?.error && (
        <Banner tone="critical">
          <p>{actionData.error}</p>
        </Banner>
      )}

      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Nombre de campaña</Text>
          <TextField
            label=""
            value={campaignName}
            onChange={setCampaignName}
            autoComplete="off"
            helpText="Visible solo para ti."
          />
          <Text as="p" variant="bodyMd" fontWeight="semibold">
            Etiqueta de descuento en el checkout
          </Text>
          <TextField
            label=""
            value={discountLabel}
            onChange={setDiscountLabel}
            placeholder="{{discount}} from {{campaign_name}}"
            autoComplete="off"
            helpText="Los clientes verán esto en su carrito y en el checkout."
          />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Cliente compra (X)</Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Productos que el cliente debe comprar para activar la campaña.
          </Text>
          <Button onClick={() => handleOpenPicker("buyer")}>Explorar y seleccionar</Button>
          <ProductList products={buyerProducts} />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Cliente recibe (Y)</Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Productos que el cliente recibirá como recompensa.
          </Text>
          <TextField
            label="Cantidad a recibir"
            type="number"
            value={rewardQuantity}
            onChange={setRewardQuantity}
            autoComplete="off"
          />
          <Button onClick={() => handleOpenPicker("reward")}>Explorar y seleccionar</Button>
          <ProductList products={rewardProducts} />
          <Banner tone="info">Máximo 100 variantes (límite de Shopify).</Banner>
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Configuración de recompensa</Text>
          <InlineStack gap="300" wrap={false}>
            <div style={{ width: "200px" }}>
              <Select
                label="Tipo de descuento"
                options={[
                  { label: "Porcentaje", value: "percentage" },
                  { label: "Cantidad fija", value: "fixed" },
                  { label: "Gratis (100%)", value: "free" },
                ]}
                value={rewardType}
                onChange={setRewardType}
              />
            </div>
            {rewardType !== "free" && (
              <TextField
                label="Cantidad"
                type="number"
                value={rewardValue}
                onChange={setRewardValue}
                suffix={rewardType === "percentage" ? "%" : "€"}
                autoComplete="off"
              />
            )}
          </InlineStack>

          <Text as="p" variant="bodyMd" fontWeight="semibold">
            El descuento se aplica al
          </Text>
          <RadioButton
            label="Producto de recompensa con precio más alto"
            checked={applyTo === "highest"}
            onChange={() => setApplyTo("highest")}
          />
          <RadioButton
            label="Producto de recompensa con precio más bajo"
            checked={applyTo === "lowest"}
            onChange={() => setApplyTo("lowest")}
          />

          <Text as="p" variant="bodyMd" fontWeight="semibold">
            Método de selección de recompensa
          </Text>
          <RadioButton
            label="Selección manual"
            helpText="El cliente debe agregar la recompensa manualmente."
            checked={selectionMethod === "manual"}
            onChange={() => setSelectionMethod("manual")}
          />
          <RadioButton
            label="Mostrar pop-up"
            helpText="Un pop-up permite al cliente elegir y agregar su recompensa."
            checked={selectionMethod === "popup"}
            onChange={() => setSelectionMethod("popup")}
          />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">Programación (opcional)</Text>
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
        </BlockStack>
      </Card>

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
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  BULK_PRICE_EDITOR: "Editor de precios masivo",
  QUANTITY_DISCOUNT: "Descuento por cantidad",
  BUY_X_GET_Y: "Compra X lleva Y",
};

export default function CampaignEdit() {
  const { campaign } = useLoaderData<typeof loader>();

  return (
    <Page
      title={`Editar: ${campaign.name}`}
      subtitle={TYPE_LABELS[campaign.type] ?? campaign.type}
      backAction={{ url: "/app/campaigns" }}
    >
      <Layout>
        <Layout.Section>
          {campaign.type === "BULK_PRICE_EDITOR" && (
            <BulkPriceEditorEditForm campaign={campaign} />
          )}
          {campaign.type === "QUANTITY_DISCOUNT" && (
            <QuantityDiscountEditForm campaign={campaign} />
          )}
          {campaign.type === "BUY_X_GET_Y" && (
            <BuyXGetYEditForm campaign={campaign} />
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
