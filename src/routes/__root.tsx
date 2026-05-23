import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { LayoutDashboard, Receipt, PieChart, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Login } from "@/components/Login";

import appCss from "../styles.css?url";

function SidebarContent() {
  return (
    <div className="flex flex-col h-full py-8 px-4 space-y-8">
      <div className="flex items-center gap-2 px-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
          FM
        </div>
        <span className="text-xl font-bold tracking-tight">Finanças Marques</span>
      </div>
      <nav className="flex-1 space-y-2">
        <Link 
          to="/" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm font-medium"
          activeProps={{ className: "bg-secondary text-primary" }}
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>
        <Link 
          to="/transacoes" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm font-medium"
          activeProps={{ className: "bg-secondary text-primary" }}
        >
          <Receipt className="w-5 h-5" />
          Transações
        </Link>
        <Link 
          to="/" 
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm font-medium"
        >
          <PieChart className="w-5 h-5" />
          Relatórios
        </Link>
      </nav>
      <div className="mt-auto pt-8 border-t">
        <Button variant="ghost" className="w-full justify-start gap-3 px-3">
          <Settings className="w-5 h-5" />
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
      {
        rel: "stylesheet",
        href: appCss,
      },
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
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#fcfbf8]">Carregando...</div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-[#fcfbf8]">
        {!isMobile && (
          <aside className="w-64 border-r bg-white flex-shrink-0">
            <SidebarContent />
          </aside>
        )}
        
        <main className="flex-1 flex flex-col min-h-0">
          {isMobile && (
            <header className="h-16 border-b bg-white flex items-center justify-between px-4 flex-shrink-0">
              <span className="font-bold text-lg">Finanças Marques</span>
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
            </header>
          )}
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
          {isMobile && (
            <nav className="h-16 border-t bg-white flex items-center justify-around flex-shrink-0">
              <Link to="/" className="flex flex-col items-center gap-1 text-muted-foreground" activeProps={{ className: "text-primary" }}>
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px]">Início</span>
              </Link>
              <Link to="/transacoes" className="flex flex-col items-center gap-1 text-muted-foreground" activeProps={{ className: "text-primary" }}>
                <Receipt className="w-5 h-5" />
                <span className="text-[10px]">Transações</span>
              </Link>
              <Button size="icon" className="rounded-full w-10 h-10 -mt-8 shadow-lg">
                <Plus className="w-6 h-6" />
              </Button>
              <Link to="/" className="flex flex-col items-center gap-1 text-muted-foreground">
                <PieChart className="w-5 h-5" />
                <span className="text-[10px]">Gráficos</span>
              </Link>
              <Link to="/" className="flex flex-col items-center gap-1 text-muted-foreground">
                <Settings className="w-5 h-5" />
                <span className="text-[10px]">Ajustes</span>
              </Link>
            </nav>
          )}
        </main>
      </div>
    </QueryClientProvider>
  );
}
