import { useMemo } from 'react'
import { BookOpenCheck } from 'lucide-react'
import type { KanaCard } from '../kanaData'
import { buildDeckCells, buildDeckMatrix } from '../kanaDeck.ts'
import { useAppTheme } from '../useAppTheme'
import CoreHeader from '../components/CoreHeader'
import ReferenceModeNav from '../components/ReferenceModeNav'

type KanaReferencePageProps = {
  cards: KanaCard[]
}

function KanaReferencePage({ cards }: KanaReferencePageProps) {
  const { theme, toggleTheme } = useAppTheme()
  const kanaDeckCells = useMemo(() => buildDeckCells(cards), [cards])
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

  const renderStaticTable = (sectionTitle: string, tableId: string, matrix: ReturnType<typeof buildDeckMatrix>) => (
    <div className="deck-table-block">
      <h3 className="deck-table-title">{sectionTitle}</h3>
      <div
        className="deck-grid"
        role="table"
        aria-label={sectionTitle}
        style={{ '--deck-columns': matrix.rows.length } as React.CSSProperties}
      >
        <div className="deck-grid-row deck-grid-header" role="row">
          <div className="deck-grid-row-label" role="columnheader" />
          {matrix.rows.map((row) => (
            <div key={`${tableId}-head-${row}`} className="deck-grid-col-label" role="columnheader">
              <span aria-hidden="true">{row || 'v'}</span>
            </div>
          ))}
        </div>

        {matrix.columns.map((column) => (
          <div key={`${tableId}-row-${column}`} className="deck-grid-row" role="row">
            <div className="deck-grid-row-label" role="rowheader">
              <span aria-hidden="true">{column}</span>
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

              return (
                <div key={`${tableId}-cell-${column}-${row}`} className="deck-kana-cell is-selected" role="cell">
                  <span className="deck-kana-character">{cell.character}</span>
                  <span className="deck-kana-romaji">{cell.displayRomaji}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <main className="app-shell">
      <CoreHeader
        title="早く / HAYAKU REFERENCE"
        theme={theme}
        onToggleTheme={toggleTheme}
        primaryActionTo="/"
        primaryActionLabel="Study"
        PrimaryActionIcon={BookOpenCheck}
      />

      <ReferenceModeNav />

      <section className="practice-panel reveal reveal-3" aria-live="polite">
        <p>Reference chart only. This page is intentionally non-interactive.</p>
        <div className="deck-panel">
          {renderStaticTable('Single Characters', 'single', singleKanaMatrix)}
          {renderStaticTable('Double Characters', 'double', doubleKanaMatrix)}
        </div>
      </section>
    </main>
  )
}

export default KanaReferencePage
