import React from 'react';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GlobalDataLoader } from '@/components/GlobalDataLoader';

export default function RootLayout() {
  const { refreshToken } = useAuthStore();

  useEffect(() => {
    refreshToken();
  }, []);

  return <GlobalDataLoader></GlobalDataLoader>;
}
