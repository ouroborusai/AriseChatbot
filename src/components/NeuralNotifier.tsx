'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useActiveCompany } from '@/contexts/ActiveCompanyContext';
import { logger } from '@/lib/logger';

/**
 * NEURAL NOTIFIER Diamond v12.0
 * Gestiona notificaciones sonoras en tiempo real para mensajes entrantes.
 */
export default function NeuralNotifier() {
  const { activeCompany } = useActiveCompany();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 1. Inicializar audio (Ping profesional)
    // Usamos una URL pública de un sonido limpio o podemos inyectar un Base64
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    audio.volume = 0.5;
    audioRef.current = audio;

    if (!activeCompany?.id) return;

    // 2. Suscribirse a Realtime de Supabase para nuevos mensajes
    const channel = supabase
      .channel('neural-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // Filtramos por conversación que pertenezca a la empresa actual
          // Nota: La suscripción de Supabase no permite filtros complejos en el cliente para FKs de forma nativa sin habilitar algo específico,
          // pero podemos filtrar en el callback.
        },
        async (payload) => {
          const newMessage = payload.new as { sender_type: string; conversation_id: string; content: string };
          
          // Solo notificar si es un mensaje de un USUARIO (cliente externo)
          if (newMessage.sender_type !== 'user') return;

          // Verificar si la conversación pertenece a la empresa actual
          const { data: conv } = await supabase
            .from('conversations')
            .select('company_id')
            .eq('id', newMessage.conversation_id)
            .single();

          if (conv?.company_id === activeCompany?.id) {
            logger.info('Nuevo mensaje entrante detectado.', 'NEURAL_NOTIFY');
            playNotificationSound();
            
            // Opcional: Notificación nativa del sistema
            if (Notification.permission === 'granted') {
              new Notification('Nuevo Mensaje ARISE', {
                body: newMessage.content,
                icon: '/brand/arise-logo.png'
              });
            }
          }
        }
      )
      .subscribe();

    // 3. Solicitar permisos de notificación al cargar
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCompany?.id]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => logger.warn(`Browser blocked autoplay sound: ${e.message}`, 'AUDIO_BLOCKED'));
    }
  };

  return null; // Componente invisible
}
