import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import App from './App'
import { HIRAGANA_CARDS, KATAKANA_CARDS } from './kanaData'
import KanaReferencePage from './pages/KanaReferencePage'
import WordsReferencePage from './pages/WordsReferencePage'

function AppRouter() {
  return (
    <BrowserRouter basename="/hayaku">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/hiragana" element={<KanaReferencePage cards={HIRAGANA_CARDS} />} />
        <Route path="/katakana" element={<KanaReferencePage cards={KATAKANA_CARDS} />} />
        <Route path="/words" element={<WordsReferencePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
