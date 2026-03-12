import { useMemo } from "react";
import { CrmDatabase, getLancamentosDoMes, formatCurrency, getDiasMes, calcularVendasNecessarias, Lancamento, formatDate } from "@/lib/crm-data";
import KpiCard from "./KpiCard";
import MetaCard from "./MetaCard";
import RecomprasHoje from "../dashboard/RecomprasHoje";
import { Meta } from "@/lib/crm-data";
import { DollarSign, TrendingDown, Activity, TrendingUp, MessageCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

interface DashboardPageProps {
  db: CrmDatabase;
  onOpenLancamento: () => void;
  onEditMeta: (meta: Meta) => void;
  onDeleteMeta: (id: string) => void;
  onNavigateToRecompras: () => void;
}

const DashboardPage = ({ db, onOpenLancamento, onEditMeta, onDeleteMeta, onNavigateToRecompras }: DashboardPageProps) => {
  const lancamentosMes = useMemo(() => getLancamentosDoMes(db), [db]);

  const totalLiquido = lancamentosMes.reduce((s, l) => s + l.valorLiquido, 0);
  const totalDesconto = lancamentosMes.reduce((s, l) => s + l.desconto, 0);
  const mediaDiaria = lancamentosMes.length > 0 ? totalLiquido / lancamentosMes.length : 0;
  const projecao = mediaDiaria * getDiasMes();

  const vendasPorDia = useMemo(() => {
    const dias = getDiasMes();
    return Array.from({ length: dias }, (_, i) => {
      const dia = i + 1;
      const valor = lancamentosMes
        .filter(l => new Date(l.data).getDate() === dia)
        .reduce((s, l) => s + l.valorLiquido, 0);
      return { dia, valor };
    });
  }, [lancamentosMes]);

  const metaVsRealizado = useMemo(() => {
    const metaPrincipal = db.metas[0];
    if (!metaPrincipal) return [];
    const diasMes = getDiasMes();
    const metaDiaria = metaPrincipal.valor / diasMes;
    const hoje = new Date().getDate();
    let acum = 0;
    return Array.from({ length: Math.min(hoje, diasMes) }, (_, i) => {
      const dia = i + 1;
      acum += lancamentosMes
        .filter(l => new Date(l.data).getDate() === dia)
        .reduce((s, l) => s + l.valorLiquido, 0);
      return { dia, meta: metaDiaria * dia, realizado: acum };
    });
  }, [db, lancamentosMes]);

  const ultimosLancamentos = useMemo(() =>
    [...db.lancamentos].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 5),
    [db]
  );

  const handleShareAllMetas = () => {
    if (db.metas.length === 0) return;
    
    let text = `🎯 *Resumo Diário das Metas*\n\n`;
    
    db.metas.forEach(meta => {
      const calc = calcularVendasNecessarias(meta, lancamentosMes);
      text += `📌 *${meta.nome}*\n`;
      text += `💰 Objetivo: ${formatCurrency(meta.valor)}\n`;
      text += `✅ Vendido: ${formatCurrency(calc.totalVendido)} (${Math.round(calc.percentual)}%)\n`;
      text += `⏳ Faltam: ${formatCurrency(calc.vendasRestantes)}\n`;
      text += `📅 Necessário/dia: ${formatCurrency(calc.vendasNecessarias)}\n`;
      text += `${calc.metaBatida ? "🎉 Meta batida! 🚀" : "💪 Foco na meta!"}\n\n`;
    });

    const url = `https://wa.me/?text=${encodeURIComponent(text.trim())}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Acompanhe o desempenho de vendas em tempo real</p>
        <div className="flex gap-3 mt-4 flex-wrap">
          <button onClick={onOpenLancamento} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            + Lançar venda do dia
          </button>
          {db.metas.length > 0 && (
            <button 
              onClick={handleShareAllMetas}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#20bd5a] transition-colors"
            >
              <MessageCircle size={18} />
              Compartilhar Metas
            </button>
          )}
        </div>
      </div>

      {db.metas.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">VENDAS NECESSÁRIAS HOJE</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {db.metas.map(meta => (
              <MetaCard key={meta.id} meta={meta} lancamentos={lancamentosMes} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard label="Total Líquido" value={formatCurrency(totalLiquido)} icon={<DollarSign size={18} />} />
        <KpiCard label="Total Desconto" value={formatCurrency(totalDesconto)} icon={<TrendingDown size={18} />} />
        <KpiCard label="Média Diária" value={formatCurrency(mediaDiaria)} icon={<Activity size={18} />} />
        <KpiCard label="Projeção Final" value={formatCurrency(projecao)} icon={<TrendingUp size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 grid grid-cols-1 gap-6">
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
            <h3 className="font-semibold text-card-foreground mb-4">Meta vs Realizado</h3>
            <div className="h-[300px]">
              {metaVsRealizado.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metaVsRealizado}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="meta" stroke="hsl(var(--success))" strokeWidth={2} dot={false} name="Meta" />
                    <Line type="monotone" dataKey="realizado" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Realizado" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Crie uma meta para ver o gráfico</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <RecomprasHoje onNavigateToRecompras={onNavigateToRecompras} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-card-foreground mb-4">Últimos Lançamentos</h3>
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 pb-4">
          <div className="min-w-[600px]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 w-1/4">Data</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 w-1/4">Valor Bruto</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 w-1/4">Desconto</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-4 w-1/4">Valor Líquido</th>
                </tr>
              </thead>
              <tbody>
                {ultimosLancamentos.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Nenhum lançamento registrado</td></tr>
                ) : ultimosLancamentos.map(l => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-4 text-sm">{formatDate(l.data)}</td>
                    <td className="py-3 px-4 text-sm">{formatCurrency(l.valorBruto)}</td>
                    <td className="py-3 px-4 text-sm text-warning">{formatCurrency(l.desconto)}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-success">{formatCurrency(l.valorLiquido)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
