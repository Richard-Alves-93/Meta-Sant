import { supabase } from "@/integrations/supabase/client";
import { withErrorHandler, normalizeError, handleSupabaseError, validateCanDelete, executeSequential, CrmError } from "@/services/errorHandler";
import { formatDateBR, formatISODate, parseLocalDate, dateWithoutTime } from "@/utils/date";

export interface Meta {
  id: string;
  nome: string;
  valor: number;
  descricao: string;
}

export interface Lancamento {
  id: string;
  data: string;
  valorBruto: number;
  desconto: number;
  valorLiquido: number;
}

export interface Customer {
  id: string;
  nome: string;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  observacoes: string | null;
}

export interface Pet {
  id: string;
  customer_id: string;
  nome: string;
  especie: string | null;
  raca: string | null;
  data_aniversario: string | null;
  sexo: string | null;
  porte: string | null;
  peso: number | null;
}

export interface Product {
  id: string;
  nome: string;
  categoria: string | null;
  prazo_recompra_dias: number;
  dias_aviso_previo: number;
  mensagem_padrao: string | null;
}

export type PetPurchaseStatus = 'Ativo' | 'Avisar em breve' | 'Avisar hoje' | 'Notificado' | 'Recompra registrada' | 'Trocado' | 'Vencido' | 'Cancelado';

export interface PetPurchase {
  id: string;
  pet_id: string;
  product_id: string;
  data_compra: string;
  dias_recompra: number;
  proxima_data: string;
  dias_aviso_previo: number;
  data_lembrete: string;
  status: PetPurchaseStatus;
  purchase_history_id: string | null;

  // Relations for joining data
  pet?: Pet;
  product?: Product;
}

export type WorkMode = 'Segunda-sexta' | 'Segunda-sabado' | 'Todos os dias' | 'Personalizado';

export interface WorkSettings {
  id: string;
  user_id: string;
  work_mode: WorkMode;
  custom_schedule_json?: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
}

export interface CustomHoliday {
  id: string;
  user_id: string;
  data: string;
  descricao?: string | null;
  created_at: string;
}

export interface CrmDatabase {
  metas: Meta[];
  lancamentos: Lancamento[];
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date + 'T12:00:00'));
}

export function getLancamentosDoMes(db: CrmDatabase): Lancamento[] {
  const hoje = new Date();
  return db.lancamentos.filter(l => {
    const d = new Date(l.data);
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  });
}

export async function calcularVendasNecessarias(meta: Meta, lancamentos: Lancamento[], useWorkingDays: boolean = true) {
  const totalVendido = lancamentos.reduce((sum, l) => sum + l.valorLiquido, 0);
  const hoje = new Date();

  let diasRestantes: number;

  if (useWorkingDays) {
    try {
      diasRestantes = await getRemainingWorkingDays(hoje);
    } catch (error) {
      // Fallback to calendar days if working days calculation fails
      const diasMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
      diasRestantes = diasMes - hoje.getDate() + 1;
    }
  } else {
    const diasMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    diasRestantes = diasMes - hoje.getDate() + 1;
  }

  const vendasRestantes = Math.max(0, meta.valor - totalVendido);
  const vendasNecessarias = diasRestantes > 0 ? vendasRestantes / diasRestantes : 0;
  const percentual = Math.min((totalVendido / meta.valor) * 100, 100);
  const metaBatida = totalVendido >= meta.valor;
  return { totalVendido, vendasRestantes, diasRestantes, vendasNecessarias, percentual, metaBatida };
}

export function getDiasMes(): number {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
}

// ---- Authentication Wrapper (P6) ----

/**
 * Wrapper for Supabase auth.getUser() with automatic logout on 401
 * Centralizes all authentication checks and handles expired sessions
 */
export async function getAuthUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  // Handle 401 Unauthorized - session expired
  if (error?.status === 401 || !user) {
    console.error('[CRM] Auth error - logging out', error);

    // Sign out and redirect to login
    await supabase.auth.signOut().catch(err =>
      console.error('[CRM] Logout error:', err)
    );

    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    throw new CrmError(
      'Authentication failed - session expired',
      'AUTH_FAILED',
      401,
      'Sua sessão expirou. Faça login novamente.',
      { originalError: error }
    );
  }

  return user;
}

// ---- Supabase data layer ----

