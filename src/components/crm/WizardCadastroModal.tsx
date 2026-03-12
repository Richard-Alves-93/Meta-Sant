import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Customer, Pet, Product } from "@/lib/crm-data";
import { User, PawPrint, Package, ArrowRight, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ProductCombobox from "./ProductCombobox";

interface WizardCadastroModalProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  onSaveCompleto: (
    tutor: Omit<Customer, 'id'>, 
    pets: Omit<Pet, 'id' | 'customer_id'>[], 
    purchases: {petIndex: number, product_id: string, product_name: string, data_compra: string}[]
  ) => Promise<void>;
}

export default function WizardCadastroModal({ open, onClose, products, onSaveCompleto }: WizardCadastroModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Tutor
  const [tutor, setTutor] = useState({ nome: '', telefone: '', whatsapp: '', email: '', observacoes: '' });
  
  // Step 2: Pets
  const [pets, setPets] = useState([{ 
    nome: '', especie: '', raca: '', data_aniversario: '', sexo: '', porte: '', peso: '' 
  }]);

  // Step 3: Purchases
  const [purchases, setPurchases] = useState([{
    petIndex: 0,
    product_id: '',
    product_name: '',
    data_compra: format(new Date(), 'yyyy-MM-dd')
  }]);

  const resetForm = () => {
    setStep(1);
    setTutor({ nome: '', telefone: '', whatsapp: '', email: '', observacoes: '' });
    setPets([{ nome: '', especie: '', raca: '', data_aniversario: '', sexo: '', porte: '', peso: '' }]);
    setPurchases([{ petIndex: 0, product_id: '', product_name: '', data_compra: format(new Date(), 'yyyy-MM-dd') }]);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const nextStep = () => {
    if (step === 1 && !tutor.nome.trim()) {
      toast.error("O nome do tutor é obrigatório.");
      return;
    }
    if (step === 2) {
      const emptyPet = pets.find(p => !p.nome.trim());
      if (emptyPet) {
        toast.error("Todos os pets devem ter pelo menos o nome preenchido.");
        return;
      }
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSave = async () => {
    if (loading) return;
    // Filter out purchases without product info
    const validPurchases = purchases.filter(p => p.product_id || p.product_name.trim());
    
    // Validate: if a purchase form exists with no product info, show error
    const invalidPurchase = purchases.find(p => !p.product_id && !p.product_name.trim());
    if (purchases.length > 0 && invalidPurchase && purchases.some(p => p.product_id || p.product_name.trim())) {
      // Only warn if there are mixed valid/invalid
    }
    
    setLoading(true);
    try {
      await onSaveCompleto(tutor, pets.map(p => ({ ...p, peso: p.peso ? Number(p.peso) : null })) as Omit<Pet, 'id' | 'customer_id'>[], validPurchases);
      toast.success("Cadastro completo realizado com sucesso!");
      handleClose();
    } catch (err) {
      toast.error("Ocorreu um erro ao salvar o cadastro completo.");
    } finally {
      setLoading(false);
    }
  };

  const addPetForm = () => {
    setPets([...pets, { nome: '', especie: '', raca: '', data_aniversario: '', sexo: '', porte: '', peso: '' }]);
  };

  const removePetForm = (index: number) => {
    if (pets.length === 1) return;
    setPets(pets.filter((_, i) => i !== index));
    // Remove associacoes de compras deste pet
    setPurchases(purchases.filter(p => p.petIndex !== index).map(p => ({
      ...p,
      petIndex: p.petIndex > index ? p.petIndex - 1 : p.petIndex
    })));
  };

  const addPurchaseForm = () => {
    setPurchases([...purchases, { petIndex: 0, product_id: '', product_name: '', data_compra: format(new Date(), 'yyyy-MM-dd') }]);
  };

  const removePurchaseForm = (index: number) => {
    setPurchases(purchases.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            Novo Cadastro Integrado
          </DialogTitle>
          <DialogDescription>
            Adicione o tutor, os animais e inicie os ciclos de recompra de uma só vez.
          </DialogDescription>
        </DialogHeader>

        {/* Wizard Progress */}
        <div className="flex items-center justify-between mb-8 mt-4 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary -z-10 rounded-full">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300" 
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
          
          {[
            { num: 1, label: "Tutor", icon: <User size={16} /> },
            { num: 2, label: "Pets", icon: <PawPrint size={16} /> },
            { num: 3, label: "Produtos", icon: <Package size={16} /> }
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-2 bg-background px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${step >= s.num ? 'bg-primary border-primary text-primary-foreground' : 'bg-secondary border-border text-muted-foreground'}`}>
                {step > s.num ? <Check size={20} /> : s.icon}
              </div>
              <span className={`text-xs font-medium ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="py-4">
          {/* STEP 1: TUTOR */}
          <div className={step === 1 ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nomeTutor">Nome Completo *</Label>
                <Input 
                  id="nomeTutor" 
                  value={tutor.nome} 
                  onChange={e => setTutor({...tutor, nome: e.target.value})} 
                  placeholder="Ex: João da Silva" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input 
                  id="whatsapp" 
                  value={tutor.whatsapp} 
                  onChange={e => setTutor({...tutor, whatsapp: e.target.value})} 
                  placeholder="Ex: 51999999999" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone Fixo (Opcional)</Label>
                <Input 
                  id="telefone" 
                  value={tutor.telefone} 
                  onChange={e => setTutor({...tutor, telefone: e.target.value})} 
                  placeholder="Ex: 5133333333" 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={tutor.email} 
                  onChange={e => setTutor({...tutor, email: e.target.value})} 
                  placeholder="joao@exemplo.com" 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="observacoes">Observações (Opcional)</Label>
                <Input 
                  id="observacoes" 
                  value={tutor.observacoes} 
                  onChange={e => setTutor({...tutor, observacoes: e.target.value})} 
                  placeholder="Informações adicionais sobre o cliente..." 
                />
              </div>
            </div>
          </div>

          {/* STEP 2: PETS */}
          <div className={step === 2 ? 'block' : 'hidden'}>
            {pets.map((pet, index) => (
              <div key={index} className="bg-secondary/30 border border-border rounded-lg p-4 mb-4 relative">
                 {pets.length > 1 && (
                  <button 
                    onClick={() => removePetForm(index)}
                    className="absolute top-2 right-2 p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 rounded-md transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
                
                <h4 className="font-semibold text-sm mb-4">Pet #{index + 1}</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Nome do Pet *</Label>
                    <Input 
                      value={pet.nome} 
                      onChange={e => {
                        const newPets = [...pets];
                        newPets[index].nome = e.target.value;
                        setPets(newPets);
                      }} 
                      placeholder="Ex: Rex" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Espécie</Label>
                    <Select value={pet.especie} onValueChange={(val) => {
                      const newPets = [...pets];
                      newPets[index].especie = val;
                      setPets(newPets);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cachorro">Cachorro</SelectItem>
                        <SelectItem value="Gato">Gato</SelectItem>
                        <SelectItem value="Pássaro">Pássaro</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Raça (Opcional)</Label>
                    <Input 
                      value={pet.raca} 
                      onChange={e => {
                        const newPets = [...pets];
                        newPets[index].raca = e.target.value;
                        setPets(newPets);
                      }} 
                      placeholder="Ex: Poodle" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Porte</Label>
                    <Select value={pet.porte} onValueChange={(val) => {
                      const newPets = [...pets];
                      newPets[index].porte = val;
                      setPets(newPets);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pequeno">Pequeno</SelectItem>
                        <SelectItem value="Médio">Médio</SelectItem>
                        <SelectItem value="Grande">Grande</SelectItem>
                        <SelectItem value="Gigante">Gigante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            
            <Button type="button" variant="outline" onClick={addPetForm} className="w-full border-dashed">
              <Plus size={16} className="mr-2" /> Adicionar outro pet
            </Button>
          </div>

          {/* STEP 3: PRODUTOS / RECOMPRA */}
          <div className={step === 3 ? 'block' : 'hidden'}>
            <p className="text-sm text-muted-foreground mb-4">
              Deseja já registrar as compras recorrentes (ração, vermífugo) que este cliente está levando hoje?
            </p>
            
            {purchases.map((purchase, index) => (
              <div key={index} className="bg-secondary/30 border border-border rounded-lg p-4 mb-4 relative">
                <button 
                  onClick={() => removePurchaseForm(index)}
                  className="absolute top-2 right-2 p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
                
                <h4 className="font-semibold text-sm mb-4">Primeira Compra #{index + 1}</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Para qual pet?</Label>
                    <Select 
                      value={purchase.petIndex.toString()} 
                      onValueChange={(val) => {
                        const newP = [...purchases];
                        newP[index].petIndex = parseInt(val);
                        setPurchases(newP);
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione o pet" /></SelectTrigger>
                      <SelectContent>
                        {pets.map((p, i) => (
                          <SelectItem key={i} value={i.toString()}>{p.nome || `Pet ${i+1}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Produto</Label>
                    <Select 
                      value={purchase.product_id} 
                      onValueChange={(val) => {
                        const newP = [...purchases];
                        newP[index].product_id = val;
                        setPurchases(newP);
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                        {products.length === 0 && (
                          <SelectItem value="none" disabled>Nenhum produto cadastrado no sistema</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Data da Compra</Label>
                    <Input 
                      type="date" 
                      value={purchase.data_compra} 
                      onChange={e => {
                        const newP = [...purchases];
                        newP[index].data_compra = e.target.value;
                        setPurchases(newP);
                      }} 
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addPurchaseForm} className="w-full border-dashed" disabled={products.length === 0}>
              <Plus size={16} className="mr-2" /> Adicionar outra compra para este Tutor
            </Button>
            {products.length === 0 && (
              <p className="text-xs text-amber-600 mt-2 text-center">Cadastre produtos na aba Produtos primeiro.</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t border-border pt-4 mt-2">
          <Button variant="ghost" onClick={step === 1 ? handleClose : prevStep} disabled={loading}>
            {step === 1 ? "Cancelar" : "Voltar"}
          </Button>
          
          {step < 3 ? (
            <Button onClick={nextStep}>
              Próximo <ArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
              {loading ? "Salvando..." : "Salvar Cadastro Completo"} <Check size={16} className="ml-2" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
