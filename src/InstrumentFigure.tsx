import { useEffect, useId, useRef, useState } from 'react';
import { Expand, X } from 'lucide-react';
import { instrumentImages } from './instrument-images';
import { instrumentCredits } from './instrument-credits';
import { InstrumentImage, kindLabel } from './InstrumentImage';

// Picture with caption, credits and an enlarged view. Loaded on demand because the credits are large.
export function InstrumentFigure({ track }: { track: string }) {
  const image = instrumentImages[track];
  const credit = instrumentCredits[track];
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const element = dialog.current,
      button = trigger.current;
    element?.showModal();
    return () => {
      element?.close();
      button?.focus();
    };
  }, [open]);
  if (!image || !credit) return null;
  const item = { ...image, ...credit };
  const creditLine = (
    <span>
      图源：
      <a href={item.source} target="_blank" rel="noreferrer">
        {item.author}
      </a>{' '}
      ·{' '}
      <a href={item.licenseUrl} target="_blank" rel="noreferrer">
        {item.license}
      </a>
    </span>
  );
  return (
    <figure className="instrument-figure">
      <button
        ref={trigger}
        className="instrument-enlarge"
        onClick={() => setOpen(true)}
        aria-label={`放大查看${item.name}图片`}
      >
        <InstrumentImage track={track} />
        <span className="enlarge-label">
          <Expand size={14} />
          放大观察
        </span>
      </button>
      <figcaption>
        <strong>
          {item.name} · {kindLabel[item.kind]}
        </strong>
        <p>{item.caption}</p>
        <details>
          <summary>图片来源与授权</summary>
          {creditLine}
          <p>{item.note}</p>
        </details>
      </figcaption>
      {open && (
        <dialog
          className="instrument-lightbox"
          ref={dialog}
          aria-labelledby={titleId}
          onCancel={event => {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }}
          onClick={event => {
            if (event.target === event.currentTarget) {
              const rect = event.currentTarget.getBoundingClientRect();
              if (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
              )
                setOpen(false);
            }
          }}
        >
          <div className="lightbox-heading">
            <h2 id={titleId}>{item.name} · 看清它的模样</h2>
            <button className="icon-button" aria-label="关闭图片" onClick={() => setOpen(false)}>
              <X size={21} />
            </button>
          </div>
          <InstrumentImage track={track} eager />
          <p>{item.caption}</p>
          <div className="lightbox-credit">{creditLine}</div>
        </dialog>
      )}
    </figure>
  );
}
