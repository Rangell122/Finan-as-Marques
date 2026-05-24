import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Search, Filter, Sparkles, AlertCircle, ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import importData from "@/data/import.json";

export const Route = createFileRoute("/transacoes")({
  component: Transacoes,
});

function Transacoes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const transactions = importData;

  const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" ? true : t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-4 md:p-8 space-y-6 bg-slate-50/50 min-h-full pb-24"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#0B1120] flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#D4A63A]" />
          Planilha Geral
        </h1>
        <p className="text-slate-500 text-sm">Visualização completa de todas as suas entradas e saídas originais.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou categoria..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0E2C63] transition-all shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#0E2C63] shadow-sm font-semibold text-slate-700"
          >
            <option value="all">Todas as Movimentações</option>
            <option value="income">Apenas Receitas (+)</option>
            <option value="expense">Apenas Despesas (-)</option>
          </select>
        </div>
      </div>

      <Card className="hidden md:block border border-border/80 shadow-sm overflow-hidden bg-white rounded-2xl w-full">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-border">
                <TableHead className="font-bold text-slate-700">Descrição</TableHead>
                <TableHead className="font-bold text-slate-700">Categoria</TableHead>
                <TableHead className="font-bold text-slate-700 whitespace-nowrap">Data</TableHead>
                <TableHead className="font-bold text-slate-700 text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((t, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50 transition-colors border-border/50">
                  <TableCell className="font-semibold text-slate-800 whitespace-nowrap">{t.description}</TableCell>
                  <TableCell className="text-slate-600">
                    <span className="inline-flex px-2 py-1 rounded bg-slate-100 text-xs font-semibold">{t.category}</span>
                  </TableCell>
                  <TableCell className="text-slate-500 whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className={`text-right font-extrabold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500 py-12">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <span>Nenhum registro encontrado.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="md:hidden space-y-3 pb-6">
        {filteredTransactions.map((t, idx) => (
          <Card key={idx} className="border border-border/40 shadow-sm p-4 bg-white rounded-xl break-words whitespace-normal max-w-full overflow-hidden">
            <div className="flex justify-between items-start mb-2 gap-2">
              <div className="space-y-1">
                <div className="font-bold text-[#0B1120] text-base leading-tight">{t.description}</div>
                <div className="text-xs text-slate-500 flex flex-wrap gap-2 items-center pt-1">
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">{t.category}</span>
                </div>
              </div>
              <div className={`p-2 rounded-xl shrink-0 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
              </div>
            </div>
            
            <div className="flex justify-between items-end mt-4 pt-3 border-t border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(t.date).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className={`font-extrabold text-lg ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
              </div>
            </div>
          </Card>
        ))}
        {filteredTransactions.length === 0 && (
          <div className="text-center text-muted-foreground py-12 bg-white rounded-xl border border-border/40">
            Nenhuma transação encontrada.
          </div>
        )}
      </div>
    </motion.div>
  );
}
