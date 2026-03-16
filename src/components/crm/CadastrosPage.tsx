import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, PawPrint, PackageSearch, Plus, Edit2, Trash2 } from "lucide-react";
import { 
  Customer, Pet, Product,
  fetchCustomers, addCustomer, updateCustomer, deleteCustomer,
  fetchPets, addPet, updatePet, deletePet,
  fetchProducts, addProduct, updateProduct, deleteProduct,
  findOrCreateProduct
} from "@/lib/crm-data";
import { toast } from "sonner";
import ClienteModal from "./ClienteModal";
import PetModal from "./PetModal";
import ProdutoModal from "./ProdutoModal";
import WizardCadastroModal from "./WizardCadastroModal";
import { startNewPurchaseCycle } from "@/lib/crm-data";

const CadastrosPage = () => {
  const [activeTab, setActiveTab] = useState("clientes");
  
  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state - Clientes
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Customer | null>(null);

  // Modal state - Pets
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  // Modal state - Produtos
  const [produtoModalOpen, setProdutoModalOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Product | null>(null);

  // Modal state - Wizard
  const [wizardModalOpen, setWizardModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p, prod] = await Promise.all([
        fetchCustomers(),
        fetchPets(),
        fetchProducts()
      ]);
      setCustomers(c);
      setPets(p);
      setProducts(prod);
    } catch (error: any) {
      console.error("Error loading cadastros:", error);
      toast.error(`Erro ao carregar dados: ${error?.message || "Erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- Handlers: Clientes ----
  const handleSaveCliente = async (customer: Omit<Customer, 'id'>) => {
    try {
      if (editingCliente) {
        await updateCustomer(editingCliente.id, customer);
        toast.success("Cliente atualizado!");
      } else {
        await addCustomer(customer);
        toast.success("Cliente criado!");
      }
      setClienteModalOpen(false);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar cliente.");
    }
  };

  const handleDeleteCliente = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este cliente? Pets vinculados também serão removidos.")) return;
    try {
      await deleteCustomer(id);
      toast.success("Cliente removido!");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover cliente.");
    }
  };

  // ---- Handlers: Pets ----
  const handleSavePet = async (pet: Omit<Pet, 'id'>) => {
    try {
      const sanitizedPet = sanitizePetData(pet);
      if (editingPet) {
        await updatePet(editingPet.id, sanitizedPet);
        toast.success("Pet atualizado!");
      } else {
        await addPet(sanitizedPet);
        toast.success("Pet adicionado!");
      }
      setPetModalOpen(false);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar pet.");
    }
  };

  const handleDeletePet = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este pet?")) return;
    try {
      await deletePet(id);
      toast.success("Pet removido!");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover pet.");
    }
  };

  // ---- Handlers: Produtos ----
  const handleSaveProduto = async (product: Omit<Product, 'id'>) => {
    try {
      if (editingProduto) {
        await updateProduct(editingProduto.id, product);
        toast.success("Produto atualizado!");
      } else {
        await addProduct(product);
        toast.success("Produto criado!");
      }
      setProdutoModalOpen(false);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar produto.");
    }
  };

  const handleDeleteProduto = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este produto? O histórico de compras será mantido, mas não será possível vinculá-lo a novas.")) return;
    try {
      await deleteProduct(id);
      toast.success("Produto removido!");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover produto.");
    }
  };

  // Helper: Converter strings vazias em null para campos de data
  const sanitizePetData = (pet: Omit<Pet, 'id'>) => ({
    ...pet,
    data_aniversario: pet.data_aniversario?.trim() ? pet.data_aniversario : null,
    peso: pet.peso ? Number(pet.peso) : null
  });

  const handleSaveCadastroCompleto = async (
    tutor: Omit<Customer, 'id'>,
    petsList: Omit<Pet, 'id' | 'customer_id'>[],
    purchasesList: {petIndex: number, product_id: string, product_name: string, prazo_recompra: number, data_compra: string}[]
  ) => {
    try {
      console.log("=== Iniciando cadastro completo ===");
      console.log("Tutor:", tutor);
      console.log("Pets:", petsList);
      console.log("Compras:", purchasesList);

      // 1. Salvar Tutor
      console.log("Step 1: Salvando tutor...");
      const newCustomer = await addCustomer(tutor);
      if (!newCustomer || !newCustomer.id) {
        throw new Error("Tutor não foi criado corretamente - sem ID retornado");
      }
      console.log("✓ Tutor criado com ID:", newCustomer.id);

      // 2. Salvar Pets
      console.log("Step 2: Salvando pets...");
      const createdPets: Pet[] = [];
      for (let i = 0; i < petsList.length; i++) {
        const p = petsList[i];
        if (!p.nome.trim()) {
          console.warn(`Pet ${i} sem nome, pulando...`);
          continue;
        }
        console.log(`Salvando pet ${i + 1}/${petsList.length}:`, p.nome);
        const sanitizedPet = sanitizePetData({ ...p, customer_id: newCustomer.id });
        const savedPet = await addPet(sanitizedPet);
        if (savedPet && savedPet.id) {
          createdPets.push(savedPet);
          console.log(`✓ Pet "${p.nome}" criado com ID:`, savedPet.id);
        } else {
          console.error(`Erro ao salvar pet ${p.nome} - sem ID retornado`);
          throw new Error(`Pet "${p.nome}" não foi criado corretamente`);
        }
      }
      console.log(`✓ ${createdPets.length} pets criados`);

      if (createdPets.length === 0 && petsList.length > 0) {
        throw new Error("Nenhum pet foi criado com sucesso");
      }

      // 3. Salvar Compras
      console.log("Step 3: Salvando compras recorrentes...");
      let comprasCount = 0;
      for (let i = 0; i < purchasesList.length; i++) {
        const purchase = purchasesList[i];

        // Skip empty purchases
        if (!purchase.product_id && !purchase.product_name.trim()) {
          console.log(`Compra ${i} vazia, pulando...`);
          continue;
        }

        console.log(`Processando compra ${i + 1}/${purchasesList.length}...`);

        // Validar índice do pet
        if (purchase.petIndex < 0 || purchase.petIndex >= createdPets.length) {
          throw new Error(`Índice de pet inválido (${purchase.petIndex}) na compra ${i + 1}. Apenas ${createdPets.length} pets criados.`);
        }

        const targetPet = createdPets[purchase.petIndex];
        if (!targetPet || !targetPet.id) {
          throw new Error(`Pet inválido para compra recorrente ${i + 1} (índice ${purchase.petIndex})`);
        }
        console.log(`Compra vinculada ao pet: ${targetPet.nome} (ID: ${targetPet.id})`);

        // Validar prazo de recompra
        if (!purchase.prazo_recompra || purchase.prazo_recompra < 1) {
          throw new Error(`Compra ${i + 1}: Prazo de recompra inválido (${purchase.prazo_recompra}). Deve ser mínimo 1 dia.`);
        }
        console.log(`Prazo de recompra: ${purchase.prazo_recompra} dias`);

        // Validar data de compra
        if (!purchase.data_compra) {
          throw new Error(`Compra ${i + 1}: Data da compra não informada`);
        }
        console.log(`Data da compra: ${purchase.data_compra}`);

        // Resolve product_id: use existing or create new
        let productId = purchase.product_id;
        let productName = purchase.product_name;

        if (!productId) {
          if (!productName.trim()) {
            throw new Error(`Compra ${i + 1}: Produto não informado`);
          }
          console.log(`Procurando/criando produto: ${productName}...`);
          const product = await findOrCreateProduct(productName.trim());
          if (!product || !product.id) {
            throw new Error(`Falha ao criar/encontrar produto "${productName}"`);
          }
          productId = product.id;
          console.log(`✓ Produto encontrado/criado com ID: ${productId}`);
        }

        // Salvar ciclo de compra com prazo_recompra explícito
        console.log(`Criando ciclo de compra para pet ${targetPet.nome}...`);
        await startNewPurchaseCycle(targetPet.id, productId, purchase.data_compra, purchase.prazo_recompra);
        comprasCount++;
        console.log(`✓ Compra ${i + 1} criada com sucesso`);
      }

      console.log(`✓ ${comprasCount} compras criadas`);
      console.log("=== Cadastro completo salvo com sucesso ===");

      // Recarregar dados
      console.log("Recarregando dados...");
      await loadData();
      console.log("✓ Dados recarregados");

    } catch (err: any) {
      console.error("❌ Erro ao salvar cadastro completo:", err);
      console.error("Stack:", err.stack);
      throw new Error(err.message || "Erro desconhecido ao salvar cadastro completo");
    }
  };

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.nome || "Desconhecido";

  if (loading && customers.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">Carregando cadastros...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Cadastros</h1>
        <p className="text-muted-foreground text-sm">Gerencie clientes, pets e produtos recorrentes</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl bg-secondary/50 p-1">
          <TabsTrigger value="clientes" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex gap-2">
            <Users size={16} />
            <span className="hidden sm:inline">Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="pets" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex gap-2">
            <PawPrint size={16} />
            <span className="hidden sm:inline">Pets</span>
          </TabsTrigger>
          <TabsTrigger value="produtos" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex gap-2">
            <PackageSearch size={16} />
            <span className="hidden sm:inline">Produtos</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 bg-card border border-border rounded-xl p-6 shadow-sm min-h-[500px]">
          
          {/* TAB: CLIENTES */}
          <TabsContent value="clientes" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-foreground">Lista de Clientes</h2>
              <button 
                onClick={() => setWizardModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus size={16} /> Novo Cadastro Completo
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">Nome</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">WhatsApp</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 hidden md:table-cell">Email</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Nenhum cliente cadastrado</td></tr>
                  ) : customers.map(c => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium">{c.nome}</td>
                      <td className="py-3 px-4 text-sm">{c.whatsapp || c.telefone || '-'}</td>
                      <td className="py-3 px-4 text-sm hidden md:table-cell">{c.email || '-'}</td>
                      <td className="py-3 px-4 text-sm text-center">
                        <button onClick={() => { setEditingCliente(c); setClienteModalOpen(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors mr-2"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteCliente(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          {/* TAB: PETS */}
          <TabsContent value="pets" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-foreground">Lista de Pets</h2>
              <button 
                onClick={() => { setEditingPet(null); setPetModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus size={16} /> Adicionar Pet
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">Nome do Pet</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">Tutor</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 hidden sm:table-cell">Espécie/Raça</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pets.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Nenhum pet cadastrado</td></tr>
                  ) : pets.map(p => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium">{p.nome}</td>
                      <td className="py-3 px-4 text-sm">{getCustomerName(p.customer_id)}</td>
                      <td className="py-3 px-4 text-sm hidden sm:table-cell">{p.especie}{p.raca ? ` - ${p.raca}` : ''}</td>
                      <td className="py-3 px-4 text-sm text-center">
                        <button onClick={() => { setEditingPet(p); setPetModalOpen(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors mr-2"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeletePet(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          {/* TAB: PRODUTOS */}
          <TabsContent value="produtos" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-foreground">Produtos Recorrentes</h2>
              <button 
                onClick={() => { setEditingProduto(null); setProdutoModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus size={16} /> Novo Produto
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">Produto</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">Categoria</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4">Prazo Padrão</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 hidden md:table-cell">Aviso (Dias)</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Nenhum produto cadastrado</td></tr>
                  ) : products.map(p => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium">{p.nome}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">{p.categoria || 'Geral'}</span>
                      </td>
                      <td className="py-3 px-4 text-sm">{p.prazo_recompra_dias} dias</td>
                      <td className="py-3 px-4 text-sm hidden md:table-cell">{p.dias_aviso_previo} dias antes</td>
                      <td className="py-3 px-4 text-sm text-center">
                        <button onClick={() => { setEditingProduto(p); setProdutoModalOpen(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors mr-2"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteProduto(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Modals */}
      <ClienteModal 
        open={clienteModalOpen} 
        onClose={() => setClienteModalOpen(false)} 
        onSave={handleSaveCliente}
        editingCustomer={editingCliente}
      />
      
      <PetModal 
        open={petModalOpen} 
        onClose={() => setPetModalOpen(false)} 
        onSave={handleSavePet}
        editingPet={editingPet}
        customers={customers}
      />

      <ProdutoModal 
        open={produtoModalOpen} 
        onClose={() => setProdutoModalOpen(false)} 
        onSave={handleSaveProduto}
        editingProduct={editingProduto}
      />

      <WizardCadastroModal
        open={wizardModalOpen}
        onClose={() => setWizardModalOpen(false)}
        products={products}
        onSaveCompleto={handleSaveCadastroCompleto}
      />
    </div>
  );
};

export default CadastrosPage;
