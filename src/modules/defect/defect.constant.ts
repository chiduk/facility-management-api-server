export enum DefectStatus {
  PARTNER_ASSIGNED = 'PARTNER_ASSIGNED',
  PARTNER_NOT_ASSIGNED = 'PARTNER_NOT_ASSIGNED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED',
  SCHEDULED = 'SCHEDULED',
  REPAIRED = 'REPAIRED',
  CONFIRMED = 'CONFIRMED',
}

export interface IDefectContractorStatus {
  PARTNER_NOT_ASSIGNED: Array<DefectStatus>;
  NOT_PROCESSED: Array<DefectStatus>;
  IN_PROGRESS: Array<DefectStatus>;
  REJECTED: Array<DefectStatus>;
  REPAIRED: Array<DefectStatus>;
  CONFIRMED: Array<DefectStatus>;
}

interface IDefectPartnerAdminStatus {
  NOT_PROCESSED: Array<DefectStatus>;
  IN_PROGRESS: Array<DefectStatus>;
  REJECTED: Array<DefectStatus>;
  REPAIRED: Array<DefectStatus>;
  CONFIRMED: Array<DefectStatus>;
  REJECT_AVAILABLE: Array<DefectStatus>;
}

export interface IDefectResidentStatus {
  NOT_PROCESSED: Array<DefectStatus>;
  IN_PROGRESS: Array<DefectStatus>;
  REPAIRED: Array<DefectStatus>;
  CONFIRMED: Array<DefectStatus>;
  CANCEL_AVAILABLE: Array<DefectStatus>;
}

interface IDefectPartnerEngineerStatus {
  NOT_PROCESSED: Array<DefectStatus>;
  REPAIRED: Array<DefectStatus>;
  REJECTED: Array<DefectStatus>;
  REJECT_AVAILABLE: Array<DefectStatus>;
  ENGINEER_ASSIGNED: Array<DefectStatus>;
  ENGINEER_DONE: Array<DefectStatus>;
}

export const DEFECT_RESIDENT_STATUS: IDefectResidentStatus = {
  NOT_PROCESSED: [DefectStatus.PARTNER_NOT_ASSIGNED, DefectStatus.PARTNER_ASSIGNED, DefectStatus.REJECTED],
  IN_PROGRESS: [DefectStatus.SCHEDULED],
  REPAIRED: [DefectStatus.REPAIRED],
  CONFIRMED: [DefectStatus.CONFIRMED],
  CANCEL_AVAILABLE: [DefectStatus.PARTNER_NOT_ASSIGNED, DefectStatus.PARTNER_ASSIGNED, DefectStatus.REJECTED],
};

export const DEFECT_PARTNER_ADMIN_STATUS: IDefectPartnerAdminStatus = {
  NOT_PROCESSED: [DefectStatus.PARTNER_ASSIGNED],
  IN_PROGRESS: [DefectStatus.SCHEDULED],
  REJECTED: [DefectStatus.REJECTED],
  REPAIRED: [DefectStatus.REPAIRED],
  CONFIRMED: [DefectStatus.CONFIRMED],
  REJECT_AVAILABLE: [DefectStatus.PARTNER_ASSIGNED, DefectStatus.SCHEDULED],
};

export const DEFECT_PARTNER_ENGINEER_STATUS: IDefectPartnerEngineerStatus = {
  NOT_PROCESSED: [DefectStatus.SCHEDULED],
  REPAIRED: [DefectStatus.REPAIRED, DefectStatus.CONFIRMED],
  REJECTED: [DefectStatus.REJECTED],
  REJECT_AVAILABLE: [DefectStatus.SCHEDULED],
  ENGINEER_ASSIGNED: [DefectStatus.SCHEDULED, DefectStatus.REPAIRED, DefectStatus.CONFIRMED],
  ENGINEER_DONE: [DefectStatus.REPAIRED, DefectStatus.CONFIRMED],
};

export const DEFECT_CONTRACTOR_STATUS: IDefectContractorStatus = {
  PARTNER_NOT_ASSIGNED: [DefectStatus.PARTNER_NOT_ASSIGNED],
  NOT_PROCESSED: [DefectStatus.PARTNER_ASSIGNED],
  IN_PROGRESS: [DefectStatus.SCHEDULED],
  REJECTED: [DefectStatus.REJECTED],
  REPAIRED: [DefectStatus.REPAIRED],
  CONFIRMED: [DefectStatus.CONFIRMED],
};

export const DEFECT_PSPACE_STATUS: IDefectContractorStatus = {
  PARTNER_NOT_ASSIGNED: [DefectStatus.PARTNER_NOT_ASSIGNED],
  NOT_PROCESSED: [DefectStatus.PARTNER_ASSIGNED],
  IN_PROGRESS: [DefectStatus.SCHEDULED],
  REJECTED: [DefectStatus.REJECTED],
  REPAIRED: [DefectStatus.REPAIRED],
  CONFIRMED: [DefectStatus.CONFIRMED],
};

export enum ResidentDefectStatusKorean {
  NOT_PROCESSED = '미처리',
  IN_PROGRESS = '처리중',
  REPAIRED = '수리완료',
  CONFIRMED = '서명 완료',
}

export const convertDefectStatusToResidentKorean = (status: DefectStatus) => {
  switch (status) {
    case DefectStatus.PARTNER_NOT_ASSIGNED:
    case DefectStatus.PARTNER_ASSIGNED:
    case DefectStatus.REJECTED:
      return ResidentDefectStatusKorean.NOT_PROCESSED;
    case DefectStatus.SCHEDULED:
      return ResidentDefectStatusKorean.IN_PROGRESS;
    case DefectStatus.REPAIRED:
      return ResidentDefectStatusKorean.REPAIRED;
    case DefectStatus.CONFIRMED:
      return ResidentDefectStatusKorean.CONFIRMED;
    default:
      throw new Error('Invalid defect status.');
  }
};
