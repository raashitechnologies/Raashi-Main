/**
 * DomainsProvider — shared context that fetches domain data from the API once
 * and provides it to all consumers (Header, Footer, Home, Domains, Internships, Apply).
 *
 * Falls back to static data from domains.ts if the API is unavailable.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { publicApi } from "@/lib/api";
import { domains as staticDomains, normalizeDomainsResponse, type Domain } from "@/data/domains";
import { normalizeApiError } from "@shared/lib/apiError";

interface DomainsContextValue {
  domains: Domain[];
  loading: boolean;
  error: string | null;
  /** Re-fetch domains from the API (e.g. after an admin edit) */
  refresh: () => void;
}

const DomainsContext = createContext<DomainsContextValue>({
  domains: staticDomains,
  loading: false,
  error: null,
  refresh: () => {},
});

export function useDomains(): DomainsContextValue {
  return useContext(DomainsContext);
}

export function DomainsProvider({ children }: { children: ReactNode }) {
  const [domains, setDomains] = useState<Domain[]>(staticDomains);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDomains = () => {
    setLoading(true);
    setError(null);
    publicApi
      .getDomains()
      .then((res) => {
        const normalized = normalizeDomainsResponse(res.data);
        if (normalized.length > 0) {
          setDomains(normalized);
        }
        // If API returns empty, keep static data as fallback
      })
      .catch((err) => {
        const apiError = normalizeApiError(err);
        setError(apiError.message || "Could not load domains. Showing cached data.");
        // Keep static data — don't clear domains
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  return (
    <DomainsContext.Provider value={{ domains, loading, error, refresh: fetchDomains }}>
      {children}
    </DomainsContext.Provider>
  );
}
