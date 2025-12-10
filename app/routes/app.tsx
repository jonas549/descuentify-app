import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../utils/shopify.server";
import { AppLayout } from "../components/layout/AppLayout";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  return json({});
}

export default function AppLayoutRoute() {
  return <AppLayout />;
}