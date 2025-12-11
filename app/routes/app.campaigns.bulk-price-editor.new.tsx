import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import { Page, Layout } from "@shopify/polaris";
import { authenticate } from "../utils/shopify.server";
import { prisma } from "../utils/db.server";
import { BulkPriceEditorForm } from "../components/campaigns/forms/BulkPriceEditorForm";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const campaignName = formData.get("campaignName") as string;
  const discountType = formData.get("discountType") as string;
  const discountValue = parseFloat(formData.get("discountValue") as string);
  const startDate = formData.get("startDate") as string;
  const startTime = formData.get("startTime") as string;
  
  // Validaciones básicas
  if (!campaignName || !campaignName.trim()) {
    return json({ error: "El nombre de campaña es requerido" }, { status: 400 });
  }
  
  if (discountValue < 0 || discountValue > 100) {
    return json({ error: "El descuento debe estar entre 0 y 100" }, { status: 400 });
  }
  
  try {
    // Buscar o crear Shop
    let shop = await prisma.shop.findUnique({
      where: { shopDomain: session.shop },
    });
    
   if (!shop) {
  shop = await prisma.shop.create({
    data: {
      shopDomain: session.shop,
      accessToken: session.accessToken || "",
      scope: session.scope || "",
    },
  });
}
    
    // Crear campaña
    await prisma.campaign.create({
      data: {
        shopId: shop.id,
        name: campaignName,
        type: "BULK_PRICE_EDITOR",
        status: "DRAFT",
        startDate: startDate && startTime ? new Date(`${startDate}T${startTime}`) : null,
        config: {
          discountType,
          discountValue,
          advancedFeatures: {
            specificPriceEndings: false,
            calculateOnComparePrice: false,
            setHigherComparePrice: false,
          },
        },
      },
    });
    
    return redirect(`/app/campaigns`);
  } catch (error) {
    console.error("Error creating campaign:", error);
    return json({ error: "Error al crear la campaña" }, { status: 500 });
  }
}

export default function BulkPriceEditorNew() {
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const handleSubmit = (data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    submit(formData, { method: "post" });
  };

  return (
    <Page 
      title="Crear editor de precios masivo"
      backAction={{ url: "/app/campaigns" }}
    >
      <Layout>
        <Layout.Section variant="oneThird">
          <BulkPriceEditorForm onSubmit={handleSubmit} error={actionData?.error} />
        </Layout.Section>
        
        <Layout.Section variant="oneThird">
          <div style={{ position: "sticky", top: "20px" }}>
            <p>Preview irá aquí</p>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}