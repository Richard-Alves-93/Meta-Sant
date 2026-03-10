import { useState } from "react";
import { CrmDatabase, exportarDadosJSON, exportarCSV } from "@/lib/crm-data";
import { hexToHslStr } from "@/lib/colors";

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie dados e preferências do sistema.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-card-foreground mb-4">🎨 Personalização</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Logotipo da Barra Lateral</label>
              <div className="flex items-center gap-6">
                <div className="w-40 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-secondary/50 overflow-hidden relative group">
                  {customLogo ? (
                    <>
                      <img src={customLogo} alt="Logo Preview" className="max-h-full max-w-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={handleRemoveLogo} className="text-white text-xs font-semibold bg-red-500/80 px-2 py-1 rounded hover:bg-red-500">
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
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-primary-foreground
                      hover:file:opacity-90 cursor-pointer"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">Recomendado: Imagens com fundo transparente (PNG).</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Cor Principal (Botões e Links)</label>
              <div className="flex items-center gap-4">
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
