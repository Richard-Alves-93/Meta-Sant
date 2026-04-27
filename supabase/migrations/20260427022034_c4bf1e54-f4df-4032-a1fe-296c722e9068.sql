-- Função utilitária para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.metas_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  meta_id UUID,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ano, mes, nome)
);

ALTER TABLE public.metas_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metas_mensais"
ON public.metas_mensais FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metas_mensais"
ON public.metas_mensais FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metas_mensais"
ON public.metas_mensais FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metas_mensais"
ON public.metas_mensais FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_metas_mensais_user_periodo ON public.metas_mensais(user_id, ano, mes);

CREATE TRIGGER update_metas_mensais_updated_at
BEFORE UPDATE ON public.metas_mensais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();