import { useMemo } from "react";
import { CrmDatabase, formatCurrency, formatDate, getDiasMes } from "@/lib/crm-data";
import KpiCard from "./KpiCard";
import { DollarSign, TrendingDown, Award, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface RelatoriosPageProps {
  db: CrmDatabase;
  onExportExcel: () => void;
}

const RelatoriosPage = ({ db, onExportExcel }: RelatoriosPageProps) => {
  const lancamentos = db.lancamentos;
  const totalLiquido = lancamentos.reduce((s, l) => s + l.valorLiquido, 0);
  const totalDesconto = lancamentos.reduce((s, l) => s + l.desconto, 0);
  const melhorDia = lancamentos.length > 0 ? Math.max(...lancamentos.map(l => l.valorLiquido)) : 0;
  const mediaDiaria = lancamentos.length > 0 ? totalLiquido / lancamentos.length : 0;
  const projecao = mediaDiaria * getDiasMes();

  const vendasPorDia = useMemo(() => {
    const dias = getDiasMes();
    return Array.from({ length: dias }, (_, i) => {
      const dia = i + 1;
      const valor = lancamentos
        .filter(l => new Date(l.data).getDate() === dia)
        .reduce((s, l) => s + l.valorLiquido, 0);
      return { dia, valor };
    });
  }, [lancamentos]);

  const topDias = useMemo(() =>
    [...lancamentos].sort((a, b) => b.valorLiquido - a.valorLiquido).slice(0, 5),
    [lancamentos]
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">Relatórios</h1>
        <p className="text-muted-foreground text-sm">Analise o desempenho das vendas e acompanhe sua evolução.</p>
        <div className="mt-4">
          <button onClick={onExportExcel} className="px-4 py-2.5 rounded-lg bg-card border border-border text-muted-foreground text-sm font-medium hover:bg-secondary transition-colors">
            📥 Exportar Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard label="Total Líquido" value={formatCurrency(totalLiquido)} icon={<DollarSign size={18} />} />
        <KpiCard label="Total Descontos" value={formatCurrency(totalDesconto)} icon={<TrendingDown size={18} />} />
        <KpiCard label="Melhor Dia" value={formatCurrency(melhorDia)} icon={<Award size={18} />} />
        <KpiCard label="Projeção Final" value={formatCurrency(projecao)} icon={<TrendingUp size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-card-foreground mb-4">Vendas por Dia</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendasPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-card-foreground mb-4">Top Dias de Vendas</h3>
          {topDias.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Nenhum dado disponível</div>
          ) : (
            <div className="space-y-3">
              {topDias.map((l, idx) => (
                <div key={l.id} className="flex items-center gap-3 bg-secondary/60 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <span className="flex-1 text-sm font-medium text-card-foreground truncate">{formatDate(l.data)}</span>
                  <span className="font-semibold text-success text-sm whitespace-nowrap">{formatCurrency(l.valorLiquido)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelatoriosPage;
