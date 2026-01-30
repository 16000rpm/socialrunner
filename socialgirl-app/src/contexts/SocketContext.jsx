import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext({
  onlineCount: 0,
  onlineUsers: [],
  isConnected: false
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    const socketUrl = import.meta.env.PROD
      ? 'https://social-runner-api.onrender.com'
      : 'http://localhost:5001';

    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setIsConnected(true);

      // Send user info if authenticated
      if (isAuthenticated && user) {
        socket.emit('userJoin', {
          id: user.id,
          name: user.name || user.email,
          picture: user.picture
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    socket.on('onlineUsers', (data) => {
      console.log('[Socket] Online users:', data);
      setOnlineCount(data.count);
      setOnlineUsers(data.users || []);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Re-emit user info when auth state changes
  useEffect(() => {
    if (socketRef.current && isConnected && isAuthenticated && user) {
      socketRef.current.emit('userJoin', {
        id: user.id,
        name: user.name || user.email,
        picture: user.picture
      });
    }
  }, [isAuthenticated, user, isConnected]);

  return (
    <SocketContext.Provider value={{ onlineCount, onlineUsers, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
