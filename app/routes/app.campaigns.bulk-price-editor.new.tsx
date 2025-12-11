import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useSubmit, useLoaderData } from "@remix-run/react";
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
  ResourceList,
  ResourceItem,
  Thumbnail
} from "@shopify/polaris";
import { authenticate } from "~/utils/shopify.server";
import { prisma } from "~/utils/db.server";
import { useState, useCallback } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  return json({
    shop: session.shop,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  console.log("=== ACTION START ===");
  console.log("Shop:", session.shop);
  
  const campaignName = formData.get("campaignName") as string;
  const discountType = formData.get("discountType") as string;
  const discountValue = parseFloat(formData.get("discountValue") as string);
  const applyTo = formData.get("applyTo") as string;
  const selectedProducts = formData.get("selectedProducts") as string;
  const excludeProducts = formData.get("excludeProducts") === "true";
  const startDate = formData.get("startDate") as string;
  const startTime = formData.get("startTime") as string;
  
  console.log("Form data:", { 
    campaignName, 
    discountType, 
    discountValue, 
    applyTo,
    selectedProducts,
    excludeProducts,
    startDate, 
    startTime 
  });
  
  if (!campaignName || !campaignName.trim()) {
    console.log("ERROR: campaign name required");
    return json({ error: "El nombre de campaña es requerido" }, { status: 400 });
  }
  
  if (discountValue < 0 || discountValue > 100) {
    console.log("ERROR: invalid discount value");
    return json({ error: "El descuento debe estar entre 0 y 100" }, { status: 400 });
  }

  if (applyTo !== "all_store" && !selectedProducts) {
    console.log("ERROR: no products selected");
    return json({ error: "Debes seleccionar al menos un producto, variante o colección" }, { status: 400 });
  }
  
  try {
    let shop = await prisma.shop.findUnique({
      where: { shopDomain: session.shop },
    });
    
    console.log("Shop found:", shop?.id || "Creating new...");
    
    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          shopDomain: session.shop,
          accessToken: session.accessToken || "",
          scope: session.scope || "",
        },
      });
      console.log("Shop created:", shop.id);
    }
    
    const productsData = selectedProducts ? JSON.parse(selectedProducts) : [];
    
    const campaign = await prisma.campaign.create({
      data: {
        shopId: shop.id,
        name: campaignName,
        type: "BULK_PRICE_EDITOR",
        status: "DRAFT",
        startDate: startDate && startTime ? new Date(`${startDate}T${startTime}`) : null,
        config: {
          discountType,
          discountValue,
          applyTo,
          excludeProducts,
          advancedFeatures: {
            specificPriceEndings: false,
            calculateOnComparePrice: false,
            setHigherComparePrice: false,
          },
        },
      },
    });
    
    console.log("Campaign created:", campaign.id);

    if (productsData.length > 0) {
      for (const product of productsData) {
        await prisma.campaignProduct.create({
          data: {
            campaignId: campaign.id,
            productId: product.id,
            variantIds: product.variants || [],
            isExcluded: excludeProducts,
            role: product.type || "product",
          },
        });
      }
      console.log(`Saved ${productsData.length} products to campaign`);
    }
    
    console.log("=== ACTION END - REDIRECTING ===");
    
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    return redirect(`/app/campaigns${searchParams ? `?${searchParams}` : ''}`);
    
  } catch (error) {
    console.error("ERROR creating campaign:", error);
    return json({ error: "Error al crear la campaña" }, { status: 500 });
  }
}

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
  const [applyTo, setApplyTo] = useState("products_variants");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [excludeProducts, setExcludeProducts] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");

  const handleOpenPicker = useCallback(async () => {
    let resourceType: "product" | "collection" | "productvariant" = "product";
    
    if (applyTo === "collections") {
      resourceType = "collection";
    } else if (applyTo === "products_variants") {
      resourceType = "productvariant";
    }

    if (typeof window !== "undefined" && (window as any).shopify) {
      const selection = await (window as any).shopify.resourcePicker({
        type: resourceType,
        multiple: true,
      });

      if (selection) {
        setSelectedProducts(selection);
      }
    }
  }, [applyTo]);

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("campaignName", campaignName);
    formData.append("discountType", discountType);
    formData.append("discountValue", discountValue);
    formData.append("applyTo", applyTo);
    formData.append("selectedProducts", JSON.stringify(selectedProducts));
    formData.append("excludeProducts", excludeProducts.toString());
    formData.append("startDate", startDate);
    formData.append("startTime", startTime);
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
            placeholder="ej. 20% off"
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
              { label: "Productos y variantes específicos", value: "products_variants" },
              { label: "Colecciones", value: "collections" },
              { label: "Toda la tienda", value: "all_store" },
              { label: "Productos con tags específicos", value: "tags" },
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
      {selectedProducts.length} {applyTo === "collections" ? "colección(es)" : "producto(s)"} seleccionado(s)
    </Text>
    <Card>
      <BlockStack gap="200">
        {selectedProducts.map((item) => (
          <InlineStack key={item.id} gap="300" blockAlign="center">
            {item.images?.[0] && (
              <Thumbnail source={item.images[0].originalSrc} alt={item.title} size="small" />
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
          <Button variant="primary" onClick={handleSubmit}>
            Guardar campaña
          </Button>
        </InlineStack>
      </Card>
    </BlockStack>
  );
}

export default function BulkPriceEditorNew() {
  return (
    <Page 
      title="Crear editor de precios masivo"
      backAction={{ url: "/app/campaigns" }}
    >
      <Layout>
        <Layout.Section>
          <BulkPriceEditorFormComplete />
        </Layout.Section>
      </Layout>
    </Page>
  );
}