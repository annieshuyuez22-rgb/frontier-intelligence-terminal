import { LoadingSkeleton } from "@/components/ui";
import { getLanguage } from "@/components/language-server";

export default async function Loading() {
  return <LoadingSkeleton language={await getLanguage()} />;
}
