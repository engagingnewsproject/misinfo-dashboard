/*
Use `useNetworkStatus` on component to monitor network status...
1) Import: 
  import useNetworkStatus from '../hooks/useNetworkStatus';
  
2) Set Const: 
  const isOnline = useNetworkStatus();
  
3) UseEffect:
	useEffect(() => {
		if (!isOnline) {
			console.log('The browser is offline.')
		}
	}, [isOnline])

4) Add Markup:
  {process.env.NODE_ENV === 'development' && (
    <div className={`text-center font-extrabold text-lg ${isOnline ? 'text-green-600' : 'text-red-800'}`}>{isOnline ? "Online" : "Offline"}</div>
  )}
*/

import { useEffect,useState } from 'react';

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

export default useNetworkStatus;
