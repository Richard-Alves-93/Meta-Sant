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

export function calcularVendasNecessarias(meta: Meta, lancamentos: Lancamento[]) {
  const totalVendido = lancamentos.reduce((sum, l) => sum + l.valorLiquido, 0);
  const hoje = new Date();
  const diasMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diasRestantes = diasMes - hoje.getDate() + 1;
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
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crm-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportarCSV() {
  const db = await fetchDatabase();
  let csv = 'Data,Valor Bruto,Desconto,Valor Líquido\n';
  db.lancamentos.forEach(l => {
    csv += `"${formatDate(l.data)}","${l.valorBruto}","${l.desconto}","${l.valorLiquido}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lancamentos-${new Date().toISOString().split('T')[0]}.csv`;
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
