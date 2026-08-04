import { useSettings } from '../../state/settings'
import { PasswordPanel } from './PasswordPanel'
import { PassphrasePanel } from './PassphrasePanel'
import { PinPanel } from './PinPanel'
import { PronounceablePanel } from './PronounceablePanel'
import { UsernamePanel } from './UsernamePanel'
import { DeterministicPanel } from './DeterministicPanel'
import styles from './Options.module.css'

export function OptionsCard() {
  const mode = useSettings((s) => s.mode)

  return (
    <section id="options-panel" role="tabpanel" className={styles.card}>
      {mode === 'password' && <PasswordPanel />}
      {mode === 'passphrase' && <PassphrasePanel />}
      {mode === 'pin' && <PinPanel />}
      {mode === 'pronounceable' && <PronounceablePanel />}
      {mode === 'username' && <UsernamePanel />}
      {mode === 'deterministic' && <DeterministicPanel />}
    </section>
  )
}
