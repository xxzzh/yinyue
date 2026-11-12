import { useState } from 'react';
import { instrumentImages } from './instrument-images';

export const kindLabel = { photo: '实物照片', historical: '历史图像', diagram: '外形示意' };

type InstrumentImageProps = {
  track: string;
  className?: string;
  eager?: boolean;
};

export function InstrumentImage(props: InstrumentImageProps) {
  return <ImageContent key={props.track} {...props} />;
}

function ImageContent({ track, className = '', eager = false }: InstrumentImageProps) {
  const [failed, setFailed] = useState(false);
  const item = instrumentImages[track];
  if (!item) return null;
  return (
    <div className={`instrument-image ${className}`}>
      {failed ? (
        <span className="image-unavailable">图片暂未加载，请刷新重试</span>
      ) : (
        <img
          src={`./instruments/${item.file}`}
          alt={item.alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          width={item.width}
          height={item.height}
          onError={() => setFailed(true)}
        />
      )}
      <span className="image-kind">{kindLabel[item.kind]}</span>
    </div>
  );
}
