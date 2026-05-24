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
import { Pencil } from "lucide-react";

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

  const [type, setType] = useState(transaction?.type || "expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Pendente");
  const [responsible, setResponsible] = useState("Os dois");

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setDate(transaction.date);
      setCategory(transaction.category);
      setStatus(transaction.status === "paid" ? "Pago" : transaction.status === "pending" ? "Pendente" : transaction.status);

      let desc = transaction.description;
      let resp = "Os dois";

      if (desc.startsWith("[Jack] ")) {
        resp = "Jack";
        desc = desc.replace("[Jack] ", "");
      } else if (desc.startsWith("[Rangel] ")) {
        resp = "Rangel";
        desc = desc.replace("[Rangel] ", "");
      } else if (desc.startsWith("[Os dois] ")) {
        resp = "Os dois";
        desc = desc.replace("[Os dois] ", "");
      }

      setDescription(desc);
      setResponsible(resp);
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalDesc = type === "expense" ? `[${responsible}] ${description}` : description;

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
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === "expense" && (
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
              <Label>Valor (R$)</Label>
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
              <Label>Data / Vencimento</Label>
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

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
