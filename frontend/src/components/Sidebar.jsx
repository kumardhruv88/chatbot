import React from 'react';
import { MessageSquare, Plus, Trash2, Sparkles, X, Menu, PanelLeftOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function SidebarStrip({ onOpen, onCreateThread }) {
    return (
        <div className="w-full h-full flex flex-col items-center py-6 bg-black/20 backdrop-blur-xl">
            <div className="mb-8">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
            </div>

            <button
                onClick={onOpen}
                className="p-3 mb-4 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                title="Expand Sidebar"
            >
                <PanelLeftOpen className="w-6 h-6" />
            </button>

            <button
                onClick={onCreateThread}
                className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                title="New Chat"
            >
                <Plus className="w-6 h-6" />
            </button>
        </div>
    );
}

function Sidebar({ threads, currentThread, onCreateThread, onSelectThread, onDeleteThread, onClose }) {
    return (
        <div className="w-full h-full flex flex-col bg-transparent">
            {/* Header */}
            <div className="p-5">
                <div className="flex items-center justify-between mb-6">
                    {/* App Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white/90">
                            Nebula
                        </h1>
                    </div>

                    {/* Close button for mobile */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* New Chat Button */}
                <button
                    onClick={onCreateThread}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 flex items-center justify-center gap-2 transition-all group"
                >
                    <Plus className="w-4 h-4 text-purple-300 group-hover:text-purple-200" />
                    <span className="text-sm font-medium text-purple-100 group-hover:text-white">New Chat</span>
                </button>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
                {threads.length === 0 ? (
                    <div className="text-center mt-12 px-4 fade-in">
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-white/20" />
                        <p className="text-sm text-gray-500">No conversations</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {threads.map((thread, index) => (
                            <div
                                key={thread.id}
                                className={`group relative p-3 rounded-2xl cursor-pointer transition-all duration-200 ${currentThread?.id === thread.id
                                    ? 'bg-white/10 shadow-lg backdrop-blur-sm'
                                    : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                                    }`}
                                onClick={() => onSelectThread(thread.id)}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentThread?.id === thread.id ? 'text-purple-400' : 'text-gray-600 group-hover:text-gray-500'}`} />
                                        <div className="min-w-0 flex-1">
                                            <h3 className={`font-medium truncate text-sm leading-tight mb-0.5 ${currentThread?.id === thread.id ? 'text-gray-100' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                                {thread.title}
                                            </h3>
                                            <p className="text-[10px] text-gray-600 truncate">
                                                {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteThread(thread.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4">
                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 font-medium uppercase tracking-wider">
                    <div className="w-1 h-1 bg-green-500/70 rounded-full animate-pulse"></div>
                    <span>Nebula AI Online</span>
                </div>
            </div>
        </div >
    );
}

export default Sidebar;
