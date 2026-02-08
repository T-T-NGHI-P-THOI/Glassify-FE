import api from './axios.config';
import { API_ENDPOINTS } from './endpoints';
import type { Prescription, CreatePrescriptionData, UpdatePrescriptionData } from '../models/Prescription';

// API Response type
export interface PrescriptionApiResponse {
  status: number;
  message: string;
  data: Prescription[];
  errors: string[] | null;
}

export interface SinglePrescriptionApiResponse {
  status: number;
  message: string;
  data: Prescription;
  errors: string[] | null;
}

export default class PrescriptionAPI {
  /**
   * Get all prescriptions for the current user
   */
  static async getMyPrescriptions(): Promise<Prescription[]> {
    try {
      const response = await api.get<PrescriptionApiResponse>(
        API_ENDPOINTS.PRESCRIPTIONS.GET_MY_PRESCRIPTIONS
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user prescriptions:', error);
      throw error;
    }
  }

  /**
   * Create a new prescription
   */
  static async createPrescription(data: CreatePrescriptionData): Promise<Prescription> {
    try {
      const response = await api.post<SinglePrescriptionApiResponse>(
        API_ENDPOINTS.PRESCRIPTIONS.CREATE,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }
  }

  /**
   * Update an existing prescription
   */
  static async updatePrescription(id: string, data: Partial<CreatePrescriptionData>): Promise<Prescription> {
    try {
      const response = await api.put<SinglePrescriptionApiResponse>(
        API_ENDPOINTS.PRESCRIPTIONS.UPDATE(id),
        data
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating prescription ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a prescription
   */
  static async deletePrescription(id: string): Promise<void> {
    try {
      await api.delete(API_ENDPOINTS.PRESCRIPTIONS.DELETE(id));
    } catch (error) {
      console.error(`Error deleting prescription ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get a single prescription by ID
   */
  static async getPrescriptionById(id: string): Promise<Prescription> {
    try {
      const response = await api.get<SinglePrescriptionApiResponse>(
        API_ENDPOINTS.PRESCRIPTIONS.GET_BY_ID(id)
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching prescription ${id}:`, error);
      throw error;
    }
  }
}
