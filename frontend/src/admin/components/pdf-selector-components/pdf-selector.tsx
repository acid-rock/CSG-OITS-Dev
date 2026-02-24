import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import pdfjsLib from './pdfjs';
import { createPortal } from 'react-dom';

export type Box = {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type DraftBox = Box & {
  startX: number;
  startY: number;
};

type PageSize = {
  width: number;
  height: number;
};

type PdfSelectorProps = {
  fileUrl: string;
  onBoxesChange?: (boxes: Box[]) => void;
};

function OverlayPortal({
  page,
  children,
}: {
  page: number;
  children: ReactNode;
}) {
  const container = document.querySelector(`[data-page="${page}"]`);
  if (!container) return null;

  return createPortal(children, container);
}

function Overlay({
  page,
  boxes,
  vpWidth,
  vpHeight,
  draft,
  isDrawing,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: {
  page: number;
  boxes: Box[];
  vpWidth: number;
  vpHeight: number;
  draft: DraftBox | null;
  isDrawing: boolean;
  onMouseDown: (e: MouseEvent<SVGSVGElement>, page: number) => void;
  onMouseMove: (e: MouseEvent<SVGSVGElement>) => void;
  onMouseUp: () => void;
}) {
  return (
    <svg
      onMouseDown={(e) => {
        onMouseDown(e, page);
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      className='absolute inset-0 cursor-crosshair'
      width={vpWidth}
      height={vpHeight}
    >
      {boxes
        .filter((b) => b.page === page)
        .map((box) => (
          <rect
            key={box.id}
            x={box.x * vpWidth}
            y={box.y * vpHeight}
            width={box.width * vpWidth}
            height={box.height * vpHeight}
            fill='rgba(0,0,0,0.15)'
            stroke='black'
            strokeWidth={2}
          ></rect>
        ))}

      {draft && draft.page === page && (
        <rect
          x={draft.x * vpWidth}
          y={draft.y * vpHeight}
          width={draft.width * vpWidth}
          height={draft.height * vpHeight}
          fill='rgba(0,0,0,0.15)'
          stroke='blue'
          strokeWidth={2}
        />
      )}
    </svg>
  );
}

export function PdfSelector({ fileUrl, onBoxesChange }: PdfSelectorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale] = useState<number>(1.25);
  const [pages, setPages] = useState<number[]>([]);
  const [pageSizes, setPageSizes] = useState<Record<number, PageSize>>({});
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [draft, setDraft] = useState<DraftBox | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  function onMouseDown(e: MouseEvent<SVGSVGElement>, page: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setIsDrawing(true);
    setDraft({
      id: crypto.randomUUID(),
      page,
      startX: x,
      startY: y,
      x,
      y,
      width: 0,
      height: 0,
    });
  }

  function onMouseMove(e: MouseEvent<SVGSVGElement>) {
    if (!draft) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width;
    const cy = (e.clientY - rect.top) / rect.height;

    setDraft((d) => {
      if (!d) return d;

      const x = Math.min(d.startX, cx);
      const y = Math.min(d.startY, cy);
      const width = Math.abs(cx - d.startX);
      const height = Math.abs(cy - d.startY);

      return { ...d, x, y, width, height };
    });
  }

  function onMouseUp() {
    if (!draft) return;

    setBoxes((b) => {
      const newBoxes = [...b, draft];
      onBoxesChange?.(newBoxes);
      return newBoxes;
    });
    setDraft(null);
    setIsDrawing(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!containerRef.current || !fileUrl) return;

      containerRef.current.innerHTML = '';

      const pdf = await pdfjsLib.getDocument(fileUrl).promise;

      const nextPages: number[] = [];
      const nextSizes: Record<number, PageSize> = {};

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        if (cancelled) return;

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const pageWrapper = document.createElement('div');
        pageWrapper.dataset.page = String(pageNum);
        pageWrapper.className = 'relative mb-6';

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        pageWrapper.appendChild(canvas);
        containerRef.current.appendChild(pageWrapper);

        await page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        }).promise;

        nextPages.push(pageNum);
        nextSizes[pageNum] = {
          width: viewport.width,
          height: viewport.height,
        };
      }

      setPages(nextPages);
      setPageSizes(nextSizes);
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [fileUrl, scale]);

  return (
    <div className='w-full flex justify-center'>
      <div ref={containerRef} className='w-full max-w-5xl'></div>

      {pages.map((pageNum) => {
        const size = pageSizes[pageNum] || { width: 0, height: 0 };
        return (
          <OverlayPortal key={pageNum} page={pageNum}>
            <Overlay
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              draft={draft}
              isDrawing={isDrawing}
              page={pageNum}
              boxes={boxes}
              vpWidth={size.width}
              vpHeight={size.height}
            ></Overlay>
          </OverlayPortal>
        );
      })}
    </div>
  );
}

export default PdfSelector;
