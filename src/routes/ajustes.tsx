import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { SlidersHorizontal, LogOut, Trash2, DownloadCloud } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import importData from "@/data/import.json";

export const Route = createFileRoute("/ajustes")({
  component: Ajustes,
});

function Ajustes() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleWipe = async () => {
    if (
      confirm(
        "Tem certeza que deseja apagar TODOS os dados e zerar a plataforma? Essa ação não pode ser desfeita.",
      )
    ) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("transactions").delete().eq("user_id", user.id);
        alert("Plataforma zerada com sucesso!");
        window.location.reload();
      }
    }
  };

  const handleImport = async () => {
    if (confirm("Deseja forçar a importação da planilha Google Sheets agora?")) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        alert("Iniciando importação! Por favor, não feche a página.");
        let successCount = 0;
        for (let i = 0; i < importData.length; i++) {
          const t = importData[i];
          const { error } = await supabase.from("transactions").insert({
            user_id: user.id,
            type: t.type,
            description: t.description,
            amount: t.amount,
            date: t.date,
            category: t.category,
            status: t.status,
          });
          if (!error) successCount++;
        }
        alert(`Importação concluída! ${successCount} lançamentos inseridos com sucesso.`);
        window.location.reload();
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 space-y-6 bg-background min-h-screen pb-24"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#0B1120] flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-[#D4A63A]" />
          Ajustes
        </h1>
        <p className="text-slate-500 text-sm">Gerencie sua conta e sincronização.</p>
      </div>

      <Card className="p-2 border border-border/80 shadow-sm bg-white rounded-2xl overflow-hidden divide-y divide-slate-100">
        <button
          onClick={handleImport}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-800">Forçar Importação Google Sheets</div>
              <div className="text-xs text-slate-500">
                Puxa os dados manualmente se houver falha.
              </div>
            </div>
          </div>
        </button>
        <button
          onClick={handleWipe}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-800">Zerar Plataforma</div>
              <div className="text-xs text-slate-500">Apaga todas as transações atuais.</div>
            </div>
          </div>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-red-600">Sair da Conta</div>
              <div className="text-xs text-red-400">Desconectar do aplicativo.</div>
            </div>
          </div>
        </button>
      </Card>
    </motion.div>
  );
}
