'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/login?tab=forgot');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="animate-pulse text-green-400 font-black uppercase tracking-[0.4em] text-[10px]">
        Iniciando Protocolo de Recuperación...
      </div>
    </div>
  );
}
