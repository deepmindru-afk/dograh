/**
 * Централизованные коды диспозиции, используемые во всём приложении
 * Обновляйте этот массив при добавлении новых кодов диспозиции
 */
export const DISPOSITION_CODES = [
  'end_call_tool',
  'user_hangup',
  'call_duration_exceeded',
  'user_idle_max_duration_exceeded',
  'system_connect_error',
  'unknown',
  'voicemail_detected'
] as const;

export type DispositionCode = typeof DISPOSITION_CODES[number];

/**
 * Отображаемые названия для кодов диспозиции
 */
export const DISPOSITION_LABELS: Record<string, string> = {
  'end_call_tool': 'Завершено инструментом',
  'user_hangup': 'Пользователь завершил',
  'call_duration_exceeded': 'Превышена длительность',
  'user_idle_max_duration_exceeded': 'Превышено время бездействия',
  'system_connect_error': 'Ошибка подключения',
  'unknown': 'Неизвестно',
  'voicemail_detected': 'Автоответчик',
};
