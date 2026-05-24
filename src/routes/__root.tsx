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
  ArrowLeftRight,
  Scale,
  Target,
  BarChart3,
  FolderOpen,
  Tag,
  Calendar,
  HelpCircle,
  Info,
  Sun,
  Moon,
  CreditCard,
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

function SidebarLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all text-xs font-medium text-slate-500 dark:text-slate-300"
      activeProps={{ className: "bg-sidebar-accent text-primary dark:text-[#3b82f6] font-bold border-l-2 border-primary" }}
    >
      <Icon className="w-4 h-4 text-slate-400 dark:text-slate-300 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function SidebarContent({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  return (
    <div className="flex flex-col h-full py-6 px-4 space-y-6 bg-sidebar text-sidebar-foreground border-r border-sidebar-border overflow-y-auto scrollbar-none">
      <div className="flex items-center gap-2.5 px-2">
        <Logo className="w-8 h-8 drop-shadow-[0_0_8px_rgba(21,118,208,0.35)]" />
        <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
          Finanças Marques
        </span>
      </div>
      
      <nav className="flex-1 space-y-4">
        {/* Principal */}
        <div className="space-y-0.5">
          <div className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Principal
          </div>
          <SidebarLink to="/" icon={LayoutGrid} label="Resumo" />
          <SidebarLink to="/contas" icon={Wallet} label="Contas" />
          <SidebarLink to="/transacoes" icon={ArrowLeftRight} label="Transações" />
          <SidebarLink to="/cartoes" icon={CreditCard} label="Cartões de crédito" />
        </div>

        {/* Planejar */}
        <div className="space-y-0.5">
          <div className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Planejar
          </div>
          <SidebarLink to="/orcamentos" icon={Scale} label="Orçamentos" />
          <SidebarLink to="/objetivos" icon={Target} label="Objetivos" />
        </div>

        {/* Analisar */}
        <div className="space-y-0.5">
          <div className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Analisar
          </div>
          <SidebarLink to="/relatorios" icon={LineChart} label="Relatórios" />
          <SidebarLink to="/graficos" icon={BarChart3} label="Gráficos" />
          <SidebarLink to="/categorias" icon={FolderOpen} label="Categorias" />
          <SidebarLink to="/tags" icon={Tag} label="Tags" />
        </div>

        {/* Outros */}
        <div className="space-y-0.5">
          <div className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Outros
          </div>
          <SidebarLink to="/calendario" icon={Calendar} label="Calendário" />
          <SidebarLink to="/calculadoras" icon={Calculator} label="Ferramentas" />
          <SidebarLink to="/ajustes" icon={SlidersHorizontal} label="Configurações" />
          <SidebarLink to="/planos" icon={Sparkles} label="Planos e Preços" />
          <SidebarLink to="/faq" icon={HelpCircle} label="FAQ" />
          <SidebarLink to="/sobre" icon={Info} label="Sobre" />
        </div>
      </nav>

      <div className="pt-4 border-t border-sidebar-border/50 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          Tema: {theme === "light" ? "Claro" : "Escuro"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-slate-500 dark:text-slate-300 hover:bg-sidebar-accent rounded-lg"
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
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

  // Tema global e sincronização
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");

  // Mês de Referência global
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selected_month") || "2026-05";
    }
    return "2026-05";
  });

  const handleSetSelectedMonth = (m: string) => {
    setSelectedMonth(m);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_month", m);
      window.dispatchEvent(new CustomEvent("selectedMonthChanged", { detail: m }));
    }
  };

  // Busca global de transações
  const [searchQuery, setSearchQuery] = useState("");
  const handleSetSearchQuery = (q: string) => {
    setSearchQuery(q);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("searchQueryChanged", { detail: q }));
    }
  };

  // Contas do Usuário persistidas no localStorage
  const [accounts, setAccounts] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("contas_config");
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: "carteira", name: "Minha Carteira", balance: 100, type: "Dinheiro", color: "emerald" },
      { id: "corrente", name: "Minha Conta Corrente", balance: 1500, type: "Conta Corrente", color: "blue" },
      { id: "investimentos", name: "Investimentos", balance: 12000, type: "Investimentos", color: "purple" }
    ];
  });

  const saveAccounts = (newAccounts: any[]) => {
    setAccounts(newAccounts);
    if (typeof window !== "undefined") {
      localStorage.setItem("contas_config", JSON.stringify(newAccounts));
      window.dispatchEvent(new CustomEvent("accountsChanged"));
    }
  };

  // Estados dos modais de adição rápida
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [txType, setTxType] = useState<"income" | "expense" | "card">("expense");
  const [isAddTransferOpen, setIsAddTransferOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  // Campos para Nova Despesa/Receita/Cartão
  const [txDesc, setTxDesc] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [txCategory, setTxCategory] = useState("Outros Gastos");
  const [txAccount, setTxAccount] = useState("corrente");
  const [txTags, setTxTags] = useState("");
  const [txEfetivado, setTxEfetivado] = useState(true);
  const [txFixar, setTxFixar] = useState(true);
  const [txIgnorar, setTxIgnorar] = useState(false);
  const [txCard, setTxCard] = useState("Nubank");

  // Campos para Nova Transferência
  const [transferOrigin, setTransferOrigin] = useState("corrente");
  const [transferDest, setTransferDest] = useState("carteira");
  const [transferAmount, setTransferAmount] = useState("");

  // Campos para Nova Conta
  const [accountName, setAccountName] = useState("");
  const [accountInitialBalance, setAccountInitialBalance] = useState("");
  const [accountType, setAccountType] = useState("Conta Corrente");
  const [accountColor, setAccountColor] = useState("blue");

  const CATEGORIES = [
    "Renda - Salário",
    "Renda - PIX Recebido",
    "Renda - Freelance",
    "Renda - Investimentos",
    "Renda - Outros",
    "Casa - Água",
    "Casa - Luz",
    "Casa - Internet",
    "Casa - Mercado / Compras",
    "Moto - Gasolina",
    "Moto - Peças / Manutenção",
    "IA - Ferramentas (ChatGPT, Gemini...)",
    "Cartão - Nubank",
    "Cartão - Inter",
    "Cartão - Outro Cartão",
    "Banco - PIX Enviado",
    "Outros Gastos"
  ];

  const handleQuickAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDesc || !txAmount || !txDate || !txCategory) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const baseAmount = parseFloat(txAmount);
      const metaData = {
        desc: txDesc,
        costType: "variable",
        cardId: txType === "card" ? txCard : null,
        accountId: txAccount,
        tags: txTags.split(",").map(t => t.trim()).filter(Boolean),
        fixar: txFixar,
        ignorar: txIgnorar
      };

      const finalDesc = txType === "expense" || txType === "card"
        ? `[Os dois] META_JSON:${JSON.stringify(metaData)}`
        : `META_JSON:${JSON.stringify(metaData)}`;

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: txType === "income" ? "income" : "expense",
        description: finalDesc,
        amount: baseAmount,
        date: txDate,
        category: txCategory,
        status: txEfetivado ? "paid" : "pending",
      });

      if (error) throw error;

      setIsAddTxOpen(false);
      setTxDesc("");
      setTxAmount("");
      setTxTags("");
      await router.invalidate();
    } catch (err: any) {
      alert("Erro ao adicionar transação: " + err.message);
    }
  };

  const handleQuickAddTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount) {
      alert("Por favor, informe o valor da transferência.");
      return;
    }
    if (transferOrigin === transferDest) {
      alert("As contas de origem e destino devem ser diferentes.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const amount = parseFloat(transferAmount);
      const origAcc = accounts.find(a => a.id === transferOrigin);
      const destAcc = accounts.find(a => a.id === transferDest);

      const origName = origAcc ? origAcc.name : "Origem";
      const destName = destAcc ? destAcc.name : "Destino";

      // 1. Débito (despesa) da conta de origem
      const origMeta = {
        desc: `Transferência enviada para ${destName}`,
        accountId: transferOrigin,
        type: "transfer-out"
      };
      const origDesc = `[Os dois] META_JSON:${JSON.stringify(origMeta)}`;

      const { error: errorOut } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "expense",
        description: origDesc,
        amount,
        date: new Date().toISOString().split("T")[0],
        category: "Banco - PIX Enviado",
        status: "paid",
      });

      if (errorOut) throw errorOut;

      // 2. Crédito (receita) na conta de destino
      const destMeta = {
        desc: `Transferência recebida de ${origName}`,
        accountId: transferDest,
        type: "transfer-in"
      };
      const destDesc = `META_JSON:${JSON.stringify(destMeta)}`;

      const { error: errorIn } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "income",
        description: destDesc,
        amount,
        date: new Date().toISOString().split("T")[0],
        category: "Renda - PIX Recebido",
        status: "paid",
      });

      if (errorIn) throw errorIn;

      setIsAddTransferOpen(false);
      setTransferAmount("");
      await router.invalidate();
    } catch (err: any) {
      alert("Erro ao realizar transferência: " + err.message);
    }
  };

  const handleQuickAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !accountInitialBalance) {
      alert("Por favor, preencha o nome e o saldo inicial da conta.");
      return;
    }

    const newAcc = {
      id: "acc_" + Date.now(),
      name: accountName,
      balance: parseFloat(accountInitialBalance),
      type: accountType,
      color: accountColor
    };

    saveAccounts([...accounts, newAcc]);
    setIsAddAccountOpen(false);
    setAccountName("");
    setAccountInitialBalance("");
  };

  const handleOpenQuickModal = (type: "income" | "expense" | "card" | "transfer" | "account") => {
    if (type === "transfer") {
      setIsAddTransferOpen(true);
    } else if (type === "account") {
      setIsAddAccountOpen(true);
    } else {
      setTxType(type);
      setTxCategory(type === "income" ? "Renda - PIX Recebido" : "Outros Gastos");
      setIsAddTxOpen(true);
    }
  };

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
      <div className="flex h-[100dvh] w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
        {!isMobile && (
          <aside className="w-64 border-r border-sidebar-border bg-sidebar flex-shrink-0 print:hidden">
            <SidebarContent theme={theme} toggleTheme={toggleTheme} />
          </aside>
        )}

        <main className="flex-1 flex flex-col min-h-0 w-full relative overflow-hidden">
          {/* Cabeçalho Fixo do Conteúdo Principal */}
          <MainHeader
            selectedMonth={selectedMonth}
            onMonthChange={handleSetSelectedMonth}
            searchQuery={searchQuery}
            onSearchChange={handleSetSearchQuery}
            onOpenModal={handleOpenQuickModal}
            onLogout={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
            isMobile={isMobile}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />

          {isMobile && menuOpen && (
            <div className="absolute top-16 left-0 w-full h-[calc(100vh-4rem)] bg-sidebar border-b border-sidebar-border shadow-2xl z-40 overflow-y-auto print:hidden">
              <SidebarContent theme={theme} toggleTheme={toggleTheme} />
            </div>
          )}

          <div className="flex-1 overflow-y-auto overflow-x-hidden w-full scrollbar-none pb-20 md:pb-0">
            <Outlet />
          </div>

          {isMobile && (
            <nav className="h-16 border-t bg-white dark:bg-[#071a3d] dark:border-sidebar-border flex items-center justify-around flex-shrink-0 z-30 absolute bottom-0 w-full shadow-[0_-4px_10px_rgba(0,0,0,0.05)] print:hidden">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500"
                activeProps={{ className: "text-primary dark:text-[#3b82f6]" }}
              >
                <LayoutGrid className="w-5 h-5" />
                <span className="text-[10px]">Início</span>
              </Link>
              <Link
                to="/transacoes"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500"
                activeProps={{ className: "text-primary dark:text-[#3b82f6]" }}
              >
                <ArrowLeftRight className="w-5 h-5" />
                <span className="text-[10px]">Transações</span>
              </Link>
              <button
                onClick={() => handleOpenQuickModal("expense")}
                className="rounded-full w-12 h-12 -mt-6 shadow-lg bg-primary hover:bg-primary/95 flex items-center justify-center text-white transition-all duration-200 border-4 border-background"
              >
                <Plus className="w-6 h-6" />
              </button>
              <Link
                to="/relatorios"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500"
                activeProps={{ className: "text-primary dark:text-[#3b82f6]" }}
              >
                <LineChart className="w-5 h-5" />
                <span className="text-[10px]">Relatórios</span>
              </Link>
              <Link
                to="/ajustes"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500"
                activeProps={{ className: "text-primary dark:text-[#3b82f6]" }}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="text-[10px]">Ajustes</span>
              </Link>
            </nav>
          )}

          {/* BALÃO FLUTUANTE DA IA ASSISTENTE FINANCEIRO */}
          <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex items-center justify-center print:hidden">
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

          {/* MODAL 1: Nova Despesa / Receita / Despesa Cartão */}
          <Dialog open={isAddTxOpen} onOpenChange={setIsAddTxOpen}>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border border-border rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {txType === "income" ? "Nova Receita" : txType === "card" ? "Despesa Cartão" : "Nova Despesa"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleQuickAddTx} className="space-y-4 pt-3 text-xs">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700 dark:text-slate-300">Descrição</Label>
                  <Input
                    type="text"
                    placeholder="Ex: Supermercado, Salário, etc."
                    value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)}
                    className="rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary text-xs h-9 text-foreground"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700 dark:text-slate-300">Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary text-xs h-9 font-bold text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700 dark:text-slate-300">Data</Label>
                    <Input
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary text-xs h-9 text-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700 dark:text-slate-300">Categoria</Label>
                    <Select value={txCategory} onValueChange={setTxCategory}>
                      <SelectTrigger className="rounded-xl border border-border text-xs h-9 bg-background text-foreground">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border">
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700 dark:text-slate-300">Conta</Label>
                    <Select value={txAccount} onValueChange={setTxAccount}>
                      <SelectTrigger className="rounded-xl border border-border text-xs h-9 bg-background text-foreground">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border">
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id} className="text-xs">
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {txType === "card" && (
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700 dark:text-slate-300">Qual Cartão?</Label>
                    <Select value={txCard} onValueChange={setTxCard}>
                      <SelectTrigger className="rounded-xl border border-border text-xs h-9 bg-background text-foreground">
                        <SelectValue placeholder="Selecione o cartão..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border">
                        <SelectItem value="Nubank" className="text-xs">Nubank</SelectItem>
                        <SelectItem value="Inter" className="text-xs">Inter</SelectItem>
                        <SelectItem value="Sicredi" className="text-xs">Sicredi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700 dark:text-slate-300">Tags (separadas por vírgula)</Label>
                  <Input
                    type="text"
                    placeholder="Ex: lazer, moto, mercado"
                    value={txTags}
                    onChange={(e) => setTxTags(e.target.value)}
                    className="rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary text-xs h-9 text-foreground"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">Efetivado</div>
                      <div className="text-[10px] text-slate-500">Marcar lançamento como pago/recebido</div>
                    </div>
                    <Switch checked={txEfetivado} onCheckedChange={setTxEfetivado} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">Fixar no resumo</div>
                      <div className="text-[10px] text-slate-500">Exibir este lançamento na lista do dashboard</div>
                    </div>
                    <Switch checked={txFixar} onCheckedChange={txFixar} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">Ignorar nos gráficos</div>
                      <div className="text-[10px] text-slate-500">Ocultar dos relatórios visuais</div>
                    </div>
                    <Switch checked={txIgnorar} onCheckedChange={setTxIgnorar} />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-10 rounded-xl text-xs mt-2 select-none">
                  Confirmar Lançamento
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* MODAL 2: Nova Transferência */}
          <Dialog open={isAddTransferOpen} onOpenChange={setIsAddTransferOpen}>
            <DialogContent className="sm:max-w-[400px] bg-card text-card-foreground border border-border rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-foreground">Nova Transferência</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleQuickAddTransfer} className="space-y-4 pt-3 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700 dark:text-slate-300">Conta Origem</Label>
                    <Select value={transferOrigin} onValueChange={setTransferOrigin}>
                      <SelectTrigger className="rounded-xl border border-border text-xs h-9 bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border">
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id} className="text-xs">
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700 dark:text-slate-300">Conta Destino</Label>
                    <Select value={transferDest} onValueChange={setTransferDest}>
                      <SelectTrigger className="rounded-xl border border-border text-xs h-9 bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border">
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id} className="text-xs">
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700 dark:text-slate-300">Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary text-xs h-9 font-bold text-foreground"
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-10 rounded-xl text-xs mt-2 select-none">
                  Realizar Transferência
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* MODAL 3: Nova Conta */}
          <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
            <DialogContent className="sm:max-w-[400px] bg-card text-card-foreground border border-border rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-foreground">Nova Conta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleQuickAddAccount} className="space-y-4 pt-3 text-xs">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700 dark:text-slate-300">Nome da Conta</Label>
                  <Input
                    type="text"
                    placeholder="Ex: Banco do Brasil, Poupança Caixa"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary text-xs h-9 text-foreground"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700 dark:text-slate-300">Saldo Inicial (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={accountInitialBalance}
                      onChange={(e) => setAccountInitialBalance(e.target.value)}
                      className="rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary text-xs h-9 font-bold text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700 dark:text-slate-300">Tipo de Conta</Label>
                    <Select value={accountType} onValueChange={setAccountType}>
                      <SelectTrigger className="rounded-xl border border-border text-xs h-9 bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border">
                        <SelectItem value="Conta Corrente" className="text-xs">Conta Corrente</SelectItem>
                        <SelectItem value="Poupança" className="text-xs">Poupança</SelectItem>
                        <SelectItem value="Investimentos" className="text-xs">Investimentos</SelectItem>
                        <SelectItem value="Dinheiro" className="text-xs">Dinheiro</SelectItem>
                        <SelectItem value="Outros" className="text-xs">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700 dark:text-slate-300">Cor do Destaque</Label>
                  <Select value={accountColor} onValueChange={setAccountColor}>
                    <SelectTrigger className="rounded-xl border border-border text-xs h-9 bg-background text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border">
                      <SelectItem value="blue" className="text-xs text-blue-600 font-semibold">Azul Royal</SelectItem>
                      <SelectItem value="emerald" className="text-xs text-emerald-600 font-semibold">Verde Esmeralda</SelectItem>
                      <SelectItem value="purple" className="text-xs text-purple-600 font-semibold">Roxo Premium</SelectItem>
                      <SelectItem value="amber" className="text-xs text-amber-600 font-semibold">Ambar/Laranja</SelectItem>
                      <SelectItem value="rose" className="text-xs text-rose-600 font-semibold">Vermelho Rose</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-10 rounded-xl text-xs mt-2 select-none">
                  Criar Conta
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </QueryClientProvider>
  );
}

