
export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface UserState {
  points: number;
  history: Array<{
    id: string;
    action: string;
    points: number;
    timestamp: number;
  }>;
}

export interface AdStatus {
  loading: boolean;
  error: string | null;
  message: string | null;
}
