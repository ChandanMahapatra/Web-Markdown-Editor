'use client';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <h2 className="text-xl font-semibold mb-4 text-black">Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              AI Provider
            </label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 text-black">
              <option value="">None (Local only)</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              {/* Add more from ai-sdk providers */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              API Key
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded px-3 py-2 text-black"
              placeholder="Enter API key"
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
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
