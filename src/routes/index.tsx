import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Coins, Home, CreditCard, ShoppingBag, Calendar, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import importData from "@/data/import.json";

export const Route = createFileRoute("/")({
  component: Index,
});

const MONTHS = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

function formatCurrency(val: number) {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function SummaryCard({ title, value, icon: Icon, color, bgClass }: { title: string; value: string; icon: any; color: string; bgClass: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-300 border border-border bg-white overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-slate-500">{title}</CardTitle>
        <div className={`p-2 rounded-xl ${bgClass}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#0B1120] truncate">{value}</div>
      </CardContent>
    </Card>
  );
}

function SectionList({ title, items, icon: Icon, colorClass, total }: { title: string; items: any[]; icon: any; colorClass: string; total: number }) {
  return (
    <Card className="border border-border/80 shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col">
      <div className={`p-4 border-b border-border/50 flex items-center justify-between bg-slate-50`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${colorClass}`} />
          <h3 className="font-bold text-slate-800">{title}</h3>
        </div>
        <span className={`font-bold ${colorClass}`}>{formatCurrency(total)}</span>
      </div>
      <div className="p-0 flex-1 overflow-y-auto max-h-[300px]">
        {items.length === 0 ? (
          <div className="p-4 text-sm text-slate-400 text-center">Nenhum registro no mês.</div>
        ) : (
          <div className="divide-y divide-border/40">
            {items.map((item, idx) => (
              <div key={idx} className="p-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <span className="text-sm font-semibold text-slate-700 truncate pr-4">{item.description}</span>
                <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function Index() {
  const currentMonthIndex = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIndex);

  // O JSON usa datas como '2026-01-10', '2026-02-10', etc.
  const monthString = `2026-${String(selectedMonth + 1).padStart(2, '0')}-10`;
  const monthData = importData.filter(t => t.date === monthString);

  // Agrupamentos baseados na estrutura original da planilha
  const receitas = monthData.filter(t => t.type === 'income');
  const casa = monthData.filter(t => t.type === 'expense' && t.category.includes('Casa') || t.category.includes('Moto') || t.description.toLowerCase().includes('mei') || t.description.toLowerCase().includes('academia'));
  const cartao = monthData.filter(t => t.type === 'expense' && (t.category.includes('Cartão') || t.description.toLowerCase().includes('empréstimo') || t.description.toLowerCase().includes('divida')));
  const gastos = monthData.filter(t => t.type === 'expense' && !casa.includes(t) && !cartao.includes(t));

  const totalReceitas = receitas.reduce((acc, curr) => acc + curr.amount, 0);
  const totalCasa = casa.reduce((acc, curr) => acc + curr.amount, 0);
  const totalCartao = cartao.reduce((acc, curr) => acc + curr.amount, 0);
  const totalGastos = gastos.reduce((acc, curr) => acc + curr.amount, 0);
  const totalDespesas = totalCasa + totalCartao + totalGastos;
  const saldoFinal = totalReceitas - totalDespesas;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-4 md:p-8 space-y-6 bg-slate-50/50 min-h-full pb-24"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#0B1120] flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#D4A63A]" />
          Visão Geral
        </h1>
        <p className="text-slate-500 text-sm">Todos os dados sincronizados diretamente da sua planilha original.</p>
      </div>

      {/* Seletor de Mês (Scroll horizontal nativo) */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none w-full snap-x">
        {MONTHS.map((m, idx) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(idx)}
            className={`snap-center shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              selectedMonth === idx 
                ? "bg-[#0E2C63] text-white" 
                : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Cartões Principais */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Saldo do Mês" 
          value={formatCurrency(saldoFinal)} 
          icon={Coins} 
          color={saldoFinal >= 0 ? "text-emerald-600" : "text-rose-600"} 
          bgClass={saldoFinal >= 0 ? "bg-emerald-100" : "bg-rose-100"}
        />
        <SummaryCard 
          title="Receitas" 
          value={formatCurrency(totalReceitas)} 
          icon={ArrowUpRight} 
          color="text-emerald-600" 
          bgClass="bg-emerald-100"
        />
        <SummaryCard 
          title="Despesas" 
          value={formatCurrency(totalDespesas)} 
          icon={ArrowDownLeft} 
          color="text-rose-600" 
          bgClass="bg-rose-100"
        />
        <SummaryCard 
          title="Cartões e Emprést." 
          value={formatCurrency(totalCartao)} 
          icon={CreditCard} 
          color="text-amber-600" 
          bgClass="bg-amber-100"
        />
      </div>

      {/* Listas Detalhadas */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-start">
        <SectionList 
          title="Receitas" 
          items={receitas} 
          icon={ArrowUpRight} 
          colorClass="text-emerald-600" 
          total={totalReceitas} 
        />
        <SectionList 
          title="Casa (Fixo)" 
          items={casa} 
          icon={Home} 
          colorClass="text-blue-600" 
          total={totalCasa} 
        />
        <SectionList 
          title="Cartões / Dívidas" 
          items={cartao} 
          icon={CreditCard} 
          colorClass="text-amber-600" 
          total={totalCartao} 
        />
        <SectionList 
          title="Gastos (Variável)" 
          items={gastos} 
          icon={ShoppingBag} 
          colorClass="text-rose-600" 
          total={totalGastos} 
        />
      </div>
    </motion.div>
  );
}

