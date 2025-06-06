import {
  supabase,
  DatabaseCharity,
  CreateCharity,
  UpdateCharity,
} from '@/lib/supabase';
import { Charity, CharityCategory } from '@/types';

export class CharityService {
  // Input validation helper
  private validateInput(input: string, maxLength: number = 255): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Trim whitespace and limit length
    const sanitized = input.trim().slice(0, maxLength);

    // Basic XSS prevention - remove script tags and javascript: protocols
    return sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '');
  }

  // URL validation helper
  private validateUrl(url: string): string {
    if (!url) return '';

    const sanitized = this.validateInput(url, 500);

    // Ensure URL starts with http:// or https://
    if (sanitized && !sanitized.match(/^https?:\/\//)) {
      return `https://${sanitized}`;
    }

    return sanitized;
  }

  // Email validation helper
  private validateEmail(email: string): string {
    const sanitized = this.validateInput(email, 255);

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (sanitized && !emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }

    return sanitized;
  }

  // Mock data generator for missing fields
  private generateMockMetadata(id: number): {
    category: CharityCategory;
    impactMetrics: {
      veteransServed: number;
      yearsOfService: number;
      fundingReceived: number;
    };
    verification: {
      is501c3: boolean;
      verifiedDate: Date;
      taxId?: string;
    };
    tags: string[];
    featured: boolean;
    establishedYear: number;
    location: {
      city: string;
      state: string;
      country: string;
    };
  } {
    // Use ID to generate consistent mock data
    const categories: CharityCategory[] = [
      'disabled_veterans',
      'military_families',
      'veteran_housing',
      'mental_health',
      'education',
      'employment',
      'general_support',
    ];

    const seed = id % 100;

    return {
      category: categories[seed % categories.length],
      impactMetrics: {
        veteransServed: 500 + seed * 100,
        yearsOfService: 3 + (seed % 15),
        fundingReceived: 50000 + seed * 10000,
      },
      verification: {
        is501c3: seed % 10 !== 0, // 90% verified
        verifiedDate: new Date(2020 + (seed % 4), seed % 12, 1),
        taxId: `${(seed + 10).toString().padStart(2, '0')}-${(seed * 7).toString().padStart(7, '0')}`,
      },
      tags: [
        'Veterans Support',
        'Community Service',
        seed % 3 === 0 ? 'Mental Health' : 'Family Support',
        seed % 4 === 0 ? 'Housing' : 'Education',
      ].slice(0, 2 + (seed % 3)),
      featured: seed % 5 === 0, // 20% featured
      establishedYear: 2010 + (seed % 14),
      location: {
        city: seed % 3 === 0 ? 'Various' : 'Regional',
        state: seed % 2 === 0 ? 'Nationwide' : 'Multi-State',
        country: 'USA',
      },
    };
  }

  // Convert database charity to app charity format with mock metadata
  private convertToAppCharity(dbCharity: DatabaseCharity): Charity {
    const mockData = this.generateMockMetadata(dbCharity.id);

    return {
      id: dbCharity.id.toString(),
      name: dbCharity.name || 'Unknown Charity',
      website: dbCharity.website_url || '',
      logo: dbCharity.logo_url || '/images/charities/default-charity.svg',
      mission:
        dbCharity.description || 'Supporting veterans and their families',
      description: dbCharity.description || 'No description available',

      // Mock data for missing fields
      ...mockData,
    };
  }

  async getAllCharities(
    page = 1,
    limit = 20
  ): Promise<{
    charities: Charity[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('charities')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const charities = (data || []).map(charity =>
        this.convertToAppCharity(charity)
      );
      const totalCount = count || 0;
      const hasMore = totalCount > page * limit;

      return {
        charities,
        totalCount,
        hasMore,
      };
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
        .eq('id', parseInt(id))
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
    description: string;
    website_url: string;
    logo_url: string;
    contact_email: string;
    charity_address?: string;
  }): Promise<Charity> {
    try {
      // Validate and sanitize input data
      const dbData: CreateCharity = {
        name: this.validateInput(charityData.name, 255),
        description: this.validateInput(charityData.description, 1000),
        website_url: this.validateUrl(charityData.website_url),
        logo_url: this.validateUrl(charityData.logo_url),
        contact_email: this.validateEmail(charityData.contact_email),
        charity_address: charityData.charity_address
          ? this.validateInput(charityData.charity_address, 500)
          : undefined,
      };

      // Additional validation
      if (!dbData.name) {
        throw new Error('Charity name is required');
      }
      if (!dbData.description) {
        throw new Error('Charity description is required');
      }
      if (!dbData.contact_email) {
        throw new Error('Contact email is required');
      }

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
      description?: string;
      website_url?: string;
      logo_url?: string;
      contact_email?: string;
      charity_address?: string;
    }
  ): Promise<Charity> {
    try {
      // Validate ID
      const numericId = parseInt(id);
      if (isNaN(numericId) || numericId <= 0) {
        throw new Error('Invalid charity ID');
      }

      // Validate and sanitize update data
      const sanitizedUpdates: any = {};

      if (updates.name !== undefined) {
        sanitizedUpdates.name = this.validateInput(updates.name, 255);
        if (!sanitizedUpdates.name) {
          throw new Error('Charity name cannot be empty');
        }
      }

      if (updates.description !== undefined) {
        sanitizedUpdates.description = this.validateInput(
          updates.description,
          1000
        );
      }

      if (updates.website_url !== undefined) {
        sanitizedUpdates.website_url = this.validateUrl(updates.website_url);
      }

      if (updates.logo_url !== undefined) {
        sanitizedUpdates.logo_url = this.validateUrl(updates.logo_url);
      }

      if (updates.contact_email !== undefined) {
        sanitizedUpdates.contact_email = this.validateEmail(
          updates.contact_email
        );
      }

      if (updates.charity_address !== undefined) {
        sanitizedUpdates.charity_address = updates.charity_address
          ? this.validateInput(updates.charity_address, 500)
          : null;
      }

      const { data, error } = await supabase
        .from('charities')
        .update(sanitizedUpdates)
        .eq('id', numericId)
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
      const { error } = await supabase
        .from('charities')
        .delete()
        .eq('id', parseInt(id));

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting charity:', error);
      throw error;
    }
  }

  async searchCharities(
    query: string,
    page = 1,
    limit = 20
  ): Promise<{
    charities: Charity[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      // Validate and sanitize search query
      const sanitizedQuery = this.validateInput(query, 100);

      // Prevent empty or too short queries
      if (!sanitizedQuery || sanitizedQuery.length < 2) {
        return {
          charities: [],
          totalCount: 0,
          hasMore: false,
        };
      }

      // Validate pagination parameters
      const safePage = Math.max(1, Math.floor(page));
      const safeLimit = Math.min(100, Math.max(1, Math.floor(limit))); // Cap at 100 items per page

      const from = (safePage - 1) * safeLimit;
      const to = from + safeLimit - 1;

      const { data, error, count } = await supabase
        .from('charities')
        .select('*', { count: 'exact' })
        .or(
          `name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`
        )
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const charities = (data || []).map(charity =>
        this.convertToAppCharity(charity)
      );
      const totalCount = count || 0;
      const hasMore = totalCount > safePage * safeLimit;

      return {
        charities,
        totalCount,
        hasMore,
      };
    } catch (error) {
      console.error('Error searching charities:', error);
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
