import {
  supabase,
  UserProfile,
  CreateUserProfile,
  UpdateUserProfile,
} from '@/lib/supabase';

export class ProfileService {
  async getProfile(walletAddress: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error (not PGRST116):', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async createProfile(profileData: {
    walletAddress: string;
    name?: string;
    avatarUrl?: string;
  }): Promise<UserProfile> {
    try {
      const data: CreateUserProfile = {
        wallet_address: profileData.walletAddress.toLowerCase(),
        name: profileData.name || null,
        avatar_url: profileData.avatarUrl || null,
      };

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return profile;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  async updateProfile(
    walletAddress: string,
    updates: {
      name?: string;
      avatarUrl?: string;
    }
  ): Promise<UserProfile> {
    try {
      const data: UpdateUserProfile = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) data.name = updates.name;
      if (updates.avatarUrl !== undefined) data.avatar_url = updates.avatarUrl;

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .update(data)
        .eq('wallet_address', walletAddress.toLowerCase())
        .select()
        .single();

      if (error) throw error;

      return profile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async uploadAvatar(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  async deleteProfile(walletAddress: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('wallet_address', walletAddress.toLowerCase());

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }

  async checkProfileExists(walletAddress: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking profile existence:', error);
      return false;
    }
  }
}

export const profileService = new ProfileService();