{/* Shared Header Component */}
interface MainHeaderProps {
  selectedMonth: string;
  onMonthChange: (m: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenModal: (type: "income" | "expense" | "card" | "transfer" | "account") => void;
  onLogout: () => void;
  isMobile: boolean;
  menuOpen: boolean;
  setMenuOpen: (o: boolean) => void;
}

function MainHeader({
  selectedMonth,
  onMonthChange,
  searchQuery,
  onSearchChange,
  onOpenModal,
  onLogout,
  isMobile,
  menuOpen,
  setMenuOpen,
}: MainHeaderProps) {
  const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const formatMonthName = (ym: string) => {
    if (!ym) return "";
    const [y, m] = ym.split("-");
    const mName = MONTH_NAMES[parseInt(m, 10) - 1] || m;
    return `${mName} ${y}`;
  };

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    let newM = m - 1;
    let newY = y;
    if (newM === 0) {
      newM = 12;
      newY = y - 1;
    }
    const mStr = newM < 10 ? `0${newM}` : `${newM}`;
    onMonthChange(`${newY}-${mStr}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    let newM = m + 1;
    let newY = y;
    if (newM === 13) {
      newM = 1;
      newY = y + 1;
    }
    const mStr = newM < 10 ? `0${newM}` : `${newM}`;
    onMonthChange(`${newY}-${mStr}`);
  };

  return (
    <header className="h-16 border-b border-border bg-card text-card-foreground flex items-center justify-between px-4 sm:px-6 z-30 relative w-full flex-shrink-0 print:hidden select-none">
      {/* Esquerda: Menu (mobile) + Mês de Referência */}
      <div className="flex items-center gap-3">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
            className="hover:bg-muted text-slate-500 dark:text-slate-300 h-9 w-9"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        )}

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8 hover:bg-muted text-slate-500 dark:text-slate-300 rounded-lg"
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
          </Button>
          <span className="text-xs sm:text-sm font-bold text-foreground min-w-[80px] sm:min-w-[100px] text-center">
            {formatMonthName(selectedMonth)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8 hover:bg-muted text-slate-500 dark:text-slate-300 rounded-lg"
          >
            <ChevronUp className="w-4 h-4 rotate-90" />
          </Button>
        </div>
      </div>

      {/* Direita: Busca, Adição Rápida (+), Notificações, Perfil */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Busca */}
        <div className="relative hidden md:block w-40 lg:w-56">
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-muted text-foreground text-xs rounded-xl pl-8 pr-3 py-1.5 border border-border outline-none focus:ring-1 focus:ring-primary focus:bg-background placeholder:text-slate-400"
          />
          <div className="absolute left-2.5 top-2.5 text-slate-400">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Adição Rápida */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="rounded-full bg-primary hover:bg-primary/95 text-white h-9 w-9 p-0 sm:h-9 sm:w-auto sm:px-4 flex items-center justify-center gap-1 shadow select-none">
              <Plus className="w-5 h-5 flex-shrink-0" />
              <span className="hidden sm:inline text-xs font-bold">Lançar</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 bg-card border border-border">
            <DropdownMenuItem onClick={() => onOpenModal("expense")} className="text-xs font-semibold cursor-pointer py-2 text-rose-600 dark:text-rose-400 hover:bg-muted">
              Nova Despesa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenModal("card")} className="text-xs font-semibold cursor-pointer py-2 text-amber-600 dark:text-amber-400 hover:bg-muted">
              Despesa Cartão
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenModal("income")} className="text-xs font-semibold cursor-pointer py-2 text-emerald-600 dark:text-emerald-400 hover:bg-muted">
              Nova Receita
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenModal("transfer")} className="text-xs font-semibold cursor-pointer py-2 text-blue-600 dark:text-blue-400 hover:bg-muted">
              Transferência
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenModal("account")} className="text-xs font-semibold cursor-pointer py-2 text-purple-600 dark:text-purple-400 hover:bg-muted">
              Nova Conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notificações */}
        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted text-slate-500 dark:text-slate-300 relative rounded-lg">
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </Button>

        {/* Perfil */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700 outline-none hover:ring-2 hover:ring-primary/50 transition-all select-none cursor-pointer">
              CM
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-card border border-border">
            <DropdownMenuItem onClick={onLogout} className="text-xs font-bold text-red-500 dark:text-red-400 cursor-pointer py-2 hover:bg-red-50 dark:hover:bg-red-950/20">
              Sair da Conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
