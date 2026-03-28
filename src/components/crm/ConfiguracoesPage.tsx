import { useState } from "react";
import { CrmDatabase, exportarDadosJSON, deleteMeta, deleteLancamento, addMeta, addLancamento } from "@/lib/crm-data";
import { hexToHslStr } from "@/lib/colors";
import { toast } from "sonner";
import { WorkSettingsSection } from "./WorkSettingsSection";

interface ConfiguracoesPageProps {
  db: CrmDatabase;
  onRefresh: () => Promise<void>;
  customLogo: string | null;
  onLogoChange: (logo: string | null) => void;
}

const ConfiguracoesPage = ({ db, onRefresh, customLogo, onLogoChange }: ConfiguracoesPageProps) => {
  const [primaryColor, setPrimaryColor] = useState(
    localStorage.getItem('crm_custom_primary_color') || "#3b82f6"
  );

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem('crm_custom_logo', base64String);
        onLogoChange(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    localStorage.removeItem('crm_custom_logo');
    onLogoChange(null);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPrimaryColor(val);
    localStorage.setItem('crm_custom_primary_color', val);
    document.documentElement.style.setProperty('--primary', hexToHslStr(val));
    document.documentElement.style.setProperty('--ring', hexToHslStr(val));
    document.documentElement.style.setProperty('--sidebar-primary', hexToHslStr(val));
    document.documentElement.style.setProperty('--sidebar-ring', hexToHslStr(val));
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Atenção: Restaurar um backup antigo (V3) substituirá APENAS suas Metas e Vendas. Todos os seus novos Tutores, Pets e Recompras (V4) continuarão seguros. Deseja continuar?")) {
      if (e.target) e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backup = JSON.parse(content);
        
        let metasToRestore = [];
        let lancamentosToRestore = [];

        // Relax format checking
        if (backup.versao || backup.db || backup.metas || backup.lancamentos) {
            // Restore configs
            if (backup.config) {
                if (backup.config.logo) {
                    localStorage.setItem('crm_custom_logo', backup.config.logo);
                    onLogoChange(backup.config.logo);
                }
                if (backup.config.primaryColor) {
                    const color = backup.config.primaryColor;
                    setPrimaryColor(color);
                    localStorage.setItem('crm_custom_primary_color', color);
                    document.documentElement.style.setProperty('--primary', hexToHslStr(color));
                    document.documentElement.style.setProperty('--ring', hexToHslStr(color));
                    document.documentElement.style.setProperty('--sidebar-primary', hexToHslStr(color));
                    document.documentElement.style.setProperty('--sidebar-ring', hexToHslStr(color));
                }
            }
            
            if (backup.db) {
              metasToRestore = backup.db.metas || [];
              lancamentosToRestore = backup.db.lancamentos || [];
            } else {
              metasToRestore = backup.metas || [];
              lancamentosToRestore = backup.lancamentos || [];
            }
        } else if (Array.isArray(backup) && backup.length > 0 && backup[0].hasOwnProperty('valorBruto')) {
            // Very old pure array format just in case
            lancamentosToRestore = backup;
        } else {
            throw new Error("Formato de arquivo irreconhecível.");
        }

        // Delete existing data line by line
        for (const m of db.metas) {
          await deleteMeta(m.id);
        }
        for (const l of db.lancamentos) {
          await deleteLancamento(l.id);
        }

        // Insert new data sequentially to avoid rate-limits and sorting issues
        for (const m of metasToRestore) {
          await addMeta(m.nome, m.valor, m.descricao || '');
        }
        for (const l of lancamentosToRestore) {
          await addLancamento(l.data, l.valorBruto || l.valor_bruto || 0, l.desconto || 0);
        }

        toast.success("Backup restaurado com sucesso!");
        await onRefresh();
      } catch (err: any) {
        console.error("Erro ao importar backup:", err);
        toast.error(`Erro ao importar: ${err?.message || "O arquivo não pôde ser processado."}`);
      }
      
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  const [activeTab, setActiveTab] = useState<'personalizacao' | 'jornada' | 'backup' | 'sistema'>('personalizacao');

  const sections = [
    { key: 'personalizacao', label: '🎨 Personalização' },
    { key: 'jornada', label: '⏱ Jornada de Trabalho' },
    { key: 'backup', label: '📥 Exportar & 📤 Importar Backup' },
    { key: 'sistema', label: 'ℹ️ Informações do Sistema' },
  ] as const;

  const sectionTitles: Record<typeof activeTab, string> = {
    personalizacao: 'Personalização do Sistema',
    jornada: 'Jornada de Trabalho',
    backup: 'Exportar & Importar Backup',
    sistema: 'Informações do Sistema',
  };

  const activeSectionTitle = sectionTitles[activeTab];

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-foreground mb-1">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie dados e preferências do sistema.</p>
      </div>

      <div className="settings-container flex flex-col md:flex-row gap-6">
        <aside className="settings-menu w-full md:w-72 rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Seções</p>
          </div>

          <div className="flex flex-col gap-2">
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveTab(section.key)}
                className={`rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                  activeTab === section.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-transparent text-foreground hover:bg-slate-100'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="settings-content flex-1 rounded-3xl border border-border bg-card p-6 shadow-sm overflow-y-auto min-h-[520px]">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground mb-2">Configurações</p>
            <h2 className="text-2xl font-semibold text-foreground mb-2">{activeSectionTitle}</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Personalize e mantenha o sistema sob controle com seções claras e foco no que importa.
            </p>
          </div>

          <div className="space-y-6">
            {activeTab === 'personalizacao' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-semibold text-card-foreground mb-4">🎨 Personalização</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">Logotipo da Barra Lateral</label>
                      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                        <div className="w-40 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-secondary/50 overflow-hidden relative group">
                          {customLogo ? (
                            <>
                              <img src={customLogo} alt="Logo Preview" className="max-h-full max-w-full object-contain p-2" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={handleRemoveLogo}
                                  className="text-white text-xs font-semibold bg-red-500/80 px-2 py-1 rounded hover:bg-red-500"
                                >
                                  Remover
                                </button>
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem imagem</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
                          />
                          <p className="mt-2 text-xs text-muted-foreground">Recomendado: Imagens com fundo transparente (PNG).</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border mt-4">
                      <label className="block text-sm font-medium text-muted-foreground mb-2">Cor Principal (Botões e Links)</label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={handleColorChange}
                          className="w-12 h-12 p-1 rounded cursor-pointer border border-border"
                        />
                        <span className="text-sm text-muted-foreground">Escolha a cor de destaque do sistema</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'jornada' && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <WorkSettingsSection />
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="font-semibold text-card-foreground mb-2">📥 Exportar & 📤 Importar Backup</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Exporte um backup completo do seu sistema (incluindo cores, logotipo, metas e lançamentos) e importe quando precisar.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={exportarDadosJSON}
                    className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    📥 Exportar Backup Completo
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById('import-backup-input')?.click()}
                    className="px-4 py-2.5 rounded-lg bg-card border border-border text-muted-foreground text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    📤 Restaurar Backup
                  </button>
                  <input
                    id="import-backup-input"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportBackup}
                  />
                </div>
              </div>
            )}

            {activeTab === 'sistema' && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="font-semibold text-card-foreground mb-4">ℹ️ Informações do Sistema</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ConfiguracoesPage;
