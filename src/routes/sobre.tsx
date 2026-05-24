import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Sparkles, Code, Heart, Shield } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/sobre")({
  component: SobreRoute,
});

function SobreRoute() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 space-y-8 bg-background min-h-screen pb-24"
    >
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex justify-center items-center gap-2">
          <Info className="w-8 h-8 text-[#1576D0]" />
          Sobre a Plataforma
        </h1>
        <p className="text-muted-foreground text-sm">
          Conheça os pilares de desenvolvimento, tecnologias utilizadas e o propósito por trás do Finanças Marques.
        </p>
      </div>

      <div className="max-w-3xl mx-auto grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="p-6 border border-border bg-white dark:bg-card rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-foreground">Design Premium</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Layout projetado utilizando o conceito de split-screen visual com transições suaves e design responsivo, oferecendo legibilidade e foco no conteúdo tanto no modo claro (fundo branco predominante) quanto no escuro (tons de azul marinho profundo).
          </p>
        </Card>

        <Card className="p-6 border border-border bg-white dark:bg-card rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-sm text-foreground">Stack de Tecnologia</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Desenvolvido sobre React, Vite e Tailwind CSS v4 para o frontend rápido e sem travamentos. Rotas estáticas compiladas com TanStack Router para transições visuais instantâneas e bancos de dados gerenciados via Supabase Cloud.
          </p>
        </Card>

        <Card className="p-6 border border-border bg-white dark:bg-card rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-sm text-foreground">Segurança & Privacidade</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Toda a autenticação é criptografada e controlada de forma segura pelo provedor de identidade do Supabase, garantindo que suas informações de despesas e receitas permaneçam privadas e protegidas.
          </p>
        </Card>

        <Card className="p-6 border border-border bg-white dark:bg-card rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-sm text-foreground">Desenvolvimento Familiar</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Criado como um painel exclusivo focado no gerenciamento econômico da família Marques, automatizando os balanços mensais, amortização de dívidas e ajudando no controle e conquista da liberdade financeira.
          </p>
        </Card>
      </div>
    </motion.div>
  );
}
