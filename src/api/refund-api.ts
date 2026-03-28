import axios from './axios.config';
import type { ApiResponse } from '../models/ApiResponse';
import type {
  RefundRequest,
  ReturnEligibility,
  CreateRefundRequestDto,
  UpdateReturnTrackingDto,
  ReviewRefundRequestDto,
  ConfirmItemReceivedDto,
  RefundRequestFilter,
} from '../models/Refund';

const REFUND_BASE_URL = '/api/v1/refunds';

// Customer APIs
export const checkReturnEligibility = async (
  orderItemId: string
): Promise<ApiResponse<ReturnEligibility>> => {
  const response = await axios.get<ApiResponse<ReturnEligibility>>(
    `${REFUND_BASE_URL}/eligibility/${orderItemId}`
  );
  return response.data;
};

export const createReturnRequest = async (
  data: CreateRefundRequestDto
): Promise<ApiResponse<RefundRequest>> => {
  const response = await axios.post<ApiResponse<RefundRequest>>(
    REFUND_BASE_URL,
    data
  );
  return response.data;
};

export const listReturnRequests = async (
  filter?: RefundRequestFilter
): Promise<ApiResponse<RefundRequest[]>> => {
  const response = await axios.get<ApiResponse<RefundRequest[]>>(
    REFUND_BASE_URL,
    { params: filter }
  );
  return response.data;
};

export const getReturnRequestDetail = async (
  requestId: string
): Promise<ApiResponse<RefundRequest>> => {
  const response = await axios.get<ApiResponse<RefundRequest>>(
    `${REFUND_BASE_URL}/${requestId}`
  );
  return response.data;
};

export const updateReturnTracking = async (
  requestId: string,
  data: UpdateReturnTrackingDto
): Promise<ApiResponse<RefundRequest>> => {
  const response = await axios.put<ApiResponse<RefundRequest>>(
    `${REFUND_BASE_URL}/${requestId}/tracking`,
    data
  );
  return response.data;
};

export const cancelReturnRequest = async (
  requestId: string
): Promise<ApiResponse<RefundRequest>> => {
  const response = await axios.delete<ApiResponse<RefundRequest>>(
    `${REFUND_BASE_URL}/${requestId}`
  );
  return response.data;
};

// Seller APIs
export const reviewReturnRequest = async (
  requestId: string,
  data: ReviewRefundRequestDto
): Promise<ApiResponse<RefundRequest>> => {
  const response = await axios.post<ApiResponse<RefundRequest>>(
    `${REFUND_BASE_URL}/${requestId}/review`,
    data
  );
  return response.data;
};

export const confirmItemReceived = async (
  requestId: string,
  data: ConfirmItemReceivedDto
): Promise<ApiResponse<RefundRequest>> => {
  const response = await axios.post<ApiResponse<RefundRequest>>(
    `${REFUND_BASE_URL}/${requestId}/confirm-received`,
    data
  );
  return response.data;
};

// Admin APIs
export const platformReview = async (
  requestId: string,
  approved: boolean,
  reason?: string
): Promise<ApiResponse<RefundRequest>> => {
  const response = await axios.post<ApiResponse<RefundRequest>>(
    `${REFUND_BASE_URL}/${requestId}/platform-review`,
    null,
    {
      params: { approved, reason },
    }
  );
  return response.data;
};

export const processRefund = async (
  requestId: string
): Promise<ApiResponse<RefundRequest>> => {
  const response = await axios.post<ApiResponse<RefundRequest>>(
    `${REFUND_BASE_URL}/${requestId}/process-refund`
  );
  return response.data;
};

export const uploadRefundEvidenceImages = async (
  requestId: string,
  files: File[]
): Promise<ApiResponse<RefundRequest>> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await axios.post<ApiResponse<RefundRequest>>(
    `${REFUND_BASE_URL}/${requestId}/evidence-images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

export const getReturnStatistics = async (
  shopId?: string
): Promise<ApiResponse<any>> => {
  const response = await axios.get<ApiResponse<any>>(
    `${REFUND_BASE_URL}/statistics`,
    { params: { shopId } }
  );
  return response.data;
};
