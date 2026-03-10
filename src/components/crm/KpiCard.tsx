interface KpiCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const KpiCard = ({ label, value, icon }: KpiCardProps) => (
  <div className="bg-card border border-border rounded-xl p-4 xl:p-6 shadow-sm flex flex-col justify-center">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[11px] xl:text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">{label}</span>
      {icon && <span className="text-muted-foreground flex-shrink-0 ml-2">{icon}</span>}
    </div>
    <div className="text-xl lg:text-lg xl:text-2xl font-bold text-card-foreground tracking-tight">{value}</div>
  </div>
);

export default KpiCard;
