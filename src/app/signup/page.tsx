import { SignupForm } from "@/components/SignupForm";
import { safeNext } from "@/lib/redirect";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <SignupForm next={next ? safeNext(next) : undefined} />;
}
