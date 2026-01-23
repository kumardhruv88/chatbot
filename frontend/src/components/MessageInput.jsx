import React, { useState, useRef, useEffect } from 'react';
import { Send, Globe, Loader2, Plus, Image, FileUp, BrainCircuit, ShoppingBag, MoreHorizontal, X, Mic, MicOff } from 'lucide-react';

// Use shared API URL from api.js (reads from VITE_API_URL env var)
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const API_BASE_URL = `${API_URL}/api`;

function MessageInput({ threadId, onMessageSent, onFileUpload, uploading }) {
    const [message, setMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [enableSearch, setEnableSearch] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [statusMessage, setStatusMessage] = useState('Thinking...');
    const [showMenu, setShowMenu] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const fileInputRef = useRef(null);
    const menuRef = useRef(null);
    const recognitionRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setMessage(prev => prev + (prev ? ' ' : '') + finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setSelectedImage(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                onFileUpload(file);
            }
            setShowMenu(false);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsStreaming(false);
        setStreamingContent('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if ((!message.trim() && !selectedImage) || isStreaming) return;

        const userMessage = message;
        const imagePayload = selectedImage;

        setMessage('');
        setSelectedImage(null);
        setIsStreaming(true);
        setStreamingContent('');
        setStatusMessage(isThinking ? 'Thinking deeply...' : 'Thinking...');

        // Stop listening if sending
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }

        // Create new AbortController
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage || (imagePayload ? "Analyze this image" : ""), // Ensure message isn't empty if only image
                    thread_id: threadId,
                    enable_search: enableSearch,
                    thinking_mode: isThinking,
                    image: imagePayload
                }),
                signal: controller.signal,
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));

                        if (data.type === 'token') {
                            setStreamingContent(prev => prev + data.content);
                        } else if (data.type === 'status') {
                            setStatusMessage(data.content);
                        } else if (data.type === 'done') {
                            setIsStreaming(false);
                            setStreamingContent('');
                            abortControllerRef.current = null;
                            onMessageSent();
                        } else if (data.type === 'error') {
                            console.error('Stream error:', data.error);
                            alert('Error: ' + data.error);
                            setIsStreaming(false);
                            setStreamingContent('');
                            abortControllerRef.current = null;
                        }
                    }
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request aborted');
                return;
            }
            console.error('Error sending message:', error);
            alert('Failed to send message');
            setIsStreaming(false);
            setStreamingContent('');
            abortControllerRef.current = null;
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex flex-col gap-3 relative">
            {/* Streaming indicator */}
            {isStreaming && streamingContent && (
                <div className="glass-light p-4 rounded-2xl fade-in">
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        <span>{statusMessage}</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{streamingContent}</p>
                </div>
            )}

            {/* Image Preview */}
            {selectedImage && (
                <div className="relative inline-block fade-in self-start">
                    <div className="p-2 glass rounded-xl border border-white/10 group">
                        <img src={selectedImage} alt="Selected" className="h-20 w-auto rounded-lg object-cover" />
                        <button
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                            <X className="w-3 h-3 text-white" />
                        </button>
                    </div>
                </div>
            )}

            {/* Plus Menu Popover */}
            {showMenu && (
                <div ref={menuRef} className="absolute bottom-full left-0 mb-3 w-56 glass-strong rounded-xl border border-white/10 shadow-xl overflow-hidden fade-in z-50">
                    <div className="p-1 space-y-0.5">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 rounded-lg text-left transition-colors group"
                        >
                            <FileUp className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-200 font-medium">Add photos & files</span>
                            </div>
                        </button>

                        <button
                            onClick={() => { setMessage("Generate an image of "); setShowMenu(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 rounded-lg text-left transition-colors group"
                        >
                            <Image className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                            <span className="text-xs text-gray-200 font-medium">Generate image</span>
                        </button>

                        <button
                            onClick={() => setEnableSearch(!enableSearch)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 rounded-lg text-left transition-colors group"
                        >
                            <Globe className={`w-4 h-4 ${enableSearch ? 'text-green-400' : 'text-gray-400'} group-hover:text-green-300`} />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-200 font-medium">Web search</span>
                                <span className="text-[10px] text-gray-500">{enableSearch ? 'On' : 'Off'}</span>
                            </div>
                        </button>

                        <button className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 rounded-lg text-left transition-colors group">
                            <ShoppingBag className="w-4 h-4 text-orange-400 group-hover:text-orange-300" />
                            <span className="text-xs text-gray-200 font-medium">Shopping research</span>
                        </button>

                        <button
                            onClick={() => setIsThinking(!isThinking)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 rounded-lg text-left transition-colors group"
                        >
                            <BrainCircuit className={`w-4 h-4 ${isThinking ? 'text-pink-400' : 'text-gray-400'} group-hover:text-pink-300`} />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-200 font-medium">Thinking</span>
                                <span className="text-[10px] text-gray-500">{isThinking ? 'On' : 'Off'}</span>
                            </div>
                        </button>

                        <button className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 rounded-lg text-left transition-colors group">
                            <MoreHorizontal className="w-4 h-4 text-gray-400 group-hover:text-gray-300" />
                            <span className="text-xs text-gray-200 font-medium">More</span>
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Input Container - Glass pill */}
                <div className={`bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl rounded-[26px] p-2 flex items-end gap-2 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] relative ${isListening ? 'ring-2 ring-red-500/50' : 'focus-within:ring-1 focus-within:ring-white/20'}`}>
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,.docx,.md,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* Plus Menu Button */}
                    <button
                        type="button"
                        onClick={() => setShowMenu(!showMenu)}
                        className={`p-3 rounded-full transition-all duration-300 group ${showMenu ? 'bg-white/10 text-white rotate-45' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                        title="Add..."
                    >
                        <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </button>

                    {/* Active Mode Indicators (Tiny Icons) */}
                    {(enableSearch || isThinking) && (
                        <div className="absolute top-[-28px] left-4 flex gap-2 fade-in">
                            {enableSearch && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] uppercase tracking-wider font-semibold text-green-400 backdrop-blur-md shadow-lg">
                                    <Globe className="w-3 h-3" />
                                    <span>Research</span>
                                </div>
                            )}
                            {isThinking && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full text-[10px] uppercase tracking-wider font-semibold text-pink-400 backdrop-blur-md shadow-lg">
                                    <BrainCircuit className="w-3 h-3" />
                                    <span>Thinking</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Message textarea */}
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? "Listening..." : (isThinking ? "Ask a complex question..." : "Message AI Chat...")}
                        disabled={isStreaming}
                        rows={1}
                        className="flex-1 bg-transparent text-white resize-none border-none outline-none focus:outline-none focus:ring-0 focus:border-none shadow-none ring-0 placeholder-gray-500 py-3 text-[15px] leading-relaxed selection:bg-purple-500/30"
                        style={{ minHeight: '48px', maxHeight: '200px' }}
                    />

                    {/* Mic Button */}
                    <button
                        type="button"
                        onClick={toggleListening}
                        disabled={isStreaming}
                        className={`p-3 rounded-full transition-all duration-300 group ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                        title="Voice Input"
                    >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 transition-transform group-hover:scale-110" />}
                    </button>

                    {/* Send / Stop button */}
                    <button
                        type={isStreaming ? "button" : "submit"}
                        onClick={isStreaming ? handleStop : undefined}
                        disabled={!isStreaming && (!message.trim() && !selectedImage)}
                        className={`p-3 rounded-[20px] transition-all duration-300 shadow-lg flex items-center justify-center ${isStreaming
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:scale-105'
                            : (!message.trim() && !selectedImage)
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                : 'bg-white text-black hover:scale-105 hover:shadow-white/20'
                            }`}
                        title={isStreaming ? "Stop generation" : "Send message"}
                    >
                        {isStreaming ? (
                            <div className="relative flex items-center justify-center">
                                {/* <Loader2 className="w-5 h-5 animate-spin absolute opacity-50" /> */}
                                <X className="w-5 h-5 relative z-10" />
                            </div>
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Hint text */}
                <p className="text-xs text-gray-600 text-center mt-2">
                    Press Enter to send • Shift + Enter for new line
                </p>
            </form>
        </div>
    );
}

export default MessageInput;
