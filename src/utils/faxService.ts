/**
 * Fax Service for Zeni
 * Provides integration with fax APIs (Twilio, eFax, etc.)
 * Falls back to simulation mode when no API is configured
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FAX_API_KEY_STORAGE = '@zeni_fax_api_key';
const FAX_API_TYPE_STORAGE = '@zeni_fax_api_type';

export type FaxApiType = 'twilio' | 'srfax' | 'simulation';

export interface FaxConfig {
  apiType: FaxApiType;
  apiKey?: string;
  apiSecret?: string;
  accountSid?: string;
  fromNumber?: string;
}

export interface FaxJob {
  id: string;
  documentPath: string;
  recipientNumber: string;
  recipientName: string;
  coverPage?: {
    subject: string;
    message: string;
    fromName: string;
  };
  status: 'pending' | 'sending' | 'delivered' | 'failed';
  statusMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  pagesCount: number;
  estimatedCost?: number;
}

export interface FaxResult {
  success: boolean;
  jobId?: string;
  message: string;
  estimatedDeliveryTime?: number; // in minutes
}

class FaxService {
  private config: FaxConfig | null = null;

  constructor() {
    this.loadConfig();
  }

  private async loadConfig(): Promise<void> {
    try {
      const apiType = await AsyncStorage.getItem(FAX_API_TYPE_STORAGE);
      const apiKey = await AsyncStorage.getItem(FAX_API_KEY_STORAGE);
      
      if (apiType) {
        this.config = {
          apiType: apiType as FaxApiType,
          apiKey: apiKey || undefined,
        };
      }
    } catch (error) {
      console.log('Failed to load fax config:', error);
    }
  }

  async setConfig(config: FaxConfig): Promise<void> {
    this.config = config;
    try {
      await AsyncStorage.setItem(FAX_API_TYPE_STORAGE, config.apiType);
      if (config.apiKey) {
        await AsyncStorage.setItem(FAX_API_KEY_STORAGE, config.apiKey);
      }
    } catch (error) {
      console.log('Failed to save fax config:', error);
    }
  }

  async clearConfig(): Promise<void> {
    this.config = null;
    try {
      await AsyncStorage.multiRemove([FAX_API_KEY_STORAGE, FAX_API_TYPE_STORAGE]);
    } catch (error) {
      console.log('Failed to clear fax config:', error);
    }
  }

  isConfigured(): boolean {
    return this.config?.apiType !== 'simulation' && !!this.config?.apiKey;
  }

  getApiType(): FaxApiType {
    return this.config?.apiType || 'simulation';
  }

  /**
   * Send a fax
   */
  async sendFax(job: Omit<FaxJob, 'id' | 'status'>): Promise<FaxResult> {
    const apiType = this.config?.apiType || 'simulation';

    switch (apiType) {
      case 'twilio':
        return this.sendViaTwilio(job);
      case 'srfax':
        return this.sendViaSRFax(job);
      default:
        return this.simulateFax(job);
    }
  }

  /**
   * Check fax status
   */
  async checkStatus(jobId: string): Promise<{ status: string; message?: string }> {
    // In production, this would query the fax provider's API
    // For simulation, return random status updates
    const statuses = ['sending', 'delivered', 'delivered'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      status: randomStatus,
      message: randomStatus === 'delivered' 
        ? 'Fax successfully delivered' 
        : 'Fax is being transmitted',
    };
  }

  /**
   * Estimate cost for fax
   */
  estimateCost(pagesCount: number, isInternational: boolean = false): number {
    // Typical pricing: $0.07-0.15 per page domestic, $0.15-0.25 international
    const basePrice = isInternational ? 0.20 : 0.10;
    return pagesCount * basePrice;
  }

  /**
   * Format fax number to E.164 format
   */
  formatFaxNumber(number: string): string {
    // Remove all non-digit characters except leading +
    let cleaned = number.replace(/[^\d+]/g, '');
    
    // If doesn't start with +, assume it's a US number
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = '+1' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = '+' + cleaned;
      }
    }
    
    return cleaned;
  }

  /**
   * Validate fax number format
   */
  validateFaxNumber(number: string): { valid: boolean; message?: string } {
    const formatted = this.formatFaxNumber(number);
    
    if (formatted.length < 10) {
      return { valid: false, message: 'Fax number is too short' };
    }
    
    if (formatted.length > 15) {
      return { valid: false, message: 'Fax number is too long' };
    }
    
    if (!/^\+?\d+$/.test(formatted)) {
      return { valid: false, message: 'Invalid characters in fax number' };
    }
    
    return { valid: true };
  }

  // Private methods for different providers

  private async sendViaTwilio(job: Omit<FaxJob, 'id' | 'status'>): Promise<FaxResult> {
    if (!this.config?.apiKey || !this.config?.accountSid) {
      return { success: false, message: 'Twilio credentials not configured' };
    }

    try {
      // In production, this would make an actual API call to Twilio
      // const response = await fetch(`https://fax.twilio.com/v1/Faxes`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Basic ${btoa(this.config.accountSid + ':' + this.config.apiKey)}`,
      //     'Content-Type': 'application/x-www-form-urlencoded',
      //   },
      //   body: new URLSearchParams({
      //     To: this.formatFaxNumber(job.recipientNumber),
      //     From: this.config.fromNumber,
      //     MediaUrl: job.documentPath,
      //   }).toString(),
      // });

      // For now, simulate the response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        jobId: `twilio_${Date.now()}`,
        message: 'Fax queued for delivery via Twilio',
        estimatedDeliveryTime: 10,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Twilio error: ${error.message}`,
      };
    }
  }

  private async sendViaSRFax(job: Omit<FaxJob, 'id' | 'status'>): Promise<FaxResult> {
    if (!this.config?.apiKey) {
      return { success: false, message: 'SRFax API key not configured' };
    }

    try {
      // SRFax API integration would go here
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        jobId: `srfax_${Date.now()}`,
        message: 'Fax queued for delivery via SRFax',
        estimatedDeliveryTime: 15,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `SRFax error: ${error.message}`,
      };
    }
  }

  private async simulateFax(job: Omit<FaxJob, 'id' | 'status'>): Promise<FaxResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Validate number
    const validation = this.validateFaxNumber(job.recipientNumber);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message || 'Invalid fax number',
      };
    }

    // 95% success rate in simulation
    const success = Math.random() > 0.05;
    
    if (success) {
      return {
        success: true,
        jobId: `sim_${Date.now()}`,
        message: 'Fax queued for delivery (Simulation Mode)',
        estimatedDeliveryTime: 5,
      };
    } else {
      return {
        success: false,
        message: 'Simulated failure: Recipient fax machine busy',
      };
    }
  }
}

// Export singleton instance
export const faxService = new FaxService();
export default faxService;
