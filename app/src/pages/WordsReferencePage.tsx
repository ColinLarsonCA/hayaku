import { useEffect, useMemo, useState } from 'react'
import { BookOpenCheck } from 'lucide-react'
import { japaneseFrequencyData } from '../data/japaneseFrequencyData'
import CoreHeader from '../components/CoreHeader'
import ReferenceModeNav from '../components/ReferenceModeNav'
import { useAppTheme } from '../useAppTheme'
import {
  WORD_GROUPS_PER_PAGE,
  buildWordFrequencyGroups,
  filterWordEntries,
  getJishoSearchUrl,
  getWordTypeOptions,
  sortWordEntriesByFrequency,
} from '../wordUtils'

function WordsReferencePage() {
  const { theme, toggleTheme } = useAppTheme()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(0)

  const allWordEntries = useMemo(() => sortWordEntriesByFrequency(japaneseFrequencyData), [])
  const typeOptions = useMemo(() => getWordTypeOptions(allWordEntries), [allWordEntries])
  const filteredEntries = useMemo(
    () => filterWordEntries(allWordEntries, { search, typeFilter: typeFilter || null }),
    [allWordEntries, search, typeFilter],
  )
  const wordGroups = useMemo(() => buildWordFrequencyGroups(filteredEntries), [filteredEntries])

  useEffect(() => {
    setPage(0)
  }, [search, typeFilter])

  const totalPages = Math.ceil(wordGroups.length / WORD_GROUPS_PER_PAGE)
  const clampedPage = Math.max(0, Math.min(page, Math.max(totalPages - 1, 0)))
  const startIdx = clampedPage * WORD_GROUPS_PER_PAGE
  const visibleGroups = wordGroups.slice(startIdx, startIdx + WORD_GROUPS_PER_PAGE)
  const totalVisibleWords = filteredEntries.length

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
        <p>Reference list of the ~5000 most frequently used Japanese words used in the study mode.</p>
        <p className="word-reference-meta">
          Showing {totalVisibleWords} words
        </p>
        <div className="deck-panel word-deck-panel">
          <div className="word-deck-header">
            <input
              type="text"
              className="word-deck-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by word, reading, meaning, or type"
              aria-label="Search words"
            />
            <div className="word-deck-actions" role="group" aria-label="Word reference filters">
              <label className="word-type-filter-label" htmlFor="word-type-filter">
                Type
              </label>
              <select
                id="word-type-filter"
                className="word-type-filter"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                aria-label="Filter by word type"
              >
                <option value="">All types</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="word-deck-list" role="list" aria-label="Word reference list by frequency">
            {visibleGroups.length === 0 ? (
              <div className="deck-empty-state" role="status" aria-live="polite">
                <p className="deck-empty-title">No matching words.</p>
                <p className="deck-empty-copy">Try clearing your search or changing the type filter.</p>
              </div>
            ) : null}

            {visibleGroups.map((group) => (
              <section key={group.groupStart} className="word-deck-group">
                <div className="word-deck-group-header">
                  <p className="word-deck-group-label">
                    {group.groupStart}-{group.groupEnd}
                  </p>
                </div>

                <div className="word-deck-group-rows">
                  {group.entries.map((entry, index) => {
                    const showReading =
                      entry.reading.length > 0 && entry.reading.toLowerCase() !== entry.word.toLowerCase()
                    return (
                      <div
                        key={`${group.groupStart}-${index}-${entry.frequency}-${entry.word}-${entry.reading}-${entry.type}-${entry.meaning}`}
                        className="word-deck-row"
                      >
                        <div className="word-deck-row-toggle word-deck-row-static" role="listitem">
                          <span className="word-deck-frequency">{entry.frequency}</span>
                          <span className="word-deck-primary">
                            <span className="word-deck-word">{entry.word}</span>
                            {showReading ? <span className="word-deck-reading">{entry.reading}</span> : null}
                          </span>
                          <span className="word-deck-secondary">
                            <span className="word-deck-type">{entry.type}</span>
                            <span className="word-deck-meaning">{entry.meaning}</span>
                          </span>
                        </div>
                        <a
                          href={getJishoSearchUrl(entry.word)}
                          target="_blank"
                          rel="noreferrer"
                          className="word-deck-jisho-link"
                          aria-label={`Open ${entry.word} in Jisho`}
                        >
                          jisho
                        </a>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}

            {totalPages > 1 && (
              <div className="word-deck-pagination" role="group" aria-label="Word reference pagination">
                <button
                  type="button"
                  className="ghost-action deck-quick-action-btn"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={clampedPage === 0}
                  aria-label="Previous page"
                >
                  ← Previous
                </button>
                <span className="pagination-info" aria-live="polite">
                  Page {clampedPage + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  className="ghost-action deck-quick-action-btn"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={clampedPage === totalPages - 1}
                  aria-label="Next page"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default WordsReferencePage
