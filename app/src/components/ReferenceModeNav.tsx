import { NavLink } from 'react-router-dom'

function ReferenceModeNav() {
  return (
    <nav className="mode-nav reveal reveal-2" aria-label="Reference pages">
      <NavLink to="/hiragana" className={({ isActive }) => `mode-btn ${isActive ? 'is-active' : ''}`}>
        <span className="mode-label-desktop">ひらがな / HIRAGANA</span>
        <span className="mode-label-mobile">HIRAGANA</span>
      </NavLink>
      <NavLink to="/katakana" className={({ isActive }) => `mode-btn ${isActive ? 'is-active' : ''}`}>
        <span className="mode-label-desktop">カタカナ / KATAKANA</span>
        <span className="mode-label-mobile">KATAKANA</span>
      </NavLink>
      <NavLink to="/words" className={({ isActive }) => `mode-btn ${isActive ? 'is-active' : ''}`}>
        <span className="mode-label-desktop">言葉 / WORDS</span>
        <span className="mode-label-mobile">WORDS</span>
      </NavLink>
    </nav>
  )
}

export default ReferenceModeNav
