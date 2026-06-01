import { useEffect, useMemo, useRef, useState } from 'react'
import { Sun, Moon, RotateCcw } from 'lucide-react'
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

const normalizeInput = (value: string) => value.trim().toLowerCase()

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

const createNewHiraganaSession = (): HiraganaSession => ({
  remainingCharacters: shuffle(HIRAGANA_CARDS.map((card) => card.character)),
  currentInput: '',
})

const createNewKatakanaSession = (): HiraganaSession => ({
  remainingCharacters: shuffle(KATAKANA_CARDS.map((card) => card.character)),
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
  const [hiraganaSession, setHiraganaSession] = useState<HiraganaSession>(() => {
    const saved = window.localStorage.getItem(HIRAGANA_SESSION_KEY)
    return parseStoredSession(saved, HIRAGANA_CARDS) ?? createNewHiraganaSession()
  })
  const [katakanaSession, setKatakanaSession] = useState<HiraganaSession>(() => {
    const saved = window.localStorage.getItem(KATAKANA_SESSION_KEY)
    return parseStoredSession(saved, KATAKANA_CARDS) ?? createNewKatakanaSession()
  })
  const answerInputRef = useRef<HTMLInputElement>(null)
  const focusAnswerInput = () => {
    requestAnimationFrame(() => {
      answerInputRef.current?.focus()
    })
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
    window.localStorage.setItem('hayaku-mode', mode)
  }, [mode])

  useEffect(() => {
    if (mode === 'hiragana' || mode === 'katakana') {
      focusAnswerInput()
    }
  }, [mode, hiraganaSession.remainingCharacters.length, katakanaSession.remainingCharacters.length])

  const modeContent = useMemo(() => modes[mode], [mode])

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }

  const currentSession = mode === 'katakana' ? katakanaSession : hiraganaSession
  const setCurrentSession = mode === 'katakana' ? setKatakanaSession : setHiraganaSession
  const cards = mode === 'katakana' ? KATAKANA_CARDS : HIRAGANA_CARDS
  const createNewSession = mode === 'katakana' ? createNewKatakanaSession : createNewHiraganaSession

  const currentCharacter = currentSession.remainingCharacters[0]
  const currentCard = cards.find((card) => card.character === currentCharacter)
  const completedCount = cards.length - currentSession.remainingCharacters.length

  const updateInputAndCheckAnswer = (nextValue: string) => {
    const normalizedInput = normalizeInput(nextValue)
    if (!currentCard) {
      return
    }

    const isMatch = currentCard.answers.includes(normalizedInput)
    if (isMatch) {
      setCurrentSession((currentSessionState) => ({
        ...(currentSessionState.remainingCharacters.length <= 1
          ? createNewSession()
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
    setCurrentSession(createNewSession())
    focusAnswerInput()
  }

  const renderPractice = (modeName: string) => (
    <>
      <div className="panel-header">
        <h2>{modeContent.title}</h2>
        <div className="session-meta" role="status" aria-live="polite">
          <span>
            Correct: {completedCount}/{cards.length}
          </span>
          <span>Remaining: {currentSession.remainingCharacters.length}</span>
        </div>
      </div>

      <div className="drill-card">
        <p className="hiragana-character" aria-live="polite">
          {currentCharacter}
        </p>
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
            onClick={() => setMode(key)}
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
          <div style={{ textAlign: 'center', paddingTop: '3rem', fontSize: '1.5rem', fontFamily: 'inherit' }}>
            <p style={{ lineHeight: '1.8' }}>ちょっと待てください<br />(人 •͈ᴗ•͈)</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
