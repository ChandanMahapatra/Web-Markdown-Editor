'use client';

import { useState, useEffect } from 'react';
import { loadSettings, saveSettings } from '@/lib/storage';
import { openDB } from 'idb';
import { event } from '@/lib/analytics';

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

  useEffect(() => {
    event('settings_modal_opened', 'engagement');
    
    loadSettings().then((loaded) => {
      if (loaded) {
        setSettings({
          provider: loaded.provider || '',
          model: loaded.model || '',
          apiKey: loaded.apiKey || '',
          baseURL: loaded.baseURL || '',
        });
      } else {
        // Default values - no provider selected by default
        setSettings({
          provider: '',
          model: '',
          apiKey: '',
          baseURL: '',
        });
      }
    });
  }, []);

  const handleSave = async () => {
    await saveSettings(settings);
    
    if (settings.provider) {
      event('ai_provider_selected', 'ai_setup', settings.provider);
    }
    
    onClose(true);
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings? This will clear your API keys and provider configuration.')) {
      try {
        const db = await openDB('markdown-editor', 1);
        await db.delete('settings', 'user-settings');
        setSettings({
          provider: '',
          model: '',
          apiKey: '',
          baseURL: '',
        });
        onClose(false);
      } catch (error) {
        console.error('Failed to reset settings:', error);
        alert('Failed to reset settings. Please try again.');
      }
    }
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
              <option value="">None (No AI)</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="openrouter">OpenRouter</option>
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
                placeholder={
                  settings.provider === 'openrouter'
                    ? 'e.g., anthropic/claude-3.5-sonnet, openai/gpt-4o'
                    : settings.provider === 'openai'
                    ? 'e.g., gpt-4, gpt-3.5-turbo'
                    : settings.provider === 'anthropic'
                    ? 'e.g., claude-3-sonnet, claude-3-haiku'
                    : 'Enter model name'
                }
              />
              {settings.provider === 'openrouter' && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Popular models: anthropic/claude-3.5-sonnet, openai/gpt-4o, google/gemini-pro-1.5
                </p>
              )}
            </div>
          )}

          {(settings.provider === 'openai' || settings.provider === 'anthropic' || settings.provider === 'openrouter') && (
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

        </div>

        <div className="flex justify-between gap-2 mt-6">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reset Settings
          </button>
          <div className="flex gap-2">
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
    </div>
  );
}
