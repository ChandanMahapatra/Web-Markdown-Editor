'use client';

import { useState, useEffect } from 'react';
import { loadSettings, saveSettings } from '@/lib/storage';
import { getProviders, Provider } from '@/lib/ai';

interface SettingsModalProps {
  onClose: (saved?: boolean) => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState({
    provider: '',
    model: '',
    apiKey: '',
    baseURL: '',
  });
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  useEffect(() => {
    loadSettings().then((loaded) => {
      if (loaded) {
        setSettings({
          provider: loaded.provider || 'lmstudio',
          model: loaded.model || '',
          apiKey: loaded.apiKey || '',
          baseURL: loaded.baseURL || 'http://192.168.4.222:1234/v1',
        });
      } else {
        // Default values
        setSettings({
          provider: 'lmstudio',
          model: '',
          apiKey: '',
          baseURL: 'http://192.168.4.222:1234/v1',
        });
      }
    });
  }, []);

  useEffect(() => {
    if (settings.provider && providers.length > 0) {
      const provider = providers.find(p => p.id === settings.provider);
      if (provider) {
        const updates: Partial<typeof settings> = {};
        if (!settings.model || !provider.models.includes(settings.model)) {
          updates.model = provider.models[0] || '';
        }
        if (!settings.baseURL || settings.baseURL === 'http://192.168.4.222:1234/v1') {
          updates.baseURL = provider.baseURL || '';
        }
        if (Object.keys(updates).length > 0) {
          setSettings(prev => ({ ...prev, ...updates }));
        }
      }
    }
  }, [settings.provider, providers]);

  const handleSave = async () => {
    await saveSettings(settings);
    onClose(true);
  };

  return (
    <div className="fixed inset-0 bg-[var(--color-background-primary)] bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--color-background-primary)] border border-[var(--color-border-primary)] rounded-lg p-6 w-96 max-w-full">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-text-primary)]">Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              AI Provider
            </label>
            <select
              className="w-full border border-[var(--color-border-primary)] rounded px-3 py-2 text-[var(--color-text-primary)] bg-[var(--color-background-primary)]"
              value={settings.provider}
              onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
            >
              <option value="">None (Local only)</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="lmstudio">LM Studio (Local)</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>

          {settings.provider && settings.provider !== '' && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Model
              </label>
              <input
                type="text"
                className="w-full border border-[var(--color-border-primary)] rounded px-3 py-2 text-[var(--color-text-primary)] bg-[var(--color-background-primary)]"
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                placeholder="Enter model name"
              />
            </div>
          )}

          {(settings.provider === 'openai' || settings.provider === 'anthropic') && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                API Key
              </label>
              <input
                type="password"
                className="w-full border border-[var(--color-border-primary)] rounded px-3 py-2 text-[var(--color-text-primary)] bg-[var(--color-background-primary)]"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="Enter API key"
              />
            </div>
          )}

          {(settings.provider === 'lmstudio' || settings.provider === 'ollama') && (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  Base URL
                </label>
                <input
                  type="text"
                  className="w-full border border-[var(--color-border-primary)] rounded px-3 py-2 text-[var(--color-text-primary)] bg-[var(--color-background-primary)]"
                  value={settings.baseURL}
                  onChange={(e) => setSettings({ ...settings, baseURL: e.target.value })}
                  placeholder="Enter base URL (e.g., http://localhost:1234)"
                />
              </div>
              {typeof window !== 'undefined' && window.location.protocol === 'https:' && window.location.hostname !== 'localhost' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Local models unavailable:</strong> This deployed HTTPS site cannot connect to HTTP local servers due to browser security restrictions. 
                    Local models only work when running locally or with HTTPS-enabled local servers.
                  </p>
                </div>
              )}
            </>
          )}


        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => onClose()}
            className="px-4 py-2 bg-[var(--color-text-secondary)] text-[var(--color-accent-text)] rounded hover:bg-[var(--color-text-disabled)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[var(--color-accent-primary)] text-[var(--color-accent-text)] rounded hover:bg-[var(--color-accent-hover)]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
