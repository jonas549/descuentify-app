import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import { Page, Layout } from "@shopify/polaris";
import { authenticate } from "~/utils/shopify.server";
import { prisma } from "~/utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  console.log("=== ACTION START ===");
  console.log("Shop:", session.shop);
  
  const campaignName = formData.get("campaignName") as string;
  const discountType = formData.get("discountType") as string;
  const discountValue = parseFloat(formData.get("discountValue") as string);
  const startDate = formData.get("startDate") as string;
  const startTime = formData.get("startTime") as string;
  
  console.log("Form data:", { campaignName, discountType, discountValue, startDate, startTime });
  
  if (!campaignName || !campaignName.trim()) {
    console.log("ERROR: campaign name required");
    return json({ error: "El nombre de campaña es requerido" }, { status: 400 });
  }
  
  if (discountValue < 0 || discountValue > 100) {
    console.log("ERROR: invalid discount value");
    return json({ error: "El descuento debe estar entre 0 y 100" }, { status: 400 });
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
          advancedFeatures: {
            specificPriceEndings: false,
            calculateOnComparePrice: false,
            setHigherComparePrice: false,
          },
        },
      },
    });
    
    console.log("Campaign created:", campaign.id);
    console.log("=== ACTION END - REDIRECTING ===");
    
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    return redirect(`/app/campaigns${searchParams ? `?${searchParams}` : ''}`);
    
  } catch (error) {
    console.error("ERROR creating campaign:", error);
    return json({ error: "Error al crear la campaña" }, { status: 500 });
  }
}

export default function BulkPriceEditorNew() {
  return (
    <Page 
      title="Crear editor de precios masivo"
      backAction={{ url: "/app/campaigns" }}
    >
      <p>Formulario temporal - en construcción</p>
    </Page>
  );
}