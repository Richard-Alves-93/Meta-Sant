import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Calendar } from 'lucide-react';
import {
  getWorkSettings,
  saveWorkSettings,
  addCustomHoliday,
  deleteCustomHoliday,
  fetchCustomHolidays,
  getRemainingWorkingDays,
  WorkMode,
  CustomHoliday,
} from '@/lib/crm-data';
import { toast } from 'sonner';

export function WorkSettingsSection() {
  const [workMode, setWorkMode] = useState<WorkMode>('Segunda-sexta');
  const [customSchedule, setCustomSchedule] = useState<Record<string, boolean>>({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: false,
    Sunday: false,
  });
  const [holidays, setHolidays] = useState<CustomHoliday[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayDesc, setNewHolidayDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [remainingDays, setRemainingDays] = useState(0);

  // Load initial data
  useEffect(() => {
    loadSettings();
  }, []);

  // Recalculate remaining days when settings change
  useEffect(() => {
    calculateRemainingDays();
  }, [workMode, customSchedule, holidays]);

  async function loadSettings() {
    try {
      setLoading(true);
      const [settings, holidaysList] = await Promise.all([
        getWorkSettings(),
        fetchCustomHolidays(),
      ]);

      if (settings) {
        setWorkMode(settings.work_mode);
        if (settings.custom_schedule_json) {
          setCustomSchedule(settings.custom_schedule_json);
        }
      }

      setHolidays(holidaysList);
    } catch (error) {
      console.error('Error loading work settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }

  async function calculateRemainingDays() {
    try {
      const days = await getRemainingWorkingDays();
      setRemainingDays(days);
    } catch (error) {
      console.error('Error calculating remaining days:', error);
    }
  }

  async function handleSaveSettings() {
    try {
      setSaving(true);
      const scheduleToSave = workMode === 'Personalizado' ? customSchedule : undefined;
      await saveWorkSettings(workMode, scheduleToSave);
      toast.success('Jornada de trabalho salva com sucesso!');
    } catch (error) {
      console.error('Error saving work settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddHoliday() {
    if (!newHolidayDate) {
      toast.error('Selecione uma data');
      return;
    }

    try {
      await addCustomHoliday(newHolidayDate, newHolidayDesc || undefined);
      setNewHolidayDate('');
      setNewHolidayDesc('');
      const updatedHolidays = await fetchCustomHolidays();
      setHolidays(updatedHolidays);
      toast.success('Feriado adicionado!');
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast.error('Erro ao adicionar feriado');
    }
  }

  async function handleDeleteHoliday(holidayId: string) {
    try {
      await deleteCustomHoliday(holidayId);
      const updatedHolidays = await fetchCustomHolidays();
      setHolidays(updatedHolidays);
      toast.success('Feriado removido!');
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast.error('Erro ao remover feriado');
    }
  }

  const dayLabels: Record<string, string> = {
    Monday: 'Segunda',
    Tuesday: 'Terça',
    Wednesday: 'Quarta',
    Thursday: 'Quinta',
    Friday: 'Sexta',
    Saturday: 'Sábado',
    Sunday: 'Domingo',
  };

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) {
    return <div className="text-center py-4">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jornada de Trabalho</CardTitle>
        <CardDescription>Configure sua rotina de trabalho para cálculos precisos de metas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Work Mode Selection */}
        <div className="space-y-3">
          <Label>Modo de Trabalho</Label>
          <RadioGroup value={workMode} onValueChange={(value) => setWorkMode(value as WorkMode)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Segunda-sexta" id="mode-weekdays" />
              <Label htmlFor="mode-weekdays" className="cursor-pointer font-normal">
                Segunda a Sexta
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Segunda-sabado" id="mode-saturday" />
              <Label htmlFor="mode-saturday" className="cursor-pointer font-normal">
                Segunda a Sábado
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Todos os dias" id="mode-daily" />
              <Label htmlFor="mode-daily" className="cursor-pointer font-normal">
                Todos os Dias
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Personalizado" id="mode-custom" />
              <Label htmlFor="mode-custom" className="cursor-pointer font-normal">
                Personalizado
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Custom Schedule */}
        {workMode === 'Personalizado' && (
          <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
            <Label>Selecione os dias que você trabalha</Label>
            <div className="grid grid-cols-2 gap-3">
              {dayOrder.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day}`}
                    checked={customSchedule[day] || false}
                    onCheckedChange={(checked) => {
                      setCustomSchedule({
                        ...customSchedule,
                        [day]: checked,
                      });
                    }}
                  />
                  <Label htmlFor={`day-${day}`} className="cursor-pointer font-normal">
                    {dayLabels[day]}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remaining Days Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-1">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">Dias de trabalho restantes este mês: {remainingDays}</span>
          </div>
          <p className="text-xs text-blue-700 ml-7">Cálculo automático baseado na sua jornada e feriados</p>
        </div>

        {/* Save Button */}
        <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
          {saving ? 'Salvando...' : 'Salvar Jornada de Trabalho'}
        </Button>

        {/* Holidays Section */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">Feriados da Empresa</h3>

          {/* Add Holiday Form */}
          <div className="space-y-3 mb-4 p-4 border rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="holiday-date" className="text-sm">
                  Data do Feriado
                </Label>
                <Input
                  id="holiday-date"
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="holiday-desc" className="text-sm">
                  Descrição (opcional)
                </Label>
                <Input
                  id="holiday-desc"
                  type="text"
                  placeholder="Ex: Tiradentes"
                  value={newHolidayDesc}
                  onChange={(e) => setNewHolidayDesc(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <Button onClick={handleAddHoliday} className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Feriado
            </Button>
          </div>

          {/* Holidays List */}
          {holidays.length > 0 ? (
            <div className="space-y-2">
              {holidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div>
                    <p className="font-medium text-sm">
                      {new Intl.DateTimeFormat('pt-BR').format(new Date(holiday.data + 'T12:00:00'))}
                    </p>
                    {holiday.descricao && <p className="text-xs text-gray-600">{holiday.descricao}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteHoliday(holiday.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Nenhum feriado cadastrado</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
