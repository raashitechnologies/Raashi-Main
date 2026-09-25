import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { publicApi } from "@/lib/api";
import { normalizeApiError } from "@shared/lib/apiError";

export interface ContentSection {
  section_key: string;
  title: string;
  content: Record<string, any>;
}

interface ContentContextValue {
  content: Record<string, ContentSection>;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  getContent: (key: string) => Record<string, any> | null;
}

const ContentContext = createContext<ContentContextValue>({
  content: {},
  loading: false,
  error: null,
  refresh: () => {},
  getContent: () => null,
});

export function useContentContext() {
  return useContext(ContentContext);
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Record<string, ContentSection>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = () => {
    setLoading(true);
    publicApi
      .getPublishedContent()
      .then((res) => {
        const sections = res.data?.sections;
        const contentMap: Record<string, ContentSection> = {};

        if (sections && typeof sections === "object" && !Array.isArray(sections)) {
          // API returns a keyed dictionary: { "about_page": { title, content, updated_at }, ... }
          Object.entries(sections).forEach(([key, val]: [string, any]) => {
            contentMap[key] = {
              section_key: key,
              title: val.title,
              content: val.content || {},
            };
          });
        } else if (Array.isArray(sections)) {
          // Fallback: array format
          sections.forEach((s: ContentSection) => {
            contentMap[s.section_key] = s;
          });
        }

        setContent(contentMap);
      })
      .catch((err) => {
        const apiError = normalizeApiError(err);
        setError(apiError.message || "Failed to load CMS content.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const getContent = (key: string) => {
    return content[key]?.content || null;
  };

  return (
    <ContentContext.Provider value={{ content, loading, error, refresh: fetchContent, getContent }}>
      {children}
    </ContentContext.Provider>
  );
}
