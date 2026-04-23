export interface PrescriptionRangeConfig {
  min: number;
  max: number;
  step: number;
  normalMin?: number;
  normalMax?: number;
  normalAbsMax?: number;
  warnAbsMax?: number;
}

export interface AxisConfig {
  min: number;
  max: number;
}

export interface PlatformSettingResponse {
  id: string;
  platformName: string;
  defaultCommissionRate: number;
  escrowHoldDays: number;
  returnWindowDays: number;
  exchangeWindowDays: number;
  minWithdrawalAmount: number;
  maxCartItemQty: number;
  maxBuyerShippingFee: number;
  freeShippingThreshold: number;

  refundNoLongerNeededMinEvidenceImages: number;
  refundSellerReminderAfterHours: number;
  refundBuyerShipmentReminderAfterDays: number;
  refundStuckShipmentWarningAfterDays: number;
  refundSellerResponseDeadlineHours: number;
  refundPartialMinPercent: number;
  refundProcessingMinDays: number;
  refundProcessingMaxDays: number;
  refundAutoApprovalWithEvidence: boolean;
  refundPlatformReviewEscalation: boolean;

  sph: PrescriptionRangeConfig;
  cyl: PrescriptionRangeConfig;
  axis: AxisConfig;
  add: PrescriptionRangeConfig;
  pd: PrescriptionRangeConfig;
  pdSplit: PrescriptionRangeConfig;
  prescriptionNote: string;

  createdAt: string;
  updatedAt: string;
}

export interface PlatformSettingUpdateRequest {
  platformName?: string;
  defaultCommissionRate?: number;
  escrowHoldDays?: number;
  returnWindowDays?: number;
  exchangeWindowDays?: number;
  minWithdrawalAmount?: number;
  maxCartItemQty?: number;
  maxBuyerShippingFee?: number;
  freeShippingThreshold?: number;

  refundNoLongerNeededMinEvidenceImages?: number;
  refundSellerReminderAfterHours?: number;
  refundBuyerShipmentReminderAfterDays?: number;
  refundStuckShipmentWarningAfterDays?: number;
  refundSellerResponseDeadlineHours?: number;
  refundPartialMinPercent?: number;
  refundProcessingMinDays?: number;
  refundProcessingMaxDays?: number;
  refundAutoApprovalWithEvidence?: boolean;
  refundPlatformReviewEscalation?: boolean;

  sphMin?: number;
  sphMax?: number;
  sphStep?: number;
  sphNormalAbsMax?: number;
  sphWarnAbsMax?: number;

  cylMin?: number;
  cylMax?: number;
  cylStep?: number;
  cylNormalAbsMax?: number;
  cylWarnAbsMax?: number;

  axisMin?: number;
  axisMax?: number;

  addMin?: number;
  addMax?: number;
  addStep?: number;
  addNormalMin?: number;
  addNormalMax?: number;

  pdMin?: number;
  pdMax?: number;
  pdStep?: number;
  pdNormalMin?: number;
  pdNormalMax?: number;

  pdSplitMin?: number;
  pdSplitMax?: number;
  pdSplitStep?: number;
  pdSplitNormalMin?: number;
  pdSplitNormalMax?: number;

  prescriptionNote?: string;
}
