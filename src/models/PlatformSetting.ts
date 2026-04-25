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

export interface PackageDimensionConfig {
  frameLengthCm: number;
  frameWidthCm: number;
  frameHeightCm: number;
  frameWeightG: number;
  lensLengthCm: number;
  lensWidthCm: number;
  lensHeightCm: number;
  lensWeightG: number;
  accessoryLengthCm: number;
  accessoryWidthCm: number;
  accessoryHeightCm: number;
  accessoryWeightG: number;
  giftLengthCm: number;
  giftWidthCm: number;
  giftHeightCm: number;
  giftWeightG: number;
  cartonSLengthCm: number;
  cartonSWidthCm: number;
  cartonSHeightCm: number;
  cartonSTareG: number;
  cartonMLengthCm: number;
  cartonMWidthCm: number;
  cartonMHeightCm: number;
  cartonMTareG: number;
  cartonLLengthCm: number;
  cartonLWidthCm: number;
  cartonLHeightCm: number;
  cartonLTareG: number;
  packingBuffer: number;
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
  packageDimensions?: PackageDimensionConfig;

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

  // Package dimension config
  pkgFrameLengthCm?: number;
  pkgFrameWidthCm?: number;
  pkgFrameHeightCm?: number;
  pkgFrameWeightG?: number;
  pkgLensLengthCm?: number;
  pkgLensWidthCm?: number;
  pkgLensHeightCm?: number;
  pkgLensWeightG?: number;
  pkgAccessoryLengthCm?: number;
  pkgAccessoryWidthCm?: number;
  pkgAccessoryHeightCm?: number;
  pkgAccessoryWeightG?: number;
  pkgGiftLengthCm?: number;
  pkgGiftWidthCm?: number;
  pkgGiftHeightCm?: number;
  pkgGiftWeightG?: number;
  pkgCartonSLengthCm?: number;
  pkgCartonSWidthCm?: number;
  pkgCartonSHeightCm?: number;
  pkgCartonSTareG?: number;
  pkgCartonMLengthCm?: number;
  pkgCartonMWidthCm?: number;
  pkgCartonMHeightCm?: number;
  pkgCartonMTareG?: number;
  pkgCartonLLengthCm?: number;
  pkgCartonLWidthCm?: number;
  pkgCartonLHeightCm?: number;
  pkgCartonLTareG?: number;
  pkgPackingBuffer?: number;
}
