export type Language = 'cs' | 'en';
export type Words = { cs: string; en: string };
export const w = (cs: string, en: string): Words => ({ cs, en });
/** Legacy workbook shape; existing browser records are left untouched. */
export type Brief = Record<'name' | 'goal' | 'inputs' | 'output' | 'limits' | 'success', string>;
