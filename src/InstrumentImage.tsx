import { useEffect, useId, useRef, useState } from 'react';
import { Expand, X } from 'lucide-react';
import { instrumentImages } from './instrument-images';

const kindLabel = { photo: '实物照片', historical: '历史图像', diagram: '外形示意' };

export function InstrumentImage({ track, className = '', eager = false }: { track: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const item = instrumentImages[track];
  useEffect(() => { setFailed(false); }, [track]);
  if (!item) return null;
  return <div className={`instrument-image ${className}`}>
    {failed ? <span className="image-unavailable">图片暂未加载，请刷新重试</span> : <img src={`./instruments/${item.file}`} alt={item.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" width={item.width} height={item.height} onError={() => setFailed(true)} />}
    <span className="image-kind">{kindLabel[item.kind]}</span>
  </div>;
}

export function InstrumentFigure({ track }: { track: string }) {
  const item = instrumentImages[track];
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    return () => { dialog.current?.close(); trigger.current?.focus(); };
  }, [open]);
  if (!item) return null;
  const credit = <span>图源：<a href={item.source} target="_blank" rel="noreferrer">{item.author}</a> · <a href={item.licenseUrl} target="_blank" rel="noreferrer">{item.license}</a></span>;
  return <figure className="instrument-figure">
    <button ref={trigger} className="instrument-enlarge" onClick={() => setOpen(true)} aria-label={`放大查看${item.name}图片`}><InstrumentImage track={track} /><span className="enlarge-label"><Expand size={14} />放大观察</span></button>
    <figcaption><strong>{item.name} · {kindLabel[item.kind]}</strong><p>{item.caption}</p><details><summary>图片来源与授权</summary>{credit}<p>{item.note}</p></details></figcaption>
    {open && <dialog className="instrument-lightbox" ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); event.stopPropagation(); setOpen(false); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setOpen(false); } }}>
      <div className="lightbox-heading"><h2 id={titleId}>{item.name} · 看清它的模样</h2><button className="icon-button" aria-label="关闭图片" onClick={() => setOpen(false)}><X size={21} /></button></div>
      <InstrumentImage track={track} eager /><p>{item.caption}</p><div className="lightbox-credit">{credit}</div>
    </dialog>}
  </figure>;
}
