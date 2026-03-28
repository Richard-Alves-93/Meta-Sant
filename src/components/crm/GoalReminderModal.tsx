import { Button } from '@/components/ui/button';

interface GoalReminderModalProps {
  open: boolean;
  force: boolean;
  onCreate: () => void;
  onLater: () => void;
}

const GoalReminderModal = ({ open, force, onCreate, onLater }: GoalReminderModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-card-foreground">Você já cadastrou as metas do próximo mês?</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {force
              ? 'Hoje é dia 1. Para começar o mês com foco, cadastre suas metas antes de continuar.'
              : 'Último dia do mês: se ainda não configurou as metas do próximo mês, aproveite para fazê-lo agora.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onCreate} className="w-full sm:w-auto">Cadastrar agora</Button>
          <Button variant="outline" onClick={onLater} className="w-full sm:w-auto">
            {force ? 'Depois, me lembre' : 'Depois'}
          </Button>
        </div>

        {force && (
          <p className="mt-4 text-xs text-muted-foreground">
            Este lembrete não pode ser fechado por fora do botão. Sua meta ainda não está registrada para o mês atual.
          </p>
        )}
      </div>
    </div>
  );
};

export default GoalReminderModal;
