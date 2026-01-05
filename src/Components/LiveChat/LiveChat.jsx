import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, Paperclip, Smile, Search } from 'lucide-react';
import './LiveChat.css';

// Static users data
const STATIC_USERS = [
    {
        id: 1,
        name: 'John Doe',
        avatar: 'JD',
        status: 'online',
        lastMessage: 'Thanks for your help!',
        unreadCount: 2,
        lastSeen: '2 min ago'
    },
    {
        id: 2,
        name: 'Sarah Smith',
        avatar: 'SS',
        status: 'online',
        lastMessage: 'Can you check the dashboard?',
        unreadCount: 5,
        lastSeen: '5 min ago'
    },
    {
        id: 3,
        name: 'Mike Johnson',
        avatar: 'MJ',
        status: 'offline',
        lastMessage: 'See you tomorrow',
        unreadCount: 0,
        lastSeen: '2 hours ago'
    },
    {
        id: 4,
        name: 'Emily Davis',
        avatar: 'ED',
        status: 'online',
        lastMessage: 'Perfect! That worked',
        unreadCount: 1,
        lastSeen: '10 min ago'
    },
    {
        id: 5,
        name: 'David Wilson',
        avatar: 'DW',
        status: 'offline',
        lastMessage: 'I\'ll send the report',
        unreadCount: 0,
        lastSeen: 'Yesterday'
    },
    {
        id: 6,
        name: 'Lisa Anderson',
        avatar: 'LA',
        status: 'online',
        lastMessage: 'Great work on the project!',
        unreadCount: 3,
        lastSeen: '1 min ago'
    }
];

// Static messages for each user
const USERS_MESSAGES = {
    1: [
        { id: 1, sender: 'John Doe', message: 'Hi! I need help with the fleet system', timestamp: '10:30 AM', isAgent: false, avatar: 'JD' },
        { id: 2, sender: 'You', message: 'Hello John! I\'d be happy to help. What do you need?', timestamp: '10:31 AM', isAgent: true, avatar: 'ME' },
        { id: 3, sender: 'John Doe', message: 'How do I add a new vehicle?', timestamp: '10:32 AM', isAgent: false, avatar: 'JD' },
        { id: 4, sender: 'You', message: 'Go to the Fleet section and click on "Add Vehicle" button', timestamp: '10:33 AM', isAgent: true, avatar: 'ME' },
        { id: 5, sender: 'John Doe', message: 'Thanks for your help!', timestamp: '10:35 AM', isAgent: false, avatar: 'JD' }
    ],
    2: [
        { id: 1, sender: 'Sarah Smith', message: 'Hey, I have a question', timestamp: '9:15 AM', isAgent: false, avatar: 'SS' },
        { id: 2, sender: 'You', message: 'Sure, what\'s up?', timestamp: '9:16 AM', isAgent: true, avatar: 'ME' },
        { id: 3, sender: 'Sarah Smith', message: 'Can you check the dashboard?', timestamp: '9:20 AM', isAgent: false, avatar: 'SS' }
    ],
    3: [
        { id: 1, sender: 'Mike Johnson', message: 'Good morning!', timestamp: 'Yesterday', isAgent: false, avatar: 'MJ' },
        { id: 2, sender: 'You', message: 'Good morning Mike!', timestamp: 'Yesterday', isAgent: true, avatar: 'ME' },
        { id: 3, sender: 'Mike Johnson', message: 'See you tomorrow', timestamp: 'Yesterday', isAgent: false, avatar: 'MJ' }
    ],
    4: [
        { id: 1, sender: 'Emily Davis', message: 'I need some assistance', timestamp: '11:00 AM', isAgent: false, avatar: 'ED' },
        { id: 2, sender: 'You', message: 'How can I help you?', timestamp: '11:01 AM', isAgent: true, avatar: 'ME' },
        { id: 3, sender: 'Emily Davis', message: 'Perfect! That worked', timestamp: '11:05 AM', isAgent: false, avatar: 'ED' }
    ],
    5: [
        { id: 1, sender: 'David Wilson', message: 'Hi there', timestamp: 'Yesterday', isAgent: false, avatar: 'DW' },
        { id: 2, sender: 'You', message: 'Hello David!', timestamp: 'Yesterday', isAgent: true, avatar: 'ME' },
        { id: 3, sender: 'David Wilson', message: 'I\'ll send the report', timestamp: 'Yesterday', isAgent: false, avatar: 'DW' }
    ],
    6: [
        { id: 1, sender: 'Lisa Anderson', message: 'Thank you so much!', timestamp: '10:45 AM', isAgent: false, avatar: 'LA' },
        { id: 2, sender: 'You', message: 'You\'re welcome!', timestamp: '10:46 AM', isAgent: true, avatar: 'ME' },
        { id: 3, sender: 'Lisa Anderson', message: 'Great work on the project!', timestamp: '10:50 AM', isAgent: false, avatar: 'LA' }
    ]
};

