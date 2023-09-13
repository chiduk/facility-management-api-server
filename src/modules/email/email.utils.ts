// eslint-disable-next-line import/prefer-default-export
export const maskEmail = (email: string): string => {
  const atIndex = email.indexOf('@');
  let username = email.slice(0, atIndex);
  if (username.length === 1) {
    // username이 1글자이면 그냥 다 마스킹
    username.replace(/./g, '*');
  } else if (username.length === 2) {
    // username이 2글자이면 마지막글자 마스킹
    username = `${username.slice(0, 0)}*`;
  } else if (username.length > 2) {
    // username이 2글자 초과하면 앞 2글자 제외 모두 마스킹
    username = `${username.slice(0, 2)}${username.slice(2).replace(/./g, '*')}`;
  }
  let domain = email.slice(atIndex);
  // domain은 첫글자와 마지막글자 제외 모두 마스킹
  domain = `${domain.slice(1, 2)}${domain.slice(2, domain.length - 2).replace(/./g, '*')}${domain.slice(domain.length - 1)}`;
  return `${username}@${domain}`;
};
