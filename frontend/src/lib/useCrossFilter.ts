import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function useCrossFilter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const getCrossFilterUrl = useCallback(
    (name: string, value: string) => {
      return `${pathname}?${createQueryString(name, value)}`;
    },
    [pathname, createQueryString]
  );

  return { getCrossFilterUrl, createQueryString, searchParams, pathname };
}
