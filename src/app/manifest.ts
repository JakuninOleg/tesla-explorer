import type { MetadataRoute } from "next";
import { getWebManifest } from "@/lib/pwa-manifest";

export default function manifest(): MetadataRoute.Manifest {
  return getWebManifest();
}
