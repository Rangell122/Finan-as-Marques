import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const parseMeta = (description: string) => {
  const raw = String(description || "");
  let responsible = "Os dois";
  let cleanDesc = raw;
  let costType = "variable";
  let cardId = null;
  let installment = null;

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
      if (meta.costType) costType = meta.costType;
      if (meta.cardId) cardId = meta.cardId;
      if (meta.installment) installment = meta.installment;
    } catch (e) {
      console.error("Error parsing META_JSON:", e);
      cleanDesc = remaining.substring(10);
    }
  } else if (remaining.startsWith("DEBT_JSON:")) {
    try {
      const meta = JSON.parse(remaining.substring(10));
      cleanDesc = `Dívida: ${meta.name || ""}`;
      costType = "fixed";
    } catch (e) {
      cleanDesc = "Dívida";
    }
  } else {
    cleanDesc = remaining;
  }

  return {
    cleanDesc,
    responsible,
    costType,
    cardId,
    installment
  };
};

export function EditTransactionDialog({
  transaction,
  onEdit,
  open,
  setOpen,
}: {
  transaction: any;
  onEdit: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Pendente");
  const [responsible, setResponsible] = useState("Os dois");

  // Novas configurações de cartão e tipo de custo
  const [costType, setCostType] = useState("variable"); // "fixed" ou "variable"
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" ou "card"
  const [cardId, setCardId] = useState("Nubank");
  const [installmentInfo, setInstallmentInfo] = useState<any>(null);

  const [cards, setCards] = useState<string[]>(["Nubank", "Inter", "Sicredi"]);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setDate(transaction.date);
      setCategory(transaction.category);
      
      // Handle status mapping
      const baseStatus = transaction.status === "paid" ? "Pago" : transaction.status === "pending" ? "Pendente" : transaction.status;
      
      // If status is pending but due date is in the past, render it as "Atrasado"
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(transaction.date);
      dueDate.setMinutes(dueDate.getMinutes() + dueDate.getTimezoneOffset());
      dueDate.setHours(0, 0, 0, 0);
      
      if (transaction.status === "pending" && dueDate < today) {
        setStatus("Atrasado");
      } else {
        setStatus(baseStatus);
      }

      const meta = parseMeta(transaction.description);
      setDescription(meta.cleanDesc);
      setResponsible(meta.responsible);
      setCostType(meta.costType);
      setPaymentMethod(meta.cardId ? "card" : "cash");
      if (meta.cardId) setCardId(meta.cardId);
      setInstallmentInfo(meta.installment);

      try {
        const storedCards = localStorage.getItem("cartoes_config");
        if (storedCards) {
          const parsed = JSON.parse(storedCards);
          setCards(parsed.map((c: any) => c.name));
        }
      } catch (e) {}
    }
  }, [transaction, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isCard = type === "expense" && paymentMethod === "card";

      const metaData = {
        desc: description,
        costType: type === "expense" ? costType : "variable",
        cardId: isCard ? cardId : null,
        installment: installmentInfo
      };

      const finalDesc = type === "expense"
        ? `[${responsible}] META_JSON:${JSON.stringify(metaData)}`
        : `META_JSON:${JSON.stringify(metaData)}`;

      const { error } = await supabase
        .from("transactions")
        .update({
          type,
          description: finalDesc,
          amount: parseFloat(amount),
          date,
          category,
          status: status === "Pago" ? "paid" : "pending",
        })
        .eq("id", transaction.id);

      if (error) throw error;

      setOpen(false);
      onEdit();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Lançamento</DialogTitle>
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
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
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

          {installmentInfo && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-[#1576D0] font-semibold">
              Esta é a parcela {installmentInfo.current} de {installmentInfo.total} deste lançamento.
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
              <Label>Valor Parcela / Lançamento (R$)</Label>
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
              placeholder="Ex: Alimentação"
            />
          </div>

          <Button type="submit" className="w-full mt-4 bg-primary text-white hover:bg-primary/90" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
