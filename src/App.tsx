import { useApp } from './state/store';
import { IconLadder, IconSong, IconVoice, IconWatch, Mark } from './ui/icons';
import { NoteName } from './ui/NoteName';
import { ProgressScreen } from './ui/ProgressScreen';
import { go, useRoute, type Route } from './ui/router';
import { ScalesScreen } from './ui/ScalesScreen';
import { SingScreen } from './ui/SingScreen';
import { SongScreen } from './ui/SongScreen';
import { scaleType } from './theory/scales';

const LINKS: { route: Route; label: string; Icon: typeof IconSong }[] = [
  { route: 'song', label: 'Song', Icon: IconSong },
  { route: 'scales', label: 'Scales', Icon: IconLadder },
  { route: 'sing', label: 'Sing', Icon: IconVoice },
  { route: 'progress', label: 'Progress', Icon: IconWatch },
];

export function App() {
  const route = useRoute();
  const { scale } = useApp();
  const type = scaleType(scale.scaleId);

  return (
    <div className="app">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="band band--top">
        <div className="band__inner">
          <a className="wordmark" href="#/song" aria-label="Musician, home">
            <Mark />
            Musician
          </a>
          <nav className="band__nav" aria-label="Sections">
            {LINKS.map(({ route: r, label, Icon }) => (
              <a key={r} href={`#/${r}`} aria-current={route === r ? 'page' : undefined}>
                <Icon size={18} />
                {label}
              </a>
            ))}
          </nav>
          <button type="button" className="keychip" onClick={() => go('scales')} aria-label={`Current scale: ${scale.tonic} ${type.name}. Change it.`}>
            <span className="keychip__swatch" aria-hidden="true" />
            <span aria-hidden="true">
              <NoteName name={scale.tonic} /> {type.id === 'major' || type.id === 'minor' ? type.name.toLowerCase() : type.name}
            </span>
          </button>
        </div>
      </header>

      <main className="sheet" id="main" tabIndex={-1}>
        {route === 'song' && <SongScreen />}
        {route === 'scales' && <ScalesScreen />}
        {route === 'sing' && <SingScreen />}
        {route === 'progress' && <ProgressScreen />}
      </main>

      <nav className="band nav" aria-label="Sections">
        <ul className="nav__list">
          {LINKS.map(({ route: r, label, Icon }) => (
            <li key={r}>
              <a className="nav__link" href={`#/${r}`} aria-current={route === r ? 'page' : undefined}>
                <Icon size={24} />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
