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
  DEFECTIVE = 'DEFECTIVE',
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
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RETURN_SHIPPING = 'RETURN_SHIPPING',
  ITEM_RECEIVED = 'ITEM_RECEIVED',
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

export enum RefundProcessType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
}

export enum RefundReviewDecision {
  REFUND_WITHOUT_RETURN = 'REFUND_WITHOUT_RETURN',
  RETURN_AND_REFUND = 'RETURN_AND_REFUND',
  REJECT = 'REJECT',
}

export enum ShopAppealStatus {
  NONE = 'NONE',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum ShopAppealReason {
  DISAGREE_ADMIN_DECISION = 'DISAGREE_ADMIN_DECISION',
  RETURN_ITEM_PROBLEM = 'RETURN_ITEM_PROBLEM',
  NOT_RECEIVED_RETURN_ITEM = 'NOT_RECEIVED_RETURN_ITEM',
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
  returnInstruction?: string;
  shopCoverShipping?: boolean;
  itemCondition?: ItemCondition;
  itemConditionNote?: string;
  adminDecision?: RefundReviewDecision;
  // Backward compatibility for older responses
  returnInstructions?: string;
  sellerPaysShipping?: boolean;
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
  shopAppealStatus?: ShopAppealStatus;
  shopAppealReason?: ShopAppealReason;
  shopAppealDetail?: string;
  shopAppealEvidenceImages?: string[];
  shopAppealedAt?: string;
  adminAppealReviewedAt?: string;
  adminAppealReviewNote?: string;
  shopCompensationAmount?: number;
  shopCompensatedAt?: string;
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
  returnInstruction?: string;
  shopCoverShipping?: boolean;
  // Backward compatibility for older APIs
  returnInstructions?: string;
  sellerPaysShipping?: boolean;
}

export interface ConfirmItemReceivedDto {
  itemCondition: ItemCondition;
  itemConditionNote?: string;
  // Backward compatibility for older APIs
  conditionNotes?: string;
  meetsReturnCriteria: boolean;
  rejectionReason?: string;
}

export interface ProcessRefundDto {
  refundType: RefundProcessType;
  partialAmount?: number;
}

export interface SubmitShopAppealDto {
  appealReason: ShopAppealReason;
  appealDetail?: string;
  evidenceImages?: string[];
}

export interface ReviewShopAppealDto {
  approved: boolean;
  reviewNote?: string;
  compensationAmount?: number;
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
  [ReturnReason.NOT_RECEIVED]: 'Not Received',
  [ReturnReason.MISSING_ITEMS]: 'Missing Items',
  [ReturnReason.DAMAGED_IN_SHIPPING]: 'Damaged in Shipping',
  [ReturnReason.WRONG_ITEM]: 'Wrong Item',
  [ReturnReason.WRONG_COLOR]: 'Wrong Color',
  [ReturnReason.WRONG_SIZE]: 'Wrong Size',
  [ReturnReason.DEFECTIVE]: 'Defective Product',
  [ReturnReason.NOT_AS_DESCRIBED]: 'Not As Described',
  [ReturnReason.WRONG_PRESCRIPTION]: 'Wrong Prescription',
  [ReturnReason.SELLER_AGREEMENT]: 'Seller Agreement',
  [ReturnReason.CHANGED_MIND]: 'Changed Mind',
  [ReturnReason.WRONG_SELECTION]: 'Wrong Selection',
  [ReturnReason.BETTER_PRICE_FOUND]: 'Better Price Found',
  [ReturnReason.NO_LONGER_NEEDED]: 'No Longer Needed',
  [ReturnReason.OTHER]: 'Other',
};

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  [ReturnStatus.REQUESTED]: 'Requested',
  [ReturnStatus.APPROVED]: 'Approved',
  [ReturnStatus.REJECTED]: 'Rejected',
  [ReturnStatus.RETURN_SHIPPING]: 'Returning Item',
  [ReturnStatus.ITEM_RECEIVED]: 'Item Received',
  [ReturnStatus.COMPLETED]: 'Completed',
  [ReturnStatus.CANCELLED]: 'Cancelled',
};

export const REFUND_STATUS_OPTIONS: ReturnStatus[] = [
  ReturnStatus.REQUESTED,
  ReturnStatus.APPROVED,
  ReturnStatus.REJECTED,
  ReturnStatus.RETURN_SHIPPING,
  ReturnStatus.ITEM_RECEIVED,
  ReturnStatus.COMPLETED,
  ReturnStatus.CANCELLED,
];

export const ITEM_CONDITION_LABELS: Record<ItemCondition, string> = {
  [ItemCondition.EXCELLENT]: 'Excellent',
  [ItemCondition.GOOD]: 'Good',
  [ItemCondition.ACCEPTABLE]: 'Acceptable',
  [ItemCondition.DAMAGED]: 'Damaged',
  [ItemCondition.NOT_AS_RETURNED]: 'Not As Returned',
  [ItemCondition.NOT_MATCH]: 'Does Not Match Purchase',
};

export const SHOP_APPEAL_REASON_LABELS: Record<ShopAppealReason, string> = {
  [ShopAppealReason.DISAGREE_ADMIN_DECISION]: 'Disagree With Admin Decision',
  [ShopAppealReason.RETURN_ITEM_PROBLEM]: 'Returned Item Has Issues',
  [ShopAppealReason.NOT_RECEIVED_RETURN_ITEM]: 'Not Received Returned Item',
};

export const SHOP_APPEAL_STATUS_LABELS: Record<ShopAppealStatus, string> = {
  [ShopAppealStatus.NONE]: 'No Appeal',
  [ShopAppealStatus.SUBMITTED]: 'Appeal Submitted',
  [ShopAppealStatus.APPROVED]: 'Appeal Approved',
  [ShopAppealStatus.REJECTED]: 'Appeal Rejected',
  [ShopAppealStatus.EXPIRED]: 'Appeal Expired',
};
