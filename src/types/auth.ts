export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  total_sessions: number;
  total_chords_practiced: number;
  average_accuracy: number;
  created_at: string;
  updated_at: string;
}
