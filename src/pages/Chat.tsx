import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService, type Chat, type User } from '../services/api';
import Button from '../components/ui/button/Button';
import TextArea from '../components/form/input/TextArea';
import Badge from '../components/ui/badge/Badge';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import ComponentCard from '../components/common/ComponentCard';

// Simple Avatar component for chat
const ChatAvatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };
  
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
  const colorIndex = name.charCodeAt(0) % colors.length;
  
  return (
    <div className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
      {initials}
    </div>
  );
};

export default function Chat() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [creatingChat, setCreatingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats();
    loadUsers();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const chatsData = await apiService.getChats();
      setChats(chatsData);
      if (chatsData.length > 0 && !selectedChat) {
        setSelectedChat(chatsData[0]);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      let usersData;
      if (user?.role === 'admin') {
        // Admin can see all users
        usersData = await apiService.getAllUsers();
      } else {
        // Creators can only see users they're chatting with
        usersData = await apiService.getChatParticipants();
      }
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      setSending(true);
      await apiService.sendMessage(selectedChat.chatId, newMessage.trim());
      setNewMessage('');
      
      // Refresh the chat to get the new message
      const updatedChat = await apiService.getChat(selectedChat.chatId);
      setSelectedChat(updatedChat);
      
      // Update the chat in the list
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.chatId === selectedChat.chatId ? updatedChat : chat
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleCreateChat = async () => {
    if (!selectedUserId) return;

    try {
      setCreatingChat(true);
      const newChat = await apiService.createChat(selectedUserId);
      setChats(prevChats => [newChat, ...prevChats]);
      setSelectedChat(newChat);
      setShowNewChatModal(false);
      setSelectedUserId('');
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setCreatingChat(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:ml-64">
      <PageBreadcrumb pageTitle="Chats" />
      <ComponentCard
        title={          <div className="flex items-center justify-between w-full">
            <span>Chat</span>
            {user?.role === 'admin' && (
              <Button                onClick={() => setShowNewChatModal(true)}
                size="sm"
                className="px-3 py-1 text-xs"
              >
                New Chat
              </Button>
            )}
          </div>
        }
      >
        <div className="flex flex-col md:flex-row gap-6 min-h-[400px]">
          {/* Chat List */}
          <div className="md:w-1/3 w-full border-r border-gray-100 dark:border-gray-800 pr-0 md:pr-4 mb-6 md:mb-0">
            <div className="overflow-y-auto max-h-[400px] md:max-h-[600px]">
              {chats.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No chats available
                </div>
              ) : (
                chats.map((chat) => {
                  const otherParticipantId = chat.participantsList?.find(p => p !== user?.userId);
                  const otherParticipant = users.find(u => u.userId === otherParticipantId);
                  const lastMessage = chat.messages[chat.messages.length - 1];
                  return (
                    <div
                      key={chat.chatId}                      onClick={() => setSelectedChat(chat)}                      className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg mb-2 ${
                        selectedChat?.chatId === chat.chatId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <ChatAvatar
                          size="md"
                          name={otherParticipant?.name || 'Unknown'}                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {otherParticipant?.name || 'Unknown User'}
                            </h3>
                            {lastMessage && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(lastMessage.timestamp)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              color={otherParticipant?.role === 'admin' ? 'primary' : 'info'}                            >
                              {otherParticipant?.role || 'unknown'}
                            </Badge>
                            {lastMessage && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const otherParticipantId = selectedChat.participantsList?.find((p: string) => p !== user?.userId);
                      const otherParticipant = users.find(u => u.userId === otherParticipantId);
                      return (
                        <>
                          <ChatAvatar
                            size="md"
                            name={otherParticipant?.name || 'Unknown'}                          />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {otherParticipant?.name || 'Unknown User'}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <Badge
                                color={otherParticipant?.role === 'admin' ? 'primary' : 'info'}                              >
                                {otherParticipant?.role || 'unknown'}
                              </Badge>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {otherParticipant?.email}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-2 space-y-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  {selectedChat.messages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    selectedChat.messages.map((message) => {
                      const isOwnMessage = message.senderId === user?.userId;
                      const messageUser = users.find(u => u.userId === message.senderId);
                      return (
                        <div
                          key={message.messageId}                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}                        >                          <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>                            <div className={`rounded-lg px-4 py-2 ${
                              isOwnMessage 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800'                            }`}>
                              <p className="text-sm">{message.content}</p>                              <p className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'                              }`}>
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                            {!isOwnMessage && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                                {messageUser?.name || 'Unknown'}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="pt-4 flex space-x-3">
                  <div className="flex-1">
                    <TextArea
                      value={newMessage}
                      onChange={setNewMessage}
                      placeholder="Type your message..."
                      rows={1}
                      className="resize-none"                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-6"                  >
                    {sending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-medium mb-2">No chat selected</h3>
                  <p>Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Chat Modal */}
        {showNewChatModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Start New Chat
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Creator
                  </label>
                  <select
                    value={selectedUserId}                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a creator...</option>
                    {users
                      .filter(u => u.role === 'creator')
                      .map(user => (
                        <option key={user.userId} value={user.userId}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleCreateChat}
                    disabled={!selectedUserId || creatingChat}
                    className="flex-1"                  >
                    {creatingChat ? 'Creating...' : 'Start Chat'}
                  </Button>
                  <Button                    onClick={() => {
                      setShowNewChatModal(false);
                      setSelectedUserId('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ComponentCard>
    </div>
  );
} 