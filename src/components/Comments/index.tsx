import { useEffect, useRef } from 'react';

export default function Comments(): JSX.Element {
  const commentsContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!commentsContainer) return;
    fetch('/api/utterances')
      .then(response => response.json())
      .then(data => {
        const script = document.createElement('script');

        Object.entries(data).forEach(([attribute, value]) => {
          script.setAttribute(attribute, String(value));
        });

        commentsContainer.current.appendChild(script);
      });
  }, [commentsContainer]);

  return <div ref={commentsContainer} />;
}
