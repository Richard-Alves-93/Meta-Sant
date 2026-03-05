import { useState, useCallback } from "react";
import CrmSidebar, { CrmPage } from "@/components/crm/CrmSidebar";
import DashboardPage from "@/components/crm/DashboardPage";
import LancamentosPage from "@/components/crm/LancamentosPage";
import MetasPage from "@/components/crm/MetasPage";
import RelatoriosPage from "@/components/crm/RelatoriosPage";
import ConfiguracoesPage from "@/components/crm/ConfiguracoesPage";
import MetaModal from "@/components/crm/MetaModal";
import LancamentoModal from "@/components/crm/LancamentoModal";
import {
  getDatabase, addMeta, updateMeta, deleteMeta,
  addLancamento, updateLancamento, deleteLancamento,
  exportarDadosJSON, exportarCSV, importarDados,
  fazerBackup, restaurarBackup, limparTodosDados,
  Meta, Lancamento, CrmDatabase
} from "@/lib/crm-data";
import { toast } from "sonner";

const Index = () => {
  const [page, setPage] = useState<CrmPage>("dashboard");
  const [db, setDb] = useState<CrmDatabase>(getDatabase);

  // Meta modal
  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);

  // Lancamento modal
  const [lancModalOpen, setLancModalOpen] = useState(false);
  const [editingLanc, setEditingLanc] = useState<Lancamento | null>(null);

  const refresh = useCallback(() => setDb(getDatabase()), []);

  // Meta CRUD
  const handleSaveMeta = (nome: string, valor: number, descricao: string) => {
    if (editingMeta) updateMeta(editingMeta.id, nome, valor, descricao);
    else addMeta(nome, valor, descricao);
    refresh();
    setMetaModalOpen(false);
    setEditingMeta(null);
    toast.success(editingMeta ? "Meta atualizada!" : "Meta criada!");
  };

  const handleEditMeta = (meta: Meta) => { setEditingMeta(meta); setMetaModalOpen(true); };
  const handleDeleteMeta = (id: string) => {
    if (confirm("Tem certeza que deseja remover esta meta?")) {
      deleteMeta(id); refresh(); toast.success("Meta removida!");
    }
  };

  // Lancamento CRUD
  const handleSaveLanc = (data: string, bruto: number, desconto: number) => {
    if (editingLanc) updateLancamento(editingLanc.id, data, bruto, desconto);
    else addLancamento(data, bruto, desconto);
    refresh();
    setLancModalOpen(false);
    setEditingLanc(null);
    toast.success(editingLanc ? "Lançamento atualizado!" : "Lançamento salvo!");
  };

  const handleAddLancInline = (data: string, bruto: number, desconto: number) => {
    addLancamento(data, bruto, desconto);
    refresh();
    toast.success("Lançamento salvo!");
  };

  const handleEditLanc = (l: Lancamento) => { setEditingLanc(l); setLancModalOpen(true); };
  const handleDeleteLanc = (id: string) => {
    if (confirm("Tem certeza que deseja remover este lançamento?")) {
      deleteLancamento(id); refresh(); toast.success("Lançamento removido!");
    }
  };

  // Config
  const handleBackup = () => { fazerBackup(); refresh(); toast.success("Backup realizado!"); };
  const handleRestore = () => {
    if (confirm("Restaurar backup? Os dados atuais serão substituídos.")) {
      if (restaurarBackup()) { refresh(); toast.success("Backup restaurado!"); }
      else toast.error("Nenhum backup disponível");
    }
  };
  const handleClearAll = () => {
    if (confirm("⚠️ Todos os dados serão deletados permanentemente. Continuar?")) {
      limparTodosDados(); refresh(); toast.success("Dados limpos!");
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async () => {
      if (input.files?.[0]) {
        try {
          await importarDados(input.files[0]);
          refresh(); toast.success("Dados importados!");
        } catch { toast.error("Arquivo inválido"); }
      }
    };
    input.click();
  };

  return (
    <div className="flex min-h-screen">
      <CrmSidebar currentPage={page} onNavigate={setPage} />

      <main className="ml-[250px] flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-8 h-16 flex items-center justify-between sticky top-0 z-40">
          <div />
          <button onClick={() => setPage("configuracoes")} className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:bg-border transition-colors">
            ⚙️
          </button>
        </header>

        <div className="flex-1 p-8">
          {page === "dashboard" && (
            <DashboardPage db={db} onOpenLancamento={() => { setEditingLanc(null); setLancModalOpen(true); }}
              onExport={exportarDadosJSON} onImport={handleImport}
              onEditMeta={handleEditMeta} onDeleteMeta={handleDeleteMeta} />
          )}
          {page === "lancamentos" && (
            <LancamentosPage db={db} onAdd={handleAddLancInline}
              onEdit={handleEditLanc} onDelete={handleDeleteLanc}
              onExportCSV={exportarCSV} onOpenModal={() => { setEditingLanc(null); setLancModalOpen(true); }} />
          )}
          {page === "metas" && (
            <MetasPage db={db} onAdd={() => { setEditingMeta(null); setMetaModalOpen(true); }}
              onEdit={handleEditMeta} onDelete={handleDeleteMeta} />
          )}
          {page === "relatorios" && (
            <RelatoriosPage db={db} onExportExcel={exportarDadosJSON} />
          )}
          {page === "configuracoes" && (
            <ConfiguracoesPage db={db} onBackup={handleBackup} onRestore={handleRestore} onClearAll={handleClearAll} />
          )}
        </div>

        <footer className="bg-card border-t border-border py-4 px-8 text-center text-xs text-muted-foreground">
          © 2026 CRM Dashboard. Todos os direitos reservados.
        </footer>
      </main>

      <MetaModal open={metaModalOpen} onClose={() => { setMetaModalOpen(false); setEditingMeta(null); }}
        onSave={handleSaveMeta} editingMeta={editingMeta} />
      <LancamentoModal open={lancModalOpen} onClose={() => { setLancModalOpen(false); setEditingLanc(null); }}
        onSave={handleSaveLanc} editingLancamento={editingLanc} />
    </div>
  );
};

export default Index;
