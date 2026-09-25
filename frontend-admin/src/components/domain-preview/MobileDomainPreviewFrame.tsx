import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { DomainDetailRenderer } from '@shared/domain/DomainDetailRenderer';
import type { Domain } from '@shared/domain/types';

export interface MobileDomainPreviewFrameProps {
  domain: Domain;
  scale: number;
  stageHeight: number;
}

export interface MobileDomainPreviewFrameRef {
  scrollToSection: (sectionId: string, reducedMotion?: boolean) => void;
}

export const MobileDomainPreviewFrame = forwardRef<MobileDomainPreviewFrameRef, MobileDomainPreviewFrameProps>(
  ({ domain, scale, stageHeight }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeBody, setIframeBody] = useState<HTMLElement | null>(null);

    // Padding inside the stage that we must subtract for height calculation
    const STAGE_PAD = 16;
    const visualHeight = Math.max(stageHeight - STAGE_PAD * 2, 200); // 200px min fallback

    useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const doc = iframe.contentDocument;
      if (!doc) return;

      // Initialize the iframe document
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              /* Ensure the body behaves as the scroll container and resets margin */
              body {
                margin: 0;
                background-color: #ffffff;
                overflow-x: hidden; /* Prevent unwanted horizontal scroll */
                overflow-y: auto;
              }
            </style>
          </head>
          <body>
            <div id="iframe-root"></div>
          </body>
        </html>
      `);
      doc.close();

      const head = doc.head;
      
      // Inject the parent's CSS (Tailwind styles) into the iframe
      const stylesAndLinks = document.head.querySelectorAll('style, link[rel="stylesheet"]');
      stylesAndLinks.forEach(node => {
        const clone = node.cloneNode(true) as HTMLElement;
        if (clone.tagName === 'LINK') {
          const link = clone as HTMLLinkElement;
          link.href = new URL(link.getAttribute('href') || '', document.baseURI).href;
        }
        head.appendChild(clone);
      });

      const root = doc.getElementById('iframe-root');
      if (root) {
        setIframeBody(root);
      }
      
      return () => {
        setIframeBody(null);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      scrollToSection: (sectionId: string, reducedMotion = false) => {
        const doc = iframeRef.current?.contentDocument;
        if (!doc) return;
        const target = doc.getElementById(sectionId);
        if (target) {
          target.scrollIntoView({
            behavior: reducedMotion ? 'auto' : 'smooth',
            block: 'start'
          });
        }
      }
    }));

    const visualWidth = Math.round(390 * scale);

    return (
      <div
        className="relative overflow-hidden rounded-t-xl shadow-[0_0_60px_rgba(0,0,0,0.55)] shrink-0"
        style={{
          width: visualWidth,
          height: visualHeight,
          marginLeft: 'auto',
          marginRight: 'auto',
          marginTop: STAGE_PAD,
        }}
      >
        <iframe
          ref={iframeRef}
          title="Mobile Preview"
          style={{
            width: '390px',
            height: `${100 / scale}%`,
            border: 'none',
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
            backgroundColor: '#ffffff',
            display: 'block'
          }}
        />
        {iframeBody && createPortal(
          <DomainDetailRenderer domain={domain} previewMode />,
          iframeBody
        )}
      </div>
    );
  }
);

MobileDomainPreviewFrame.displayName = 'MobileDomainPreviewFrame';
