
export const nullify = <T extends object>(obj: T): T => {
  if (!obj) {
    return obj;
  }
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, value === undefined ? null : value])) as unknown as T;
}