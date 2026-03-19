/**
 * ETAPA 9: Customer Service
 * Handles all customer-related data operations
 */

import { supabase } from "@/integrations/supabase/client";
import { withErrorHandler, handleSupabaseError, validateCanDelete } from "@/services/errorHandler";
import { getAuthUser } from "@/services/authService";
import type { Customer } from "@/lib/types";

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
  return withErrorHandler(
    async () => {
      // Delete related data via referential integrity
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw handleSupabaseError(error, 'deleteCustomer');
    },
    'deleteCustomer',
    undefined,
    { customerId: id }
  );
}
