import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useAgentsStore } from '@/stores/agents-store';
import { AgentSettingsForm } from '@/components/AgentSettingsForm';

/** Standalone page that shows the Boss (main agent) edit-settings as a full page. */
export function BossSettingsPage() {
  const intl = useIntl();
  const { agents, fetchAgents, loading } = useAgentsStore();

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Prefer the default agent id 'boss', fall back to the main-role agent.
  const boss = agents.find((a) => a.name === 'boss') ?? agents.find((a) => a.role === 'main') ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{boss?.icon || '🐾'}</span>
        <div>
          <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
            {intl.formatMessage({ id: 'nav.bossSettings' })}
          </h2>
          {boss && (
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {boss.display_name} · {boss.trigger}
            </p>
          )}
        </div>
      </div>

      {boss ? (
        <AgentSettingsForm agent={boss} onSaved={fetchAgents} />
      ) : (
        <div className="glass-card rounded-2xl p-10 text-center text-stone-500 dark:text-stone-400">
          {loading ? '…' : intl.formatMessage({ id: 'agents.empty' })}
        </div>
      )}
    </div>
  );
}
