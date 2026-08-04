import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TopBar } from './components/TopBar'
import { PasswordCard } from './components/PasswordCard'
import { ModeTabs } from './components/ModeTabs'
import { OptionsCard } from './components/options/OptionsCard'
import { TransparencyPanel } from './components/TransparencyPanel'
import { SettingsDialog } from './components/dialogs/SettingsDialog'
import { HistoryDialog } from './components/dialogs/HistoryDialog'
import { QrDialog } from './components/dialogs/QrDialog'
import { BulkDialog } from './components/dialogs/BulkDialog'
import { TrainerDialog } from './components/dialogs/TrainerDialog'
import { useAppearance } from './hooks/useAppearance'
import { useGenerator } from './hooks/useGenerator'
import { useHibp } from './hooks/useHibp'
import { useStrengthAnalysis } from './hooks/useStrengthAnalysis'
import { syncHistoryStorage, useHistory } from './state/history'
import { useSettings } from './state/settings'
import styles from './App.module.css'

export type DialogId = 'settings' | 'history' | 'qr' | 'bulk' | 'trainer' | null

export default function App() {
  const { t } = useTranslation()
  useAppearance()
  useGenerator()
  useStrengthAnalysis()
  useHibp()

  const [dialog, setDialog] = useState<DialogId>(null)

  // Verlauf in den zur Einstellung passenden Speicher spiegeln.
  const historyEntries = useHistory((s) => s.entries)
  const historyEnabled = useSettings((s) => s.historyEnabled)
  const historyPersist = useSettings((s) => s.historyPersist)
  useEffect(() => {
    syncHistoryStorage(historyEnabled, historyPersist)
  }, [historyEntries, historyEnabled, historyPersist])

  return (
    <div className={styles.app}>
      <TopBar onOpenDialog={setDialog} />
      <main className={styles.main}>
        <PasswordCard onOpenDialog={setDialog} />
        <ModeTabs />
        <OptionsCard />
        <TransparencyPanel />
      </main>
      <footer className={styles.footer}>
        <p>{t('footer.pledge')}</p>
      </footer>

      <SettingsDialog open={dialog === 'settings'} onClose={() => setDialog(null)} />
      <HistoryDialog open={dialog === 'history'} onClose={() => setDialog(null)} />
      <QrDialog open={dialog === 'qr'} onClose={() => setDialog(null)} />
      <BulkDialog open={dialog === 'bulk'} onClose={() => setDialog(null)} />
      <TrainerDialog open={dialog === 'trainer'} onClose={() => setDialog(null)} />
    </div>
  )
}
