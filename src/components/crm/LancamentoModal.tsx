import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lancamento, formatCurrency } from "@/lib/crm-data";

interface LancamentoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: string, valorBruto: number, desconto: number) => void;
  editingLancamento?: Lancamento | null;
}

const LancamentoModal = ({ open, onClose, onSave, editingLancamento }: LancamentoModalProps) => {
  const [data, setData] = useState("");
  const [bruto, setBruto] = useState("");
  const [desconto, setDesconto] = useState("");

  useEffect(() => {
    if (editingLancamento) {
      setData(editingLancamento.data);
      setBruto(String(editingLancamento.valorBruto));
      setDesconto(String(editingLancamento.desconto));
    } else {
      setData(new Date().toISOString().split("T")[0]);
      setBruto(""); setDesconto("");
    }
  }, [editingLancamento, open]);

  const liquido = (parseFloat(bruto) || 0) - (parseFloat(desconto) || 0);

  const handleSave = () => {
    const v = parseFloat(bruto);
    if (!data || !v || v <= 0) return;
    onSave(data, v, parseFloat(desconto) || 0);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingLancamento ? "Editar Lançamento" : "Lançar Venda do Dia"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Valor Bruto (R$)</Label>
            <Input type="number" value={bruto} onChange={(e) => setBruto(e.target.value)} placeholder="0.00" step="0.01" />
          </div>
          <div className="space-y-2">
            <Label>Desconto (R$)</Label>
            <Input type="number" value={desconto} onChange={(e) => setDesconto(e.target.value)} placeholder="0.00" step="0.01" />
          </div>
          <div className="bg-secondary rounded-lg p-3 text-sm">
            Valor Líquido: <span className="font-bold text-card-foreground">{formatCurrency(liquido)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LancamentoModal;
