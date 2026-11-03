import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function CatalogPager({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  const [targetPage, setTargetPage] = useState(String(page));
  useEffect(() => {
    setTargetPage(String(page));
  }, [page, pages]);
  if (pages < 2) return null;
  return (
    <nav className="catalog-pager" aria-label="课程分页">
      <button className="button outline small" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <ArrowLeft size={14} />
        上一页
      </button>
      <span aria-live="polite">
        第 {page} / {pages} 页
      </span>
      <button className="button outline small" disabled={page === pages} onClick={() => onChange(page + 1)}>
        下一页
        <ArrowRight size={14} />
      </button>
      <form
        className="pager-jump"
        onSubmit={event => {
          event.preventDefault();
          const target = Number(targetPage);
          if (Number.isInteger(target) && target >= 1 && target <= pages) onChange(target);
        }}
      >
        <label>
          跳至
          <input
            type="number"
            inputMode="numeric"
            aria-label="跳转页码"
            title={`请输入 1 到 ${pages} 的整数页码`}
            min={1}
            max={pages}
            step={1}
            required
            value={targetPage}
            onChange={event => setTargetPage(event.target.value)}
          />
          页
        </label>
        <button className="button outline small" type="submit">
          跳转
        </button>
      </form>
    </nav>
  );
}
