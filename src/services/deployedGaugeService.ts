import { Address } from 'viem';
import {
  readContract,
  writeContract,
  simulateContract,
  getAccount,
} from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { gaugeVoterABI } from '@/contracts/abis/GaugeVoter';
import { getContractAddressFromEnv } from '@/contracts/addresses';

export interface DeployedGaugeInfo {
  address: Address;
  active: boolean;
  created: number;
  metadataURI: string;
  name: string;
  totalVotes: bigint;
}

export interface GaugeMetadata {
  name: string;
  description: string;
  type:
    | 'holiday_charity'
    | 'charity_directory'
    | 'platform_feature'
    | 'general';
  charityId?: string;
  holidayId?: string;
  createdAt: Date;
}

export interface CharityGaugeMapping {
  charityId: string;
  charityName: string;
  gaugeAddress: Address;
  votes: bigint;
  percentage: number;
}

export interface HolidayVotingResults {
  holidayId: string;
  totalVotes: bigint;
  charityMappings: CharityGaugeMapping[];
  leadingCharity?: CharityGaugeMapping;
  votingComplete: boolean;
}

export class DeployedGaugeService {
  private gaugeVoterAddress: Address;

  constructor() {
    this.gaugeVoterAddress = getContractAddressFromEnv(
      'GAUGE_VOTER_PLUGIN'
    ) as Address;
  }

