export interface Prescription {
  id: string;
  userId: string;
  name: string;
  sphR: number;
  cylR: number;
  axisR: number;
  sphL: number;
  cylL: number;
  axisL: number;
  pdSingle: number;
  pdLeft: number;
  pdRight: number;
  addPower: number;
  prescriptionDate: string;
  imageUrl: string;
  isDefault: boolean;
  prescriptionUsage: 'DISTANCE' | 'READING' | 'COMPUTER' | 'OTHER';
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrescriptionData {
  name: string;
  sphR: number;
  cylR: number;
  axisR: number;
  sphL: number;
  cylL: number;
  axisL: number;
  pdSingle?: number;
  pdLeft?: number;
  pdRight?: number;
  addPower?: number;
  prescriptionDate: string;
  imageUrl?: string;
  isDefault?: boolean;
  prescriptionUsage: 'DISTANCE' | 'READING' | 'COMPUTER' | 'OTHER';
}

export interface UpdatePrescriptionData extends Partial<CreatePrescriptionData> {
  id: string;
}
