import { supabase } from '@/lib/supabase';

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  friend_profile?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export const friendsApi = {
  async getUserFriends(userId: string) {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        friend_profile:profiles!friends_friend_id_fkey(id, username, avatar_url)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Friend[];
  },

  async getPendingRequests(userId: string) {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        friend_profile:profiles!friends_user_id_fkey(id, username, avatar_url)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Friend[];
  },

  async sendFriendRequest(userId: string, friendUsername: string) {
    // Find user by username
    const { data: friendProfile, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', friendUsername)
      .single();

    if (searchError) throw new Error('User not found');

    // Create friend request
    const { data, error } = await supabase
      .from('friends')
      .insert({
        user_id: userId,
        friend_id: friendProfile.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async acceptFriendRequest(requestId: string) {
    const { data, error } = await supabase
      .from('friends')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeFriend(friendshipId: string) {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId);

    if (error) throw error;
  },
};
