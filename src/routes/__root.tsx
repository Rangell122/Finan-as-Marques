import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import {
  LayoutGrid,
  Wallet,
  LineChart,
  SlidersHorizontal,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Mic,
  Send,
  Sparkles,
  Check,
  Loader2,
  Settings,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Login } from "@/components/Login";
import { Logo } from "@/components/Logo";
import importData from "@/data/import.json";

import appCss from "../styles.css?url";

function SidebarContent() {
  return (
    <div className="flex flex-col h-full py-8 px-4 space-y-8 bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-2">
        <Logo className="w-9 h-9 drop-shadow-[0_0_8px_rgba(21,118,208,0.35)]" />
        <span className="text-xl font-bold tracking-tight text-sidebar-foreground">
          Finanças Marques
        </span>
      </div>
      <nav className="flex-1 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sm font-medium text-slate-300 hover:text-white"
          activeProps={{ className: "bg-sidebar-accent text-primary font-bold" }}
        >
          <LayoutGrid className="w-5 h-5" />
          Dashboard
        </Link>
        <Link
          to="/transacoes"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sm font-medium text-slate-300 hover:text-white"
          activeProps={{ className: "bg-sidebar-accent text-primary font-bold" }}
        >
          <Wallet className="w-5 h-5" />
          Transações
        </Link>
        <Link
          to="/relatorios"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sm font-medium text-slate-300 hover:text-white"
          activeProps={{ className: "bg-sidebar-accent text-primary font-bold" }}
        >
          <LineChart className="w-5 h-5" />
          Relatórios
        </Link>
        <Link
          to="/calculadoras"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sm font-medium text-slate-300 hover:text-white"
          activeProps={{ className: "bg-sidebar-accent text-primary font-bold" }}
        >
          <Calculator className="w-5 h-5" />
          Calculadoras
        </Link>
      </nav>
      <div className="mt-auto pt-8 border-t border-sidebar-border/50">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-slate-300 hover:text-white hover:bg-sidebar-accent"
        >
          <SlidersHorizontal className="w-5 h-5" />
          Configurações
        </Button>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Ops! Algo deu errado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Não conseguimos carregar esta página. Tente atualizar ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Finanças Marques" },
      { name: "description", content: "Seu controle financeiro premium" },
      { name: "author", content: "Finanças Marques" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/logo.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/logo.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (let registration of registrations) {
                    registration.unregister().then(function() {
                      console.log('SW unregistered successfully');
                      window.location.reload();
                    });
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-primary/10">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const isMobile = useIsMobile();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States para a IA Assistente de Voz
  const [aiOpen, setAiOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    {
      id: "1",
      type: "system",
      text: "Olá! Sou o assistente de voz da família Marques. 🎙️ Diga ou digite o seu lançamento (ex: 'Gastei 55 reais de gasolina no Posto Shell' ou 'Recebi um Pix de 200 reais de freela').",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const parseResponsible = (description: string) => {
    const desc = String(description || "");
    if (desc.startsWith("[Jack] ")) {
      return { name: "Jack", cleanDesc: desc.replace("[Jack] ", "") };
    }
    if (desc.startsWith("[Rangel] ")) {
      return { name: "Rangel", cleanDesc: desc.replace("[Rangel] ", "") };
    }
    if (desc.startsWith("[Os dois] ")) {
      return { name: "Os dois", cleanDesc: desc.replace("[Os dois] ", "") };
    }
    return { name: "Os dois", cleanDesc: desc };
  };

  // Parser local inteligente para entender os lançamentos digitados/falados
  const parseFinancialStatement = (text: string) => {
    const lowercase = text.toLowerCase();

    // 1. Detectar tipo
    let type: "income" | "expense" = "expense";
    if (
      lowercase.includes("recebi") ||
      lowercase.includes("ganhei") ||
      lowercase.includes("entrou") ||
      lowercase.includes("rendeu") ||
      lowercase.includes("salário") ||
      lowercase.includes("salario") ||
      lowercase.includes("receita") ||
      lowercase.includes("pix recebido")
    ) {
      type = "income";
    }

    // 2. Extrair valor numérico
    let amount = 0;
    const matches = lowercase.match(/\d+(?:[.,]\d+)?/g);
    if (matches && matches.length > 0) {
      amount = parseFloat(matches[0].replace(",", "."));
    }

    // 3. Detectar categoria com base em palavras-chave
    let category = type === "income" ? "Renda - Outros" : "Outros Gastos";

    if (type === "income") {
      if (
        lowercase.includes("salário") ||
        lowercase.includes("salario") ||
        lowercase.includes("empresa")
      ) {
        category = "Renda - Salário";
      } else if (lowercase.includes("pix")) {
        category = "Renda - PIX Recebido";
      } else if (
        lowercase.includes("freela") ||
        lowercase.includes("freelance") ||
        lowercase.includes("bico")
      ) {
        category = "Renda - Freelance";
      } else if (
        lowercase.includes("rendeu") ||
        lowercase.includes("investimento") ||
        lowercase.includes("rendimento")
      ) {
        category = "Renda - Investimentos";
      }
    } else {
      if (
        lowercase.includes("água") ||
        lowercase.includes("agua") ||
        lowercase.includes("copasa") ||
        lowercase.includes("saneamento")
      ) {
        category = "Casa - Água";
      } else if (
        lowercase.includes("luz") ||
        lowercase.includes("energia") ||
        lowercase.includes("cemig")
      ) {
        category = "Casa - Luz";
      } else if (
        lowercase.includes("internet") ||
        lowercase.includes("wifi") ||
        lowercase.includes("claro") ||
        lowercase.includes("vivo")
      ) {
        category = "Casa - Internet";
      } else if (
        lowercase.includes("mercado") ||
        lowercase.includes("supermercado") ||
        lowercase.includes("compra") ||
        lowercase.includes("compras") ||
        lowercase.includes("comida")
      ) {
        category = "Casa - Mercado / Compras";
      } else if (
        lowercase.includes("gasolina") ||
        lowercase.includes("combustivel") ||
        lowercase.includes("combustível") ||
        lowercase.includes("posto")
      ) {
        category = "Moto - Gasolina";
      } else if (
        lowercase.includes("peça") ||
        lowercase.includes("peças") ||
        lowercase.includes("oficina") ||
        lowercase.includes("pneu") ||
        lowercase.includes("mecânico") ||
        lowercase.includes("óleo") ||
        lowercase.includes("oleo")
      ) {
        category = "Moto - Peças / Manutenção";
      } else if (
        lowercase.includes("chatgpt") ||
        lowercase.includes("openai") ||
        lowercase.includes("gemini") ||
        lowercase.includes("ia") ||
        lowercase.includes("inteligência artificial")
      ) {
        category = "IA - Ferramentas (ChatGPT, Gemini...)";
      } else if (lowercase.includes("nubank") || lowercase.includes("nu")) {
        category = "Cartão - Nubank";
      } else if (lowercase.includes("inter")) {
        category = "Cartão - Inter";
      } else if (lowercase.includes("cartão") || lowercase.includes("cartao")) {
        category = "Cartão - Outro Cartão";
      } else if (
        lowercase.includes("pix enviado") ||
        lowercase.includes("transferi") ||
        lowercase.includes("mandei um pix")
      ) {
        category = "Banco - PIX Enviado";
      }
    }

    // 4. Limpar descrição básica
    let description = "";
    let responsible = "Os dois";
    if (type === "income") {
      description = text
        .replace(/(?:recebi|ganhei|salário|salario|pix|de|reais|\d+(?:[.,]\d+)?)/gi, "")
        .trim();
      if (!description) {
        description = category === "Renda - Salário" ? "Salário Recebido" : "Entrada Recebida";
      }
    } else {
      if (lowercase.includes("jack")) {
        responsible = "Jack";
      } else if (lowercase.includes("rangel")) {
        responsible = "Rangel";
      }
      description = text
        .replace(
          /(?:gastei|comprei|paguei|reais|no|na|em|de|com|jack|rangel|\d+(?:[.,]\d+)?)/gi,
          "",
        )
        .trim();
      description = description.replace(/\s+/g, " ");
      description = description.replace(/^(?:por|para|de)\s+/i, "").trim();
      if (!description) {
        description = category.split(" - ")[1] || "Gasto Registrado";
      }
    }

    // Capitalizar a primeira letra
    description = description.charAt(0).toUpperCase() + description.slice(1);
    if (type === "expense") {
      description = `[${responsible}] ${description}`;
    }

    return {
      type,
      amount,
      category,
      description,
      date: new Date().toISOString().split("T")[0],
    };
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz. Por favor, digite o lançamento.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInputText(speechToText);
      handleProcessMessage(speechToText);
    };

    recognition.onerror = (event: any) => {
      console.error("Erro no reconhecimento de voz:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleProcessMessage = (text: string) => {
    if (!text.trim()) return;

    // Adicionar mensagem do usuário
    const userMsg = { id: Date.now().toString(), type: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    // Processamento
    const parsed = parseFinancialStatement(text);
    setPendingTransaction(parsed);

    // Mensagem do sistema pedindo confirmação
    const systemMsg = {
      id: (Date.now() + 1).toString(),
      type: "system",
      text: "Entendi! Por favor, confirme ou edite os dados extraídos abaixo antes de salvar na planilha:",
      isConfirmation: true,
    };
    setMessages((prev) => [...prev, systemMsg]);
  };

  const handleConfirmTransaction = async () => {
    if (!pendingTransaction) return;
    setAiLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: pendingTransaction.type,
        description: pendingTransaction.description,
        amount: parseFloat(pendingTransaction.amount),
        date: pendingTransaction.date,
        category: pendingTransaction.category,
        status: "paid",
      });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "system",
          text: `✅ Sucesso! Lançamento de "${pendingTransaction.description}" (R$ ${pendingTransaction.amount.toFixed(2)}) adicionado na planilha!`,
        },
      ]);

      setPendingTransaction(null);

      // Atualizar a rota ativa para atualizar os gráficos e planilhas em tempo real
      await router.invalidate();
    } catch (err: any) {
      alert("Erro ao salvar lançamento da IA: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        Carregando...
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-[100dvh] w-screen overflow-hidden bg-background">
        {!isMobile && (
          <aside className="w-64 border-r border-sidebar-border bg-sidebar flex-shrink-0">
            <SidebarContent />
          </aside>
        )}

        <main className="flex-1 flex flex-col min-h-0 w-full relative overflow-hidden">
          {isMobile && (
            <header className="h-16 border-b border-sidebar-border bg-sidebar flex items-center justify-between px-4 flex-shrink-0 z-50 relative text-sidebar-foreground w-full">
              <div className="flex items-center gap-2">
                <Logo className="w-7 h-7 drop-shadow-[0_0_6px_rgba(212,166,58,0.35)]" />
                <span className="font-bold text-lg text-sidebar-foreground">Finanças Marques</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                {menuOpen ? (
                  <X className="w-6 h-6 text-sidebar-foreground" />
                ) : (
                  <Menu className="w-6 h-6 text-sidebar-foreground" />
                )}
              </Button>
            </header>
          )}

          {isMobile && menuOpen && (
            <div className="absolute top-16 left-0 w-full bg-sidebar border-b border-sidebar-border shadow-2xl flex flex-col p-4 space-y-3 z-40 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-sidebar-accent transition-colors text-base font-semibold text-slate-300 hover:text-white border-b border-sidebar-border/30"
                activeProps={{ className: "bg-sidebar-accent text-primary font-bold" }}
              >
                <LayoutGrid className="w-5 h-5 text-primary" />
                Início (Dashboard)
              </Link>
              <Link
                to="/transacoes"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-sidebar-accent transition-colors text-base font-semibold text-slate-300 hover:text-white border-b border-sidebar-border/30"
                activeProps={{ className: "bg-sidebar-accent text-primary font-bold" }}
              >
                <Wallet className="w-5 h-5 text-primary" />
                Transações
              </Link>
              <Link
                to="/calculadoras"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-sidebar-accent transition-colors text-base font-semibold text-slate-300 hover:text-white border-b border-sidebar-border/30"
                activeProps={{ className: "bg-sidebar-accent text-primary font-bold" }}
              >
                <Calculator className="w-5 h-5 text-primary" />
                Calculadoras
              </Link>

              {/* Relatórios Accordion */}
              <div>
                <button
                  onClick={() => setReportsExpanded(!reportsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-sidebar-accent transition-colors text-base font-semibold text-slate-300 hover:text-white border-b border-sidebar-border/30"
                >
                  <div className="flex items-center gap-3">
                    <LineChart className="w-5 h-5 text-primary" />
                    <span>Relatórios</span>
                  </div>
                  {reportsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                {reportsExpanded && (
                  <div className="pl-8 pr-3 py-2 space-y-2 bg-[#0E2C63]/40 rounded-b-lg border-x border-b border-[#0E2C63]/30 mt-1">
                    <Link
                      to="/"
                      onClick={() => setMenuOpen(false)}
                      className="block py-2 text-sm text-slate-300 hover:text-white"
                    >
                      Resumo Mensal
                    </Link>
                    <Link
                      to="/"
                      onClick={() => setMenuOpen(false)}
                      className="block py-2 text-sm text-slate-300 hover:text-white"
                    >
                      Análise de Gastos
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setTimeout(() => window.print(), 500);
                      }}
                      className="block w-full text-left py-2 text-sm text-slate-300 hover:text-white"
                    >
                      Exportar PDF / Imprimir
                    </button>
                  </div>
                )}
              </div>

              {/* Configurações Accordion */}
              <div>
                <button
                  onClick={() => setSettingsExpanded(!settingsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-[#0E2C63] transition-colors text-base font-semibold text-slate-300 hover:text-white border-b border-[#0E2C63]/30"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-[#1576D0]" />
                    <span>Configurações</span>
                  </div>
                  {settingsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                {settingsExpanded && (
                  <div className="pl-8 pr-3 py-2 space-y-2 bg-[#0E2C63]/40 rounded-b-lg border-x border-b border-[#0E2C63]/30 mt-1">
                    <div className="py-2 text-xs text-slate-400 border-b border-[#0E2C63]/30 pb-1">
                      Conta:{" "}
                      <span className="font-semibold text-white">
                        {session.user?.email || "Casal"}
                      </span>
                    </div>
                    <Link
                      to="/"
                      onClick={() => setMenuOpen(false)}
                      className="block py-2 text-sm text-slate-300 hover:text-white"
                    >
                      Gerenciar Categorias
                    </Link>
                    <Link
                      to="/calculadoras"
                      onClick={() => setMenuOpen(false)}
                      className="block py-2 text-sm text-slate-300 hover:text-white"
                    >
                      Calculadoras Financeiras
                    </Link>
                    <button
                      onClick={async () => {
                        if (
                          confirm(
                            "Deseja importar as 212 transações da planilha Google Sheets? Isso apagará todos os dados atuais da plataforma e recarregará os originais.",
                          )
                        ) {
                          const {
                            data: { user },
                          } = await supabase.auth.getUser();
                          if (user) {
                            alert("Limpando dados antigos e iniciando importação! Por favor, não feche a página.");
                            
                            // WIPE FIRST to prevent duplication!
                            await supabase.from("transactions").delete().eq("user_id", user.id);
                            
                            let successCount = 0;
                            // Batch processing to avoid rate limits
                            for (let i = 0; i < importData.length; i++) {
                              const t = importData[i];
                              const { error } = await supabase.from("transactions").insert({
                                user_id: user.id,
                                type: t.type,
                                description: t.description,
                                amount: t.amount,
                                date: t.date,
                                category: t.category,
                                status: t.status === "Pago" ? "paid" : t.status === "Pendente" ? "pending" : "pending",
                              });
                              if (!error) successCount++;
                            }
                            alert(
                              `Importação concluída! ${successCount} lançamentos inseridos com sucesso.`,
                            );
                            window.location.reload();
                          }
                        }
                      }}
                      className="w-full text-left py-2 text-sm text-emerald-400 font-semibold hover:text-emerald-300 mt-1"
                    >
                      Importar Planilha Google Sheets
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          confirm(
                            "Tem certeza que deseja apagar TODOS os dados e zerar a planilha? Essa ação não pode ser desfeita.",
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
                      }}
                      className="w-full text-left py-2 text-sm text-amber-500 font-semibold hover:text-amber-400 mt-1"
                    >
                      Zerar Planilha (Apagar Dados)
                    </button>
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setMenuOpen(false);
                      }}
                      className="w-full text-left py-2 text-sm text-red-400 font-semibold hover:text-red-300 mt-2"
                    >
                      Sair da Conta
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto overflow-x-hidden w-full scrollbar-none pb-20 md:pb-0">
            <Outlet />
          </div>

          {isMobile && (
            <nav className="h-16 border-t bg-white flex items-center justify-around flex-shrink-0 z-50 absolute bottom-0 w-full shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
              <Link
                to="/"
                className="flex flex-col items-center gap-1 text-slate-400"
                activeProps={{ className: "text-primary" }}
              >
                <LayoutGrid className="w-5 h-5" />
                <span className="text-[10px]">Início</span>
              </Link>
              <Link
                to="/transacoes"
                className="flex flex-col items-center gap-1 text-slate-400"
                activeProps={{ className: "text-primary" }}
              >
                <Wallet className="w-5 h-5" />
                <span className="text-[10px]">Transações</span>
              </Link>
              <Link
                to="/adicionar"
                className="rounded-full w-12 h-12 -mt-6 shadow-lg bg-primary hover:bg-primary/95 flex items-center justify-center text-primary-foreground transition-all duration-200 border-4 border-background"
              >
                <Plus className="w-6 h-6" />
              </Link>
              <Link
                to="/relatorios"
                className="flex flex-col items-center gap-1 text-slate-400"
                activeProps={{ className: "text-primary" }}
              >
                <LineChart className="w-5 h-5" />
                <span className="text-[10px]">Relatórios</span>
              </Link>
              <Link
                to="/ajustes"
                className="flex flex-col items-center gap-1 text-slate-400"
                activeProps={{ className: "text-primary" }}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="text-[10px]">Ajustes</span>
              </Link>
            </nav>
          )}

          {/* BALÃO FLUTUANTE DA IA ASSISTENTE FINANCEIRO */}
          <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex items-center justify-center">
            {/* Subtle glow background element */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#1576D0] via-emerald-500 to-blue-500 blur-md opacity-45 animate-pulse -z-10" />

            <button
              onClick={() => setAiOpen(!aiOpen)}
              className={`rounded-full w-14 h-14 bg-[#071A3D]/95 backdrop-blur-md border border-[#1576D0]/60 shadow-[0_0_20px_rgba(21,118,208,0.35)] hover:shadow-[0_0_25px_rgba(21,118,208,0.6)] transition-all duration-300 flex items-center justify-center group overflow-hidden ${
                aiOpen ? "rotate-90" : "hover:scale-110"
              }`}
            >
              {aiOpen ? (
                <X className="w-6 h-6 text-[#1576D0]" />
              ) : (
                <div className="relative w-10 h-10 flex items-center justify-center">
                  {/* Glowing core */}
                  <div className="absolute w-5 h-5 rounded-full bg-gradient-to-tr from-[#1576D0] to-[#3b82f6] blur-[4px] opacity-75 group-hover:scale-125 transition-transform duration-300" />

                  {/* Sparkles icon */}
                  <Sparkles className="absolute w-4.5 h-4.5 text-white group-hover:rotate-12 transition-transform duration-300 z-10" />

                  {/* High tech spinning orbit */}
                  <svg
                    className="absolute w-9 h-9 animate-[spin_8s_linear_infinite]"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#1576D0"
                      strokeWidth="4"
                      strokeDasharray="30 30"
                      fill="none"
                      opacity="0.7"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#22C55E"
                      strokeWidth="4"
                      strokeDasharray="15 45"
                      fill="none"
                      opacity="0.8"
                    />
                  </svg>
                </div>
              )}
            </button>
          </div>

          {aiOpen && (
            <div className="fixed bottom-36 right-4 md:bottom-24 md:right-6 w-[calc(100vw-2rem)] sm:w-[380px] bg-white border border-slate-200 shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden">
              {/* Header do Chat */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-100" />
                  <div>
                    <span className="font-bold text-sm block">Assistente Marques</span>
                    <span className="text-[10px] opacity-90">Planilha por Voz / Texto</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAiOpen(false)}
                  className="text-white hover:bg-white/10 rounded-full w-8 h-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Corpo de Mensagens */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[300px] min-h-[220px] bg-slate-50">
                {messages.map((m) => {
                  const isPendingExpense =
                    m.isConfirmation && pendingTransaction && pendingTransaction.type === "expense";
                  const { name: pendingResp, cleanDesc: pendingClean } = isPendingExpense
                    ? parseResponsible(pendingTransaction.description)
                    : {
                        name: "Os dois",
                        cleanDesc: pendingTransaction ? pendingTransaction.description : "",
                      };

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.type === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                          m.type === "user"
                            ? "bg-primary text-primary-foreground font-semibold rounded-tr-none"
                            : "bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm"
                        }`}
                      >
                        {m.text}

                        {/* Caixa de Confirmação do Lançamento da IA */}
                        {m.isConfirmation && pendingTransaction && (
                          <div className="mt-3 p-3 bg-slate-100 rounded-xl space-y-2.5 border border-slate-200">
                            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1">
                              Revisar Lançamento
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-800">
                              <div className="space-y-0.5">
                                <span className="text-[9px] text-slate-500 font-semibold">
                                  Tipo
                                </span>
                                <div
                                  className={`font-bold ${pendingTransaction.type === "income" ? "text-emerald-600" : "text-rose-600"}`}
                                >
                                  {pendingTransaction.type === "income"
                                    ? "Receita (+)"
                                    : "Despesa (-)"}
                                </div>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[9px] text-slate-500 font-semibold">
                                  Valor (R$)
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={pendingTransaction.amount}
                                  onChange={(e) =>
                                    setPendingTransaction({
                                      ...pendingTransaction,
                                      amount: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-200 px-1.5 py-0.5 rounded font-bold outline-none text-[#0B1120] focus:ring-1 focus:ring-primary"
                                />
                              </div>
                              {pendingTransaction.type === "expense" && (
                                <div className="space-y-0.5 col-span-2">
                                  <span className="text-[9px] text-slate-500 font-semibold">
                                    Quem Gastou?
                                  </span>
                                  <select
                                    value={pendingResp}
                                    onChange={(e) =>
                                      setPendingTransaction({
                                        ...pendingTransaction,
                                        description: `[${e.target.value}] ${pendingClean}`,
                                      })
                                    }
                                    className="w-full bg-white border border-slate-200 px-1 py-0.5 rounded text-[10px] font-bold outline-none text-[#0B1120] focus:ring-1 focus:ring-primary"
                                  >
                                    <option value="Jack">Jack</option>
                                    <option value="Rangel">Rangel</option>
                                    <option value="Os dois">Os dois</option>
                                  </select>
                                </div>
                              )}
                              <div className="space-y-0.5 col-span-2">
                                <span className="text-[9px] text-slate-500 font-semibold">
                                  Descrição
                                </span>
                                <input
                                  type="text"
                                  value={
                                    pendingTransaction.type === "expense"
                                      ? pendingClean
                                      : pendingTransaction.description
                                  }
                                  onChange={(e) =>
                                    setPendingTransaction({
                                      ...pendingTransaction,
                                      description:
                                        pendingTransaction.type === "expense"
                                          ? `[${pendingResp}] ${e.target.value}`
                                          : e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-200 px-1.5 py-0.5 rounded font-bold outline-none text-[#0B1120] focus:ring-1 focus:ring-primary"
                                />
                              </div>
                              <div className="space-y-0.5 col-span-2">
                                <span className="text-[9px] text-slate-500 font-semibold">
                                  Categoria
                                </span>
                                <select
                                  value={pendingTransaction.category}
                                  onChange={(e) =>
                                    setPendingTransaction({
                                      ...pendingTransaction,
                                      category: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-slate-200 px-1 py-0.5 rounded text-[10px] font-bold outline-none text-[#0B1120] focus:ring-1 focus:ring-primary"
                                >
                                  <option value="Renda - Salário">Renda - Salário</option>
                                  <option value="Renda - PIX Recebido">Renda - PIX Recebido</option>
                                  <option value="Renda - Freelance">Renda - Freelance</option>
                                  <option value="Renda - Investimentos">
                                    Renda - Investimentos
                                  </option>
                                  <option value="Renda - Outros">Renda - Outros</option>
                                  <option value="Casa - Água">Casa - Água</option>
                                  <option value="Casa - Luz">Casa - Luz</option>
                                  <option value="Casa - Internet">Casa - Internet</option>
                                  <option value="Casa - Mercado / Compras">
                                    Casa - Mercado / Compras
                                  </option>
                                  <option value="Moto - Gasolina">Moto - Gasolina</option>
                                  <option value="Moto - Peças / Manutenção">
                                    Moto - Peças / Manutenção
                                  </option>
                                  <option value="IA - Ferramentas (ChatGPT, Gemini...)">
                                    IA - Ferramentas
                                  </option>
                                  <option value="Cartão - Nubank">Cartão - Nubank</option>
                                  <option value="Cartão - Inter">Cartão - Inter</option>
                                  <option value="Cartão - Outro Cartão">
                                    Cartão - Outro Cartão
                                  </option>
                                  <option value="Banco - PIX Enviado">Banco - PIX Enviado</option>
                                  <option value="Outros Gastos">Outros Gastos</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                        {m.isConfirmation && pendingTransaction && (
                          <div className="flex gap-2 pt-1">
                            <Button
                              onClick={handleConfirmTransaction}
                              disabled={aiLoading}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-[11px] rounded-lg"
                            >
                              {aiLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5 mr-1" />
                              )}
                              Gravar na Planilha
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setPendingTransaction(null);
                                setMessages((prev) => [
                                  ...prev,
                                  {
                                    id: Date.now().toString(),
                                    type: "system",
                                    text: "Lançamento cancelado!",
                                  },
                                ]);
                              }}
                              className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold h-8 text-[11px] rounded-lg"
                            >
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Área de Input de Texto/Voz */}
              <div className="p-3 border-t border-slate-100 bg-white flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Fale ou digite o lançamento..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleProcessMessage(inputText);
                  }}
                  className="flex-1 bg-slate-100 text-[#0B1120] placeholder:text-slate-400 border border-slate-200 px-3 py-2 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                />

                {/* Botão do Microfone */}
                <Button
                  size="icon"
                  onClick={startListening}
                  className={`rounded-full w-9 h-9 border border-slate-200 ${
                    isListening
                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </Button>

                {/* Botão de Enviar */}
                <Button
                  size="icon"
                  onClick={() => handleProcessMessage(inputText)}
                  className="rounded-full w-9 h-9 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </QueryClientProvider>
  );
}
