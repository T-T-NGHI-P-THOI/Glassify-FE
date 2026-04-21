import axios from './axios.config';
import type { ApiResponse } from '../models/ApiResponse';
import type {
  RefundRequest,
  ReturnEligibility,
  CreateRefundRequestDto,
  UpdateReturnTrackingDto,
  ConfirmItemReceivedDto,
  ProcessRefundDto,
  SubmitShopAppealDto,
  RefundRequestFilter,
  ProposeRefundDto,
  ProposalResponseDto,
} from '../models/Refund';

const REFUND_BASE_URL = '/api/v1/refunds';

const ensureRefundApiSuccess = <T>(responseData: ApiResponse<T>): ApiResponse<T> => {
  if (responseData.status >= 400 || responseData.success === false) {
    throw {
      message: responseData.message,
      errors: responseData.errors,
      response: {
        data: responseData,
      },
    };
  }

  return responseData;
};

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
  return ensureRefundApiSuccess(response.data);
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

// Seller refund payout API
export const processRefund = async (
  requestId: string,
  data: ProcessRefundDto
): Promise<ApiResponse<RefundRequest>> => {
  const response = await axios.post<ApiResponse<RefundRequest>>(
    `${REFUND_BASE_URL}/${requestId}/process-refund`,
    data
  );
  return response.data;
};

export const submitShopAppeal = async (
  requestId: string,
  data: SubmitShopAppealDto
): Promise<ApiResponse<RefundRequest>> => {
  const response = await axios.post<ApiResponse<RefundRequest>>(
    `${REFUND_BASE_URL}/${requestId}/shop-appeal`,
    data
  );
  return response.data;
};

// ── Propose-Refund flow (shop → customer) ──────────────────────────────────

/**
 * Shop proposes a refund amount (partial or full) to the customer without
 * requiring item return. Only valid for REFUND_WITHOUT_RETURN admin decisions
 * at APPROVED status.
 */
export const proposeRefund = async (
  requestId: string,
  data: ProposeRefundDto
): Promise<ApiResponse<RefundRequest>> => {
  const response = await axios.post<ApiResponse<RefundRequest>>(
    `${REFUND_BASE_URL}/${requestId}/propose-refund`,
    data
  );
  return response.data;
};

/**
 * Customer accepts the shop's refund proposal.
 * Refund is processed immediately to their wallet.
 */
export const acceptProposal = async (
  requestId: string
): Promise<ApiResponse<RefundRequest>> => {
  const response = await axios.post<ApiResponse<RefundRequest>>(
    `${REFUND_BASE_URL}/${requestId}/proposal/accept`
  );
  return response.data;
};

/**
 * Customer rejects the shop's refund proposal.
 * The request proceeds to the original admin decision (RETURN_AND_REFUND).
 */
export const rejectProposal = async (
  requestId: string,
  data?: ProposalResponseDto
): Promise<ApiResponse<RefundRequest>> => {
  const response = await axios.post<ApiResponse<RefundRequest>>(
    `${REFUND_BASE_URL}/${requestId}/proposal/reject`,
    data ?? {}
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
    { params: shopId ? { shopId } : undefined }
  );
  return response.data;
};
