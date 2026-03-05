import { CrmDatabase, exportarDadosJSON, exportarCSV } from "@/lib/crm-data";

interface ConfiguracoesPageProps {
  db: CrmDatabase;
  onRefresh: () => Promise<void>;
}

const ConfiguracoesPage = ({ db, onRefresh }: ConfiguracoesPageProps) => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie dados e preferências do sistema.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-card-foreground mb-2">📥 Exportar Dados</h3>
          <p className="text-sm text-muted-foreground mb-4">Exporte seus dados em JSON ou CSV.</p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={exportarDadosJSON} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              📥 Exportar JSON
            </button>
            <button onClick={exportarCSV} className="px-4 py-2.5 rounded-lg bg-card border border-border text-muted-foreground text-sm font-medium hover:bg-secondary transition-colors">
              📥 Exportar CSV
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-card-foreground mb-4">ℹ️ Informações do Sistema</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Versão</div>
              <div className="font-semibold text-card-foreground">3.0.0</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Armazenamento</div>
              <div className="font-semibold text-card-foreground">Cloud</div>
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
