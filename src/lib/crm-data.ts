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

const DB_KEY = 'crm_data';
const BACKUP_KEY = 'crm_backup';
const BACKUP_DATE_KEY = 'crm_backup_date';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function getDatabase(): CrmDatabase {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : { metas: [], lancamentos: [] };
}

export function saveDatabase(db: CrmDatabase) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
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

// CRUD Metas
export function addMeta(nome: string, valor: number, descricao: string): CrmDatabase {
  const db = getDatabase();
  db.metas.push({ id: generateId(), nome, valor, descricao });
  saveDatabase(db);
  return db;
}

export function updateMeta(id: string, nome: string, valor: number, descricao: string): CrmDatabase {
  const db = getDatabase();
  const idx = db.metas.findIndex(m => m.id === id);
  if (idx !== -1) db.metas[idx] = { id, nome, valor, descricao };
  saveDatabase(db);
  return db;
}

export function deleteMeta(id: string): CrmDatabase {
  const db = getDatabase();
  db.metas = db.metas.filter(m => m.id !== id);
  saveDatabase(db);
  return db;
}

// CRUD Lancamentos
export function addLancamento(data: string, valorBruto: number, desconto: number): CrmDatabase {
  const db = getDatabase();
  db.lancamentos.push({ id: generateId(), data, valorBruto, desconto, valorLiquido: valorBruto - desconto });
  saveDatabase(db);
  return db;
}

export function updateLancamento(id: string, data: string, valorBruto: number, desconto: number): CrmDatabase {
  const db = getDatabase();
  const idx = db.lancamentos.findIndex(l => l.id === id);
  if (idx !== -1) db.lancamentos[idx] = { id, data, valorBruto, desconto, valorLiquido: valorBruto - desconto };
  saveDatabase(db);
  return db;
}

export function deleteLancamento(id: string): CrmDatabase {
  const db = getDatabase();
  db.lancamentos = db.lancamentos.filter(l => l.id !== id);
  saveDatabase(db);
  return db;
}

// Backup
export function fazerBackup() {
  const db = getDatabase();
  localStorage.setItem(BACKUP_KEY, JSON.stringify(db));
  localStorage.setItem(BACKUP_DATE_KEY, new Date().toISOString());
}

export function restaurarBackup(): boolean {
  const backup = localStorage.getItem(BACKUP_KEY);
  if (!backup) return false;
  saveDatabase(JSON.parse(backup));
  return true;
}

export function getUltimoBackup(): string | null {
  return localStorage.getItem(BACKUP_DATE_KEY);
}

export function limparTodosDados() {
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(BACKUP_KEY);
  localStorage.removeItem(BACKUP_DATE_KEY);
}

export function exportarDadosJSON() {
  const db = getDatabase();
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crm-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportarCSV() {
  const db = getDatabase();
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

export function importarDados(file: File): Promise<CrmDatabase> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.metas && data.lancamentos) {
          saveDatabase(data);
          resolve(data);
        } else {
          reject(new Error('Arquivo inválido'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}
