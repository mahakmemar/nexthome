import { LoginForm } from "@/components/LoginForm";
import { safeNext } from "@/lib/redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginForm next={next ? safeNext(next) : undefined} />;
}
