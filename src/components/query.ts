export type SearchParamValue = string | string[] | undefined;

export function singleParam(value: SearchParamValue): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function isOneOf<T extends readonly string[]>(value: string, values: T): value is T[number] {
  return values.includes(value);
}

export function queryWith(searchParams: Record<string, SearchParamValue>, changes: Record<string, string>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    const item = singleParam(value);
    if (item) query.set(key, item);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value) query.set(key, value);
    else query.delete(key);
  }
  const result = query.toString();
  return result ? `?${result}` : "";
}
