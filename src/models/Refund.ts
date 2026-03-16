export enum ReturnType {
  REFUND = 'REFUND',
  EXCHANGE = 'EXCHANGE',
}

export enum ReturnReason {
  NOT_RECEIVED = 'NOT_RECEIVED',
  MISSING_ITEMS = 'MISSING_ITEMS',
  DAMAGED_IN_SHIPPING = 'DAMAGED_IN_SHIPPING',
  WRONG_ITEM = 'WRONG_ITEM',
  WRONG_COLOR = 'WRONG_COLOR',
  WRONG_SIZE = 'WRONG_SIZE',
  DEFECTIVE_LENS = 'DEFECTIVE_LENS',
  NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
  WRONG_PRESCRIPTION = 'WRONG_PRESCRIPTION',
  SELLER_AGREEMENT = 'SELLER_AGREEMENT',
  CHANGED_MIND = 'CHANGED_MIND',
  WRONG_SELECTION = 'WRONG_SELECTION',
  BETTER_PRICE_FOUND = 'BETTER_PRICE_FOUND',
  NO_LONGER_NEEDED = 'NO_LONGER_NEEDED',
  OTHER = 'OTHER',
}

export enum ReturnStatus {
  REQUESTED = 'REQUESTED',
  SELLER_REVIEWING = 'SELLER_REVIEWING',
  PLATFORM_REVIEWING = 'PLATFORM_REVIEWING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RETURN_SHIPPING = 'RETURN_SHIPPING',
  ITEM_RECEIVED = 'ITEM_RECEIVED',
  REFUNDING = 'REFUNDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ItemCondition {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  ACCEPTABLE = 'ACCEPTABLE',
  DAMAGED = 'DAMAGED',
  NOT_AS_RETURNED = 'NOT_AS_RETURNED',
  NOT_MATCH = 'NOT_MATCH',
}

export enum DisputeDecision {
  APPROVE_BUYER = 'APPROVE_BUYER',
  APPROVE_SELLER = 'APPROVE_SELLER',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
}

export interface RefundRequest {
  id: string;
  requestNumber: string;
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  productName: string;
  productSku: string;
  productImageUrl?: string;
  shopId: string;
  shopName: string;
  userId: string;
  returnType: ReturnType;
  reason: ReturnReason;
  reasonDetail?: string;
  evidenceImages: string[];
  quantity: number;
  refundAmount: number;
  exchangeVariantInfo?: string;
  exchangePriceDiff?: number;
  returnTrackingNumber?: string;
  returnCarrier?: string;
  returnInstructions?: string;
  sellerPaysShipping?: boolean;
  itemCondition?: ItemCondition;
  conditionNotes?: string;
  status: ReturnStatus;
  statusDisplay: string;
  requestedAt: string;
  approvedAt?: string;
  itemReceivedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  completedAt?: string;
  sellerResponsible: boolean;
  autoApprovalEligible: boolean;
  returnWindowRemaining?: number;
  hasDispute?: boolean;
  adminNotes?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
}

export interface ReturnEligibility {
  eligible: boolean;
  ineligibilityReason?: string;
  daysRemaining?: number;
  hoursRemaining?: number;
  returnDeadline?: string;
  isPrescriptionProduct: boolean;
  hasBeenUsed: boolean;
  accessoriesComplete: boolean;
  maxRefundAmount: number;
  shippingRefundable: boolean;
}

export interface CreateRefundRequestDto {
  orderItemId: string;
  returnType: ReturnType;
  reason: ReturnReason;
  reasonDetail?: string;
  quantity: number;
  evidenceImages: string[];
  exchangeVariantId?: string;
}

export interface UpdateReturnTrackingDto {
  trackingNumber: string;
  carrier?: string;
  notes?: string;
}

export interface ReviewRefundRequestDto {
  approved: boolean;
  rejectionReason?: string;
  returnInstructions?: string;
  sellerPaysShipping?: boolean;
}

