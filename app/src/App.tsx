import { useEffect, useMemo, useRef, useState } from 'react'
import { Sun, Moon, RotateCcw } from 'lucide-react'
import { japaneseFrequencyData } from './data/japaneseFrequencyData'
import './App.css'

type Theme = 'light' | 'dark'
type PracticeMode = 'hiragana' | 'katakana' | 'frequency'

type HiraganaCard = {
  character: string
  answers: string[]
}

type HiraganaSession = {
  remainingCharacters: string[]
  currentInput: string
}

type WordSession = {
  remainingIndexes: number[]
  currentInput: string
}

type WordSelection = {
  word: string
  reading?: string
  type?: string
}

type WordSetMode = 'test' | 'full'
type JapaneseFrequencyEntry = (typeof japaneseFrequencyData)[number]
type DeckConfig = {
  includedCharacters: string[]
}

type DeckCell = {
  character: string
  displayRomaji: string
  positionRomaji: string
  row: string
  column: string
}

type DeckMatrix = {
  rows: string[]
  columns: string[]
  rowCharacters: Map<string, string[]>
  columnCharacters: Map<string, string[]>
  cellMap: Map<string, DeckCell>
}

const modes: Record<PracticeMode, { label: string; mobileLabel: string; title: string }> = {
  hiragana: {
    label: 'ひらがな / HIRAGANA',
    mobileLabel: 'HIRAGANA',
    title: 'ひらがな / HIRAGANA',
  },
  katakana: {
    label: 'カタカナ / KATAKANA',
    mobileLabel: 'KATAKANA',
    title: 'カタカナ / KATAKANA',
  },
  frequency: {
    label: '言葉 / WORDS',
    mobileLabel: 'WORDS',
    title: '言葉 / WORDS',
  },
}

const getSystemTheme = (): Theme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const HIRAGANA_CARDS: HiraganaCard[] = [
  { character: 'あ', answers: ['a'] },
  { character: 'い', answers: ['i'] },
  { character: 'う', answers: ['u'] },
  { character: 'え', answers: ['e'] },
  { character: 'お', answers: ['o'] },
  { character: 'か', answers: ['ka'] },
  { character: 'き', answers: ['ki'] },
  { character: 'く', answers: ['ku'] },
  { character: 'け', answers: ['ke'] },
  { character: 'こ', answers: ['ko'] },
  { character: 'さ', answers: ['sa'] },
  { character: 'し', answers: ['shi', 'si'] },
  { character: 'す', answers: ['su'] },
  { character: 'せ', answers: ['se'] },
  { character: 'そ', answers: ['so'] },
  { character: 'た', answers: ['ta'] },
  { character: 'ち', answers: ['chi', 'ti'] },
  { character: 'つ', answers: ['tsu', 'tu'] },
  { character: 'て', answers: ['te'] },
  { character: 'と', answers: ['to'] },
  { character: 'な', answers: ['na'] },
  { character: 'に', answers: ['ni'] },
  { character: 'ぬ', answers: ['nu'] },
  { character: 'ね', answers: ['ne'] },
  { character: 'の', answers: ['no'] },
  { character: 'は', answers: ['ha'] },
  { character: 'ひ', answers: ['hi'] },
  { character: 'ふ', answers: ['fu', 'hu'] },
  { character: 'へ', answers: ['he'] },
  { character: 'ほ', answers: ['ho'] },
  { character: 'ま', answers: ['ma'] },
  { character: 'み', answers: ['mi'] },
  { character: 'む', answers: ['mu'] },
  { character: 'め', answers: ['me'] },
  { character: 'も', answers: ['mo'] },
  { character: 'や', answers: ['ya'] },
  { character: 'ゆ', answers: ['yu'] },
  { character: 'よ', answers: ['yo'] },
  { character: 'ら', answers: ['ra'] },
  { character: 'り', answers: ['ri'] },
  { character: 'る', answers: ['ru'] },
  { character: 'れ', answers: ['re'] },
  { character: 'ろ', answers: ['ro'] },
  { character: 'わ', answers: ['wa'] },
  { character: 'を', answers: ['wo', 'o'] },
  { character: 'ん', answers: ['n'] },
  { character: 'が', answers: ['ga'] },
  { character: 'ぎ', answers: ['gi'] },
  { character: 'ぐ', answers: ['gu'] },
  { character: 'げ', answers: ['ge'] },
  { character: 'ご', answers: ['go'] },
  { character: 'ざ', answers: ['za'] },
  { character: 'じ', answers: ['ji', 'zi'] },
  { character: 'ず', answers: ['zu'] },
  { character: 'ぜ', answers: ['ze'] },
  { character: 'ぞ', answers: ['zo'] },
  { character: 'だ', answers: ['da'] },
  { character: 'ぢ', answers: ['ji', 'di'] },
  { character: 'づ', answers: ['zu', 'du'] },
  { character: 'で', answers: ['de'] },
  { character: 'ど', answers: ['do'] },
  { character: 'ば', answers: ['ba'] },
  { character: 'び', answers: ['bi'] },
  { character: 'ぶ', answers: ['bu'] },
  { character: 'べ', answers: ['be'] },
  { character: 'ぼ', answers: ['bo'] },
  { character: 'ぱ', answers: ['pa'] },
  { character: 'ぴ', answers: ['pi'] },
  { character: 'ぷ', answers: ['pu'] },
  { character: 'ぺ', answers: ['pe'] },
  { character: 'ぽ', answers: ['po'] },
  { character: 'きゃ', answers: ['kya'] },
  { character: 'きゅ', answers: ['kyu'] },
  { character: 'きょ', answers: ['kyo'] },
  { character: 'しゃ', answers: ['sha', 'sya'] },
  { character: 'しゅ', answers: ['shu', 'syu'] },
  { character: 'しょ', answers: ['sho', 'syo'] },
  { character: 'ちゃ', answers: ['cha', 'tya', 'cya'] },
  { character: 'ちゅ', answers: ['chu', 'tyu', 'cyu'] },
  { character: 'ちょ', answers: ['cho', 'tyo', 'cyo'] },
  { character: 'にゃ', answers: ['nya'] },
  { character: 'にゅ', answers: ['nyu'] },
  { character: 'にょ', answers: ['nyo'] },
  { character: 'ひゃ', answers: ['hya'] },
  { character: 'ひゅ', answers: ['hyu'] },
  { character: 'ひょ', answers: ['hyo'] },
  { character: 'みゃ', answers: ['mya'] },
  { character: 'みゅ', answers: ['myu'] },
  { character: 'みょ', answers: ['myo'] },
  { character: 'りゃ', answers: ['rya'] },
  { character: 'りゅ', answers: ['ryu'] },
  { character: 'りょ', answers: ['ryo'] },
  { character: 'ぎゃ', answers: ['gya'] },
  { character: 'ぎゅ', answers: ['gyu'] },
  { character: 'ぎょ', answers: ['gyo'] },
  { character: 'じゃ', answers: ['ja', 'jya', 'zya'] },
  { character: 'じゅ', answers: ['ju', 'jyu', 'zyu'] },
  { character: 'じょ', answers: ['jo', 'jyo', 'zyo'] },
  { character: 'ぢゃ', answers: ['ja', 'dya'] },
  { character: 'ぢゅ', answers: ['ju', 'dyu'] },
  { character: 'ぢょ', answers: ['jo', 'dyo'] },
  { character: 'びゃ', answers: ['bya'] },
  { character: 'びゅ', answers: ['byu'] },
  { character: 'びょ', answers: ['byo'] },
  { character: 'ぴゃ', answers: ['pya'] },
  { character: 'ぴゅ', answers: ['pyu'] },
  { character: 'ぴょ', answers: ['pyo'] },
]

