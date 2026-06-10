import { japaneseFrequencyData } from './data/japaneseFrequencyData'

export type JapaneseFrequencyEntry = (typeof japaneseFrequencyData)[number]

export type WordFrequencyGroup = {
  groupStart: number
  groupEnd: number
  entries: JapaneseFrequencyEntry[]
}

export const WORD_GROUPS_PER_PAGE = 5

const normalizeInput = (value: string) => value.trim().toLowerCase()

const GRAMMAR_WORD_TYPES = new Set([
  'adnominal',
  'particle',
  'discourse particle',
  'case particle',
  'conjunctive particle',
  'conjunction',
  'auxiliary',
  'prefix',
  'suffix',
  'counter',
])

export const parseWordTypeParts = (wordType: string) =>
  wordType
    .split(',')
    .map((part) => normalizeInput(part))
    .filter(Boolean)

export const hasGrammarType = (wordType: string) =>
  parseWordTypeParts(wordType).some((part) => GRAMMAR_WORD_TYPES.has(part))

export const getFrequencyGroupStart = (frequency: number) => Math.floor((frequency - 1) / 100) * 100 + 1

export const getJishoSearchUrl = (word: string) => `https://jisho.org/search/${encodeURIComponent(word)}`

export const sortWordEntriesByFrequency = (entries: JapaneseFrequencyEntry[]) =>
  [...entries].sort((a, b) => a.frequency - b.frequency)

export const filterWordEntries = (
  entries: JapaneseFrequencyEntry[],
  options?: {
    search?: string
    typeFilter?: string | null
  },
) => {
  const normalizedSearch = normalizeInput(options?.search ?? '')
  const normalizedTypeFilter = normalizeInput(options?.typeFilter ?? '')

  return entries.filter((entry) => {
    if (normalizedTypeFilter) {
      const parts = parseWordTypeParts(entry.type)
      if (!parts.includes(normalizedTypeFilter)) {
        return false
      }
    }

    if (!normalizedSearch) {
      return true
    }

    const haystacks = [entry.word, entry.reading, entry.meaning, entry.type]
    return haystacks.some((value) => normalizeInput(value).includes(normalizedSearch))
  })
}

export const buildWordFrequencyGroups = (entries: JapaneseFrequencyEntry[]): WordFrequencyGroup[] => {
  const groups = new Map<number, JapaneseFrequencyEntry[]>()

  entries.forEach((entry) => {
    const groupStart = getFrequencyGroupStart(entry.frequency)
    const group = groups.get(groupStart) ?? []
    group.push(entry)
    groups.set(groupStart, group)
  })

  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([groupStart, groupEntries]) => ({
      groupStart,
      groupEnd: groupStart + 99,
      entries: groupEntries,
    }))
}

export const getWordTypeOptions = (entries: JapaneseFrequencyEntry[]) => {
  const uniqueTypes = new Set<string>()
  entries.forEach((entry) => {
    parseWordTypeParts(entry.type).forEach((part) => uniqueTypes.add(part))
  })
  return [...uniqueTypes].sort((a, b) => a.localeCompare(b))
}
