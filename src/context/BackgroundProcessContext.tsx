import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';
import { showToast } from '../utils/toast';

export interface BackgroundProcess {
  id: string;
  type: 'scraping' | 'report' | 'analysis' | 'export';
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStep?: string;
  totalSteps?: number;
  currentStepNumber?: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  result?: any;
  userId: string;
  metadata?: Record<string, any>;
}

interface BackgroundProcessContextType {
  processes: BackgroundProcess[];
  activeProcesses: BackgroundProcess[];
  addProcess: (process: BackgroundProcess) => void;
  updateProcess: (id: string, update: Partial<BackgroundProcess>) => void;
  removeProcess: (id: string) => void;
  cancelProcess: (id: string) => Promise<void>;
  refreshProcesses: () => Promise<void>;
  isConnected: boolean;
}

const BackgroundProcessContext = createContext<BackgroundProcessContextType | undefined>(undefined);

export const useBackgroundProcesses = () => {
  const context = useContext(BackgroundProcessContext);
  if (!context) {
    throw new Error('useBackgroundProcesses must be used within a BackgroundProcessProvider');
  }
  return context;
};

interface BackgroundProcessProviderProps {
  children: React.ReactNode;
}

export const BackgroundProcessProvider: React.FC<BackgroundProcessProviderProps> = ({ children }) => {
  const [processes, setProcesses] = useState<BackgroundProcess[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const activeProcesses = processes.filter(
    process => ['pending', 'running'].includes(process.status)
  );

  const addProcess = useCallback((process: BackgroundProcess) => {
    setProcesses(prev => {
      const existing = prev.find(p => p.id === process.id);
      if (existing) {
        return prev.map(p => p.id === process.id ? process : p);
      }
      return [process, ...prev];
    });
  }, []);

  const updateProcess = useCallback((id: string, update: Partial<BackgroundProcess>) => {
    setProcesses(prev => 
      prev.map(process => 
        process.id === id ? { ...process, ...update } : process
      )
    );
  }, []);

  const removeProcess = useCallback((id: string) => {
    setProcesses(prev => prev.filter(process => process.id !== id));
  }, []);

  const cancelProcess = useCallback(async (id: string) => {
    try {
      await apiService.cancelBackgroundProcess(id);
      updateProcess(id, { status: 'cancelled' });
    } catch (error) {
      console.error('Failed to cancel process:', error);
    }
  }, [updateProcess]);

  const refreshProcesses = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const { processes: fetchedProcesses } = await apiService.getBackgroundProcesses();
      setProcesses(fetchedProcesses);
    } catch (error) {
      console.error('Failed to fetch background processes:', error);
    }
  }, [isAuthenticated]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const newSocket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to background process WebSocket');
      setIsConnected(true);
      newSocket.emit('join-user-room', user.userId);
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason: any) => {
      console.log('Disconnected from background process WebSocket:', reason);
      setIsConnected(false);
    });

    newSocket.on('processCreated', (process: BackgroundProcess) => {
      console.log('Process created:', process);
      addProcess(process);
      showToast.info(`Started: ${process.title}`);
    });

    newSocket.on('processUpdated', (process: BackgroundProcess) => {
      console.log('Process updated:', process);
      updateProcess(process.id, process);
      
      // Show toast notifications for status changes
      if (process.status === 'completed') {
        showToast.success(`${process.title} completed successfully!`);
      } else if (process.status === 'failed') {
        showToast.error(`${process.title} failed: ${process.error || 'Unknown error'}`);
      } else if (process.status === 'cancelled') {
        showToast.warning(`${process.title} was cancelled`);
      }
    });

    setSocket(newSocket);

    // Initial load of processes
    refreshProcesses();

    return () => {
      newSocket.close();
    };
  }, [isAuthenticated, user, addProcess, updateProcess, refreshProcesses]);

  // Clean up completed processes after 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setProcesses(prev => 
        prev.filter(process => {
          if (['completed', 'failed', 'cancelled'].includes(process.status)) {
            const completedAt = process.completedAt ? new Date(process.completedAt) : new Date(process.startedAt);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            return completedAt > fiveMinutesAgo;
          }
          return true;
        })
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const value: BackgroundProcessContextType = {
    processes,
    activeProcesses,
    addProcess,
    updateProcess,
    removeProcess,
    cancelProcess,
    refreshProcesses,
    isConnected,
  };

  return (
    <BackgroundProcessContext.Provider value={value}>
      {children}
    </BackgroundProcessContext.Provider>
  );
}; 