/**
 * ETAPA 9: Work Settings Service
 * Handles work schedule, holidays, and working days calculations
 */

import { supabase } from "@/integrations/supabase/client";
import type { WorkSettings, CustomHoliday, WorkMode } from "@/lib/types";

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
