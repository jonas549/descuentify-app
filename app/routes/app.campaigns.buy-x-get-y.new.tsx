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
  const discountLabel = formData.get("discountLabel") as string;
  const buyerProductsJson = formData.get("buyerProducts") as string;
  const rewardProductsJson = formData.get("rewardProducts") as string;
  const rewardQuantity = parseInt(formData.get("rewardQuantity") as string) || 1;
  const rewardType = formData.get("rewardType") as string;
  const rewardValue = parseFloat(formData.get("rewardValue") as string) || 0;
  const applyTo = formData.get("applyTo") as string;
  const selectionMethod = formData.get("selectionMethod") as string;
  const startDate = formData.get("startDate") as string;
  const startTime = formData.get("startTime") as string;
  const saveAs = formData.get("saveAs") as string;

  if (!campaignName?.trim()) {
    return json({ error: "El nombre de campaña es requerido" }, { status: 400 });
  }

  const buyerProductsData = buyerProductsJson ? JSON.parse(buyerProductsJson) : [];
  const rewardProductsData = rewardProductsJson ? JSON.parse(rewardProductsJson) : [];

  if (buyerProductsData.length === 0) {
    return json(
      { error: "Debes seleccionar los productos que el cliente debe comprar (X)" },
      { status: 400 }
    );
  }
  if (rewardProductsData.length === 0) {
    return json(
      { error: "Debes seleccionar los productos de recompensa (Y)" },
      { status: 400 }
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

    const status = saveAs === "active" ? "ACTIVE" : "DRAFT";

    const campaign = await prisma.campaign.create({
      data: {
        shopId: shop.id,
        name: campaignName,
        type: "BUY_X_GET_Y",
        status: status as any,
        discountLabel: discountLabel || null,
        startDate: startDate && startTime ? new Date(`${startDate}T${startTime}`) : null,
        config: { rewardQuantity, rewardType, rewardValue, applyTo, selectionMethod },
      },
    });

    for (const product of buyerProductsData) {
      const variantIds = product.variants?.map((v: any) => v.id || v) || [];
      await prisma.campaignProduct.create({
        data: {
          campaignId: campaign.id,
          productId: product.id,
          variantIds,
          isExcluded: false,
          role: "buyer",
        },
      });
    }

    for (const product of rewardProductsData) {
      const variantIds = product.variants?.map((v: any) => v.id || v) || [];
      await prisma.campaignProduct.create({
        data: {
          campaignId: campaign.id,
          productId: product.id,
          variantIds,
          isExcluded: false,
          role: "reward",
        },
      });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    return redirect(`/app/campaigns${searchParams ? `?${searchParams}` : ""}`);
  } catch (error) {
    console.error("Error creating BuyXGetY campaign:", error);
    return json({ error: "Error al crear la campaña" }, { status: 500 });
  }
}

interface Product {
  id: string;
  title: string;
  images?: Array<{ originalSrc: string }>;
  variants?: Array<{ id: string }>;
}

function BuyXGetYFormComplete() {
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const [campaignName, setCampaignName] = useState("");
  const [discountLabel, setDiscountLabel] = useState("");
  const [buyerProducts, setBuyerProducts] = useState<Product[]>([]);
  const [rewardProducts, setRewardProducts] = useState<Product[]>([]);
  const [rewardQuantity, setRewardQuantity] = useState("1");
  const [rewardType, setRewardType] = useState("percentage");
  const [rewardValue, setRewardValue] = useState("100");
  const [applyTo, setApplyTo] = useState("highest");
  const [selectionMethod, setSelectionMethod] = useState("popup");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");

  const handleOpenPicker = async (target: "buyer" | "reward") => {
    if (typeof window !== "undefined" && (window as any).shopify) {
      try {
        const selection = await (window as any).shopify.resourcePicker({
          type: "product",
          multiple: true,
        });
        if (selection) {
          if (target === "buyer") setBuyerProducts(selection);
          else setRewardProducts(selection);
        }
      } catch (error) {
        console.error("Error opening picker:", error);
      }
    }
  };

  const handleSubmit = (saveAs: "draft" | "active") => {
    const formData = new FormData();
    formData.append("campaignName", campaignName);
    formData.append("discountLabel", discountLabel);
    formData.append("buyerProducts", JSON.stringify(buyerProducts));
    formData.append("rewardProducts", JSON.stringify(rewardProducts));
    formData.append("rewardQuantity", rewardQuantity);
    formData.append("rewardType", rewardType);
    formData.append("rewardValue", rewardValue);
    formData.append("applyTo", applyTo);
    formData.append("selectionMethod", selectionMethod);
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
            placeholder="ej. Compra 2 lleva 1 gratis"
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
          {buyerProducts.length > 0 && (
            <BlockStack gap="200">
              <Text as="p">{buyerProducts.length} producto(s) seleccionado(s)</Text>
              {buyerProducts.map((p) => (
                <InlineStack key={p.id} gap="300" blockAlign="center">
                  {p.images?.[0] && (
                    <Thumbnail source={p.images[0].originalSrc} alt={p.title} size="small" />
                  )}
                  <Text as="span" variant="bodyMd">{p.title}</Text>
                </InlineStack>
              ))}
            </BlockStack>
          )}
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
          {rewardProducts.length > 0 && (
            <BlockStack gap="200">
              <Text as="p">{rewardProducts.length} producto(s) seleccionado(s)</Text>
              {rewardProducts.map((p) => (
                <InlineStack key={p.id} gap="300" blockAlign="center">
                  {p.images?.[0] && (
                    <Thumbnail source={p.images[0].originalSrc} alt={p.title} size="small" />
                  )}
                  <Text as="span" variant="bodyMd">{p.title}</Text>
                </InlineStack>
              ))}
            </BlockStack>
          )}
          <Banner tone="info">
            Máximo 100 variantes (límite de Shopify).
          </Banner>
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
            helpText="El cliente debe agregar la recompensa a su carrito manualmente."
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

export default function BuyXGetYNew() {
  return (
    <Page
      title="Crear Compra X Lleva Y"
      backAction={{ url: "/app/campaigns" }}
    >
      <Layout>
        <Layout.Section>
          <BuyXGetYFormComplete />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
