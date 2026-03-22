import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { chatAPI } from '../../services/api';
import { io } from 'socket.io-client';
import { Send, User } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

export const ChatWindow = () => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Fetch contacts
        if (user) {
            chatAPI.getContacts(user.id, user.role === 'trainer' ? 3 : 4)
                .then(res => {
                    if (res.data.success) {
                        setContacts(res.data.contacts);
                    }
                })
                .catch(err => console.error("Error fetching contacts:", err));

            // Initialize Socket
            socketRef.current = io(SOCKET_URL);
            socketRef.current.emit('join_chat', user.id);

            socketRef.current.on('receive_message', (msg) => {
                setMessages(prev => [...prev, msg]);
            });
        }

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [user]);

    useEffect(() => {
        if (activeContact) {
            chatAPI.getHistory(user.id, activeContact.id)
                .then(res => {
                    if (res.data.success) {
                        setMessages(res.data.messages);
                    }
                })
                .catch(err => console.error("Error fetching history:", err));
        }
    }, [activeContact, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeContact) return;

        const msgData = {
            senderId: user.id,
            receiverId: activeContact.id,
            content: newMessage
        };

        socketRef.current.emit('send_message', msgData);
        setNewMessage('');
    };

    return (
        <div className="flex h-[calc(100vh-100px)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Contacts Sidebar */}
            <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {contacts.length === 0 ? (
                        <p className="p-4 text-center text-sm text-gray-500">No contacts found.</p>
                    ) : (
                        contacts.map(contact => (
                            <button
                                key={contact.id}
                                onClick={() => setActiveContact(contact)}
                                className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-100 transition-colors border-b border-gray-100 ${
                                    activeContact?.id === contact.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <User size={20} />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                        {contact.first_name} {contact.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate capitalize">{contact.role_id === 3 ? 'Trainer' : 'Student'}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50">
                {activeContact ? (
                    <>
                        <div className="p-4 border-b border-gray-200 bg-white flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">{activeContact.first_name} {activeContact.last_name}</h3>
                                <p className="text-xs text-green-600 flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Available
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.filter(m => 
                                (m.sender_id === user.id && m.receiver_id === activeContact.id) || 
                                (m.sender_id === activeContact.id && m.receiver_id === user.id)
                            ).map((msg, idx) => {
                                const isMe = msg.sender_id === user.id;
                                return (
                                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                                            isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                                        }`}>
                                            <p>{msg.content}</p>
                                            <span className={`text-[10px] mt-1 block ${isMe ? 'text-blue-100 text-right' : 'text-gray-400'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex items-center space-x-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <User size={32} className="text-gray-400" />
                        </div>
                        <p className="text-lg font-medium text-gray-600">Select a contact to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};
