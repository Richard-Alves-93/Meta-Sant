interface KpiCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const KpiCard = ({ label, value, icon }: KpiCardProps) => (
  <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm flex flex-col justify-center min-h-[100px]">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate mr-2">{label}</span>
      {icon && <span className="text-muted-foreground flex-shrink-0">{icon}</span>}
    </div>
    <div className="text-lg sm:text-xl md:text-2xl font-bold text-card-foreground truncate" title={value}>{value}</div>
  </div>
);

export default KpiCard;
