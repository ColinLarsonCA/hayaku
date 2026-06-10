import type { KanaCard } from './kanaData'

export type DeckCell = {
  character: string
  displayRomaji: string
  positionRomaji: string
  row: string
  column: string
}

export type DeckMatrix = {
  rows: string[]
  columns: string[]
  rowCharacters: Map<string, string[]>
  columnCharacters: Map<string, string[]>
  cellMap: Map<string, DeckCell>
}

const normalizeInput = (value: string) => value.trim().toLowerCase()

const getDeckPositionRomajiForCard = (card: KanaCard) => {
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

const getDeckDisplayRomajiForCard = (card: KanaCard) => card.answers[0]

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

export const buildDeckCells = (cards: KanaCard[]): DeckCell[] => {
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

export const buildDeckMatrix = (cells: DeckCell[]): DeckMatrix => {
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

export const formatDeckRowLabel = (row: string) => {
  if (row === '') {
    return 'vowels'
  }
  if (row === 'n') {
    return 'n'
  }
  return `${row}-`
}

export const formatDeckColumnLabel = (column: string) => {
  if (column === 'other') {
    return 'other'
  }
  return column
}
