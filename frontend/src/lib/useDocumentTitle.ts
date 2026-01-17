// useDocumentTitle.ts — Small hook to set document.title with a consistent suffix
// Usage: useDocumentTitle('Page Title') will set document.title to 'Page Title | DinoProject'
import { useEffect } from "react";

export function useDocumentTitle(title: string, suffix: string = " | DinoProject") {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title + suffix;
    return () => {
      document.title = prevTitle;
    };
  }, [title, suffix]);
}
