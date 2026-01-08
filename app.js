import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Clock, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

const AnonymousChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substr(2, 9));
  const [username] = useState(() => 'Anonymous' + Math.floor(Math.random() * 9999));
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [hasAccess, setHasAccess] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize timer on first load
  useEffect(() => {
    const initTimer = async () => {
      try {
        const stored = await window.storage.get('chatAccess_' + userId);
        if (stored) {
          const data = JSON.parse(stored.value);
          const now = Date.now();
          if (now < data.expiresAt) {
            setTimeRemaining(Math.floor((data.expiresAt - now) / 1000));
            setHasAccess(true);
          } else {
            setHasAccess(false);
            setTimeRemaining(0);
          }
        } else {
          // First time user - 30 minutes free
          const expiresAt = Date.now() + (30 * 60 * 1000);
          await window.storage.set('chatAccess_' + userId, JSON.stringify({ expiresAt }));
          setTimeRemaining(30 * 60);
          setHasAccess(true);
        }
      } catch (error) {
        // If storage fails, give 30 min access
        setTimeRemaining(30 * 60);
        setHasAccess(true);
      }
    };

    initTimer();
  }, [userId]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setHasAccess(false);
          setShowPaymentModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Load messages from storage
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const keys = await window.storage.list('msg_', true);
        if (keys && keys.keys) {
          const msgs = [];
          for (const key of keys.keys) {
            try {
              const result = await window.storage.get(key, true);
              if (result) {
                msgs.push(JSON.parse(result.value));
              }
            } catch (e) {
              console.log('Error loading message:', e);
            }
          }
          msgs.sort((a, b) => a.timestamp - b.timestamp);
          setMessages(msgs.slice(-50)); // Keep last 50 messages
        }
      } catch (error) {
        console.log('Could not load messages:', error);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !hasAccess) return;

    const newMessage = {
      id: Date.now() + '_' + Math.random(),
      text: inputMessage,
      username: username,
      userId: userId,
      timestamp: Date.now()
    };

    try {
      await window.storage.set('msg_' + newMessage.id, JSON.stringify(newMessage), true);
      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');
    } catch (error) {
      console.log('Error sending message:', error);
    }
  };

  const handlePayment = async () => {
    setPaymentProcessing(true);
    
    // Simulate Razorpay payment integration
    // In production, you would integrate with Razorpay SDK here
    const options = {
      amount: 100, // ₹1 = 100 paise
      currency: 'INR',
      name: 'Anonymous Chat',
      description: '1 Hour Access',
      handler: async function(response) {
        // Payment successful
        const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour
        try {
          await window.storage.set('chatAccess_' + userId, JSON.stringify({ expiresAt }));
          setTimeRemaining(60 * 60);
          setHasAccess(true);
          setPaymentSuccess(true);
          setTimeout(() => {
            setShowPaymentModal(false);
            setPaymentSuccess(false);
            setPaymentProcessing(false);
          }, 2000);
        } catch (error) {
          console.log('Error updating access:', error);
        }
      }
    };

    // For demo purposes, simulate successful payment after 2 seconds
    setTimeout(async () => {
      const expiresAt = Date.now() + (60 * 60 * 1000);
      try {
        await window.storage.set('chatAccess_' + userId, JSON.stringify({ expiresAt }));
        setTimeRemaining(60 * 60);
        setHasAccess(true);
        setPaymentSuccess(true);
        setTimeout(() => {
          setShowPaymentModal(false);
          setPaymentSuccess(false);
          setPaymentProcessing(false);
        }, 2000);
      } catch (error) {
        setPaymentProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500">
      {/* Header */}
      <header className="bg-white bg-opacity-10 backdrop-blur-md border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <h1 className="text-lg sm:text-2xl font-bold text-white">Anonymous Chat</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2 bg-white bg-opacity-20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                <span className="text-xs sm:text-sm font-semibold text-white">
                  {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
                </span>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-1 sm:gap-2 bg-green-500 hover:bg-green-600 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full transition text-white text-xs sm:text-sm font-medium"
              >
                <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Extend</span>
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs sm:text-sm text-white text-opacity-90">
            Chatting as: <span className="font-semibold">{username}</span>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 max-w-7xl w-full mx-auto">
        <div className="space-y-3 sm:space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.userId === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-md rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                  msg.userId === userId
                    ? 'bg-white text-gray-800'
                    : 'bg-white bg-opacity-20 backdrop-blur-md text-white'
                }`}
              >
                <div className="text-xs font-semibold mb-1 opacity-75">
                  {msg.username}
                </div>
                <div className="text-sm sm:text-base break-words">{msg.text}</div>
                <div className="text-xs opacity-50 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md border-t border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {hasAccess ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 bg-white bg-opacity-20 backdrop-blur-md text-white placeholder-white placeholder-opacity-60 rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
              <button
                onClick={handleSendMessage}
                className="bg-white text-purple-600 rounded-full p-2 sm:p-3 hover:bg-opacity-90 transition"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-white text-sm sm:text-base mb-2 sm:mb-3">
                Your free time has expired. Pay ₹1 to continue chatting for 1 hour.
              </p>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition text-sm sm:text-base"
              >
                Pay ₹1 to Continue
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full">
            {paymentSuccess ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
                <p className="text-gray-600">You now have 1 hour of access.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-8 h-8 text-purple-600" />
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Extend Access</h2>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-4 sm:p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-700 font-medium">1 Hour Access</span>
                    <span className="text-2xl font-bold text-purple-600">₹1</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Payment is processed securely through Razorpay. Your bank details are never shared with us.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handlePayment}
                    disabled={paymentProcessing}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {paymentProcessing ? 'Processing...' : 'Pay with Razorpay'}
                  </button>
                  
                  {!paymentProcessing && (
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-semibold transition text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  Demo mode: Payment will be simulated. In production, integrate with Razorpay API.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnonymousChatApp;