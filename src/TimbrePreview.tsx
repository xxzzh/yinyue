import { selectionProfiles } from './instrument-selection';

export function TimbrePreview({ track }: { track: string }) {
  const item=selectionProfiles[track];
  if(!item)return null;
  return <div className="atlas-timbre"><div className="tone-tags">{item.tags.map(tag=><span key={tag}>{tag}</span>)}</div><p>{item.timbre}</p></div>;
}
