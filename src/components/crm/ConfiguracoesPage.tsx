import { CrmDatabase, getUltimoBackup } from "@/lib/crm-data";

interface ConfiguracoesPageProps {
  db: CrmDatabase;
  onBackup: () => void;
  onRestore: () => void;
  onClearAll: () => void;
}

const ConfiguracoesPage = ({ db, onBackup, onRestore, onClearAll }: ConfiguracoesPageProps) => {
  const ultimoBackup = getUltimoBackup();
  const backupStr = ultimoBackup ? new Date(ultimoBackup).toLocaleString("pt-BR") : "Nunca";

  const storageSize = (() => {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += (localStorage[key]?.length || 0) + key.length;
      }
    }
    return (total / 1024).toFixed(2);
  })();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie dados, backups e preferências do sistema.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-card-foreground mb-2">💾 Backup e Restauração</h3>
          <p className="text-sm text-muted-foreground mb-4">Faça backup de seus dados ou restaure de um backup anterior.</p>
          <div className="flex gap-3 flex-wrap mb-4">
            <button onClick={onBackup} className="px-4 py-2.5 rounded-lg bg-success text-success-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              💾 Fazer Backup Agora
            </button>
            <button onClick={onRestore} className="px-4 py-2.5 rounded-lg bg-card border border-border text-muted-foreground text-sm font-medium hover:bg-secondary transition-colors">
              ♻️ Restaurar Backup
            </button>
          </div>
          <div className="bg-secondary rounded-lg p-3 text-xs text-muted-foreground">
            Último backup: {backupStr}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-card-foreground mb-2">🗑️ Dados</h3>
          <p className="text-sm text-muted-foreground mb-4">Limpe todos os dados do sistema. Esta ação não pode ser desfeita.</p>
          <button onClick={onClearAll} className="px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            🗑️ Limpar Todos os Dados
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-card-foreground mb-4">ℹ️ Informações do Sistema</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Versão</div>
              <div className="font-semibold text-card-foreground">2.2.0</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Armazenamento</div>
              <div className="font-semibold text-card-foreground">{storageSize} KB</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total de Metas</div>
              <div className="font-semibold text-card-foreground">{db.metas.length}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total de Lançamentos</div>
              <div className="font-semibold text-card-foreground">{db.lancamentos.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesPage;
