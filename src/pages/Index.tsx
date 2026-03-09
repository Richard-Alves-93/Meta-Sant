import { useState, useCallback, useEffect } from "react";
import CrmSidebar, { CrmPage } from "@/components/crm/CrmSidebar";
import DashboardPage from "@/components/crm/DashboardPage";
import LancamentosPage from "@/components/crm/LancamentosPage";
import MetasPage from "@/components/crm/MetasPage";
import RelatoriosPage from "@/components/crm/RelatoriosPage";
import ConfiguracoesPage from "@/components/crm/ConfiguracoesPage";
import MetaModal from "@/components/crm/MetaModal";
import LancamentoModal from "@/components/crm/LancamentoModal";
import {
  fetchDatabase, addMeta, updateMeta, deleteMeta,
  addLancamento, updateLancamento, deleteLancamento,
  exportarDadosJSON, exportarCSV,
  Meta, Lancamento, CrmDatabase
} from "@/lib/crm-data";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Index = () => {
  const { user, signOut } = useAuth();
  const [page, setPage] = useState<CrmPage>("dashboard");
  const [db, setDb] = useState<CrmDatabase>({ metas: [], lancamentos: [] });
  const [loading, setLoading] = useState(true);

  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [lancModalOpen, setLancModalOpen] = useState(false);
  const [editingLanc, setEditingLanc] = useState<Lancamento | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchDatabase();
      setDb(data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSaveMeta = async (nome: string, valor: number, descricao: string) => {
    if (editingMeta) await updateMeta(editingMeta.id, nome, valor, descricao);
    else await addMeta(nome, valor, descricao);
    await refresh();
    setMetaModalOpen(false);
    setEditingMeta(null);
    toast.success(editingMeta ? "Meta atualizada!" : "Meta criada!");
  };

  const handleEditMeta = (meta: Meta) => { setEditingMeta(meta); setMetaModalOpen(true); };
  const handleDeleteMeta = async (id: string) => {
    if (confirm("Tem certeza que deseja remover esta meta?")) {
      await deleteMeta(id); await refresh(); toast.success("Meta removida!");
    }
  };

  const handleSaveLanc = async (data: string, bruto: number, desconto: number) => {
    if (editingLanc) await updateLancamento(editingLanc.id, data, bruto, desconto);
    else await addLancamento(data, bruto, desconto);
    await refresh();
    setLancModalOpen(false);
    setEditingLanc(null);
    toast.success(editingLanc ? "Lançamento atualizado!" : "Lançamento salvo!");
  };

  const handleAddLancInline = async (data: string, bruto: number, desconto: number) => {
    await addLancamento(data, bruto, desconto);
    await refresh();
    toast.success("Lançamento salvo!");
  };

  const handleEditLanc = (l: Lancamento) => { setEditingLanc(l); setLancModalOpen(true); };
  const handleDeleteLanc = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este lançamento?")) {
      await deleteLancamento(id); await refresh(); toast.success("Lançamento removido!");
    }
  };

  const handleExport = async () => { await exportarDadosJSON(); };
  const handleExportCSV = async () => { await exportarCSV(); };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url || "";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <CrmSidebar currentPage={page} onNavigate={setPage} />

      <main className="ml-[250px] flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-8 h-16 flex items-center justify-between sticky top-0 z-40">
          <div />
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-card-foreground hidden sm:block">{displayName}</span>
            <button
              onClick={signOut}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:bg-border transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className="flex-1 p-8">
          {page === "dashboard" && (
            <DashboardPage db={db} onOpenLancamento={() => { setEditingLanc(null); setLancModalOpen(true); }}
              onExport={handleExport} onImport={() => {}}
              onEditMeta={handleEditMeta} onDeleteMeta={handleDeleteMeta} />
          )}
          {page === "lancamentos" && (
            <LancamentosPage db={db} onAdd={handleAddLancInline}
              onEdit={handleEditLanc} onDelete={handleDeleteLanc}
              onExportCSV={handleExportCSV} onOpenModal={() => { setEditingLanc(null); setLancModalOpen(true); }} />
          )}
          {page === "metas" && (
            <MetasPage db={db} onAdd={() => { setEditingMeta(null); setMetaModalOpen(true); }}
              onEdit={handleEditMeta} onDelete={handleDeleteMeta} />
          )}
          {page === "relatorios" && (
            <RelatoriosPage db={db} onExportExcel={handleExport} />
          )}
          {page === "configuracoes" && (
            <ConfiguracoesPage db={db} onRefresh={refresh} />
          )}
        </div>

        <footer className="bg-card border-t border-border py-4 px-8 text-center text-xs text-muted-foreground">
          © 2026 CRM Dashboard desenvolvido por <a href="https://api.whatsapp.com/send?phone=5551991840532" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline transition-colors font-medium">Richard Alves</a>. Todos os direitos reservados.
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
