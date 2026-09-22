import type { SiteData } from "@/types/site";
import { getTemplate } from "./registry";

/** The one shared rendering system: public pages, wizard preview and editor preview all use this. */
export function WebsiteRenderer({ template, data }: { template: string; data: SiteData }) {
  const { Component } = getTemplate(template);
  return <Component data={data} />;
}
