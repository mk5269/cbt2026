import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/AuthScreen";
import { LoginForm } from "@/components/LoginForm";
import { ensureAdmin, getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  await ensureAdmin();
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <AuthScreen title="로그인" description="아이디와 비밀번호만 입력하면 됩니다.">
      <LoginForm />
    </AuthScreen>
  );
}
