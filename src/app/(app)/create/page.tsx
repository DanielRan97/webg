import type { Metadata } from "next";
import { SiteForm } from "@/components/wizard/SiteForm";
import { emptySiteData } from "@/lib/site-defaults";

export const metadata: Metadata = { title: "יצירת אתר חדש" };

export default function CreatePage() {
  return <SiteForm initial={emptySiteData()} />;
}
