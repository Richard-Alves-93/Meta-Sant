/**
 * ETAPA 9: Work Settings Service
 * Handles work schedule, holidays, and working days calculations
 */

import { supabase } from "@/integrations/supabase/client";
import type { WorkSettings, CustomHoliday, WorkMode } from "@/lib/types";

export const defaultJornada = {
  modo: "Segunda-sexta",
  diasSelecionados: [1, 2, 3, 4, 5], // 1=Mon, 2=Tue... 5=Fri
  usarFeriados: true // Padrao para calcular descontando feriados
};

export function carregarJornada() {
  try {
    const data = localStorage.getItem("jornada_trabalho");
    if (!data) return defaultJornada;
    
    const parsed = JSON.parse(data);

    return {
      modo: parsed.modo || "Segunda-sexta",
      diasSelecionados: Array.isArray(parsed.diasSelecionados)
        ? parsed.diasSelecionados
        : [1, 2, 3, 4, 5],
      usarFeriados: parsed.usarFeriados !== undefined ? parsed.usarFeriados : true
    };
  } catch (error) {
    console.error("Erro ao carregar jornada:", error);
    return defaultJornada;
  }
}

export function salvarJornada(jornada: any) {
  try {
    localStorage.setItem("jornada_trabalho", JSON.stringify(jornada));
    return true;
  } catch (error) {
    console.error("Erro ao salvar jornada:", error);
    return false;
  }
}

// Deprecated (Kept for backwards compatibility but not used or relies on local fallback)
export async function getWorkSettings(): Promise<WorkSettings | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data } = await supabase
      .from('work_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    return data as WorkSettings | null;
  } catch (e) {
    return null;
  }
}

export async function getRemainingWorkingDays(fromDate?: Date): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const currentDate = fromDate || new Date();
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Fetch holidays ONLY
  const holidaysRes = await supabase.from('custom_holidays').select('*').eq('user_id', user.id);
  const holidays = (holidaysRes.data || []) as CustomHoliday[];

  const holidayDates = new Set(holidays.map(h => h.data));
  const jornada = carregarJornada();

  let workingDays = 0;
  const dateIterator = new Date(currentDate);
  dateIterator.setHours(0, 0, 0, 0);

  while (dateIterator <= lastDayOfMonth) {
    const dateStr = dateIterator.toISOString().split('T')[0];

    // Se usarFeriados for true, avaliamos se é um dia do Set, caso contrário ignoramos o bloqueio do feriado.
    if (!jornada.usarFeriados || !holidayDates.has(dateStr)) {
      const dayOfWeek = dateIterator.getDay(); // JS getDay: 0=Sun, 1=Mon...6=Sat

      let isWorkDay = false;
      if (jornada.modo === 'Segunda-sexta') {
        isWorkDay = dayOfWeek >= 1 && dayOfWeek <= 5;
      } else if (jornada.modo === 'Segunda-sabado') {
        isWorkDay = dayOfWeek >= 1 && dayOfWeek <= 6;
      } else if (jornada.modo === 'Todos os dias') {
        isWorkDay = true;
      } else if (jornada.modo === 'Personalizado') {
        // Assume diasSelecionados has JS Day values (0-6) mapped previously (In WorkSettings we mapped them correctly).
        // Note: Se o array tiver valores 1 a 6 e 0 para dom, includes funcionará.
        isWorkDay = Array.isArray(jornada.diasSelecionados) && jornada.diasSelecionados.includes(dayOfWeek);
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
