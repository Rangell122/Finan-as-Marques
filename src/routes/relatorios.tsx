import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { LineChart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/relatorios")({
  component: Relatorios,
});

function Relatorios() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 space-y-6 bg-background min-h-screen pb-24"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#0B1120] flex items-center gap-2">
          <LineChart className="w-6 h-6 text-[#D4A63A]" />
          Relatórios
        </h1>
        <p className="text-slate-500 text-sm">Acompanhe a evolução do seu patrimônio.</p>
      </div>

      <Card className="p-6 border border-border/80 shadow-sm bg-white rounded-2xl flex flex-col items-center justify-center text-center space-y-4 py-20">
        <div className="p-4 bg-slate-50 rounded-full">
          <Sparkles className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Em Desenvolvimento</h2>
        <p className="text-slate-500 max-w-xs">
          Esta tela de relatórios completos estará disponível nas próximas atualizações.
        </p>
        <button
          onClick={() => window.print()}
          className="mt-4 bg-[#0E2C63] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#071A3D] transition-colors"
        >
          Exportar Resumo Atual em PDF
        </button>
      </Card>
    </motion.div>
  );
}
