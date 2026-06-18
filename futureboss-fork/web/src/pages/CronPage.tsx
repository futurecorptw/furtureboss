import { useIntl } from 'react-intl';
import { CronTab } from './SettingsPage';

/** Standalone page for scheduled tasks (Cron), pulled out of System Settings. */
export function CronPage() {
  const intl = useIntl();
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
        {intl.formatMessage({ id: 'settings.cron' })}
      </h2>
      <CronTab />
    </div>
  );
}
