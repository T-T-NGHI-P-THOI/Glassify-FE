import { useState, useEffect } from 'react';
import PrescriptionAPI from '../api/prescription-api';
import type { Prescription, CreatePrescriptionData } from '../models/Prescription';

export const usePrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PrescriptionAPI.getMyPrescriptions();
      setPrescriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const createPrescription = async (data: CreatePrescriptionData) => {
    setLoading(true);
    setError(null);
    try {
      const newPrescription = await PrescriptionAPI.createPrescription(data);
      setPrescriptions(prev => [...prev, newPrescription]);
      return newPrescription;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prescription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePrescription = async (id: string, data: Partial<CreatePrescriptionData>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedPrescription = await PrescriptionAPI.updatePrescription(id, data);
      setPrescriptions(prev =>
        prev.map(p => (p.id === id ? updatedPrescription : p))
      );
      return updatedPrescription;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prescription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePrescription = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await PrescriptionAPI.deletePrescription(id);
      setPrescriptions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prescription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setDefaultPrescription = async (id: string, data: Partial<CreatePrescriptionData>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedPrescription = await PrescriptionAPI.updatePrescription(id, data);
      setPrescriptions(prev =>
        prev.map(p => ({
          ...p,
          isDefault: p.id === id ? true : false
        }))
      );
      return updatedPrescription;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default prescription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  return {
    prescriptions,
    loading,
    error,
    fetchPrescriptions,
    createPrescription,
    updatePrescription,
    deletePrescription,
    setDefaultPrescription,
  };
};