const KATAKANA_CARDS: HiraganaCard[] = [
  { character: 'ア', answers: ['a'] },
  { character: 'イ', answers: ['i'] },
  { character: 'ウ', answers: ['u'] },
  { character: 'エ', answers: ['e'] },
  { character: 'オ', answers: ['o'] },
  { character: 'カ', answers: ['ka'] },
  { character: 'キ', answers: ['ki'] },
  { character: 'ク', answers: ['ku'] },
  { character: 'ケ', answers: ['ke'] },
  { character: 'コ', answers: ['ko'] },
  { character: 'サ', answers: ['sa'] },
  { character: 'シ', answers: ['shi', 'si'] },
  { character: 'ス', answers: ['su'] },
  { character: 'セ', answers: ['se'] },
  { character: 'ソ', answers: ['so'] },
  { character: 'タ', answers: ['ta'] },
  { character: 'チ', answers: ['chi', 'ti'] },
  { character: 'ツ', answers: ['tsu', 'tu'] },
  { character: 'テ', answers: ['te'] },
  { character: 'ト', answers: ['to'] },
  { character: 'ナ', answers: ['na'] },
  { character: 'ニ', answers: ['ni'] },
  { character: 'ヌ', answers: ['nu'] },
  { character: 'ネ', answers: ['ne'] },
  { character: 'ノ', answers: ['no'] },
  { character: 'ハ', answers: ['ha'] },
  { character: 'ヒ', answers: ['hi'] },
  { character: 'フ', answers: ['fu', 'hu'] },
  { character: 'ヘ', answers: ['he'] },
  { character: 'ホ', answers: ['ho'] },
  { character: 'マ', answers: ['ma'] },
  { character: 'ミ', answers: ['mi'] },
  { character: 'ム', answers: ['mu'] },
  { character: 'メ', answers: ['me'] },
  { character: 'モ', answers: ['mo'] },
  { character: 'ヤ', answers: ['ya'] },
  { character: 'ユ', answers: ['yu'] },
  { character: 'ヨ', answers: ['yo'] },
  { character: 'ラ', answers: ['ra'] },
  { character: 'リ', answers: ['ri'] },
  { character: 'ル', answers: ['ru'] },
  { character: 'レ', answers: ['re'] },
  { character: 'ロ', answers: ['ro'] },
  { character: 'ワ', answers: ['wa'] },
  { character: 'ヲ', answers: ['wo', 'o'] },
  { character: 'ン', answers: ['n'] },
  { character: 'ガ', answers: ['ga'] },
  { character: 'ギ', answers: ['gi'] },
  { character: 'グ', answers: ['gu'] },
  { character: 'ゲ', answers: ['ge'] },
  { character: 'ゴ', answers: ['go'] },
  { character: 'ザ', answers: ['za'] },
  { character: 'ジ', answers: ['ji', 'zi'] },
  { character: 'ズ', answers: ['zu'] },
  { character: 'ゼ', answers: ['ze'] },
  { character: 'ゾ', answers: ['zo'] },
  { character: 'ダ', answers: ['da'] },
  { character: 'ヂ', answers: ['ji', 'di'] },
  { character: 'ヅ', answers: ['zu', 'du'] },
  { character: 'デ', answers: ['de'] },
  { character: 'ド', answers: ['do'] },
  { character: 'バ', answers: ['ba'] },
  { character: 'ビ', answers: ['bi'] },
  { character: 'ブ', answers: ['bu'] },
  { character: 'ベ', answers: ['be'] },
  { character: 'ボ', answers: ['bo'] },
  { character: 'パ', answers: ['pa'] },
  { character: 'ピ', answers: ['pi'] },
  { character: 'プ', answers: ['pu'] },
  { character: 'ペ', answers: ['pe'] },
  { character: 'ポ', answers: ['po'] },
  { character: 'キャ', answers: ['kya'] },
  { character: 'キュ', answers: ['kyu'] },
  { character: 'キョ', answers: ['kyo'] },
  { character: 'シャ', answers: ['sha', 'sya'] },
  { character: 'シュ', answers: ['shu', 'syu'] },
  { character: 'ショ', answers: ['sho', 'syo'] },
  { character: 'チャ', answers: ['cha', 'tya', 'cya'] },
  { character: 'チュ', answers: ['chu', 'tyu', 'cyu'] },
  { character: 'チョ', answers: ['cho', 'tyo', 'cyo'] },
  { character: 'ニャ', answers: ['nya'] },
  { character: 'ニュ', answers: ['nyu'] },
  { character: 'ニョ', answers: ['nyo'] },
  { character: 'ヒャ', answers: ['hya'] },
  { character: 'ヒュ', answers: ['hyu'] },
  { character: 'ヒョ', answers: ['hyo'] },
  { character: 'ミャ', answers: ['mya'] },
  { character: 'ミュ', answers: ['myu'] },
  { character: 'ミョ', answers: ['myo'] },
  { character: 'リャ', answers: ['rya'] },
  { character: 'リュ', answers: ['ryu'] },
  { character: 'リョ', answers: ['ryo'] },
  { character: 'ギャ', answers: ['gya'] },
  { character: 'ギュ', answers: ['gyu'] },
  { character: 'ギョ', answers: ['gyo'] },
  { character: 'ジャ', answers: ['ja', 'jya', 'zya'] },
  { character: 'ジュ', answers: ['ju', 'jyu', 'zyu'] },
  { character: 'ジョ', answers: ['jo', 'jyo', 'zyo'] },
  { character: 'ヂャ', answers: ['ja', 'dya'] },
  { character: 'ヂュ', answers: ['ju', 'dyu'] },
  { character: 'ヂョ', answers: ['jo', 'dyo'] },
  { character: 'ビャ', answers: ['bya'] },
  { character: 'ビュ', answers: ['byu'] },
  { character: 'ビョ', answers: ['byo'] },
  { character: 'ピャ', answers: ['pya'] },
  { character: 'ピュ', answers: ['pyu'] },
  { character: 'ピョ', answers: ['pyo'] },
]

const HIRAGANA_SESSION_KEY = 'hayaku-hiragana-session-v1'
const KATAKANA_SESSION_KEY = 'hayaku-katakana-session-v1'
const WORD_SESSION_KEY = 'hayaku-word-session-v3'
const WORD_SET_MODE_KEY = 'hayaku-word-set-mode-v1'
const HIRAGANA_DECK_KEY = 'hayaku-hiragana-deck-v1'
const KATAKANA_DECK_KEY = 'hayaku-katakana-deck-v1'

const WORDS_TEST_SELECTIONS: WordSelection[] = [
  { word: '私', reading: 'わたし', type: 'pronoun' },
  { word: '神', type: 'noun' },
  { word: 'ありがとう', type: 'interjection' },
  { word: 'の', type: 'case particle' },
  { word: '物', type: 'noun' },
  { word: 'いろいろ', type: 'adverb, na-adjective' },
  { word: 'と', type: 'case particle' },
  { word: '今日', reading: 'きょう', type: 'noun' },
]

const normalizeInput = (value: string) => value.trim().toLowerCase()
const containsKanji = (value: string) => /[\u3400-\u9FFF]/.test(value)

const normalizeMeaning = (value: string) =>
  normalizeInput(value.replace(/^["']+/, '').replace(/["']+$/, ''))

const parseMeaningAnswers = (meaning: string) => {
  const fullMeaning = normalizeMeaning(meaning)
  const splitMeanings = meaning
    .split(/[;,]/)
    .map(normalizeMeaning)
    .filter(Boolean)

  return [...new Set([fullMeaning, ...splitMeanings].filter(Boolean))]
}

const matchesSelection = (entry: JapaneseFrequencyEntry, selection: WordSelection) => {
  if (entry.word !== selection.word) {
    return false
  }

  if (selection.reading && entry.reading !== selection.reading) {
    return false
  }

  if (selection.type && entry.type !== selection.type) {
    return false
  }

  return true
}

const createWordsTestCards = () => {
  return WORDS_TEST_SELECTIONS.map((selection) =>
    japaneseFrequencyData.find((entry) => matchesSelection(entry, selection)),
  ).filter((entry): entry is JapaneseFrequencyEntry => Boolean(entry))
}

const getWordCardsForMode = (wordSetMode: WordSetMode): JapaneseFrequencyEntry[] =>
  wordSetMode === 'test' ? createWordsTestCards() : japaneseFrequencyData

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

const createNewKanaSession = (cards: HiraganaCard[]): HiraganaSession => ({
  remainingCharacters: shuffle(cards.map((card) => card.character)),
  currentInput: '',
})

const createNewWordSession = (wordCards: JapaneseFrequencyEntry[]): WordSession => ({
  remainingIndexes: shuffle(wordCards.map((_, index) => index)),
  currentInput: '',
})

const parseStoredSession = (value: string | null, validCards: HiraganaCard[]): HiraganaSession | null => {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as HiraganaSession
    if (!Array.isArray(parsed.remainingCharacters) || typeof parsed.currentInput !== 'string') {
      return null
    }

    const validCharacters = new Set(validCards.map((card) => card.character))
    const deduped = parsed.remainingCharacters.filter(
      (character, index, collection) =>
        typeof character === 'string' &&
        validCharacters.has(character) &&
        collection.indexOf(character) === index,
    )

    if (deduped.length === 0) {
      return null
    }

    return {
      remainingCharacters: deduped,
      currentInput: parsed.currentInput,
    }
  } catch {
    return null
  }
}

const parseStoredWordSession = (
  value: string | null,
  wordCards: JapaneseFrequencyEntry[],
): WordSession | null => {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as WordSession
    if (!Array.isArray(parsed.remainingIndexes) || typeof parsed.currentInput !== 'string') {
      return null
    }

    const deduped = parsed.remainingIndexes.filter(
      (index, arrayIndex, collection) =>
        Number.isInteger(index) &&
        index >= 0 &&
        index < wordCards.length &&
        collection.indexOf(index) === arrayIndex,
    )

    if (deduped.length === 0) {
      return null
    }

    return {
      remainingIndexes: deduped,
      currentInput: parsed.currentInput,
    }
  } catch {
    return null
  }
}

const getDeckPositionRomajiForCard = (card: HiraganaCard) => {
  const overrideByCharacter: Record<string, string> = {
    'し': 'si',
    'シ': 'si',
    'ち': 'ti',
    'チ': 'ti',
    'じ': 'zi',
    'ジ': 'zi',
    'ぢ': 'di',
    'ヂ': 'di',
    'つ': 'tu',
    'ツ': 'tu',
    'づ': 'du',
    'ヅ': 'du',
    'ふ': 'hu',
    'フ': 'hu',
  }

  return overrideByCharacter[card.character] ?? card.answers[0]
}

const getDeckDisplayRomajiForCard = (card: HiraganaCard) => card.answers[0]

const parseRomajiToGridPosition = (romaji: string) => {
  const normalized = normalizeInput(romaji)
  if (normalized === 'n') {
    return { row: 'n', column: 'n' }
  }

  const match = normalized.match(/^(.*?)([aiueo])$/)
  if (!match) {
    return { row: normalized, column: 'other' }
  }

  return {
    row: match[1],
    column: match[2],
  }
}

const buildDeckCells = (cards: HiraganaCard[]): DeckCell[] => {
  return cards.map((card) => {
    const positionRomaji = getDeckPositionRomajiForCard(card)
    const displayRomaji = getDeckDisplayRomajiForCard(card)
    const position = parseRomajiToGridPosition(positionRomaji)
    return {
      character: card.character,
      displayRomaji,
      positionRomaji,
      row: position.row,
      column: position.column,
    }
  })
}

const ROW_ORDER = [
  '',
  'k',
  's',
  't',
  'n',
  'h',
  'm',
  'y',
  'r',
  'w',
  'g',
  'z',
  'd',
  'b',
  'p',
  'f',
  'ts',
  'j',
  'ch',
  'sh',
  'ky',
  'ny',
  'hy',
  'my',
  'ry',
  'gy',
  'by',
  'py',
  'dy',
]

const COLUMN_ORDER = ['a', 'i', 'u', 'e', 'o', 'n', 'other']

const sortByKnownOrder = (items: string[], order: string[]) => {
  const orderIndex = new Map(order.map((item, index) => [item, index]))
  return [...items].sort((a, b) => {
    const aIndex = orderIndex.get(a)
    const bIndex = orderIndex.get(b)
    if (aIndex !== undefined && bIndex !== undefined) {
      return aIndex - bIndex
    }
    if (aIndex !== undefined) {
      return -1
    }
    if (bIndex !== undefined) {
      return 1
    }
    return a.localeCompare(b)
  })
}

const buildDeckMatrix = (cells: DeckCell[]): DeckMatrix => {
  const rows = sortByKnownOrder([...new Set(cells.map((cell) => cell.row))], ROW_ORDER)
  const columns = sortByKnownOrder([...new Set(cells.map((cell) => cell.column))], COLUMN_ORDER)

  const rowCharacters = new Map<string, string[]>()
  rows.forEach((row) => {
    rowCharacters.set(
      row,
      cells.filter((cell) => cell.row === row).map((cell) => cell.character),
    )
  })

  const columnCharacters = new Map<string, string[]>()
  columns.forEach((column) => {
    columnCharacters.set(
      column,
      cells.filter((cell) => cell.column === column).map((cell) => cell.character),
    )
  })

  const cellMap = new Map<string, DeckCell>()
  cells.forEach((cell) => {
    cellMap.set(`${cell.row}:${cell.column}`, cell)
  })

  return {
    rows,
    columns,
    rowCharacters,
    columnCharacters,
    cellMap,
  }
}

const createDefaultDeckConfig = (cards: HiraganaCard[]): DeckConfig => ({
  includedCharacters: cards.map((card) => card.character),
})

const parseStoredDeckConfig = (value: string | null, cards: HiraganaCard[]): DeckConfig | null => {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as DeckConfig
    if (!Array.isArray(parsed.includedCharacters)) {
      return null
    }

    const validCharacters = new Set(cards.map((card) => card.character))
    const deduped = parsed.includedCharacters.filter(
      (character, index, collection) =>
        typeof character === 'string' &&
        validCharacters.has(character) &&
        collection.indexOf(character) === index,
    )

    return {
      includedCharacters: deduped,
    }
  } catch {
    return null
  }
}

