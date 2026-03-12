import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Pet, Customer } from "@/lib/crm-data";

interface PetModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (pet: Omit<Pet, 'id'>) => Promise<void>;
  editingPet?: Pet | null;
  customers: Customer[]; // Need to select a customer for the pet
}

const PetModal = ({ open, onClose, onSave, editingPet, customers }: PetModalProps) => {
  const [nome, setNome] = useState("");
  const [especie, setEspecie] = useState("Cachorro");
  const [raca, setRaca] = useState("");
  const [dataAniversario, setDataAniversario] = useState("");
  const [sexo, setSexo] = useState("Macho");
  const [porte, setPorte] = useState("Médio");
  const [peso, setPeso] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingPet) {
      setNome(editingPet.nome);
      setEspecie(editingPet.especie || "Cachorro");
      setRaca(editingPet.raca || "");
      setDataAniversario(editingPet.data_aniversario || "");
      setSexo(editingPet.sexo || "Macho");
      setPorte(editingPet.porte || "Médio");
      setPeso(editingPet.peso ? editingPet.peso.toString() : "");
      setCustomerId(editingPet.customer_id);
    } else {
      setNome("");
      setEspecie("Cachorro");
      setRaca("");
      setDataAniversario("");
      setSexo("Macho");
      setPorte("Médio");
      setPeso("");
      setCustomerId("");
    }
  }, [editingPet, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !customerId) return;

    setLoading(true);
    try {
      await onSave({
        nome,
        customer_id: customerId,
        especie: especie || null,
        raca: raca || null,
        data_aniversario: dataAniversario || null,
        sexo: sexo || null,
        porte: porte || null,
        peso: peso ? parseFloat(peso) : null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[500px]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {editingPet ? "Editar Pet" : "Novo Pet"}
          </h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-foreground">Tutor *</label>
              <select 
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>Selecione o tutor</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome do Pet *</label>
              <input 
                required
                type="text" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Rex"
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Espécie</label>
              <select 
                value={especie}
                onChange={(e) => setEspecie(e.target.value)}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Cachorro">Cachorro</option>
                <option value="Gato">Gato</option>
                <option value="Pássaro">Pássaro</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Raça</label>
              <input 
                type="text" 
                value={raca}
                onChange={(e) => setRaca(e.target.value)}
                placeholder="Ex: Poodle"
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Data de Aniversário</label>
              <input 
                type="date" 
                value={dataAniversario}
                onChange={(e) => setDataAniversario(e.target.value)}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Sexo</label>
              <select 
                value={sexo}
                onChange={(e) => setSexo(e.target.value)}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Macho">Macho</option>
                <option value="Fêmea">Fêmea</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Porte</label>
              <select 
                value={porte}
                onChange={(e) => setPorte(e.target.value)}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Pequeno">Pequeno</option>
                <option value="Médio">Médio</option>
                <option value="Grande">Grande</option>
                <option value="Gigante">Gigante</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Peso (kg)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="Ex: 5.5"
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading || !nome.trim() || !customerId}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PetModal;
