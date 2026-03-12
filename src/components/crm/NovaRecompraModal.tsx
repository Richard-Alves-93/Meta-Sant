import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { Customer, Pet, Product, fetchCustomers, fetchPets, fetchProducts } from "@/lib/crm-data";

interface NovaRecompraModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { petId: string; productId: string; dataCompra: string }) => Promise<void>;
}

const NovaRecompraModal = ({ open, onClose, onSave }: NovaRecompraModalProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [dataCompra, setDataCompra] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      Promise.all([fetchCustomers(), fetchPets(), fetchProducts()]).then(([c, p, prod]) => {
        setCustomers(c);
        setPets(p);
        setProducts(prod);
      });
      // Reset state
      setSelectedCustomerId("");
      setSelectedPetId("");
      setSelectedProductId("");
      setDataCompra(new Date().toISOString().split('T')[0]);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetId || !selectedProductId || !dataCompra) return;

    setLoading(true);
    try {
      await onSave({
        petId: selectedPetId,
        productId: selectedProductId,
        dataCompra
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const filteredPets = pets.filter(p => !selectedCustomerId || p.customer_id === selectedCustomerId);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Iniciar Novo Ciclo de Recompra</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tutor (Opcional - Filtro)</label>
            <select 
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setSelectedPetId(""); // Reset pet when customer changes
              }}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos os Tutores</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Pet *</label>
            <select 
              required
              value={selectedPetId}
              onChange={(e) => setSelectedPetId(e.target.value)}
              disabled={filteredPets.length === 0}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="" disabled>Selecione o Pet</option>
              {filteredPets.map(p => {
                const tutor = customers.find(c => c.id === p.customer_id);
                return (
                  <option key={p.id} value={p.id}>{p.nome} {tutor ? `(${tutor.nome})` : ''}</option>
                );
              })}
            </select>
            {filteredPets.length === 0 && <p className="text-xs text-red-500">Nenhum pet encontrado para este tutor.</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Produto Adquirido *</label>
            <select 
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>Selecione o produto</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} (Ciclo de {p.prazo_recompra_dias} dias)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Data da Compra Inicial *</label>
            <input 
              required
              type="date" 
              value={dataCompra}
              onChange={(e) => setDataCompra(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
            />
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
              disabled={loading || !selectedPetId || !selectedProductId || !dataCompra}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity disabled:opacity-50"
            >
              {loading ? "Iniciando..." : "Iniciar Ciclo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovaRecompraModal;
