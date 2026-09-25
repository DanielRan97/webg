import type { Metadata } from "next";
import { CreateDraftRedirect } from "@/components/wizard/CreateDraftRedirect";

export const metadata: Metadata = { title: "יצירת אתר חדש" };

export default function CreatePage() {
  return <CreateDraftRedirect />;
}
