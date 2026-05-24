import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Globe, Laptop, LineChart } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/planos")({
  component: PlanosRoute,
});

function PlanosRoute() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  const benefits = [
    { text: "Sincronização automática em nuvem", icon: Globe },
    { text: "Suporte a múltiplos dispositivos simultâneos", icon: Laptop },
    { text: "Relatórios de análise avançados", icon: LineChart },
    { text: "Backup diário automatizado de segurança", icon: Check },
    { text: "Suporte prioritário e personalizado", icon: Check }
  ];

  const price = billing === "yearly" ? 14.90 : 19.90;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 space-y-8 bg-background min-h-screen pb-24"
    >
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex justify-center items-center gap-2">
          <Sparkles className="w-8 h-8 text-[#1576D0] drop-shadow-[0_0_8px_rgba(21,118,208,0.4)]" />
          Planos e Preços
        </h1>
        <p className="text-muted-foreground text-sm">
          Desbloqueie o plano <strong className="text-[#1576D0] font-bold">Sync</strong> e aproveite a sincronização em nuvem de ponta a ponta e relatórios avançados.
        </p>
      </div>

      {/* Switcher billing */}
      <div className="flex justify-center">
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              billing === "monthly"
                ? "bg-white dark:bg-card text-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              billing === "yearly"
                ? "bg-white dark:bg-card text-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Anual
            <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[8px] font-extrabold uppercase rounded-full">
              -25%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Card */}
      <div className="max-w-md mx-auto">
        <Card className="border border-primary/30 dark:border-primary/20 shadow-xl bg-white dark:bg-card rounded-3xl overflow-hidden relative">
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -z-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -z-10" />

          <div className="p-6 text-center border-b border-border/50">
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/20 text-[#1576D0] text-[10px] font-extrabold uppercase rounded-full tracking-wider">
              Plano Sync
            </span>
            <div className="mt-6 flex justify-center items-baseline gap-1">
              <span className="text-sm font-semibold text-muted-foreground">R$</span>
              <span className="text-4xl font-extrabold text-foreground">{price.toFixed(2).replace(".", ",")}</span>
              <span className="text-xs text-muted-foreground font-semibold">/ mês</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              {billing === "yearly" ? "Cobrado anualmente (R$ 178,80)" : "Cobrado mensalmente"}
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="p-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-lg flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{benefit.text}</span>
                  </div>
                );
              })}
            </div>

            <Button className="w-full bg-primary hover:bg-primary/95 text-white font-extrabold h-11 rounded-xl shadow-lg shadow-primary/25 mt-4 select-none">
              Assinar Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
