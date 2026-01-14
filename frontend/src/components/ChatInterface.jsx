import React, { useState, useEffect, useRef } from 'react';
import { FileText, MessageSquare, Sparkles, Menu } from 'lucide-react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { documentAPI } from '../services/api';

function ChatInterface({ thread, onMessageSent, sidebarOpen, onToggleSidebar }) {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const lastScrollY = useRef(0);
    const messageListContainerRef = useRef(null);

    const handleFileUpload = async (file) => {
        if (!thread) {
            alert('Please select or create a thread first');
            return;
        }

        setUploading(true);
        try {
            await documentAPI.upload(file, thread.id);
            alert('Document uploaded successfully!');
            loadDocuments();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload document: ' + (error.response?.data?.detail || error.message));
        } finally {
            setUploading(false);
        }
    };

    const loadDocuments = async () => {
        if (!thread) return;
        try {
            const response = await documentAPI.list(thread.id);
            setDocuments(response.data);
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    };

    // Load documents when thread changes
    useEffect(() => {
        loadDocuments();
    }, [thread]);

    // Handle scroll to hide/show header
    const handleScroll = (e) => {
        const scrollTop = e.target.scrollTop;

        // Hide header on scroll down (if settled > 50px), show on scroll up
        if (scrollTop > lastScrollY.current && scrollTop > 50) {
            setShowHeader(false);
        } else {
            setShowHeader(true);
        }
        lastScrollY.current = scrollTop;
    };

    if (!thread) {
        return (
            <div className="flex-1 flex flex-col h-full">
                {/* Minimal header */}
                <div className="p-4 flex items-center gap-3">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2.5 hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <Menu className="w-5 h-5 text-gray-400" />
                    </button>
                    <h2 className="text-base font-medium text-gray-300">Nebula</h2>
                </div>

                {/* Empty state */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center fade-in max-w-2xl px-4">
                        <h1 className="text-3xl md:text-5xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/50 tracking-wide leading-tight drop-shadow-sm select-none">
                            "Attention Is All You Need"
                        </h1>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-lg mx-auto font-light tracking-wide">
                            The architecture that revolutionized AI. Experience the power of Transformers.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
            {/* Headers Area - Absolute or Fixed within this container */}
            <div
                className={`absolute top-0 left-0 right-0 z-20 transition-transform duration-300 ease-in-out ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}
            >
                <div className="p-4 backdrop-blur-md">
                    <div className="max-w-[800px] mx-auto flex items-center gap-3">
                        <button
                            onClick={onToggleSidebar}
                            className="p-2.5 hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <Menu className="w-5 h-5 text-gray-400" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-medium text-gray-200 truncate">{thread.title}</h2>
                            {documents.length > 0 && (
                                <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                                    <FileText className="w-3 h-3" />
                                    {documents.length} document{documents.length !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages - Needs padding top to account for header when visible, but let's just giving it standard padding */}
            <div className="flex-1 flex flex-col h-full overflow-hidden pt-16">
                {/* We need to pass a callback or Ref to MessageList to attach the scroll listener properly in React way */}
                {/* However, for now, we'll use a wrapper div that IS the scroll container if possible, or force MessageList to fit */}
                {/* Actually, MessageList has the overflow-y-auto. Let's wrap it in a Context or just use the DOM selector method above which is hacky but expected to work given structure */}
                <MessageList
                    messages={thread.messages || []}
                    onScroll={handleScroll}
                />
            </div>

            {/* Input - Centered with max-width */}
            <div className="p-4 z-20">
                <div className="max-w-[800px] mx-auto">
                    <MessageInput
                        threadId={thread.id}
                        onMessageSent={onMessageSent}
                        onFileUpload={handleFileUpload}
                        uploading={uploading}
                    />
                </div>
            </div>
        </div>
    );
}

export default ChatInterface;
