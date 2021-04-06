import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDate(date: string, template = 'd MMM y'): string {
  return format(new Date(date), template, {
    locale: ptBR,
  });
}
