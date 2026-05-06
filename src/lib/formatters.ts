import { formatCurrency } from '@/utils/currency';

/**
 * ETAPA 9: Formatters Utility Functions
 * Centralized formatting functions for currency, dates, etc.
 */

export { formatCurrency };

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date + 'T12:00:00'));
}

export function formatDateTime(date: string, createdAt?: string): string {
  const dataStr = new Intl.DateTimeFormat('pt-BR').format(new Date(date + 'T12:00:00'));
  if (!createdAt) return dataStr;
  const hora = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(createdAt));
  return `${dataStr} ${hora}`;
}