export async function fetchDatabase(): Promise<CrmDatabase> {
  const [metasRes, lancRes] = await Promise.all([
    supabase.from('metas').select('*'),
    supabase.from('lancamentos').select('*'),
  ]);

  const metas: Meta[] = (metasRes.data || []).map(m => ({
    id: m.id,
    nome: m.nome,
    valor: Number(m.valor),
    descricao: m.descricao || '',
  }));

  const lancamentos: Lancamento[] = (lancRes.data || []).map(l => ({
    id: l.id,
    data: l.data,
    valorBruto: Number(l.valor_bruto),
    desconto: Number(l.desconto),
    valorLiquido: Number(l.valor_liquido),
  }));

  return { metas, lancamentos };
}

export async function addMeta(nome: string, valor: number, descricao: string) {
  const user = await getAuthUser();
  await supabase.from('metas').insert({ user_id: user.id, nome, valor, descricao });
}

export async function updateMeta(id: string, nome: string, valor: number, descricao: string) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('metas').update({ nome, valor, descricao }).eq('id', id);
      if (error) throw handleSupabaseError(error, 'updateMeta');
    },
    'updateMeta',
    undefined,
    { metaId: id }
  );
}

export async function deleteMeta(id: string) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('metas').delete().eq('id', id);
      if (error) throw handleSupabaseError(error, 'deleteMeta');
    },
    'deleteMeta',
    undefined,
    { metaId: id }
  );
}

export async function addLancamento(data: string, valorBruto: number, desconto: number) {
  const user = await getAuthUser();
  await supabase.from('lancamentos').insert({
    user_id: user.id,
    data,
    valor_bruto: valorBruto,
    desconto,
  });
}

export async function updateLancamento(id: string, data: string, valorBruto: number, desconto: number) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('lancamentos').update({
        data,
        valor_bruto: valorBruto,
        desconto,
      }).eq('id', id);
      if (error) throw handleSupabaseError(error, 'updateLancamento');
    },
    'updateLancamento',
    undefined,
    { lancamentoId: id }
  );
}

export async function deleteLancamento(id: string) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('lancamentos').delete().eq('id', id);
      if (error) throw handleSupabaseError(error, 'deleteLancamento');
    },
    'deleteLancamento',
    undefined,
    { lancamentoId: id }
  );
}