export interface ConfirmItemReceivedDto {
  itemCondition: ItemCondition;
  conditionNotes?: string;
  meetsReturnCriteria: boolean;
  rejectionReason?: string;
}

export interface PlatformReviewDto {
  decision: DisputeDecision;
  adminNotes: string;
  finalRefundAmount?: number;
}

export interface ProcessRefundDto {
  refundMethod: string;
  refundNotes?: string;
}

export interface RefundRequestFilter {
  page?: number;
  unitPerPage?: number;
  userId?: string;
  shopId?: string;
  orderId?: string;
  status?: ReturnStatus;
  returnType?: ReturnType;
  requestNumber?: string;
  orderNumber?: string;
  requestedAfter?: string;
  requestedBefore?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  [ReturnReason.NOT_RECEIVED]: 'Chưa nhận được hàng',
  [ReturnReason.MISSING_ITEMS]: 'Thiếu sản phẩm',
  [ReturnReason.DAMAGED_IN_SHIPPING]: 'Hỏng trong quá trình vận chuyển',
  [ReturnReason.WRONG_ITEM]: 'Sản phẩm sai',
  [ReturnReason.WRONG_COLOR]: 'Sai màu',
  [ReturnReason.WRONG_SIZE]: 'Sai kích thước',
  [ReturnReason.DEFECTIVE_LENS]: 'Tròng kính bị lỗi',
  [ReturnReason.NOT_AS_DESCRIBED]: 'Không đúng mô tả',
  [ReturnReason.WRONG_PRESCRIPTION]: 'Sai độ kính',
  [ReturnReason.SELLER_AGREEMENT]: 'Thỏa thuận với người bán',
  [ReturnReason.CHANGED_MIND]: 'Đổi ý',
  [ReturnReason.WRONG_SELECTION]: 'Chọn nhầm',
  [ReturnReason.BETTER_PRICE_FOUND]: 'Tìm thấy giá tốt hơn',
  [ReturnReason.NO_LONGER_NEEDED]: 'Không còn cần nữa',
  [ReturnReason.OTHER]: 'Lý do khác',
};

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  [ReturnStatus.REQUESTED]: 'Đã yêu cầu',
  [ReturnStatus.SELLER_REVIEWING]: 'Người bán đang xem xét',
  [ReturnStatus.PLATFORM_REVIEWING]: 'Nền tảng đang xem xét',
  [ReturnStatus.APPROVED]: 'Đã chấp thuận',
  [ReturnStatus.REJECTED]: 'Đã từ chối',
  [ReturnStatus.RETURN_SHIPPING]: 'Đang gửi trả hàng',
  [ReturnStatus.ITEM_RECEIVED]: 'Đã nhận hàng trả',
  [ReturnStatus.REFUNDING]: 'Đang hoàn tiền',
  [ReturnStatus.COMPLETED]: 'Hoàn tất',
  [ReturnStatus.CANCELLED]: 'Đã hủy',
};

export const REFUND_STATUS_OPTIONS: ReturnStatus[] = [
  ReturnStatus.REQUESTED,
  ReturnStatus.SELLER_REVIEWING,
  ReturnStatus.PLATFORM_REVIEWING,
  ReturnStatus.APPROVED,
  ReturnStatus.REJECTED,
  ReturnStatus.RETURN_SHIPPING,
  ReturnStatus.ITEM_RECEIVED,
  ReturnStatus.REFUNDING,
  ReturnStatus.COMPLETED,
  ReturnStatus.CANCELLED,
];

export const ITEM_CONDITION_LABELS: Record<ItemCondition, string> = {
  [ItemCondition.EXCELLENT]: 'Xuất sắc',
  [ItemCondition.GOOD]: 'Tốt',
  [ItemCondition.ACCEPTABLE]: 'Chấp nhận được',
  [ItemCondition.DAMAGED]: 'Hư hỏng',
  [ItemCondition.NOT_AS_RETURNED]: 'Không như hàng trả',
  [ItemCondition.NOT_MATCH]: 'Không khớp với hàng đã mua',
};
