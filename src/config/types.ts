const allTypes = {
  resident: [],
  constructor: [],
  partner: [],
};

export const types: string[] = Object.keys(allTypes);
export const typeRights: Map<string, string[]> = new Map(Object.entries(allTypes));
