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
  Text,
  RadioButton,
  Thumbnail,
} from "@shopify/polaris";
import { authenticate } from "~/utils/shopify.server";
import { prisma } from "~/utils/db.server";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const campaignName = formData.get("campaignName") as string;
  const tiersJson = formData.get("tiers") as string;
  const conditionType = formData.get("conditionType") as string;
  const selectedProducts = formData.get("selectedProducts") as string;
  const startDate = formData.get("startDate") as string;
  const startTime = formData.get("startTime") as string;
  const saveAs = formData.get("saveAs") as string;

  if (!campaignName?.trim()) {
    return json({ error: "El nombre de campaña es requerido" }, { status: 400 });
  }

  const tiers = JSON.parse(tiersJson || "[]");
  if (tiers.length === 0) {
    return json({ error: "Debes agregar al menos un nivel de descuento" }, { status: 400 });
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

    const status = saveAs === "active" ? "ACTIVE" : "DRAFT";

    const campaign = await prisma.campaign.create({
      data: {
        shopId: shop.id,
        name: campaignName,
        type: "QUANTITY_DISCOUNT",
        status: status as any,
        startDate: startDate && startTime ? new Date(`${startDate}T${startTime}`) : null,
        config: { conditionType },
      },
    });

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      await prisma.discountTier.create({
        data: {
          campaignId: campaign.id,
          minQuantity: parseInt(tier.minQuantity) || 1,
          discountType: tier.discountType === "percentage" ? "PERCENTAGE" : "FIXED_AMOUNT",
          discountValue: parseFloat(tier.discountValue) || 0,
          order: i,
        },
      });
    }

    const productsData = selectedProducts ? JSON.parse(selectedProducts) : [];
    for (const product of productsData) {
      const variantIds = product.variants?.map((v: any) => v.id || v) || [];
      await prisma.campaignProduct.create({
        data: {
          campaignId: campaign.id,
          productId: product.id,
          variantIds,
          isExcluded: false,
          role: "discount",
        },
      });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    return redirect(`/app/campaigns${searchParams ? `?${searchParams}` : ""}`);
  } catch (error) {
    console.error("Error creating quantity discount campaign:", error);
    return json({ error: "Error al crear la campaña" }, { status: 500 });
  }
}

interface Product {
  id: string;
  title: string;
  images?: Array<{ originalSrc: string }>;
  variants?: Array<{ id: string }>;
}

interface Tier {
  discountType: "percentage" | "fixed";
  discountValue: string;
  minQuantity: string;
}

function QuantityDiscountFormComplete() {
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const [campaignName, setCampaignName] = useState("");
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [currentDiscountType, setCurrentDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [currentDiscountValue, setCurrentDiscountValue] = useState("10");
  const [currentMinQuantity, setCurrentMinQuantity] = useState("2");
  const [conditionType, setConditionType] = useState("mix");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");

  const handleAddTier = () => {
    if (!currentDiscountValue || !currentMinQuantity) return;
    setTiers([
      ...tiers,
      {
        discountType: currentDiscountType,
        discountValue: currentDiscountValue,
        minQuantity: currentMinQuantity,
      },
    ]);
    setCurrentMinQuantity((parseInt(currentMinQuantity) + 1).toString());
  };

  const handleRemoveTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleOpenPicker = async () => {
    if (typeof window !== "undefined" && (window as any).shopify) {
      try {
        const selection = await (window as any).shopify.resourcePicker({
          type: "product",
          multiple: true,
        });
        if (selection) setSelectedProducts(selection);
      } catch (error) {
        console.error("Error opening picker:", error);
      }
    }
  };

  const handleSubmit = (saveAs: "draft" | "active") => {
    const formData = new FormData();
    formData.append("campaignName", campaignName);
    formData.append("tiers", JSON.stringify(tiers));
    formData.append("conditionType", conditionType);
    formData.append("selectedProducts", JSON.stringify(selectedProducts));
    formData.append("startDate", startDate);
    formData.append("startTime", startTime);
    formData.append("saveAs", saveAs);
    submit(formData, { method: "post" });
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
            placeholder="ej. Compra 3+ ahorra 10%"
            autoComplete="off"
            helpText="Este nombre te ayuda a identificar la campaña internamente."
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
                  <Button tone="critical" variant="plain" onClick={() => handleRemoveTier(i)}>
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
            helpText="Los clientes pueden calificar agregando cualquier combinación de productos elegibles."
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
          {selectedProducts.length > 0 && (
            <BlockStack gap="200">
              <Text as="p">
                {selectedProducts.length} producto(s) seleccionado(s)
              </Text>
              {selectedProducts.map((p) => (
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

export default function QuantityDiscountNew() {
  return (
    <Page
      title="Crear descuento por cantidad"
      backAction={{ url: "/app/campaigns" }}
    >
      <Layout>
        <Layout.Section>
          <QuantityDiscountFormComplete />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
