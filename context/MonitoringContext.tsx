
import React, { createContext, useContext, ReactNode } from 'react';
import { useMonitoring, MonitoringArea } from '../hooks/useMonitoring';

// Define the shape of the context data
type MonitoringContextType = ReturnType<typeof useMonitoring>;

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

export const MonitoringProvider = ({ children }: { children: ReactNode }) => {
  const monitoring = useMonitoring();

  return (
    <MonitoringContext.Provider value={monitoring}>
      {children}
    </MonitoringContext.Provider>
  );
};

export const useMonitoringContext = () => {
  const context = useContext(MonitoringContext);
  if (context === undefined) {
    throw new Error('useMonitoringContext must be used within a MonitoringProvider');
  }
  return context;
};
