type MessageNotification = {
  title: string;
  body: string;
};

export type TypePushMessage = {
  CREATE_DEFECT: MessageNotification;
  ASSIGN_DEFECT: MessageNotification;
  REPAIR_DEFECT: MessageNotification;
  CONFIRM_DEFECT: MessageNotification;
};

export const residentPushMessages: TypePushMessage = {
  CREATE_DEFECT: {
    title: '새로운 하자가 등록되었습니다.',
    body: '새로운 하자가 등록되었습니다.',
  },
  ASSIGN_DEFECT: {
    title: '하자가 엽력사에 할당되었습니다.',
    body: '하자가 엽력사에 할당되었습니다.',
  },
  REPAIR_DEFECT: {
    title: '하자가 수리완료 되었습니다.',
    body: '하자가 수리 완료되었습니다.',
  },
  CONFIRM_DEFECT: {
    title: '하자 수리 서명이 완료되었습니다.',
    body: '하자 수리 서명이 완료되었습니다.',
  },
};
