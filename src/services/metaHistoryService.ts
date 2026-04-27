/**
 * Serviço de histórico mensal de metas (snapshots).
 * Garante que cada mês tenha um registro persistido da meta vigente,
 * permitindo que o relatório mostre a meta correta de cada período histórico.
 */

import { supabase } from "@/integrations/supabase/client";
import { getAuthUser } from "@/services/authService";
import type { Meta } from "@/lib/types";

export interface MetaMensal {
  id: string;
  ano: number;
  mes: number; // 1-12
  meta_id: string | null;
  nome: string;
  valor: number;
}

export async function fetchMetasMensais(): Promise<MetaMensal[]> {
  const { data, error } = await supabase
    .from('metas_mensais' as any)
    .select('*')
    .order('ano', { ascending: true })
    .order('mes', { ascending: true });

  if (error) {
    console.error('fetchMetasMensais', error);
    return [];
  }
  return (data || []).map((r: any) => ({
    id: r.id,
    ano: r.ano,
    mes: r.mes,
    meta_id: r.meta_id,
    nome: r.nome,
    valor: Number(r.valor),
  }));
}

/**
 * Garante que há um snapshot da meta vigente para o mês atual.
 * Se já existe (mesmo user+ano+mes+nome) não duplica.
 * Não sobrescreve registros antigos: histórico é preservado.
 */
export async function ensureCurrentMonthSnapshot(metas: Meta[]): Promise<void> {
  if (!metas || metas.length === 0) return;
  try {
    const user = await getAuthUser();
    const now = new Date();
    const ano = now.getFullYear();
    const mes = now.getMonth() + 1;

    const { data: existing } = await supabase
      .from('metas_mensais' as any)
      .select('nome')
      .eq('user_id', user.id)
      .eq('ano', ano)
      .eq('mes', mes);

    const existingNames = new Set((existing || []).map((r: any) => r.nome));
    const toInsert = metas
      .filter(m => !existingNames.has(m.nome))
      .map(m => ({
        user_id: user.id,
        ano,
        mes,
        meta_id: m.id,
        nome: m.nome,
        valor: m.valor,
      }));

    if (toInsert.length > 0) {
      await supabase.from('metas_mensais' as any).insert(toInsert);
    }
  } catch (e) {
    console.error('ensureCurrentMonthSnapshot', e);
  }
}

/** Retorna meta histórica para um mês específico (ano, mes 1-12). Se não houver, retorna null. */
export function getMetaForMonth(history: MetaMensal[], ano: number, mes: number, nome?: string): MetaMensal | null {
  const candidates = history.filter(h => h.ano === ano && h.mes === mes && (!nome || h.nome === nome));
  if (candidates.length > 0) return candidates[0];
  return null;
}
