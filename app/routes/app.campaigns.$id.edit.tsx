import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { Page, Layout, Banner } from "@shopify/polaris";
import { authenticate } from "../utils/shopify.server";
import { prisma } from "../utils/db.server";
import { BulkPriceEditorForm } from "../components/campaigns/forms/BulkPriceEditorForm";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { id } = params;

  if (!id) {
    throw new Response("Campaign ID required", { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      products: true,
    },
  });

  if (!campaign) {
    throw new Response("Campaign not found", { status: 404 });
  }

  // Convertir para el frontend
  const campaignData = {
    ...campaign,
    totalRevenue: Number(campaign.totalRevenue),
    createdAt: campaign.createdAt.toISOString(),
    startDate: campaign.startDate?.toISOString() || null,
    updatedAt: campaign.updatedAt.toISOString(),
  };

  return json({ campaign: campaignData });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { id } = params;
  const formData = await request.formData();

  if (!id) {
    return json({ error: "Campaign ID required" }, { status: 400 });
  }

  const campaignName = formData.get("campaignName") as string;
  const discountType = formData.get("discountType") as string;
  const discountValue = parseFloat(formData.get("discountValue") as string);
  const applyTo = formData.get("applyTo") as string;
  const selectedProducts = formData.get("selectedProducts") as string;
  const excludeProducts = formData.get("excludeProducts") === "true";
  const startDate = formData.get("startDate") as string;
  const startTime = formData.get("startTime") as string;
  const newStatus = formData.get("status") as string || "DRAFT";

  console.log("=== UPDATE CAMPAIGN ===");
  console.log("Campaign ID:", id);
  console.log("New status:", newStatus);

  if (!campaignName || !campaignName.trim()) {
    return json({ error: "El nombre de campaña es requerido" }, { status: 400 });
  }

  if (discountValue < 0 || discountValue > 100) {
    return json({ error: "El descuento debe estar entre 0 y 100" }, { status: 400 });
  }

try {
  // Actualizar campaña
  await prisma.campaign.update({
    where: { id },
    data: {
      name: campaignName,
      status: newStatus as any, // Cast temporal
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

    // Actualizar productos si cambiaron
    if (selectedProducts) {
      const productsData = JSON.parse(selectedProducts);
      
      // Eliminar productos anteriores
      await prisma.campaignProduct.deleteMany({
        where: { campaignId: id },
      });

      // Agregar nuevos productos
      if (productsData.length > 0) {
        for (const product of productsData) {
          const variantIds = product.variants 
            ? product.variants.map((v: any) => v.id || v) 
            : [];

          await prisma.campaignProduct.create({
            data: {
              campaignId: id,
              productId: product.id,
              variantIds: variantIds,
              isExcluded: excludeProducts,
              role: applyTo,
            },
          });
        }
      }
    }

    console.log("✅ Campaign updated successfully");
    
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    return redirect(`/app/campaigns${searchParams ? `?${searchParams}` : ''}`);

  } catch (error) {
    console.error("❌ Error updating campaign:", error);
    return json({ error: "Error al actualizar la campaña" }, { status: 500 });
  }
}

export default function CampaignEdit() {
  const { campaign } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const handleSubmit = (data: any, status: string) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    formData.append("status", status);
    submit(formData, { method: "post" });
  };

return (
  <Page 
    title={`Editar: ${campaign.name}`}
    backAction={{ url: "/app/campaigns" }}
  >
    <Layout>
      <Layout.Section>
        {actionData?.error && (
          <Banner tone="critical">
            <p>{actionData.error}</p>
          </Banner>
        )}
        <Banner tone="info">
          <p>Editando campaña: {campaign.name}</p>
          <p>Tipo: {campaign.type}</p>
          <p>Estado: {campaign.status}</p>
          <p>Productos: {campaign.products.length}</p>
        </Banner>
        <p>Formulario de edición - En construcción</p>
      </Layout.Section>
    </Layout>
  </Page>
);
}