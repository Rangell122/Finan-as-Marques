import { createFileRoute } from "@tanstack/react-router";
import { FolderOpen, Plus, Tag, HelpCircle, Utensils, Home, Zap, Heart, Car, Brain, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/categorias")({
  component: CategoriasRoute,
});

function CategoriasRoute() {
  const categoriesList = [
    {
      name: "Rendas (Receitas)",
      icon: Utensils,
      subcategories: ["Salário", "PIX Recebido", "Freelance", "Investimentos", "Outros"]
    },
    {
      name: "Casa & Moradia",
      icon: Home,
      subcategories: ["Água", "Luz", "Internet", "Mercado / Compras"]
    },
    {
      name: "Transporte & Moto",
      icon: Car,
      subcategories: ["Gasolina", "Peças / Manutenção"]
    },
    {
      name: "Tecnologia & IA",
      icon: Brain,
      subcategories: ["Ferramentas (ChatGPT, Gemini...)", "Assinaturas"]
    },
    {
      name: "Bancos & Cartões",
      icon: Smartphone,
      subcategories: ["Nubank", "Inter", "Outro Cartão", "PIX Enviado"]
    },
    {
      name: "Outros Custos",
      icon: HelpCircle,
      subcategories: ["Outros Gastos"]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 space-y-8 bg-background min-h-screen pb-24"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FolderOpen className="w-8 h-8 text-[#1576D0]" />
          Categorias & Subcategorias
        </h1>
        <p className="text-muted-foreground text-sm">
          Gerencie e organize as categorias hierárquicas e rótulos usados na classificação de suas finanças.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {categoriesList.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <Card key={idx} className="p-6 border border-border/80 bg-white dark:bg-card rounded-2xl space-y-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 text-[#1576D0] rounded-xl">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">{cat.name}</h3>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                {cat.subcategories.map((sub, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}
