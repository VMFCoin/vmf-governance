import {
  supabase,
  DatabaseCharity,
  CreateCharity,
  UpdateCharity,
} from '@/lib/supabase';
import { Charity } from '@/types';

export class CharityService {
  // Convert database charity to app charity format with hardcoded metadata
  private convertToAppCharity(dbCharity: DatabaseCharity): Charity {
    return {
      id: dbCharity.id,
      name: dbCharity.name,
      website: dbCharity.website,
      logo: dbCharity.logo_url,
      mission: dbCharity.mission,
      description: dbCharity.description,

      // Hardcoded values for complex metadata
      category: 'general_support', // Default category
      impactMetrics: {
        veteransServed: 1000,
        yearsOfService: 5,
        fundingReceived: 100000,
      },
      verification: {
        is501c3: true,
        verifiedDate: new Date('2023-01-01'),
        taxId: 'XX-XXXXXXX',
      },
      tags: ['Veterans Support', 'Community Service'],
      featured: false,
      establishedYear: 2020,
      location: {
        city: 'Various',
        state: 'Nationwide',
        country: 'USA',
      },
    };
  }

  async getAllCharities(): Promise<Charity[]> {
    try {
      const { data, error } = await supabase
        .from('charities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(this.convertToAppCharity);
    } catch (error) {
      console.error('Error fetching charities:', error);
      throw error;
    }
  }

  async getCharityById(id: string): Promise<Charity | null> {
    try {
      const { data, error } = await supabase
        .from('charities')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data ? this.convertToAppCharity(data) : null;
    } catch (error) {
      console.error('Error fetching charity:', error);
      throw error;
    }
  }

  async createCharity(charityData: {
    name: string;
    website: string;
    logo: string;
    mission: string;
    description: string;
  }): Promise<Charity> {
    try {
      const dbData: CreateCharity = {
        name: charityData.name,
        website: charityData.website,
        logo_url: charityData.logo,
        mission: charityData.mission,
        description: charityData.description,
      };

      const { data, error } = await supabase
        .from('charities')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      return this.convertToAppCharity(data);
    } catch (error) {
      console.error('Error creating charity:', error);
      throw error;
    }
  }

  async updateCharity(
    id: string,
    updates: {
      name?: string;
      website?: string;
      logo?: string;
      mission?: string;
      description?: string;
    }
  ): Promise<Charity> {
    try {
      const dbUpdates: UpdateCharity = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name) dbUpdates.name = updates.name;
      if (updates.website) dbUpdates.website = updates.website;
      if (updates.logo) dbUpdates.logo_url = updates.logo;
      if (updates.mission) dbUpdates.mission = updates.mission;
      if (updates.description) dbUpdates.description = updates.description;

      const { data, error } = await supabase
        .from('charities')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.convertToAppCharity(data);
    } catch (error) {
      console.error('Error updating charity:', error);
      throw error;
    }
  }

  async deleteCharity(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('charities').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting charity:', error);
      throw error;
    }
  }

  async uploadCharityLogo(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `charities/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('charities')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('charities')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading charity logo:', error);
      throw error;
    }
  }
}

export const charityService = new CharityService();
