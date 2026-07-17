import { ChartNoAxesCombined } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/login-form";
import { getSessionIdentity } from "@/lib/session";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getSessionIdentity()) {
    redirect("/dashboard");
  }

  return (
    <main className="login-page">
      <section className="login-intro" aria-label="Sobre o FluxTrackr">
        <div className="brand-lockup login-brand">
          <span className="brand-mark" aria-hidden="true">
            <ChartNoAxesCombined size={20} strokeWidth={2.4} />
          </span>
          <span>FluxTrackr</span>
        </div>
        <div>
          <p className="page-eyebrow">Seu dinheiro, em perspectiva</p>
          <h1>Clareza para o presente.<br />Calma para o próximo passo.</h1>
          <p>
            Acompanhe o que aconteceu e o que está por vir sem transformar sua
            rotina em uma planilha.
          </p>
        </div>
        <p className="login-footnote">Dados financeiros são consolidados pela API do FluxTrackr.</p>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-heading">
          <p className="page-eyebrow">Acesso privado</p>
          <h2 id="login-title">Bem-vindo de volta</h2>
          <p>Entre com suas credenciais para continuar.</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