const QUICK_REPLIES = [
    'Help with dashboard',
    'Report an issue',
    'Contact support',
    'View tutorials'
];

const LiveChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [users, setUsers] = useState(STATIC_USERS);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState({});
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalUnreadCount, setTotalUnreadCount] = useState(11);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Initialize messages from static data
        setMessages(USERS_MESSAGES);
    }, []);

    useEffect(() => {
        // Calculate total unread count
        const total = users.reduce((sum, user) => sum + user.unreadCount, 0);
        setTotalUnreadCount(total);
    }, [users]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && selectedUser) {
            scrollToBottom();
        }
    }, [messages, isOpen, selectedUser]);

    const handleUserSelect = (user) => {
        setSelectedUser(user);

        // Mark messages as read
        setUsers(prevUsers =>
            prevUsers.map(u =>
                u.id === user.id ? { ...u, unreadCount: 0 } : u
            )
        );
    };

    const handleSendMessage = () => {
        if (inputMessage.trim() === '' || !selectedUser) return;

        const currentMessages = messages[selectedUser.id] || [];
        const newMessage = {
            id: currentMessages.length + 1,
            sender: 'You',
            message: inputMessage,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            isAgent: true,
            avatar: 'ME'
        };

        setMessages(prev => ({
            ...prev,
            [selectedUser.id]: [...(prev[selectedUser.id] || []), newMessage]
        }));

        // Update last message in users list
        setUsers(prevUsers =>
            prevUsers.map(u =>
                u.id === selectedUser.id
                    ? { ...u, lastMessage: inputMessage.substring(0, 30) + '...', lastSeen: 'Just now' }
                    : u
            )
        );

        setInputMessage('');

        // Simulate agent typing
        setIsTyping(true);
        setTimeout(() => {
            const agentResponse = {
                id: currentMessages.length + 2,
                sender: selectedUser.name,
                message: 'Thank you for your message. I\'ll get back to you shortly.',
                timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                isAgent: false,
                avatar: selectedUser.avatar
            };

            setMessages(prev => ({
                ...prev,
                [selectedUser.id]: [...(prev[selectedUser.id] || []), agentResponse]
            }));

            setIsTyping(false);
        }, 2000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleQuickReply = (reply) => {
        setInputMessage(reply);
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        setIsMinimized(false);
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentMessages = selectedUser ? messages[selectedUser.id] || [] : [];

    return (
        <div className="livechat-widget-container">
            {!isOpen ? (
                <button className="livechat-trigger-btn" onClick={toggleChat}>
                    <span class="material-symbols-rounded live-chat-icon">
                        near_me
                    </span>
                    {totalUnreadCount > 0 && (
                        <span className="livechat-notification-badge">{totalUnreadCount}</span>
                    )}
                </button>
            ) : (
                <div className={`livechat-window-container ${isMinimized ? 'livechat-minimized' : ''}`}>
                    {/* Users Sidebar */}
                    <div className="livechat-users-sidebar">
                        <div className="livechat-sidebar-header">
                            <h3>Messages</h3>
                            <div style={{ position: 'relative' }}>
                                <Search
                                    style={{
                                        position: 'absolute',
                                        left: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '16px',
                                        height: '16px',
                                        color: 'var(--text-secondary)'
                                    }}
                                />
                                <input
                                    type="text"
                                    className="livechat-search-box"
                                    placeholder="Search conversations..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                            </div>
                        </div>

                        <div className="livechat-users-list">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className={`livechat-user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                                    onClick={() => handleUserSelect(user)}
                                >
                                    <div className="livechat-user-avatar">
                                        {user.avatar}
                                        <div className={`livechat-user-status ${user.status === 'offline' ? 'offline' : ''}`}></div>
                                    </div>
                                    <div className="livechat-user-info">
                                        <h4>{user.name}</h4>
                                        <p>{user.lastMessage}</p>
                                    </div>
                                    {user.unreadCount > 0 && (
                                        <div className="livechat-user-badge">{user.unreadCount}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="livechat-chat-area">
                        {/* Header */}
                        <div className="livechat-header">
                            <div className="livechat-header-info">
                                {selectedUser ? (
                                    <>
                                        <div className="livechat-agent-avatar">
                                            {selectedUser.avatar}
                                            <div className={`livechat-agent-status ${selectedUser.status === 'offline' ? 'offline' : ''}`}></div>
                                        </div>
                                        <div className="livechat-header-text">
                                            <h3>{selectedUser.name}</h3>
                                            <p>{selectedUser.status === 'online' ? 'Active now' : `Last seen ${selectedUser.lastSeen}`}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="livechat-header-text">
                                        <h3>Support Chat</h3>
                                        <p>Select a conversation to start</p>
                                    </div>
                                )}
                            </div>
                            <div className="livechat-header-actions">
                                <button className="livechat-icon-btn" onClick={toggleMinimize}>
                                    {isMinimized ? <Maximize2 /> : <Minimize2 />}
                                </button>
                                <button className="livechat-icon-btn" onClick={toggleChat}>
                                    <X />
                                </button>
                            </div>
                        </div>

                        {/* Messages Container */}
                        {selectedUser ? (
                            <>
                                <div className="livechat-messages-container">
                                    {currentMessages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`livechat-message-wrapper ${msg.isAgent ? 'livechat-user-message' : ''
                                                }`}
                                        >
                                            <div className="livechat-message-avatar">{msg.avatar}</div>
                                            <div className="livechat-message-content">
                                                <div className="livechat-message-bubble">{msg.message}</div>
                                                <div className="livechat-message-timestamp">{msg.timestamp}</div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Typing Indicator */}
                                    {isTyping && (
                                        <div className="livechat-typing-indicator">
                                            <div className="livechat-message-avatar">{selectedUser.avatar}</div>
                                            <div className="livechat-typing-bubble">
                                                <div className="livechat-typing-dot"></div>
                                                <div className="livechat-typing-dot"></div>
                                                <div className="livechat-typing-dot"></div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Quick Replies */}
                                <div className="livechat-quick-replies">
                                    {QUICK_REPLIES.map((reply, index) => (
                                        <button
                                            key={index}
                                            className="livechat-quick-reply-btn"
                                            onClick={() => handleQuickReply(reply)}
                                        >
                                            {reply}
                                        </button>
                                    ))}
                                </div>

                                {/* Input Container */}
                                <div className="livechat-input-container">
                                    <div className="livechat-input-actions">
                                        <button className="livechat-icon-btn">
                                            <Paperclip />
                                        </button>
                                        <button className="livechat-icon-btn">
                                            <Smile />
                                        </button>
                                    </div>
                                    <div className="livechat-input-wrapper">
                                        <input
                                            type="text"
                                            className="livechat-input-field"
                                            placeholder="Type your message..."
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                        />
                                    </div>
                                    <button
                                        className="livechat-send-btn"
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim()}
                                    >
                                        <Send />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="livechat-empty-state">
                                <MessageCircle />
                                <h3>No conversation selected</h3>
                                <p>Choose a conversation from the list to start messaging</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveChat;