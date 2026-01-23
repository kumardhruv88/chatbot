import React, { useState, useEffect } from 'react';
import Sidebar, { SidebarStrip } from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import CosmicBackground from './components/CosmicBackground';
import { threadAPI } from './services/api';
import './index.css';

function App() {
    const [threads, setThreads] = useState([]);
    const [currentThread, setCurrentThread] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Load threads on mount
    useEffect(() => {
        loadThreads();
    }, []);

    const loadThreads = async () => {
        try {
            const response = await threadAPI.list();
            setThreads(response.data);

            // Select first thread if none selected
            if (!currentThread && response.data.length > 0) {
                loadThread(response.data[0].id);
            }
        } catch (error) {
            console.error('Error loading threads:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadThread = async (threadId) => {
        try {
            const response = await threadAPI.get(threadId);
            setCurrentThread(response.data);
        } catch (error) {
            console.error('Error loading thread:', error);
        }
    };

    const handleCreateThread = async () => {
        try {
            // Create with default title - backend will auto-generate proper title after first message
            const response = await threadAPI.create('New Conversation');
            setThreads(prev => [response.data, ...prev]);
            setCurrentThread(response.data);
        } catch (error) {
            console.error('Error creating thread:', error);
            alert('Failed to create thread');
        }
    };

    const handleDeleteThread = async (threadId) => {
        if (!confirm('Are you sure you want to delete this thread?')) return;

        try {
            await threadAPI.delete(threadId);
            setThreads(prev => prev.filter(t => t.id !== threadId));

            if (currentThread?.id === threadId) {
                setCurrentThread(null);
            }
        } catch (error) {
            console.error('Error deleting thread:', error);
            alert('Failed to delete thread');
        }
    };

    const handleSelectThread = (threadId) => {
        loadThread(threadId);
        // Close sidebar on mobile after selecting
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    const handleMessageSent = () => {
        // Reload current thread to get updated messages
        if (currentThread) {
            loadThread(currentThread.id);
        }
        // Reload threads to update timestamps and titles
        loadThreads();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-950">
                <div className="text-white text-base">Loading...</div>
            </div>
        );
    }

    return (
        <>
            {/* Cinematic Background - Always visible */}
            <CosmicBackground />

            {/* Main App Content */}
            <div className="relative z-10 flex h-screen text-white overflow-hidden">
                {/* Sidebar Area */}
                <div
                    className={`
                        h-full z-40 transition-all duration-300 ease-in-out flex-shrink-0
                        ${sidebarOpen ? 'w-80' : 'w-0 lg:w-16'}
                        ${sidebarOpen ? 'relative' : 'absolute -left-80 lg:relative lg:left-0'}
                    `}
                >
                    <div className="h-full w-full overflow-hidden">
                        {sidebarOpen ? (
                            <Sidebar
                                threads={threads}
                                currentThread={currentThread}
                                onCreateThread={handleCreateThread}
                                onSelectThread={handleSelectThread}
                                onDeleteThread={handleDeleteThread}
                                onClose={() => setSidebarOpen(false)}
                            />
                        ) : (
                            <div className="hidden lg:block h-full">
                                <SidebarStrip
                                    onOpen={() => setSidebarOpen(true)}
                                    onCreateThread={handleCreateThread}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Overlay for mobile when sidebar is open */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main chat area */}
                <div className="flex-1 w-full min-w-0">
                    <ChatInterface
                        thread={currentThread}
                        onMessageSent={handleMessageSent}
                        sidebarOpen={sidebarOpen}
                        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    />
                </div>
            </div>
        </>
    );
}

export default App;
