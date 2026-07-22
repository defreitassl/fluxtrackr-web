import { ChartNoAxesCombined } from "lucide-react";
import { redirect } from "next/navigation";

import { AuthScreen } from "@/features/auth/auth-screen";
import { getSessionIdentity } from "@/lib/session";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getSessionIdentity()) {
    redirect("/dashboard");
  }

  return (
    <main className="agx-page">
      <section className="agx-hero" aria-label="Sobre o FluxTrackr">
        <div className="agx-brand">
          <span className="agx-brand-mark" aria-hidden="true">
            <ChartNoAxesCombined size={22} strokeWidth={2.4} />
          </span>
          <div>
            <strong>FluxTrackr</strong>
            <span>Gestão financeira pessoal</span>
          </div>
        </div>

        <div className="agx-hero-copy">
          <small>Seu dinheiro, em perspectiva</small>
          <h1>
            Clareza para o presente.
            <br />
            Calma para o próximo passo.
          </h1>
          <p>
            Acompanhe o que aconteceu e o que está por vir sem transformar sua rotina em uma
            planilha.
          </p>
          <div className="agx-hero-mini">
            <div>
              <span>Visão do dia a dia</span>
              <strong>Disponível para gastar</strong>
            </div>
            <div>
              <span>Próximos 30 dias</span>
              <strong>Projeção de saldo</strong>
            </div>
            <div>
              <span>Cartões e faturas</span>
              <strong>Comprometido visível</strong>
            </div>
            <div>
              <span>Orçamentos</span>
              <strong>Avisos sem bloqueio</strong>
            </div>
          </div>
        </div>

        <p className="agx-hero-footnote">Dados financeiros consolidados pela API do FluxTrackr.</p>
      </section>

      <section className="agx-panel" aria-label="Acesso da conta">
        <div className="agx-card">
          <AuthScreen />
          <p className="agx-footer">
            Contas lembradas neste dispositivo guardam apenas nome e e-mail — nunca a sua senha.
          </p>
        </div>
      </section>
    </main>
  );
}