const getCardsForDeck = (cards: HiraganaCard[], deckConfig: DeckConfig): HiraganaCard[] => {
  const includedCharacters = new Set(deckConfig.includedCharacters)
  return cards.filter((card) => includedCharacters.has(card.character))
}

const toggleDeckCharacters = (
  currentDeck: DeckConfig,
  characters: string[],
  allCharacters: string[],
): DeckConfig => {
  const included = new Set(currentDeck.includedCharacters)
  const uniqueTargets = [...new Set(characters)]
  const areAllSelected = uniqueTargets.every((character) => included.has(character))

  if (areAllSelected) {
    uniqueTargets.forEach((character) => included.delete(character))
  } else {
    uniqueTargets.forEach((character) => included.add(character))
  }

  if (included.size === 0) {
    return currentDeck
  }

  return {
    includedCharacters: allCharacters.filter((character) => included.has(character)),
  }
}

const getSelectionState = (characters: string[], selectedCharacters: Set<string>) => {
  const selectedCount = characters.filter((character) => selectedCharacters.has(character)).length
  if (selectedCount === 0) {
    return 'none'
  }
  if (selectedCount === characters.length) {
    return 'all'
  }
  return 'partial'
}

const formatDeckRowLabel = (row: string) => {
  if (row === '') {
    return 'vowels'
  }
  if (row === 'n') {
    return 'n'
  }
  return `${row}-`
}

