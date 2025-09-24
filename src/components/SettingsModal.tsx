'use client';

import { useState, useEffect } from 'react';
import { loadSettings, saveSettings } from '@/lib/storage';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState({
    provider: '',
    model: '',
    apiKey: '',
    baseURL: '',
  });

  useEffect(() => {
    loadSettings().then((loaded) => {
      if (loaded) {
        setSettings({
          provider: loaded.provider || '',
          model: loaded.model || '',
          apiKey: loaded.apiKey || '',
          baseURL: loaded.baseURL || '',
        });
      }
    });
  }, []);

  const handleSave = async () => {
    await saveSettings(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <h2 className="text-xl font-semibold mb-4 text-black">Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              AI Provider
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-black"
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

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Model
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 text-black"
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              placeholder="Enter model name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              API Key
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded px-3 py-2 text-black"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder="Enter API key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Base URL
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 text-black"
              value={settings.baseURL}
              onChange={(e) => setSettings({ ...settings, baseURL: e.target.value })}
              placeholder="Enter base URL (e.g., http://localhost:1234)"
            />
          </div>


        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
