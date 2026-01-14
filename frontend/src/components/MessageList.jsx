import React, { useRef, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { User, Bot, ExternalLink, FileText, Copy, ThumbsUp, ThumbsDown, Check, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function MessageList({ messages, onScroll }) {
    const messagesEndRef = useRef(null);
    const [copiedId, setCopiedId] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDownload = async (imageUrl) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `generated-image-${Date.now()}.png`; // improved filename
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(imageUrl, '_blank'); // Fallback
        }
    };

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center fade-in max-w-2xl px-4">
                    <h1 className="text-3xl md:text-5xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/50 tracking-wide leading-tight drop-shadow-sm select-none">
                        "Attention Is All You Need"
                    </h1>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-lg mx-auto font-light tracking-wide">
                        The architecture that revolutionized AI. Experience the power of Transformers.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex-1 overflow-y-auto p-6 scroll-smooth"
            onScroll={onScroll}
        >
            {/* Message container - max width for readability */}
            <div className="max-w-[750px] mx-auto space-y-8">
                {messages.map((message, index) => (
                    <div
                        key={message.id}
                        className={`flex gap-4 fade-in group ${message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                        style={{ animationDelay: `${index * 40}ms` }}
                    >
                        {/* AI Avatar */}
                        {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg">
                                <Bot className="w-4.5 h-4.5 text-white" />
                            </div>
                        )}

                        {/* Message Content */}
                        <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                            {/* Message Bubble */}
                            <div
                                className={`${message.role === 'user'
                                    ? 'message-user'
                                    : 'message-ai w-full'
                                    }`}
                            >
                                <ReactMarkdown
                                    className="prose prose-invert prose-sm"
                                    components={{
                                        img: ({ node, ...props }) => (
                                            <div className="relative group inline-block rounded-lg overflow-hidden my-2 border border-white/10">
                                                <img {...props} className="rounded-lg max-w-full h-auto block" alt={props.alt || "Generated Image"} />
                                                <button
                                                    onClick={() => handleDownload(props.src)}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md border border-white/10 shadow-lg translate-y-2 group-hover:translate-y-0"
                                                    title="Download Image"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )
                                    }}
                                >
                                    {message.content}
                                </ReactMarkdown>
                            </div>

                            {/* Sources (only for AI messages) */}
                            {message.sources && message.sources.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {message.sources.map((source, idx) => (
                                        <a
                                            key={idx}
                                            href={source.startsWith('http') ? source : '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="source-tag inline-flex items-center gap-1.5"
                                        >
                                            {source.startsWith('http') ? (
                                                <>
                                                    <ExternalLink className="w-3 h-3" />
                                                    <span>{new URL(source).hostname}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="w-3 h-3" />
                                                    <span>{source}</span>
                                                </>
                                            )}
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* Message Footer: Actions & Timestamp */}
                            <div className={`flex items-center gap-3 mt-1.5 min-h-[20px] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <span className="text-xs text-gray-600">
                                    {format(new Date(message.timestamp), 'HH:mm')}
                                </span>

                                {/* AI Actions */}
                                {message.role === 'assistant' && (
                                    <div className="flex items-center gap-1 px-1 py-0.5 rounded-md bg-white/5 border border-white/5">
                                        <button
                                            onClick={() => handleCopy(message.content, message.id)}
                                            className="p-1 hover:bg-white/10 rounded transition-colors text-gray-500 hover:text-gray-300"
                                            title="Copy"
                                        >
                                            {copiedId === message.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                        <div className="w-px h-3 bg-white/10"></div>
                                        <button className="p-1 hover:bg-white/10 rounded transition-colors text-gray-500 hover:text-gray-300">
                                            <ThumbsUp className="w-3 h-3" />
                                        </button>
                                        <button className="p-1 hover:bg-white/10 rounded transition-colors text-gray-500 hover:text-gray-300">
                                            <ThumbsDown className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}

                                {/* User Actions - Copy Only */}
                                {message.role === 'user' && (
                                    <div className="flex items-center gap-1 px-1 py-0.5 rounded-md bg-white/5 border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleCopy(message.content, message.id)}
                                            className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-gray-200"
                                            title="Copy"
                                        >
                                            {copiedId === message.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* User Avatar */}
                        {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-400" />
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}

export default MessageList;
