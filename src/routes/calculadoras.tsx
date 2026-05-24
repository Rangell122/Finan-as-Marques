import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Calculator, 
  TrendingUp, 
  ShieldCheck, 
  Coins, 
  BarChart3, 
  ArrowRight,
  Info
} from "lucide-react";

export const Route = createFileRoute("/calculadoras")({
  component: Calculadoras,
});

function Calculadoras() {
  const [activeTab, setActiveTab] = useState<"juros" | "reserva" | "passiva" | "cdi">("juros");

  // State for Juros Compostos
  const [jurosValInicial, setJurosValInicial] = useState("1000");
  const [jurosAporte, setJurosAporte] = useState("200");
  const [jurosTaxa, setJurosTaxa] = useState("10"); // % ao ano
  const [jurosPrazo, setJurosPrazo] = useState("10"); // anos
  const [jurosResult, setJurosResult] = useState<any | null>(null);

  // State for Reserva de Emergência
  const [reservaCusto, setReservaCusto] = useState("3000");
  const [reservaMeses, setReservaMeses] = useState("6");
  const [reservaResult, setReservaResult] = useState<any | null>(null);

  // State for Renda Passiva
  const [passivaDesejada, setPassivaDesejada] = useState("5000");
  const [passivaTaxa, setPassivaTaxa] = useState("8"); // % ao ano
  const [passivaResult, setPassivaResult] = useState<any | null>(null);

  // State for CDI vs Poupança
  const [cdiValor, setCdiValor] = useState("10000");
  const [cdiTaxa, setCdiTaxa] = useState("10.75"); // % ao ano (Selic/CDI atual)
  const [cdiPrazo, setCdiPrazo] = useState("12"); // meses
  const [cdiResult, setCdiResult] = useState<any | null>(null);

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Calculadora Juros Compostos
  const calcularJuros = (e: React.FormEvent) => {
    e.preventDefault();
    const V_ini = parseFloat(jurosValInicial) || 0;
    const PMT = parseFloat(jurosAporte) || 0;
    const taxaAnual = (parseFloat(jurosTaxa) || 0) / 100;
    const taxaMensal = Math.pow(1 + taxaAnual, 1 / 12) - 1;
    const anos = parseFloat(jurosPrazo) || 0;
    const meses = Math.round(anos * 12);

    let total = V_ini;
    let totalInvestido = V_ini;

    for (let i = 0; i < meses; i++) {
      total = total * (1 + taxaMensal) + PMT;
      totalInvestido += PMT;
    }

    const rendimentoJuros = total - totalInvestido;

    setJurosResult({
      totalInvestido,
      rendimentoJuros,
      totalFinal: total
    });
  };

  // Calculadora Reserva de Emergência
  const calcularReserva = (e: React.FormEvent) => {
    e.preventDefault();
    const custo = parseFloat(reservaCusto) || 0;
    const meses = parseInt(reservaMeses, 10) || 1;

    const meta = custo * meses;
    
    // Sugestão de tempo de acúmulo guardando 10%, 20% ou 30% do custo
    setReservaResult({
      meta,
      guardando10: meta / (custo * 0.1),
      guardando20: meta / (custo * 0.2),
      guardando30: meta / (custo * 0.3),
    });
  };

  // Calculadora Renda Passiva
  const calcularRendaPassiva = (e: React.FormEvent) => {
    e.preventDefault();
    const rendaDesejada = parseFloat(passivaDesejada) || 0;
    const taxaAnual = (parseFloat(passivaTaxa) || 0) / 100;
    const taxaMensal = taxaAnual / 12;

    const patrimonioNecessario = rendaDesejada / taxaMensal;

    setPassivaResult({
      patrimonioNecessario,
      rendaDesejada,
      taxaAnual
    });
  };

  // Calculadora CDI vs Poupança
  const calcularCDI = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(cdiValor) || 0;
    const cdiAnual = (parseFloat(cdiTaxa) || 0) / 100;
    const meses = parseInt(cdiPrazo, 10) || 12;

    // CDI renderiza ~100% da Selic.
    // Poupança rende TR + 0.5% ao mês (se Selic > 8.5% rende 0.5% ao mês + TR, aprox 6.17% + TR)
    const taxaMensalCDI = Math.pow(1 + cdiAnual, 1 / 12) - 1;
    const taxaMensalPoupanca = 0.005; // ~6.17% ao ano aproximado

    const finalCDI = principal * Math.pow(1 + taxaMensalCDI, meses);
    const finalPoupanca = principal * Math.pow(1 + taxaMensalPoupanca, meses);

    // Imposto de Renda sobre rendimentos do CDI
    // Até 180 dias: 22.5% | 181-360: 20% | 361-720: 17.5% | >720: 15%
    let aliquotaIR = 0.15;
    const dias = meses * 30;
    if (dias <= 180) aliquotaIR = 0.225;
    else if (dias <= 360) aliquotaIR = 0.20;
    else if (dias <= 720) aliquotaIR = 0.175;

    const rendimentoBrutoCDI = finalCDI - principal;
    const impostoDevido = rendimentoBrutoCDI * aliquotaIR;
    const finalCDILiquido = finalCDI - impostoDevido;

    setCdiResult({
      brutoCDI: finalCDI,
      liquidoCDI: finalCDILiquido,
      poupanca: finalPoupanca,
      ganhoCDI: finalCDILiquido - principal,
      ganhoPoupanca: finalPoupanca - principal,
      impostoIR: impostoDevido,
      diferenca: finalCDILiquido - finalPoupanca
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 space-y-6 bg-background min-h-screen pb-24"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Calculator className="w-8 h-8 text-[#1576D0]" />
          Calculadoras Financeiras
        </h1>
        <p className="text-muted-foreground text-sm">
          Simule seus investimentos, renda passiva e planeje sua reserva.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("juros")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            activeTab === "juros"
              ? "bg-[#1576D0] text-white shadow-sm"
              : "bg-white dark:bg-card border border-border text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Juros Compostos
        </button>
        <button
          onClick={() => setActiveTab("reserva")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            activeTab === "reserva"
              ? "bg-[#1576D0] text-white shadow-sm"
              : "bg-white dark:bg-card border border-border text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Reserva de Emergência
        </button>
        <button
          onClick={() => setActiveTab("passiva")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            activeTab === "passiva"
              ? "bg-[#1576D0] text-white shadow-sm"
              : "bg-white dark:bg-card border border-border text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <Coins className="w-4 h-4" />
          Renda Passiva
        </button>
        <button
          onClick={() => setActiveTab("cdi")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            activeTab === "cdi"
              ? "bg-[#1576D0] text-white shadow-sm"
              : "bg-white dark:bg-card border border-border text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          CDI vs Poupança
        </button>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Input Form Column */}
        <Card className="lg:col-span-1 p-6 bg-white dark:bg-card border border-border shadow-sm rounded-2xl">
          {activeTab === "juros" && (
            <form onSubmit={calcularJuros} className="space-y-4">
              <h3 className="font-bold text-lg text-foreground mb-4">Simulação de Crescimento</h3>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Valor Inicial (R$)</Label>
                <Input
                  type="number"
                  required
                  value={jurosValInicial}
                  onChange={(e) => setJurosValInicial(e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Aporte Mensal (R$)</Label>
                <Input
                  type="number"
                  required
                  value={jurosAporte}
                  onChange={(e) => setJurosAporte(e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Taxa de Juros (% ao ano)</Label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={jurosTaxa}
                  onChange={(e) => setJurosTaxa(e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Prazo / Duração (Anos)</Label>
                <Input
                  type="number"
                  required
                  value={jurosPrazo}
                  onChange={(e) => setJurosPrazo(e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl"
                />
              </div>
              <Button type="submit" className="w-full bg-[#1576D0] hover:bg-[#0d5ca5] text-white rounded-xl h-11 font-bold select-none shadow">
                Calcular
              </Button>
            </form>
          )}

          {activeTab === "reserva" && (
            <form onSubmit={calcularReserva} className="space-y-4">
              <h3 className="font-bold text-lg text-foreground mb-4">Meta de Proteção</h3>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Custo de Vida Mensal (R$)</Label>
                <Input
                  type="number"
                  required
                  value={reservaCusto}
                  onChange={(e) => setReservaCusto(e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Quantidade de Meses de Cobertura</Label>
                <Input
                  type="number"
                  required
                  value={reservaMeses}
                  onChange={(e) => setReservaMeses(e.target.value)}
                  placeholder="Recomendado: 6 meses"
                  className="bg-background border-border text-foreground rounded-xl"
                />
              </div>
              <Button type="submit" className="w-full bg-[#1576D0] hover:bg-[#0d5ca5] text-white rounded-xl h-11 font-bold select-none shadow">
                Calcular Reserva Ideal
              </Button>
            </form>
          )}

          {activeTab === "passiva" && (
            <form onSubmit={calcularRendaPassiva} className="space-y-4">
              <h3 className="font-bold text-lg text-foreground mb-4">Meta de Renda Passiva</h3>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Renda Mensal Desejada (R$)</Label>
                <Input
                  type="number"
                  required
                  value={passivaDesejada}
                  onChange={(e) => setPassivaDesejada(e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Taxa Real da Carteira (% ao ano)</Label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={passivaTaxa}
                  onChange={(e) => setPassivaTaxa(e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl"
                />
              </div>
              <Button type="submit" className="w-full bg-[#1576D0] hover:bg-[#0d5ca5] text-white rounded-xl h-11 font-bold select-none shadow">
                Calcular Patrimônio Necessário
              </Button>
            </form>
          )}

          {activeTab === "cdi" && (
            <form onSubmit={calcularCDI} className="space-y-4">
              <h3 className="font-bold text-lg text-foreground mb-4">CDI vs Caderneta</h3>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Valor a Investir (R$)</Label>
                <Input
                  type="number"
                  required
                  value={cdiValor}
                  onChange={(e) => setCdiValor(e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Taxa CDI / Selic (% ao ano)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={cdiTaxa}
                  onChange={(e) => setCdiTaxa(e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Prazo (Meses)</Label>
                <Input
                  type="number"
                  required
                  value={cdiPrazo}
                  onChange={(e) => setCdiPrazo(e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl"
                />
              </div>
              <Button type="submit" className="w-full bg-[#1576D0] hover:bg-[#0d5ca5] text-white rounded-xl h-11 font-bold select-none shadow">
                Comparar Rentabilidade
              </Button>
            </form>
          )}
        </Card>

        {/* Results Column */}
        <Card className="lg:col-span-2 p-6 bg-white dark:bg-card border border-border shadow-sm rounded-2xl flex flex-col justify-center">
          {activeTab === "juros" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg text-foreground">Resultado da Simulação</h3>
              {jurosResult ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-border/50 space-y-1">
                    <span className="text-xs text-muted-foreground block">Total Investido</span>
                    <strong className="text-lg text-foreground font-extrabold">
                      {formatCurrency(jurosResult.totalInvestido)}
                    </strong>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/10 rounded-xl space-y-1">
                    <span className="text-xs text-emerald-700 dark:text-emerald-450 block">Total ganho em Juros</span>
                    <strong className="text-lg text-emerald-600 dark:text-emerald-400 font-extrabold">
                      {formatCurrency(jurosResult.rendimentoJuros)}
                    </strong>
                  </div>
                  <div className="p-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl col-span-2 space-y-1 text-center">
                    <span className="text-sm text-blue-700 dark:text-blue-400 block">Patrimônio Acumulado Final</span>
                    <strong className="text-3xl text-primary dark:text-blue-400 font-black">
                      {formatCurrency(jurosResult.totalFinal)}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-10 flex flex-col items-center gap-2">
                  <TrendingUp className="w-8 h-8 opacity-40 text-[#1576D0]" />
                  <span>Insira os valores na calculadora e clique em Calcular.</span>
                </div>
              )}
            </div>
          )}

          {activeTab === "reserva" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg text-foreground">Resultado da Reserva</h3>
              {reservaResult ? (
                <div className="space-y-6">
                  <div className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-center space-y-1">
                    <span className="text-sm text-emerald-700 dark:text-emerald-450 block">Meta da Reserva de Emergência</span>
                    <strong className="text-3xl text-emerald-600 dark:text-emerald-400 font-black">
                      {formatCurrency(reservaResult.meta)}
                    </strong>
                    <span className="text-xs text-muted-foreground block mt-1">
                      (Equivalente a {reservaMeses} meses de custo de vida básico de {formatCurrency(parseFloat(reservaCusto))})
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Tempo estimado para formar a reserva:</h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-border/50 rounded-xl text-center">
                        <span className="text-[10px] text-muted-foreground block">Poupando 10%/mês</span>
                        <strong className="text-sm text-foreground font-extrabold">
                          {Math.ceil(reservaResult.guardando10)} meses
                        </strong>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-border/50 rounded-xl text-center">
                        <span className="text-[10px] text-muted-foreground block">Poupando 20%/mês</span>
                        <strong className="text-sm text-foreground font-extrabold">
                          {Math.ceil(reservaResult.guardando20)} meses
                        </strong>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-border/50 rounded-xl text-center">
                        <span className="text-[10px] text-muted-foreground block">Poupando 30%/mês</span>
                        <strong className="text-sm text-foreground font-extrabold">
                          {Math.ceil(reservaResult.guardando30)} meses
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-10 flex flex-col items-center gap-2">
                  <ShieldCheck className="w-8 h-8 opacity-40 text-[#1576D0]" />
                  <span>Insira os valores na calculadora e clique em Calcular.</span>
                </div>
              )}
            </div>
          )}

          {activeTab === "passiva" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg text-foreground">Resultado Renda Perpétua</h3>
              {passivaResult ? (
                <div className="space-y-6">
                  <div className="p-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl text-center space-y-1">
                    <span className="text-sm text-blue-700 dark:text-blue-400 block">Patrimônio Ideal Necessário</span>
                    <strong className="text-3xl text-primary dark:text-blue-400 font-black">
                      {formatCurrency(passivaResult.patrimonioNecessario)}
                    </strong>
                    <span className="text-xs text-muted-foreground block mt-2">
                      Aplicado a uma taxa líquida de {passivaTaxa}% ao ano para gerar {formatCurrency(passivaResult.rendaDesejada)} mensais para sempre, sem consumir o principal.
                    </span>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/10 text-amber-800 dark:text-amber-400 rounded-xl flex gap-3 text-xs leading-relaxed">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <strong>Nota de Planejamento:</strong> A taxa recomendada para simulação é de 4% a 6% líquido (acima da inflação) ao ano para manter seu poder de compra intacto no longo prazo.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-10 flex flex-col items-center gap-2">
                  <Coins className="w-8 h-8 opacity-40 text-[#1576D0]" />
                  <span>Insira os valores na calculadora e clique em Calcular.</span>
                </div>
              )}
            </div>
          )}

          {activeTab === "cdi" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg text-foreground">Resultado Comparativo</h3>
              {cdiResult ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                      <span className="text-xs text-blue-700 dark:text-blue-400 block">CDI Líquido (Com IR)</span>
                      <strong className="text-base text-primary dark:text-blue-400 font-extrabold block mt-1">
                        {formatCurrency(cdiResult.liquidoCDI)}
                      </strong>
                      <span className="text-[10px] text-muted-foreground">
                        Rendimento: {formatCurrency(cdiResult.ganhoCDI)}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-border/50 rounded-xl">
                      <span className="text-xs text-muted-foreground block">Caderneta de Poupança</span>
                      <strong className="text-base text-foreground font-extrabold block mt-1">
                        {formatCurrency(cdiResult.poupanca)}
                      </strong>
                      <span className="text-[10px] text-muted-foreground">
                        Rendimento: {formatCurrency(cdiResult.ganhoPoupanca)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-800 dark:text-emerald-450 font-bold block">Vantagem do CDI Liquido</span>
                      <p className="text-[11px] text-muted-foreground">Rendimento extra acima da poupança</p>
                    </div>
                    <strong className="text-xl text-emerald-600 dark:text-emerald-400 font-black">
                      + {formatCurrency(cdiResult.diferenca)}
                    </strong>
                  </div>

                  <div className="text-center text-[10px] text-muted-foreground">
                    * Descontado imposto de renda retido na fonte de {formatCurrency(cdiResult.impostoIR)} sobre o rendimento bruto do CDI.
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-10 flex flex-col items-center gap-2">
                  <BarChart3 className="w-8 h-8 opacity-40 text-[#1576D0]" />
                  <span>Insira os valores na calculadora e clique em Calcular.</span>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
