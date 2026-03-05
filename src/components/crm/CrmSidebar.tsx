import { BarChart3, FileText, Target, TrendingUp, Settings } from "lucide-react";

export type CrmPage = "dashboard" | "lancamentos" | "metas" | "relatorios" | "configuracoes";

interface CrmSidebarProps {
  currentPage: CrmPage;
  onNavigate: (page: CrmPage) => void;
}

const navItems: { page: CrmPage; label: string; icon: React.ReactNode }[] = [
  { page: "dashboard", label: "Dashboard", icon: <BarChart3 size={20} /> },
  { page: "lancamentos", label: "Lançamentos", icon: <FileText size={20} /> },
  { page: "metas", label: "Metas", icon: <Target size={20} /> },
  { page: "relatorios", label: "Relatórios", icon: <TrendingUp size={20} /> },
  { page: "configuracoes", label: "Configurações", icon: <Settings size={20} /> },
];

const CrmSidebar = ({ currentPage, onNavigate }: CrmSidebarProps) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[250px] bg-card border-r border-border flex flex-col z-50">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">CR</span>
        </div>
        <span className="font-bold text-card-foreground text-lg">CRM</span>
      </div>

      <nav className="flex flex-col gap-1 px-3 flex-1">
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left
              ${currentPage === item.page
                ? "bg-accent text-accent-foreground"
                : "text-sidebar-foreground hover:bg-secondary"
              }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default CrmSidebar;
