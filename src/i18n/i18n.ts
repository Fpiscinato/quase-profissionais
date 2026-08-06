import { EN } from './en'

export type Lang = 'pt' | 'en'

type Vars = Record<string, string | number>

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`))
}

/**
 * Portuguese is the source language and doubles as the dictionary key: t()
 * returns the key unchanged in 'pt' (so every existing PT string/test stays
 * byte-identical), or looks it up in EN for 'en'. {placeholders} are
 * interpolated after lookup, so both languages can reorder them freely.
 */
export function translate(lang: Lang, key: string, vars?: Vars): string {
  const template = lang === 'en' ? (EN[key] ?? key) : key
  return interpolate(template, vars)
}

export type Translator = (key: string, vars?: Vars) => string

export function makeTranslator(lang: Lang): Translator {
  return (key, vars) => translate(lang, key, vars)
}