  /**
   * Get all deployed gauges from the contract
   */
  async getAllDeployedGauges(): Promise<Address[]> {
    try {
      const gauges = await readContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'getAllGauges',
      });
      return gauges as Address[];
    } catch (error) {
      console.error('Error getting all deployed gauges:', error);
      throw new Error('Failed to fetch deployed gauges');
    }
  }

  /**
   * Get detailed information about a specific gauge
   */
  async getGaugeInfo(gaugeAddress: Address): Promise<DeployedGaugeInfo> {
    try {
      const [gaugeData, totalVotes] = await Promise.all([
        readContract(config, {
          address: this.gaugeVoterAddress,
          abi: gaugeVoterABI,
          functionName: 'getGauge',
          args: [gaugeAddress],
        }),
        readContract(config, {
          address: this.gaugeVoterAddress,
          abi: gaugeVoterABI,
          functionName: 'gaugeVotes',
          args: [gaugeAddress],
        }),
      ]);

      const gauge = gaugeData as {
        active: boolean;
        created: bigint;
        metadataURI: string;
      };

      // Parse metadata to get a meaningful name
      let name = `Gauge ${gaugeAddress.slice(0, 8)}...`;
      try {
        if (gauge.metadataURI) {
          const metadata = JSON.parse(gauge.metadataURI) as GaugeMetadata;
          name = metadata.name || name;
        }
      } catch {
        // Use default name if metadata parsing fails
      }

      return {
        address: gaugeAddress,
        active: gauge.active,
        created: Number(gauge.created),
        metadataURI: gauge.metadataURI,
        name,
        totalVotes: totalVotes as bigint,
      };
    } catch (error) {
      console.error('Error getting gauge info:', error);
      throw new Error(`Failed to get gauge info for ${gaugeAddress}`);
    }
  }

  /**
   * Get information for all deployed gauges
   */
  async getAllGaugeInfo(): Promise<DeployedGaugeInfo[]> {
    try {
      const gaugeAddresses = await this.getAllDeployedGauges();
      const gaugeInfoPromises = gaugeAddresses.map(address =>
        this.getGaugeInfo(address)
      );
      return await Promise.all(gaugeInfoPromises);
    } catch (error) {
      console.error('Error getting all gauge info:', error);
      throw new Error('Failed to get all gauge information');
    }
  }

  /**
   * Get only active gauges
   */
  async getActiveGauges(): Promise<DeployedGaugeInfo[]> {
    try {
      const allGauges = await this.getAllGaugeInfo();
      return allGauges.filter(gauge => gauge.active);
    } catch (error) {
      console.error('Error getting active gauges:', error);
      throw new Error('Failed to get active gauges');
    }
  }

  /**
   * Parse gauge metadata from metadataURI
   */
  parseGaugeMetadata(metadataURI: string): GaugeMetadata | null {
    try {
      if (!metadataURI) return null;
      return JSON.parse(metadataURI) as GaugeMetadata;
    } catch (error) {
      console.error('Error parsing gauge metadata:', error);
      return null;
    }
  }

  /**
   * Get gauges filtered by type
   */
  async getGaugesByType(
    type: GaugeMetadata['type']
  ): Promise<DeployedGaugeInfo[]> {
    try {
      const allGauges = await this.getActiveGauges();
      return allGauges.filter(gauge => {
        const metadata = this.parseGaugeMetadata(gauge.metadataURI);
        return metadata?.type === type;
      });
    } catch (error) {
      console.error('Error getting gauges by type:', error);
      throw new Error(`Failed to get gauges of type ${type}`);
    }
  }

  /**
   * Get holiday charity gauges for a specific holiday
   */
  async getHolidayCharityGauges(
    holidayId: string
  ): Promise<DeployedGaugeInfo[]> {
    try {
      const holidayGauges = await this.getGaugesByType('holiday_charity');
      const filtered = holidayGauges.filter(gauge => {
        const metadata = this.parseGaugeMetadata(gauge.metadataURI);
        return metadata?.holidayId === holidayId;
      });

      // Fix: Log when no gauges are found
      if (filtered.length === 0) {
        console.warn(
          `No deployed gauges found for holiday ${holidayId}. This may be expected for mock/demo proposals.`
        );
      }

      return filtered;
    } catch (error) {
      console.error('Error getting holiday charity gauges:', error);
      throw new Error(`Failed to get holiday charity gauges for ${holidayId}`);
    }
  }

  /**
   * Map charities to their corresponding gauges for holiday voting
   */
  async mapCharitiesToGauges(
    holidayId: string,
    charityIds: string[]
  ): Promise<CharityGaugeMapping[]> {
    try {
      const holidayGauges = await this.getHolidayCharityGauges(holidayId);
      const mappings: CharityGaugeMapping[] = [];

      for (const charityId of charityIds) {
        // Find gauge for this charity
        const gauge = holidayGauges.find(g => {
          const metadata = this.parseGaugeMetadata(g.metadataURI);
          return metadata?.charityId === charityId;
        });

        if (gauge) {
          mappings.push({
            charityId,
            charityName: gauge.name,
            gaugeAddress: gauge.address,
            votes: gauge.totalVotes,
            percentage: 0, // Will be calculated later
          });
        }
      }

      // Calculate percentages
      const totalVotes = mappings.reduce(
        (sum, mapping) => sum + Number(mapping.votes),
        0
      );
      if (totalVotes > 0) {
        mappings.forEach(mapping => {
          mapping.percentage = (Number(mapping.votes) / totalVotes) * 100;
        });
      }

      return mappings;
    } catch (error) {
      console.error('Error mapping charities to gauges:', error);
      throw new Error('Failed to map charities to gauges');
    }
  }

  /**
   * Get voting results for a holiday
   */
  async getHolidayVotingResults(
    holidayId: string,
    charityIds: string[]
  ): Promise<HolidayVotingResults> {
    try {
      const charityMappings = await this.mapCharitiesToGauges(
        holidayId,
        charityIds
      );
      const totalVotes = charityMappings.reduce(
        (sum, mapping) => sum + mapping.votes,
        BigInt(0)
      );

      // Fix: Handle empty array case for leading charity
      const leadingCharity =
        charityMappings.length > 0
          ? charityMappings.reduce((leader, current) =>
              current.votes > leader.votes ? current : leader
            )
          : undefined;

      return {
        holidayId,
        totalVotes,
        charityMappings,
        leadingCharity,
        votingComplete: false, // Would need additional logic to determine this
      };
    } catch (error) {
      console.error('Error getting holiday voting results:', error);
      throw new Error(`Failed to get voting results for holiday ${holidayId}`);
    }
  }

  /**
   * Check if voting is currently active
   */
  async isVotingActive(): Promise<boolean> {
    try {
      const isActive = await readContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'votingActive',
      });
      return isActive as boolean;
    } catch (error) {
      console.error('Error checking if voting is active:', error);
      return false;
    }
  }

  /**
   * Get total voting power cast across all gauges
   */
  async getTotalVotingPowerCast(): Promise<bigint> {
    try {
      const totalPower = await readContract(config, {
        address: this.gaugeVoterAddress,
        abi: gaugeVoterABI,
        functionName: 'totalVotingPowerCast',
      });
      return totalPower as bigint;
    } catch (error) {
      console.error('Error getting total voting power cast:', error);
      throw new Error('Failed to get total voting power cast');
    }
  }
}

export const deployedGaugeService = new DeployedGaugeService();
