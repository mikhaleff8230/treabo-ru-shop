import { useEffect, useRef } from 'react';
import { getAuthToken } from '@/data/client/token.utils';

interface UsePusherOptions {
  channel: string;
  event: string;
  callback: (data: any) => void;
}

// Dynamic import for pusher-js to avoid build errors if module is not installed
let Pusher: any = null;
if (typeof window !== 'undefined') {
  try {
    // @ts-ignore - dynamic import
    Pusher = require('pusher-js');
  } catch (e) {
    console.warn('pusher-js module not found. Real-time updates will not work.');
  }
}

export function usePusher(
  channelName: string,
  eventName: string,
  callback: (data: any) => void
) {
  const pusherRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Check if Pusher is available
    if (!Pusher) {
      console.warn('Pusher not available. Real-time updates will not work.');
      return;
    }

    // Initialize Pusher
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'mt1';
    const pusherHost = process.env.NEXT_PUBLIC_PUSHER_HOST || 'localhost';
    const pusherPort = process.env.NEXT_PUBLIC_PUSHER_PORT || '6001';

    if (!pusherKey) {
      console.warn('Pusher key not found. Real-time updates will not work.');
      return;
    }

    // Initialize Pusher with auth endpoint
    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost:8000'}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      },
      wsHost: pusherHost,
      wsPort: parseInt(pusherPort),
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
    });

    pusherRef.current = pusher;

    // Subscribe to channel
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    // Bind to event
    channel.bind(eventName, callback);

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind(eventName);
        pusher.unsubscribe(channelName);
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, [channelName, eventName, callback]);
}




