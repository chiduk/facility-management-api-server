import { maskEmail } from '../email/email.utils';
import { logger } from '../logger';
/**
 * @description
 * 비밀번호 - 삭제
 * 이메일 - 마스킹
 * 전화번호 - 마스킹
 * @param req
 */
const filterBody = (body: any) => {
  try {
    const filteredBody = { ...body };
    if (filteredBody?.password) delete filteredBody.password;
    if (filteredBody?.email) filteredBody.email = maskEmail(filteredBody.email);
    return filteredBody;
  } catch (e) {
    logger.error(e);
  }
};

export default filterBody;
