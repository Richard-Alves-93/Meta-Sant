import { supabase } from "@/integrations/supabase/client";

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  await supabase.from('metas').insert({ user_id: user.id, nome, valor, descricao });
}

export async function updateMeta(id: string, nome: string, valor: number, descricao: string) {
  await supabase.from('metas').update({ nome, valor, descricao }).eq('id', id);
}

export async function deleteMeta(id: string) {
  await supabase.from('metas').delete().eq('id', id);
}

export async function addLancamento(data: string, valorBruto: number, desconto: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  await supabase.from('lancamentos').insert({
    user_id: user.id,
    data,
    valor_bruto: valorBruto,
    desconto,
  });
}

export async function updateLancamento(id: string, data: string, valorBruto: number, desconto: number) {
  await supabase.from('lancamentos').update({
    data,
    valor_bruto: valorBruto,
    desconto,
  }).eq('id', id);
}

export async function deleteLancamento(id: string) {
  await supabase.from('lancamentos').delete().eq('id', id);
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('customers').insert({ ...customer, user_id: user.id } as any).select().single();
  if (error) throw error;
  return data as Customer;
}

export async function updateCustomer(id: string, customer: Partial<Omit<Customer, 'id'>>) {
  await supabase.from('customers').update(customer).eq('id', id);
}

export async function deleteCustomer(id: string) {
  await supabase.from('customers').delete().eq('id', id);
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('pets').insert({ ...pet, user_id: user.id } as any).select().single();
  if (error) throw error;
  return data as Pet;
}

export async function updatePet(id: string, pet: Partial<Omit<Pet, 'id'>>) {
  await supabase.from('pets').update(pet).eq('id', id);
}

export async function deletePet(id: string) {
  await supabase.from('pets').delete().eq('id', id);
}

// Products
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('nome');
  if (error) throw error;
  return data as Product[];
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('products').insert({ ...product, user_id: user.id } as any).select().single();
  if (error) throw error;
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
  await supabase.from('products').update(product).eq('id', id);
}

export async function deleteProduct(id: string) {
  await supabase.from('products').delete().eq('id', id);
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Calculate reminder date if not provided
  let data_lembrete = purchase.data_lembrete;
  if (!data_lembrete && purchase.proxima_data && purchase.dias_aviso_previo) {
    const prox = new Date(purchase.proxima_data);
    prox.setDate(prox.getDate() - purchase.dias_aviso_previo);
    data_lembrete = prox.toISOString().split('T')[0];
  }

  await supabase.from('pet_purchases').insert({ ...purchase, data_lembrete, user_id: user.id });
}

export async function updatePetPurchase(id: string, purchase: Partial<Omit<PetPurchase, 'id' | 'pet' | 'product'>>) {
  await supabase.from('pet_purchases').update(purchase).eq('id', id);
}

export async function deletePetPurchase(id: string) {
  await supabase.from('pet_purchases').delete().eq('id', id);
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
  await supabase.from('pet_purchases').update({ status }).eq('id', purchaseId);
}

export async function registerWhatsAppLog(purchaseId: string, telefone: string, mensagem: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  await supabase.from('whatsapp_logs').insert({
    user_id: user.id,
    purchase_id: purchaseId,
    telefone,
    mensagem
  });
  
  // Update purchase status
  await updatePurchaseStatus(purchaseId, 'Notificado');
}

export async function registerRepurchase(purchaseId: string, newProductId: string, dataCompraStr: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 1. Fetch current purchase
  const { data: currentPurchase, error: fetchErr } = await supabase
    .from('pet_purchases')
    .select('*')
    .eq('id', purchaseId)
    .single();

  if (fetchErr || !currentPurchase) throw new Error('Purchase not found');

  // 2. Fetch new product to get deadlines
  const { data: newProduct, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .eq('id', newProductId)
    .single();

  if (prodErr || !newProduct) throw new Error('Product not found');

  // 3. Mark current as "Recompra registrada" or "Trocado"
  const isTrocado = currentPurchase.product_id !== newProductId;
  await supabase
    .from('pet_purchases')
    .update({ status: isTrocado ? 'Trocado' : 'Recompra registrada' })
    .eq('id', purchaseId);

  // 4. Calculate new dates
  const dataCompra = new Date(dataCompraStr);
  const proximaData = new Date(dataCompra);
  proximaData.setDate(proximaData.getDate() + newProduct.prazo_recompra_dias);
  
  const dataLembrete = new Date(proximaData);
  dataLembrete.setDate(dataLembrete.getDate() - newProduct.dias_aviso_previo);

  // 5. Insert new cycle linked to old one
  await supabase.from('pet_purchases').insert({
    user_id: user.id,
    pet_id: currentPurchase.pet_id,
    product_id: newProductId,
    data_compra: dataCompraStr,
    dias_recompra: newProduct.prazo_recompra_dias,
    proxima_data: proximaData.toISOString().split('T')[0],
    dias_aviso_previo: newProduct.dias_aviso_previo,
    data_lembrete: dataLembrete.toISOString().split('T')[0],
    status: 'Ativo',
    purchase_history_id: currentPurchase.id // Link to previous cycle
  });
}

export async function startNewPurchaseCycle(petId: string, productId: string, dataCompraStr: string, diasRecompra?: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: product, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (prodErr || !product) throw new Error('Product not found');

  // Use provided diasRecompra, fallback to product default
  const dias = diasRecompra || product.prazo_recompra_dias;

  const dataCompra = new Date(dataCompraStr);
  const proximaData = new Date(dataCompra);
  proximaData.setDate(proximaData.getDate() + dias);

  const dataLembrete = new Date(proximaData);
  dataLembrete.setDate(dataLembrete.getDate() - product.dias_aviso_previo);

  await supabase.from('pet_purchases').insert({
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
