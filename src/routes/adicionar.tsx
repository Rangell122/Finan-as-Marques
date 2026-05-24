import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/adicionar")({
  component: Adicionar,
});

function Adicionar() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 md:p-8 space-y-6 bg-background min-h-screen pb-24 flex flex-col items-center justify-center"
    >
      <div className="text-center space-y-4 mb-8">
        <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
          <Plus className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Adicionar Lançamento</h1>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">
          Registre uma nova entrada ou saída no seu caixa.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/80 w-full max-w-md flex flex-col items-center">
        <AddTransactionDialog onAdd={() => navigate({ to: "/" })} />
        <p className="text-xs text-slate-400 mt-6 text-center">
          Clique no botão acima para abrir o formulário ou use a Inteligência Artificial na tela
          inicial.
        </p>
      </div>
    </motion.div>
  );
}
