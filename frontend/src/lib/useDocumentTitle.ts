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