export async function exportarDadosJSON() {
  const db = await fetchDatabase();
  
  // Buscar os dados das novas tabelas V4
  const { data: customers } = await supabase.from('customers').select('*');
  const { data: pets } = await supabase.from('pets').select('*');
  const { data: products } = await supabase.from('products').select('*');
  const { data: pet_purchases } = await supabase.from('pet_purchases').select('*');

  const backup = {
    versao: 4,
    dataHora: new Date().toISOString(),
    config: {
      logo: localStorage.getItem('crm_custom_logo'),
      primaryColor: localStorage.getItem('crm_custom_primary_color')
    },
    db: {
      ...db,
      customers: customers || [],
      pets: pets || [],
      products: products || [],
      pet_purchases: pet_purchases || []
    }
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crm-v4-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportarExcel() {
  const db = await fetchDatabase();
  const dados = db.lancamentos.map(l => ({
    Data: formatDate(l.data),
    'Valor Bruto': l.valorBruto,
    Desconto: l.desconto,
    'Valor Líquido': l.valorLiquido
  }));
  
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");
  XLSX.writeFile(wb, `lancamentos-${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ---- Petshop Repurchase Module API ----

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers').select('*').order('nome');
  if (error) throw error;
  return data as Customer[];
}

export async function addCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
  const user = await getAuthUser();
  const { data, error } = await supabase.from('customers').insert({ ...customer, user_id: user.id } as any).select().single();
  if (error) throw handleSupabaseError(error, 'addCustomer');
  return data as Customer;
}

export async function updateCustomer(id: string, customer: Partial<Omit<Customer, 'id'>>) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('customers').update(customer).eq('id', id);
      if (error) throw handleSupabaseError(error, 'updateCustomer');
    },
    'updateCustomer',
    undefined,
    { customerId: id }
  );
}

export async function deleteCustomer(id: string) {
  // P3: Validate cascade - ensure no pets exist for this customer
  await validateCanDelete(
    'customers',
    id,
    async () => {
      const { count, error } = await supabase
        .from('pets')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', id);
      if (error) throw error;
      return count || 0;
    }
  );

  // If validation passes, proceed with deletion
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw handleSupabaseError(error, 'deleteCustomer');
    },
    'deleteCustomer',
    undefined,
    { customerId: id }
  );
}

// Pets
export async function fetchPets(): Promise<Pet[]> {
  const { data, error } = await supabase.from('pets').select('*').order('nome');
  if (error) throw error;
  return data as Pet[];
}

export async function fetchPetsByCustomer(customerId: string): Promise<Pet[]> {
  const { data, error } = await supabase.from('pets').select('*').eq('customer_id', customerId).order('nome');
  if (error) throw error;
  return data as Pet[];
}

export async function addPet(pet: Omit<Pet, 'id'>): Promise<Pet> {
  const user = await getAuthUser();

  // Sanitize date fields: convert empty strings to null
  const sanitizedPet = {
    ...pet,
    data_aniversario: pet.data_aniversario?.trim() ? pet.data_aniversario : null,
    user_id: user.id
  };

  const { data, error } = await supabase.from('pets').insert(sanitizedPet as any).select().single();
  if (error) throw handleSupabaseError(error, 'addPet');
  return data as Pet;
}

export async function updatePet(id: string, pet: Partial<Omit<Pet, 'id'>>) {
  // Sanitize date fields: convert empty strings to null
  const sanitizedPet = {
    ...pet,
    data_aniversario: pet.data_aniversario?.trim() ? pet.data_aniversario : null
  };

  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('pets').update(sanitizedPet).eq('id', id);
      if (error) throw handleSupabaseError(error, 'updatePet');
    },
    'updatePet',
    undefined,
    { petId: id }
  );
}

export async function deletePet(id: string) {
  // P3: Validate cascade - ensure no purchase records exist for this pet
  await validateCanDelete(
    'pets',
    id,
    async () => {
      const { count, error } = await supabase
        .from('pet_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('pet_id', id);
      if (error) throw error;
      return count || 0;
    }
  );

  // If validation passes, proceed with deletion
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('pets').delete().eq('id', id);
      if (error) throw handleSupabaseError(error, 'deletePet');
    },
    'deletePet',
    undefined,
    { petId: id }
  );
}

// Products
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('nome');
  if (error) throw error;
  return data as Product[];
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const user = await getAuthUser();
  const { data, error } = await supabase.from('products').insert({ ...product, user_id: user.id } as any).select().single();
  if (error) throw handleSupabaseError(error, 'addProduct');
  return data as Product;
}

export async function findOrCreateProduct(productName: string): Promise<Product> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Try to find existing product by name
  const { data: existing } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .ilike('nome', productName)
    .limit(1);
  
  if (existing && existing.length > 0) {
    return existing[0] as Product;
  }
  
  // Create new product with defaults
  return addProduct({
    nome: productName,
    categoria: null,
    prazo_recompra_dias: 30,
    dias_aviso_previo: 3,
    mensagem_padrao: null,
  });
}

export async function updateProduct(id: string, product: Partial<Omit<Product, 'id'>>) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('products').update(product).eq('id', id);
      if (error) throw handleSupabaseError(error, 'updateProduct');
    },
    'updateProduct',
    undefined,
    { productId: id }
  );
}

export async function deleteProduct(id: string) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw handleSupabaseError(error, 'deleteProduct');
    },
    'deleteProduct',
    undefined,
    { productId: id }
  );
}

// Pet Purchases (Recompras)
export async function fetchPetPurchases(): Promise<PetPurchase[]> {
  const { data, error } = await supabase
    .from('pet_purchases')
    .select(`
      *,
      pet:pets(*),
      product:products(*)
    `)
    .order('proxima_data', { ascending: true });
  if (error) throw error;
  return data as PetPurchase[];
}

export async function addPetPurchase(purchase: Omit<PetPurchase, 'id' | 'pet' | 'product'>) {
  const user = await getAuthUser();

  // Calculate reminder date if not provided
  let data_lembrete = purchase.data_lembrete;
  if (!data_lembrete && purchase.proxima_data && purchase.dias_aviso_previo) {
    const prox = new Date(purchase.proxima_data);
    prox.setDate(prox.getDate() - purchase.dias_aviso_previo);
    data_lembrete = prox.toISOString().split('T')[0];
  }

  const { error } = await supabase.from('pet_purchases').insert({ ...purchase, data_lembrete, user_id: user.id });
  if (error) throw handleSupabaseError(error, 'addPetPurchase');
}

export async function updatePetPurchase(id: string, purchase: Partial<Omit<PetPurchase, 'id' | 'pet' | 'product'>>) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('pet_purchases').update(purchase).eq('id', id);
      if (error) throw handleSupabaseError(error, 'updatePetPurchase');
    },
    'updatePetPurchase',
    undefined,
    { purchaseId: id }
  );
}

export async function deletePetPurchase(id: string) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('pet_purchases').delete().eq('id', id);
      if (error) throw handleSupabaseError(error, 'deletePetPurchase');
    },
    'deletePetPurchase',
    undefined,
    { purchaseId: id }
  );
}

export async function fetchPurchases(filters?: { status?: PetPurchaseStatus }): Promise<(PetPurchase & { customer?: Customer, pet?: Pet, product?: Product })[]> {
  let query = supabase
    .from('pet_purchases')
    .select(`
      *,
      pet:pets(*, customer:customers(*)),
      product:products(*)
    `)
    .order('proxima_data', { ascending: true });
    
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Map nested customer up for easier access in UI
  return (data || []).map(item => ({
    ...item,
    customer: item.pet?.customer
  })) as any[];
}

export async function updatePurchaseStatus(purchaseId: string, status: PetPurchaseStatus) {
  return withErrorHandler(
    async () => {
      const { error } = await supabase.from('pet_purchases').update({ status }).eq('id', purchaseId);
      if (error) throw handleSupabaseError(error, 'updatePurchaseStatus');
    },
    'updatePurchaseStatus',
    undefined,
    { purchaseId, status }
  );
}

export async function registerWhatsAppLog(purchaseId: string, telefone: string, mensagem: string) {
  const user = await getAuthUser();

  const { error } = await supabase.from('whatsapp_logs').insert({
    user_id: user.id,
    purchase_id: purchaseId,
    telefone,
    mensagem
  });

  if (error) throw handleSupabaseError(error, 'registerWhatsAppLog');

  // Update purchase status
  await updatePurchaseStatus(purchaseId, 'Notificado');
}

export async function registerRepurchase(purchaseId: string, newProductId: string, dataCompraStr: string) {
  const user = await getAuthUser();

  // P2: Implementation of atomic transaction pattern with rollback
  // Uses executeSequential to handle multi-step operation with rollback capability
  interface StepResults {
    currentPurchase?: any;
    newProduct?: any;
    isTrocado?: boolean;
    proximaData?: Date;
    dataLembrete?: Date;
  }

  const stepResults: StepResults = {};

  await executeSequential([
    {
      name: 'Fetch current purchase',
      operation: async () => {
        const { data, error } = await supabase
          .from('pet_purchases')
          .select('*')
          .eq('id', purchaseId)
          .single();

        if (error || !data) {
          throw handleSupabaseError(error || new Error('Purchase not found'), 'registerRepurchase - fetch current');
        }

        stepResults.currentPurchase = data;
        return data;
      }
    },
    {
      name: 'Fetch new product',
      operation: async () => {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', newProductId)
          .single();

        if (error || !data) {
          throw handleSupabaseError(error || new Error('Product not found'), 'registerRepurchase - fetch product');
        }

        stepResults.newProduct = data;
        return data;
      }
    },
    {
      name: 'Update current purchase status',
      operation: async () => {
        const isTrocado = stepResults.currentPurchase!.product_id !== newProductId;
        stepResults.isTrocado = isTrocado;

        const { error } = await supabase
          .from('pet_purchases')
          .update({ status: isTrocado ? 'Trocado' : 'Recompra registrada' })
          .eq('id', purchaseId);

        if (error) {
          throw handleSupabaseError(error, 'registerRepurchase - update status');
        }
      },
      rollback: async () => {
        // Revert status back to 'Ativo'
        await supabase
          .from('pet_purchases')
          .update({ status: 'Ativo' })
          .eq('id', purchaseId)
          .catch(err => console.error('[CRM] Rollback error on status revert:', err));
      }
    },
    {
      name: 'Insert new purchase cycle',
      operation: async () => {
        const dataCompra = new Date(dataCompraStr);
        const proximaData = new Date(dataCompra);
        proximaData.setDate(proximaData.getDate() + stepResults.newProduct!.prazo_recompra_dias);

        const dataLembrete = new Date(proximaData);
        dataLembrete.setDate(dataLembrete.getDate() - stepResults.newProduct!.dias_aviso_previo);

        stepResults.proximaData = proximaData;
        stepResults.dataLembrete = dataLembrete;

        const { data, error } = await supabase
          .from('pet_purchases')
          .insert({
            user_id: user.id,
            pet_id: stepResults.currentPurchase!.pet_id,
            product_id: newProductId,
            data_compra: dataCompraStr,
            dias_recompra: stepResults.newProduct!.prazo_recompra_dias,
            proxima_data: proximaData.toISOString().split('T')[0],
            dias_aviso_previo: stepResults.newProduct!.dias_aviso_previo,
            data_lembrete: dataLembrete.toISOString().split('T')[0],
            status: 'Ativo',
            purchase_history_id: purchaseId
          })
          .select()
          .single();

        if (error) {
          throw handleSupabaseError(error, 'registerRepurchase - insert new cycle');
        }

        return data;
      }
      // Note: No rollback for insert - parent executeSequential will handle cleanup
    }
  ]);
}

export async function startNewPurchaseCycle(petId: string, productId: string, dataCompraStr: string, diasRecompra?: number) {
  const user = await getAuthUser();

  // Validate data_compra is not empty
  if (!dataCompraStr || !dataCompraStr.trim()) {
    throw new CrmError(
      'Data da compra é obrigatória e não pode estar vazia',
      'VALIDATION_ERROR',
      400,
      'Data da compra é obrigatória',
      { petId, productId }
    );
  }

  const { data: product, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (prodErr || !product) throw handleSupabaseError(prodErr || new Error('Product not found'), 'startNewPurchaseCycle - fetch product');

  // Use provided diasRecompra, fallback to product default
  const dias = diasRecompra || product.prazo_recompra_dias;

  const dataCompra = new Date(dataCompraStr);
  const proximaData = new Date(dataCompra);
  proximaData.setDate(proximaData.getDate() + dias);

  const dataLembrete = new Date(proximaData);
  dataLembrete.setDate(dataLembrete.getDate() - product.dias_aviso_previo);

  const { error } = await supabase.from('pet_purchases').insert({
    user_id: user.id,
    pet_id: petId,
    product_id: productId,
    data_compra: dataCompraStr,
    dias_recompra: dias,
    proxima_data: proximaData.toISOString().split('T')[0],
    dias_aviso_previo: product.dias_aviso_previo,
    data_lembrete: dataLembrete.toISOString().split('T')[0],
    status: 'Ativo',
    purchase_history_id: null
  });

  if (error) throw handleSupabaseError(error, 'startNewPurchaseCycle - insert');
}

// ---- Work Settings Module ----

export async function getWorkSettings(): Promise<WorkSettings | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('work_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return data as WorkSettings | null;
}

export async function getRemainingWorkingDays(fromDate?: Date): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const currentDate = fromDate || new Date();
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Fetch work settings and holidays
  const [settingsRes, holidaysRes] = await Promise.all([
    supabase.from('work_settings').select('*').eq('user_id', user.id).single(),
    supabase.from('custom_holidays').select('*').eq('user_id', user.id),
  ]);

  const workSettings = settingsRes.data as WorkSettings | null;
  const holidays = (holidaysRes.data || []) as CustomHoliday[];

  const holidayDates = new Set(holidays.map(h => h.data));
  const workMode = workSettings?.work_mode || 'Segunda-sexta';

  let workingDays = 0;
  const dateIterator = new Date(currentDate);
  dateIterator.setHours(0, 0, 0, 0);

  while (dateIterator <= lastDayOfMonth) {
    const dateStr = dateIterator.toISOString().split('T')[0];

    if (!holidayDates.has(dateStr)) {
      const dayOfWeek = dateIterator.getDay();

      let isWorkDay = false;
      if (workMode === 'Segunda-sexta') {
        isWorkDay = dayOfWeek >= 1 && dayOfWeek <= 5;
      } else if (workMode === 'Segunda-sabado') {
        isWorkDay = dayOfWeek >= 1 && dayOfWeek <= 6;
      } else if (workMode === 'Todos os dias') {
        isWorkDay = true;
      } else if (workMode === 'Personalizado') {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const customSchedule = workSettings?.custom_schedule_json || {};
        isWorkDay = customSchedule[dayNames[dayOfWeek]] === true;
      }

      if (isWorkDay) {
        workingDays++;
      }
    }

    dateIterator.setDate(dateIterator.getDate() + 1);
  }

  return Math.max(1, workingDays);
}

export async function saveWorkSettings(workMode: WorkMode, customSchedule?: Record<string, boolean>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  try {
    // First try to update existing settings
    const { data: existing, error: fetchError } = await supabase
      .from('work_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!fetchError && existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('work_settings')
        .update({
          work_mode: workMode,
          custom_schedule_json: customSchedule || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('work_settings')
        .insert({
          user_id: user.id,
          work_mode: workMode,
          custom_schedule_json: customSchedule || null,
        });

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error saving work settings:', error);
    throw error;
  }
}

export async function addCustomHoliday(data: string, descricao?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('custom_holidays').insert({
    user_id: user.id,
    data,
    descricao,
  });

  if (error) throw error;
}

export async function deleteCustomHoliday(holidayId: string) {
  const { error } = await supabase.from('custom_holidays').delete().eq('id', holidayId);
  if (error) throw error;
}

export async function fetchCustomHolidays(): Promise<CustomHoliday[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('custom_holidays')
    .select('*')
    .eq('user_id', user.id)
    .order('data', { ascending: true });

  if (error) throw error;
  return data as CustomHoliday[];
}
