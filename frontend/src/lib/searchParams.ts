export type RawSearchParams = Record<string, string | string[] | undefined>;

export function flattenSearchParams(params: RawSearchParams | undefined): Record<string, string> {
  if (!params) return {};
  return Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) => {
      const flattened = Array.isArray(value) ? value[0] : value;
      return flattened === undefined ? [] : [[key, flattened]];
    }),
  );
}

