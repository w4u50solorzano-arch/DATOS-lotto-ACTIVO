
import { Reward } from './types';

export const WHATSAPP_NUMBER = "584144952096";

export const REWARDS: Reward[] = [
  {
    id: '30',
    title: 'Datos Fijos',
    description: 'Acceso exclusivo a bases de datos de alta fidelidad.',
    cost: 30,
    icon: '📊'
  },
  {
    id: '60',
    title: 'Tripletas Pro',
    description: 'Predicciones algorítmicas de alto rendimiento.',
    cost: 60,
    icon: '🎲'
  },
  {
    id: '100',
    title: 'Plan Platinum',
    description: 'Acceso total VIP a todas las herramientas élite.',
    cost: 100,
    icon: '💎'
  }
];

export const SYSTEM_PROMPT = `You are the "Soporte Lotto Activo," an energetic and professional rewards assistant for the app "DATOS lotto ACTIVO Rewards". 
Your goal is to help the user earn more points. 
- Be brief and motivational.
- Use emojis like 💎, 🚀, 🎰 and 💰.
- If the user asks for points, remind them to watch videos.
- Current rewards available: Datos Fijos (30), Tripletas (60), Plan Platinum (100).
- When a user redeems, they will be sent to WhatsApp (${WHATSAPP_NUMBER}) to claim their prize.
- Keep responses under 60 words.`;
