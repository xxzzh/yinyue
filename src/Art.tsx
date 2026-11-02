import type { Track } from './data';

export function BrandMark() {
  return <svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M10 25V12l17-3v13M10 16l17-3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><ellipse cx="7" cy="26" rx="4" ry="3" fill="currentColor"/><ellipse cx="24" cy="23" rx="4" ry="3" fill="currentColor"/></svg>;
}
export function CourseArt({ track, hero = false }: { track: Track; hero?: boolean }) {
  const id = `${track}-${hero ? 'hero' : 'card'}`;
  return <svg className={`course-art ${hero ? 'hero-art' : ''}`} viewBox="0 0 400 240" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-key`} x1="100" y1="70" x2="200" y2="200" gradientUnits="userSpaceOnUse"><stop stopColor="#fffefb"/><stop offset="1" stopColor="#e5dfd7"/></linearGradient>
      <filter id={`${id}-shadow`} x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="9" stdDeviation="8" floodColor="#453d35" floodOpacity="0.16"/></filter>
    </defs>
    {track === 'theory' && <>
      <circle cx="203" cy="120" r="83" fill="#c5cec0"/><circle cx="203" cy="120" r="63" stroke="#f4f4df" strokeWidth="1"/>
      {[0, 1, 2, 3, 4].map(n => <path key={n} d={`M70 ${85 + n * 17}C140 ${55 + n * 17} 240 ${125 + n * 17} 330 ${85 + n * 17}`} stroke="#81937e" strokeWidth="1.6" opacity=".6"/>)}
      <g transform="rotate(-12 200 120)" filter={`url(#${id}-shadow)`}>
        <path d="M160 155V62l91-14v89" stroke="#3c5549" strokeWidth="8" strokeLinecap="round"/><path d="m160 78 91-14" stroke="#3c5549" strokeWidth="12"/>
        <ellipse cx="142" cy="155" rx="22" ry="16" fill="#3c5549"/><ellipse cx="233" cy="138" rx="22" ry="16" fill="#3c5549"/>
      </g><path d="m292 46 5 12 13 2-10 8 2 13-10-7-12 6 3-13-8-9 13-1z" fill="#efdeae"/>
    </>}
    {track === 'ear' && <>
      <circle cx="200" cy="125" r="82" fill="#e9b3a1"/>
      <path d="M139 141v-30a61 61 0 0 1 122 0v30" stroke="#945a48" strokeWidth="18" strokeLinecap="round"/>
      <path d="M145 97a55 55 0 0 1 110 0" stroke="#f9ebdd" strokeWidth="8" strokeLinecap="round"/>
      <rect x="123" y="114" width="37" height="68" rx="16" fill="#f8eddf" transform="rotate(5 123 114)" filter={`url(#${id}-shadow)`}/>
      <rect x="243" y="117" width="37" height="68" rx="16" fill="#f8eddf" transform="rotate(-5 243 117)" filter={`url(#${id}-shadow)`}/>
      {[18, 31, 45, 31, 18].map((h, i) => <rect key={i} x={172 + i * 12} y={130 - h / 2} width="5" height={h} rx="2.5" fill="#945a48"/>)}
      <path d="m305 59 4 9 10 2-8 6 1 10-8-6-9 4 3-9-7-7 10-1z" fill="#bd715c"/>
    </>}
    {track === 'piano' && <>
      <circle cx={hero ? 205 : 200} cy="120" r={hero ? 110 : 84} fill={hero ? '#dfc5a2' : '#c8c6db'}/>
      <circle cx="205" cy="120" r="101" stroke={hero ? '#c2a786' : '#e9e5ef'} strokeDasharray="3 6" opacity=".7"/>
      <g transform="translate(70 53) rotate(-13 130 70)" filter={`url(#${id}-shadow)`}>
        <rect x="0" y="0" width="264" height="143" rx="10" fill="#3d4540"/>
        <rect x="8" y="9" width="248" height="127" rx="5" fill="#a5a397"/>
        {Array.from({ length: 12 }, (_, i) => <g key={i}><rect x={9 + i * 20.6} y="10" width="19.7" height="122" rx="2" fill={`url(#${id}-key)`}/><path d={`M${12 + i * 20.6} 126h12`} stroke="#d2c9bd"/></g>)}
        {[0, 1, 3, 4, 5, 7, 8, 10].map(n => <g key={n}><rect x={23 + n * 20.6} y="9" width="13" height="76" rx="2" fill="#272f2d"/><rect x={25 + n * 20.6} y="12" width="9" height="67" rx="1" fill="#3c4540"/></g>)}
      </g>
      <path d="M316 45v30m-15-15h30" stroke="#657161" strokeWidth="1.8"/><circle cx="77" cy="190" r="5" stroke="#667263" strokeWidth="1.5"/>
    </>}
    {track === 'guitar' && <>
      <circle cx="200" cy="125" r="84" fill="#d7bf8f"/>
      <g transform="rotate(28 200 120)" filter={`url(#${id}-shadow)`}>
        <path d="M183 107c-24-16-43-3-35 21 3 10-18 18-17 40 1 23 28 36 60 28s43-29 30-46c-7-10-14-13-12-25 4-21-9-29-26-18z" fill="#a76b3d"/>
        <path d="M183 110c-20-12-35-1-28 18 4 12-16 22-15 40 1 19 24 28 49 22s36-23 25-37c-9-13-12-15-11-29 1-14-6-22-20-14z" fill="#edce93"/>
        <rect x="182" y="44" width="17" height="95" fill="#775540"/><rect x="180" y="23" width="21" height="33" rx="4" fill="#a76b3d"/>
        <circle cx="183" cy="144" r="16" fill="#b18c61"/><circle cx="183" cy="144" r="12" fill="#51483a"/>
        <rect x="165" y="173" width="36" height="8" rx="2" fill="#775540"/>
        {[0, 1, 2, 3, 4, 5].map(n => <path key={n} d={`M${185 + n * 1.8} 29L${177 + n * 2} 176`} stroke="#f9edce" strokeWidth=".65"/>)}
        {[0, 1, 2, 3, 4, 5].map(n => <path key={n} d={`M182 ${62 + n * 11}h17`} stroke="#c6a880"/>) }
      </g><path d="M95 67v22m-11-11h22" stroke="#a58d5e" strokeWidth="1.6"/>
    </>}
  </svg>;
}
