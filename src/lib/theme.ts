import { cookies } from "next/headers";

/** Cookie-backed theme. Default dark (vehicle UI). */
export async function getServerTheme(): Promise<"light" | "dark"> {
  const cookieStore = await cookies();
  return cookieStore.get("theme")?.value === "light" ? "light" : "dark";
}
