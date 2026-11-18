import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/AuthScreen";
import { SignupForm } from "@/components/SignupForm";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <AuthScreen
      title="회원가입"
      description="아이디, 비밀번호, 이름을 등록합니다. 닉네임은 들어간 뒤에 따로 정할 수 있습니다."
    >
      <SignupForm />
    </AuthScreen>
  );
}
