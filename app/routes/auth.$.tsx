import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../utils/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  
  return null;
}