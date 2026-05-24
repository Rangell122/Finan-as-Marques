import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tag, Calendar, User, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/tags")({
  component: TagsRoute,
});

const parseMeta = (description: string) => {
  const raw = String(description || "");
  let responsible = "Os dois";
  let cleanDesc = raw;
  let tags: string[] = [];

  let remaining = raw;
  if (remaining.startsWith("[Jack] ")) {
    responsible = "Jack";
    remaining = remaining.replace("[Jack] ", "");
  } else if (remaining.startsWith("[Rangel] ")) {
    responsible = "Rangel";
    remaining = remaining.replace("[Rangel] ", "");
  } else if (remaining.startsWith("[Os dois] ")) {
    responsible = "Os dois";
    remaining = remaining.replace("[Os dois] ", "");
  }

  if (remaining.startsWith("META_JSON:")) {
    try {
      const meta = JSON.parse(remaining.substring(10));
      cleanDesc = meta.desc || "";
      if (meta.tags) tags = meta.tags;
    } catch (e) {
      console.error(e);
    }
  }

  return {
    cleanDesc,
    responsible,
    tags
  };
};

function TagsRoute() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .order("date", { ascending: false });

        if (error) throw error;
        if (data) {
          setTransactions(data);
        }
      } catch (err: any) {
        console.error("Erro em tags:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  // Parse transactions and extract unique tags list
  const parsedTransactions = transactions.map(t => {
    const meta = parseMeta(t.description);
    return {
      ...t,
      cleanDesc: meta.cleanDesc,
      responsible: meta.responsible,
      tags: meta.tags
    };
  });

  const allTagsMap: { [tag: string]: number } = {};
  parsedTransactions.forEach(t => {
    t.tags.forEach(tag => {
      allTagsMap[tag] = (allTagsMap[tag] || 0) + 1;
    });
  });

  const uniqueTags = Object.entries(allTagsMap).map(([name, count]) => ({ name, count }));

  useEffect(() => {
    if (uniqueTags.length > 0 && !selectedTag) {
      setSelectedTag(uniqueTags[0].name);
    }
  }, [uniqueTags, selectedTag]);

  const tagTransactions = parsedTransactions.filter(t => selectedTag && t.tags.includes(selectedTag));

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 space-y-8 bg-background min-h-screen pb-24"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Tag className="w-8 h-8 text-[#1576D0]" />
          Gerenciamento de Tags
        </h1>
        <p className="text-muted-foreground text-sm">
          Visualize e filtre lançamentos financeiros usando as tags customizadas associadas aos lançamentos.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
        {/* Tags list sidebar */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tags Em Uso</h2>
          <div className="flex flex-wrap lg:flex-col gap-2">
            {uniqueTags.map((tag) => (
              <div
                key={tag.name}
                onClick={() => setSelectedTag(tag.name)}
                className={`px-4 py-2.5 border rounded-xl cursor-pointer text-xs font-semibold flex justify-between items-center transition-all ${
                  selectedTag === tag.name
                    ? "bg-primary text-white border-transparent shadow-sm"
                    : "bg-white dark:bg-card border-border text-slate-655 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span>#{tag.name}</span>
                <Badge className={selectedTag === tag.name ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}>
                  {tag.count}
                </Badge>
              </div>
            ))}
            {uniqueTags.length === 0 && (
              <div className="text-slate-400 text-xs py-4">Nenhuma tag cadastrada nas transações.</div>
            )}
          </div>
        </div>

        {/* Tag transactions */}
        <div className="lg:col-span-3">
          <Card className="p-6 border border-border/80 bg-white dark:bg-card rounded-2xl">
            <h2 className="text-base font-bold text-foreground mb-4">
              Lançamentos com #{selectedTag}
            </h2>
            <div className="overflow-x-auto w-full">
              <Table>
                <TableBody>
                  {tagTransactions.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 border-none transition-colors">
                      <TableCell className="pl-0 py-3 text-xs text-muted-foreground font-semibold">
                        {new Date(item.date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-semibold text-sm text-foreground">{item.cleanDesc}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                          <span>{item.category}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[9px] font-bold">
                            {item.responsible}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right py-3 pr-0 font-extrabold text-sm ${item.type === "income" ? "text-emerald-650" : "text-rose-655"}`}>
                        {item.type === "income" ? "+" : "-"} {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {tagTransactions.length === 0 && (
                    <TableRow>
                      <TableCell className="text-center py-12 text-slate-400 dark:text-slate-500">
                        Nenhum lançamento com esta tag.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