const formatDeckColumnLabel = (column: string) => {
  if (column === 'other') {
    return 'other'
  }
  return column
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = window.localStorage.getItem('hayaku-theme')
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
    return getSystemTheme()
  })
  const [mode, setMode] = useState<PracticeMode>(() => {
    const saved = window.localStorage.getItem('hayaku-mode')
    if (saved === 'hiragana' || saved === 'katakana' || saved === 'frequency') {
      return saved
    }
    return 'hiragana'
  })
  const [hiraganaDeck, setHiraganaDeck] = useState<DeckConfig>(() => {
    const saved = window.localStorage.getItem(HIRAGANA_DECK_KEY)
    return parseStoredDeckConfig(saved, HIRAGANA_CARDS) ?? createDefaultDeckConfig(HIRAGANA_CARDS)
  })
  const [katakanaDeck, setKatakanaDeck] = useState<DeckConfig>(() => {
    const saved = window.localStorage.getItem(KATAKANA_DECK_KEY)
    return parseStoredDeckConfig(saved, KATAKANA_CARDS) ?? createDefaultDeckConfig(KATAKANA_CARDS)
  })
  const [isDeckEditorOpen, setIsDeckEditorOpen] = useState(false)
  const hiraganaDeckCards = useMemo(() => getCardsForDeck(HIRAGANA_CARDS, hiraganaDeck), [hiraganaDeck])
  const katakanaDeckCards = useMemo(() => getCardsForDeck(KATAKANA_CARDS, katakanaDeck), [katakanaDeck])
  const [hiraganaSession, setHiraganaSession] = useState<HiraganaSession>(() => {
    const saved = window.localStorage.getItem(HIRAGANA_SESSION_KEY)
    const savedDeck = parseStoredDeckConfig(window.localStorage.getItem(HIRAGANA_DECK_KEY), HIRAGANA_CARDS)
    const activeCards = getCardsForDeck(HIRAGANA_CARDS, savedDeck ?? createDefaultDeckConfig(HIRAGANA_CARDS))
    return parseStoredSession(saved, activeCards) ?? createNewKanaSession(activeCards)
  })
  const [katakanaSession, setKatakanaSession] = useState<HiraganaSession>(() => {
    const saved = window.localStorage.getItem(KATAKANA_SESSION_KEY)
    const savedDeck = parseStoredDeckConfig(window.localStorage.getItem(KATAKANA_DECK_KEY), KATAKANA_CARDS)
    const activeCards = getCardsForDeck(KATAKANA_CARDS, savedDeck ?? createDefaultDeckConfig(KATAKANA_CARDS))
    return parseStoredSession(saved, activeCards) ?? createNewKanaSession(activeCards)
  })
  const [wordSetMode, setWordSetMode] = useState<WordSetMode>(() => {
    const saved = window.localStorage.getItem(WORD_SET_MODE_KEY)
    if (saved === 'full' || saved === 'test') {
      return saved
    }
    return 'test'
  })
  const wordCards = useMemo(() => getWordCardsForMode(wordSetMode), [wordSetMode])
  const [wordSession, setWordSession] = useState<WordSession>(() => {
    const savedSetMode = window.localStorage.getItem(WORD_SET_MODE_KEY)
    const initialSetMode = savedSetMode === 'full' || savedSetMode === 'test' ? savedSetMode : 'test'
    const initialWordCards = getWordCardsForMode(initialSetMode)
    const saved = window.localStorage.getItem(`${WORD_SESSION_KEY}-${initialSetMode}`)
    return parseStoredWordSession(saved, initialWordCards) ?? createNewWordSession(initialWordCards)
  })
  const answerInputRef = useRef<HTMLInputElement>(null)
  const focusAnswerInput = (immediate = false) => {
    const tryFocus = () => {
      const input = answerInputRef.current
      if (!input) {
        return
      }

      input.focus({ preventScroll: true })
      // iOS Safari is more likely to keep focus when selection is explicitly set.
      const length = input.value.length
      input.setSelectionRange(length, length)
    }

    if (immediate) {
      tryFocus()
    }

    requestAnimationFrame(tryFocus)
    setTimeout(tryFocus, 0)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem('hayaku-theme', theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(HIRAGANA_SESSION_KEY, JSON.stringify(hiraganaSession))
  }, [hiraganaSession])

  useEffect(() => {
    window.localStorage.setItem(KATAKANA_SESSION_KEY, JSON.stringify(katakanaSession))
  }, [katakanaSession])

  useEffect(() => {
    window.localStorage.setItem(HIRAGANA_DECK_KEY, JSON.stringify(hiraganaDeck))
  }, [hiraganaDeck])

  useEffect(() => {
    window.localStorage.setItem(KATAKANA_DECK_KEY, JSON.stringify(katakanaDeck))
  }, [katakanaDeck])

  useEffect(() => {
    window.localStorage.setItem(`${WORD_SESSION_KEY}-${wordSetMode}`, JSON.stringify(wordSession))
  }, [wordSession, wordSetMode])

  useEffect(() => {
    window.localStorage.setItem(WORD_SET_MODE_KEY, wordSetMode)
  }, [wordSetMode])

  useEffect(() => {
    window.localStorage.setItem('hayaku-mode', mode)
  }, [mode])

  useEffect(() => {
    if ((mode === 'hiragana' || mode === 'katakana') && isDeckEditorOpen) {
      return
    }
    if (mode === 'hiragana' || mode === 'katakana' || mode === 'frequency') {
      focusAnswerInput()
    }
  }, [
    mode,
    hiraganaSession.remainingCharacters.length,
    katakanaSession.remainingCharacters.length,
    wordSession.remainingIndexes.length,
    isDeckEditorOpen,
  ])

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }

  const currentSession = mode === 'katakana' ? katakanaSession : hiraganaSession
  const setCurrentSession = mode === 'katakana' ? setKatakanaSession : setHiraganaSession
  const cards = mode === 'katakana' ? katakanaDeckCards : hiraganaDeckCards

  const currentCharacter = currentSession.remainingCharacters[0]
  const currentCard = cards.find((card) => card.character === currentCharacter)
  const completedCount = cards.length - currentSession.remainingCharacters.length

  const currentWordIndex = wordSession.remainingIndexes[0]
  const currentWordCard = wordCards[currentWordIndex]
  const wordCompletedCount = wordCards.length - wordSession.remainingIndexes.length

  const updateInputAndCheckAnswer = (nextValue: string) => {
    const normalizedInput = normalizeInput(nextValue)
    if (!currentCard) {
      return
    }

    const isMatch = currentCard.answers.includes(normalizedInput)
    if (isMatch) {
      setCurrentSession((currentSessionState) => ({
        ...(currentSessionState.remainingCharacters.length <= 1
          ? createNewKanaSession(cards)
          : {
              remainingCharacters: currentSessionState.remainingCharacters.slice(1),
              currentInput: '',
            }),
      }))
      return
    }

    setCurrentSession((currentSessionState) => ({
      ...currentSessionState,
      currentInput: nextValue,
    }))
  }

  const startNewSession = () => {
    setCurrentSession(createNewKanaSession(cards))
    focusAnswerInput(true)
  }

  const updateWordInputAndCheckAnswer = (nextValue: string) => {
    const normalizedInput = normalizeMeaning(nextValue)
    if (!currentWordCard) {
      return
    }

    const acceptedMeanings = parseMeaningAnswers(currentWordCard.meaning)
    const isMatch = acceptedMeanings.includes(normalizedInput)
    if (isMatch) {
      setWordSession((currentWordSession) => ({
        ...(currentWordSession.remainingIndexes.length <= 1
          ? createNewWordSession(wordCards)
          : {
              remainingIndexes: currentWordSession.remainingIndexes.slice(1),
              currentInput: '',
            }),
      }))
      return
    }

    setWordSession((currentWordSession) => ({
      ...currentWordSession,
      currentInput: nextValue,
    }))
  }

  const startNewWordSession = () => {
    setWordSession(createNewWordSession(wordCards))
    focusAnswerInput(true)
  }

  const toggleWordSetMode = () => {
    setWordSetMode((current) => {
      const nextMode: WordSetMode = current === 'test' ? 'full' : 'test'
      const nextWordCards = getWordCardsForMode(nextMode)
      setWordSession(createNewWordSession(nextWordCards))
      return nextMode
    })
    focusAnswerInput(true)
  }

  const kanaDeck = mode === 'katakana' ? katakanaDeck : hiraganaDeck
  const kanaDeckSourceCards = mode === 'katakana' ? KATAKANA_CARDS : HIRAGANA_CARDS
  const kanaDeckCells = useMemo(() => buildDeckCells(kanaDeckSourceCards), [kanaDeckSourceCards])
  const selectedKanaCharacters = useMemo(
    () => new Set(kanaDeck.includedCharacters),
    [kanaDeck.includedCharacters],
  )
  const singleKanaCells = useMemo(
    () => kanaDeckCells.filter((cell) => cell.character.length === 1),
    [kanaDeckCells],
  )
  const doubleKanaCells = useMemo(
    () => kanaDeckCells.filter((cell) => cell.character.length > 1),
    [kanaDeckCells],
  )
  const singleKanaMatrix = useMemo(() => buildDeckMatrix(singleKanaCells), [singleKanaCells])
  const doubleKanaMatrix = useMemo(() => buildDeckMatrix(doubleKanaCells), [doubleKanaCells])
  const allKanaCharacters = useMemo(
    () => kanaDeckSourceCards.map((card) => card.character),
    [kanaDeckSourceCards],
  )
  const singleKanaCharacters = useMemo(
    () => singleKanaCells.map((cell) => cell.character),
    [singleKanaCells],
  )
  const doubleKanaCharacters = useMemo(
    () => doubleKanaCells.map((cell) => cell.character),
    [doubleKanaCells],
  )

  const applyDeckConfig = (nextDeck: DeckConfig) => {
    if (mode === 'katakana') {
      setKatakanaDeck(nextDeck)
      const nextCards = getCardsForDeck(KATAKANA_CARDS, nextDeck)
      setKatakanaSession(createNewKanaSession(nextCards))
      return
    }

    setHiraganaDeck(nextDeck)
    const nextCards = getCardsForDeck(HIRAGANA_CARDS, nextDeck)
    setHiraganaSession(createNewKanaSession(nextCards))
  }

  const toggleDeckRow = (row: string, matrix: DeckMatrix) => {
    const characters = matrix.rowCharacters.get(row) ?? []
    applyDeckConfig(toggleDeckCharacters(kanaDeck, characters, allKanaCharacters))
  }

  const toggleDeckColumn = (column: string, matrix: DeckMatrix) => {
    const characters = matrix.columnCharacters.get(column) ?? []
    applyDeckConfig(toggleDeckCharacters(kanaDeck, characters, allKanaCharacters))
  }

  const toggleDeckCharacter = (character: string) => {
    applyDeckConfig(toggleDeckCharacters(kanaDeck, [character], allKanaCharacters))
  }

  const selectDeckCharacters = (selectedCharacters: string[]) => {
    const selected = new Set(selectedCharacters)
    applyDeckConfig({
      includedCharacters: allKanaCharacters.filter((character) => selected.has(character)),
    })
  }

  const renderDeckTable = (title: string, matrix: DeckMatrix, tableId: string) => (
    <div className="deck-table-block">
      <h3 className="deck-table-title">{title}</h3>
      <div
        className="deck-grid"
        role="table"
        aria-label={title}
        style={{ '--deck-columns': matrix.rows.length } as React.CSSProperties}
      >
        <div className="deck-grid-row deck-grid-header" role="row">
          <div className="deck-grid-row-label" role="columnheader" />
          {matrix.rows.map((row) => {
            const rowState = getSelectionState(matrix.rowCharacters.get(row) ?? [], selectedKanaCharacters)
            return (
              <div key={`${tableId}-head-${row}`} className="deck-grid-col-label" role="columnheader">
                <button
                  type="button"
                  className={`deck-axis-toggle ${rowState === 'all' ? 'is-selected' : ''} ${
                    rowState === 'partial' ? 'is-partial' : ''
                  }`}
                  onClick={() => toggleDeckRow(row, matrix)}
                  aria-pressed={rowState === 'all'}
                  aria-label={`Toggle ${formatDeckRowLabel(row)} group`}
                >
                  ▾
                </button>
              </div>
            )
          })}
        </div>

        {matrix.columns.map((column) => {
          const columnState = getSelectionState(
            matrix.columnCharacters.get(column) ?? [],
            selectedKanaCharacters,
          )
          return (
            <div key={`${tableId}-row-${column}`} className="deck-grid-row" role="row">
              <div className="deck-grid-row-label" role="rowheader">
                <button
                  type="button"
                  className={`deck-axis-toggle ${columnState === 'all' ? 'is-selected' : ''} ${
                    columnState === 'partial' ? 'is-partial' : ''
                  }`}
                  onClick={() => toggleDeckColumn(column, matrix)}
                  aria-pressed={columnState === 'all'}
                  aria-label={`Toggle ${formatDeckColumnLabel(column)} group`}
                >
                  ▸
                </button>
              </div>
              {matrix.rows.map((row) => {
                const cell = matrix.cellMap.get(`${row}:${column}`)
                if (!cell) {
                  return (
                    <div
                      key={`${tableId}-empty-${column}-${row}`}
                      className="deck-grid-empty"
                      aria-hidden="true"
                    />
                  )
                }

                const isSelected = selectedKanaCharacters.has(cell.character)
                return (
                  <button
                    key={`${tableId}-cell-${column}-${row}`}
                    type="button"
                    className={`deck-kana-cell ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => toggleDeckCharacter(cell.character)}
                    aria-pressed={isSelected}
                  >
                    <span className="deck-kana-character">{cell.character}</span>
                    <span className="deck-kana-romaji">{cell.displayRomaji}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderDeckEditor = () => (
    <div className="deck-panel">
      <p className="deck-description">Choose what to include in this deck. Changes reset your progress.</p>
      <div className="deck-quick-actions" role="group" aria-label="Deck quick actions">
        <button
          type="button"
          className="ghost-action deck-quick-action-btn"
          onClick={() => selectDeckCharacters(allKanaCharacters)}
        >
          Select all
        </button>
        <button
          type="button"
          className="ghost-action deck-quick-action-btn"
          onClick={() => selectDeckCharacters([])}
        >
          Clear all
        </button>
        <button
          type="button"
          className="ghost-action deck-quick-action-btn"
          onClick={() => selectDeckCharacters(singleKanaCharacters)}
        >
          Singles only
        </button>
        <button
          type="button"
          className="ghost-action deck-quick-action-btn"
          onClick={() => selectDeckCharacters(doubleKanaCharacters)}
        >
          Doubles only
        </button>
      </div>
      {renderDeckTable('Single Characters', singleKanaMatrix, 'single')}
      {renderDeckTable('Double Characters', doubleKanaMatrix, 'double')}
    </div>
  )

  const renderPractice = (modeName: string) => (
    <>
      <div className="practice-toolbar">
        <button
          type="button"
          className="ghost-action deck-toggle-btn"
          onClick={() => setIsDeckEditorOpen((current) => !current)}
          aria-pressed={isDeckEditorOpen}
        >
          Deck
        </button>
        <div className="session-meta" role="status" aria-live="polite">
          <span>
            Correct: {completedCount}/{cards.length}
          </span>
        </div>
      </div>

      {isDeckEditorOpen ? (
        renderDeckEditor()
      ) : cards.length === 0 ? (
        <div className="drill-card">
          <div className="deck-empty-state" role="status" aria-live="polite">
            <p className="deck-empty-title">No characters selected.</p>
            <p className="deck-empty-copy">Open Deck and choose at least one character.</p>
          </div>
        </div>
      ) : (
        <div className="drill-card">
          <p className="hiragana-character" aria-live="polite">
            {currentCharacter}
          </p>
          <div className="card-controls">
            <input
              id={`${modeName}-answer`}
              ref={answerInputRef}
              className="answer-input"
              type="text"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              value={currentSession.currentInput}
              onChange={(event) => updateInputAndCheckAnswer(event.target.value)}
              placeholder="Type romaji answer"
              aria-label="Romaji answer"
            />
            <button
              type="button"
              className="ghost-action session-reset-btn"
              onClick={startNewSession}
              aria-label="Start new session"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  )

  const renderWordPractice = () => (
    <>
      <div className="practice-toolbar">
        <div />
        <div className="session-meta" role="status" aria-live="polite">
          <span>
            Correct: {wordCompletedCount}/{wordCards.length}
          </span>
        </div>
      </div>

      <div className="drill-card">
        <button
          type="button"
          className="ghost-action words-set-toggle"
          onClick={toggleWordSetMode}
          aria-label="Toggle words source"
        >
          {wordSetMode === 'test' ? 'TEST SET' : 'FULL SET'}
        </button>
        <p className="word-type-hint" aria-label="Part of speech">
          {currentWordCard?.type ?? 'unknown'}
        </p>
        <p className="hiragana-character word-character" aria-live="polite">
          {currentWordCard?.reading && currentWordCard.word && containsKanji(currentWordCard.word) ? (
            <ruby className="word-ruby">
              {currentWordCard.word}
              <rt>{currentWordCard.reading}</rt>
            </ruby>
          ) : (
            currentWordCard?.word
          )}
        </p>
        <div className="card-controls">
          <input
            id="frequency-answer"
            ref={answerInputRef}
            className="answer-input"
            type="text"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            value={wordSession.currentInput}
            onChange={(event) => updateWordInputAndCheckAnswer(event.target.value)}
            placeholder="Type one meaning"
            aria-label="Meaning answer"
          />
          <button
            type="button"
            className="ghost-action session-reset-btn"
            onClick={startNewWordSession}
            aria-label="Start new session"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <main className="app-shell">
      <header className="topbar reveal reveal-1">
        <h1 className="brand-title">早く / HAYAKU STUDY</h1>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </header>

      <nav className="mode-nav reveal reveal-2" aria-label="Practice modes">
        {(Object.keys(modes) as PracticeMode[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`mode-btn ${mode === key ? 'is-active' : ''}`}
            onClick={() => {
              setMode(key)
              setIsDeckEditorOpen(false)
              focusAnswerInput(true)
            }}
            aria-pressed={mode === key}
          >
            <span className="mode-label-desktop">{modes[key].label}</span>
            <span className="mode-label-mobile">{modes[key].mobileLabel}</span>
          </button>
        ))}
      </nav>

      <section className="practice-panel reveal reveal-3" aria-live="polite">
        {mode === 'hiragana' || mode === 'katakana' ? (
          renderPractice(mode)
        ) : (
          renderWordPractice()
        )}
      </section>
    </main>
  )
}

export default App
