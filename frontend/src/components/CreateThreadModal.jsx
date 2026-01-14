import React, { useState } from 'react';
import { X } from 'lucide-react';

function CreateThreadModal({ isOpen, onClose, onCreate }) {
    const [title, setTitle] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title.trim()) {
            onCreate(title.trim());
            setTitle('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 fade-in px-4">
            <div className="glass-strong rounded-2xl shadow-2xl max-w-md w-full fade-in">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-gray-200">New Conversation</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-400 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-5">
                            <label className="block text-sm text-gray-400 mb-2.5">
                                Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter conversation title..."
                                autoFocus
                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus-glow placeholder-gray-600 text-sm"
                            />
                            <p className="text-xs text-gray-600 mt-2">
                                This will auto-update based on your first message
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-2.5 px-4 rounded-xl transition-all text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!title.trim()}
                                className="flex-1 gradient-primary hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-xl transition-all shadow-lg text-sm font-medium"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateThreadModal;
