// context/ConnectivityContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface ConnectivityContextType {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isConnected: true, // Optimistic default
  isInternetReachable: true,
});

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState(state);
    });

    return () => unsubscribe();
  }, []);

  const isConnected = networkState?.isConnected ?? true;
  const isInternetReachable = networkState?.isInternetReachable ?? true;

  return (
    <ConnectivityContext.Provider value={{ isConnected, isInternetReachable }}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export const useConnectivity = () => useContext(ConnectivityContext);
