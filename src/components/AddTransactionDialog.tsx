import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export function AddTransactionDialog({ onAdd }: { onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("paid");
  const [responsible, setResponsible] = useState("Os dois");

  // Novas configurações de cartão e tipo de custo
  const [costType, setCostType] = useState("variable"); // "fixed" ou "variable"
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" ou "card"
  const [cardId, setCardId] = useState("Nubank");
  const [isInstallments, setIsInstallments] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState("3");

  const [cards, setCards] = useState<string[]>(["Nubank", "Inter", "Sicredi"]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedCards = localStorage.getItem("cartoes_config");
        if (storedCards) {
          const parsed = JSON.parse(storedCards);
          setCards(parsed.map((c: any) => c.name));
          if (parsed.length > 0) {
            setCardId(parsed[0].name);
          }
        }
      } catch (e) {
        console.error("Error reading cards config:", e);
      }
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const baseAmount = parseFloat(amount);
      const isCard = type === "expense" && paymentMethod === "card";

      // Lógica de parcelamento automático
      if (isCard && isInstallments) {
        const instCount = parseInt(installmentsCount, 10) || 1;
        const batch = [];
        let remainingAmount = baseAmount;

        for (let i = 1; i <= instCount; i++) {
          let currentAmt = parseFloat((baseAmount / instCount).toFixed(2));
          if (i === instCount) {
            currentAmt = parseFloat(remainingAmount.toFixed(2));
          } else {
            remainingAmount -= currentAmt;
          }

          const instDate = new Date(date + "T00:00:00");
          instDate.setMonth(instDate.getMonth() + (i - 1));
          const dateString = instDate.toISOString().split("T")[0];

          const label = `[${i}/${instCount}] ${description}`;
          const metaData = {
            desc: label,
            costType,
            cardId,
            installment: { current: i, total: instCount }
          };

          const finalDesc = `[${responsible}] META_JSON:${JSON.stringify(metaData)}`;

          batch.push({
            user_id: user.id,
            type,
            description: finalDesc,
            amount: currentAmt,
            date: dateString,
            category,
            status: status === "paid" ? "paid" : "pending",
          });
        }

        const { error } = await supabase.from("transactions").insert(batch);
        if (error) throw error;
      } else {
        // Lógica simples (à vista / pix / receita)
        const metaData = {
          desc: description,
          costType: type === "expense" ? costType : "variable",
          cardId: isCard ? cardId : null
        };

        const finalDesc = type === "expense"
          ? `[${responsible}] META_JSON:${JSON.stringify(metaData)}`
          : `META_JSON:${JSON.stringify(metaData)}`;

        const { error } = await supabase.from("transactions").insert({
          user_id: user.id,
          type,
          description: finalDesc,
          amount: baseAmount,
          date,
          category,
          status: status === "paid" ? "paid" : "pending",
        });

        if (error) throw error;
      }

      setOpen(false);

      // Limpa o formulário
      setDescription("");
      setAmount("");
      setDate("");
      setCategory("");
      setResponsible("Os dois");
      setCostType("variable");
      setPaymentMethod("cash");
      setIsInstallments(false);
      setInstallmentsCount("3");

      onAdd();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full hover:scale-105 transition-transform bg-primary text-white shadow-lg h-12 px-6">
          <Plus className="mr-2 h-5 w-5" /> Novo Lançamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita (+)</SelectItem>
                  <SelectItem value="expense">Despesa (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Situação</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === "expense" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quem Gastou?</Label>
                <Select value={responsible} onValueChange={setResponsible}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jack">Jack</SelectItem>
                    <SelectItem value="Rangel">Rangel</SelectItem>
                    <SelectItem value="Os dois">Os dois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Classificação</Label>
                <Select value={costType} onValueChange={setCostType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="variable">Custo Variável</SelectItem>
                    <SelectItem value="fixed">Custo Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {type === "expense" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">PIX / Dinheiro</SelectItem>
                    <SelectItem value="card">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentMethod === "card" && (
                <div className="space-y-2">
                  <Label>Qual Cartão?</Label>
                  <Select value={cardId} onValueChange={setCardId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cards.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {type === "expense" && paymentMethod === "card" && (
            <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInstallments}
                  onChange={(e) => setIsInstallments(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                />
                Compra Parcelada?
              </label>
              {isInstallments && (
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-xs text-slate-500">Parcelas:</Label>
                  <Input
                    type="number"
                    min="2"
                    max="60"
                    required
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(e.target.value)}
                    className="w-20 h-8 text-center bg-white"
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Total (R$)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Input
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Casa - Mercado / Compras"
            />
          </div>

          <Button type="submit" className="w-full mt-4 bg-primary text-white hover:bg-primary/90" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Lançamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
