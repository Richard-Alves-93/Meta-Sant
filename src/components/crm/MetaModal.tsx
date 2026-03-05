import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Meta } from "@/lib/crm-data";

interface MetaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (nome: string, valor: number, descricao: string) => void;
  editingMeta?: Meta | null;
}

const MetaModal = ({ open, onClose, onSave, editingMeta }: MetaModalProps) => {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    if (editingMeta) {
      setNome(editingMeta.nome);
      setValor(String(editingMeta.valor));
      setDescricao(editingMeta.descricao);
    } else {
      setNome(""); setValor(""); setDescricao("");
    }
  }, [editingMeta, open]);

  const handleSave = () => {
    const v = parseFloat(valor);
    if (!nome.trim() || !v || v <= 0) return;
    onSave(nome.trim(), v, descricao.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingMeta ? "Editar Meta" : "Nova Meta"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Meta</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Meta 230k" />
          </div>
          <div className="space-y-2">
            <Label>Valor da Meta (R$)</Label>
            <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="230000" step="0.01" />
          </div>
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da meta..." />
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

export default MetaModal;
