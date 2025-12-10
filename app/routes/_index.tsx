import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  
  // Redirigir de / a /app preservando query params
  return redirect(`/app${searchParams ? `?${searchParams}` : ''}`);
}