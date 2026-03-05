interface KpiCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const KpiCard = ({ label, value, icon }: KpiCardProps) => (
  <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      {icon && <span className="text-muted-foreground">{icon}</span>}
    </div>
    <div className="text-2xl font-bold text-card-foreground">{value}</div>
  </div>
);

export default KpiCard;
