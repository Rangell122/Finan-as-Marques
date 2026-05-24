import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/faq")({
  component: FaqRoute,
});

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Card className="border border-border bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex justify-between items-center text-left focus:outline-none"
      >
        <span className="font-bold text-xs sm:text-sm text-foreground pr-4 leading-relaxed">
          {question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/30">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function FaqRoute() {
  const faqs = [
    {
      question: "Como funciona o cálculo do Saldo Total?",
      answer: "O saldo total é a soma do saldo efetivado (todas as contas ajustadas pelos lançamentos pagos e recebidos) mais o saldo previsto (lançamentos agendados/pendentes para o mês de referência)."
    },
    {
      question: "Como os dados são armazenados na plataforma?",
      answer: "Suas transações e extratos principais são salvos de forma segura em uma base de dados na nuvem (Supabase). Dados de personalização local como limites de cartões e configurações de contas alternativas ficam no armazenamento local (localStorage) de seu navegador."
    },
    {
      question: "Posso adicionar mais de um cartão de crédito?",
      answer: "Sim! Na aba inicial, clique em Configurar Cartões (ícone de lápis) para customizar os nomes, limites e dia de vencimento dos cartões. Você poderá registrar compras específicas em cada um deles."
    },
    {
      question: "Como funciona o Assistente de Voz por Inteligência Artificial?",
      answer: "O assistente usa o reconhecimento de voz nativo do seu navegador. Basta falar frases como 'Gastei 50 reais de gasolina hoje' ou 'Recebi freela de 300 reais' para que a IA extraia automaticamente o valor, categoria, descrição e crie o lançamento pré-preenchido para você revisar e salvar."
    },
    {
      question: "Como exportar relatórios em formato PDF?",
      answer: "Na seção de Relatórios, cada gráfico possui um ícone de impressora no cabeçalho. Ao clicar nele, a página gerará uma visualização limpa do respectivo gráfico pronta para salvar como PDF ou imprimir."
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 space-y-8 bg-background min-h-screen pb-24"
    >
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex justify-center items-center gap-2">
          <HelpCircle className="w-8 h-8 text-[#1576D0]" />
          Perguntas Frequentes
        </h1>
        <p className="text-muted-foreground text-sm">
          Tire suas dúvidas sobre o funcionamento da plataforma, sincronização, inteligência artificial e relatórios.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {faqs.map((faq, idx) => (
          <FaqItem key={idx} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </motion.div>
  );
}
