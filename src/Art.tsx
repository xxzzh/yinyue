import { InstrumentImage } from './InstrumentImage';
import { traditionalInstrument } from './traditional-catalog';
import type { Track } from './data';

export function BrandMark() {
  return <svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M10 25V12l17-3v13M10 16l17-3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><ellipse cx="7" cy="26" rx="4" ry="3" fill="currentColor"/><ellipse cx="24" cy="23" rx="4" ry="3" fill="currentColor"/></svg>;
}
export function CourseArt({ track, hero = false }: { track: Track; hero?: boolean }) {
  const traditional = traditionalInstrument(track);
  if (traditional) return <InstrumentImage track={track} className="course-art" />;
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
    {(track === 'guitar' || track === 'ukulele') && <>
      <circle cx="200" cy="125" r="84" fill="#d7bf8f"/>
      <g transform="rotate(28 200 120)" filter={`url(#${id}-shadow)`}>
        <path d="M183 107c-24-16-43-3-35 21 3 10-18 18-17 40 1 23 28 36 60 28s43-29 30-46c-7-10-14-13-12-25 4-21-9-29-26-18z" fill="#a76b3d"/>
        <path d="M183 110c-20-12-35-1-28 18 4 12-16 22-15 40 1 19 24 28 49 22s36-23 25-37c-9-13-12-15-11-29 1-14-6-22-20-14z" fill="#edce93"/>
        <rect x="182" y="44" width="17" height="95" fill="#775540"/><rect x="180" y="23" width="21" height="33" rx="4" fill="#a76b3d"/>
        <circle cx="183" cy="144" r="16" fill="#b18c61"/><circle cx="183" cy="144" r="12" fill="#51483a"/>
        <rect x="165" y="173" width="36" height="8" rx="2" fill="#775540"/>
        {Array.from({ length: track === 'ukulele' ? 4 : 6 }, (_, n) => <path key={n} d={`M${185 + n * (track === 'ukulele' ? 3 : 1.8)} 29L${177 + n * (track === 'ukulele' ? 3.3 : 2)} 176`} stroke="#f9edce" strokeWidth=".65"/>)}
        {[0, 1, 2, 3, 4, 5].map(n => <path key={n} d={`M182 ${62 + n * 11}h17`} stroke="#c6a880"/>) }
      </g><path d="M95 67v22m-11-11h22" stroke="#a58d5e" strokeWidth="1.6"/>
    </>}
    {track === 'bass' && <><circle cx="200" cy="124" r="86" fill="#c7d1c1"/><g transform="rotate(25 200 120)" filter={`url(#${id}-shadow)`}><path d="M180 124c-17-27-38-10-33 12 4 16-19 23-16 43 4 26 63 34 83 13 17-18-5-34-7-48-3-16 18-24 4-39-7 13-13 19-18 19z" fill="#47685b"/><rect x="182" y="37" width="15" height="112" fill="#a68153"/><path d="m179 19 23-6-4 34h-17z" fill="#bd9b6d"/><rect x="166" y="148" width="37" height="10" rx="2" fill="#e2dac4"/><rect x="170" y="172" width="29" height="7" fill="#b8b9a9"/>{[0,1,2,3].map(n=><path key={n} d={`M${185+n*3} 25L${176+n*4} 177`} stroke="#f4e8c7" strokeWidth=".8"/>)}</g></>}
    {track === 'violin' && <><circle cx="200" cy="125" r="85" fill="#c9c3d8"/><g transform="rotate(22 200 120)" filter={`url(#${id}-shadow)`}><path d="M178 82c-30-4-39 20-23 34-17 8-20 26-8 35-29 27-4 58 36 55 37 1 61-28 35-53 12-12 10-27-7-36 17-16 5-37-22-34z" fill="#b87e52"/><path d="M170 88c-21 4-22 17-9 28-17 15-17 26-4 35-27 23-8 49 26 47 32 0 49-25 24-46 11-10 10-21-6-35 13-14 10-27-15-29z" fill="#deb17c"/><rect x="179" y="41" width="12" height="117" fill="#594a3e"/><circle cx="184" cy="28" r="10" fill="#aa704b"/><path d="M164 140q-12 4-5 19m43-19q12 4 5 19" stroke="#6c4e39" strokeWidth="3"/><path d="m174 174 21 0" stroke="#f5dfb1" strokeWidth="7"/>{[0,1,2,3].map(n=><path key={n} d={`M${181+n*2.4} 38v139`} stroke="#f9e9ca" strokeWidth=".6"/>)}</g><path d="M269 32 133 209" stroke="#6a5247" strokeWidth="5"/><path d="M275 35 139 211" stroke="#eadbbc" strokeWidth="2"/></>}
    {track === 'drums' && <><circle cx="200" cy="126" r="86" fill="#e4b5a1"/><g filter={`url(#${id}-shadow)`}><path d="M113 97v104m175-105v105m-118-98-14 104m75-103 15 104" stroke="#8b8c7a" strokeWidth="4"/><ellipse cx="112" cy="90" rx="51" ry="12" fill="#ddc280"/><ellipse cx="286" cy="89" rx="47" ry="11" fill="#ddc280"/><rect x="145" y="101" width="44" height="39" rx="7" fill="#a96d54"/><ellipse cx="167" cy="101" rx="23" ry="8" fill="#f4e4cf"/><rect x="211" y="102" width="44" height="39" rx="7" fill="#a96d54"/><ellipse cx="233" cy="102" rx="23" ry="8" fill="#f4e4cf"/><circle cx="200" cy="159" r="48" fill="#a96d54"/><circle cx="200" cy="159" r="41" fill="#f5e9d8"/><circle cx="218" cy="176" r="9" fill="#d2c6b4"/><path d="m164 203-9 16m80-16 10 16" stroke="#8b8c7a" strokeWidth="4"/></g></>}
    {track === 'flute' && <><circle cx="200" cy="125" r="85" fill="#c4d2c1"/><g transform="rotate(-26 200 120)" filter={`url(#${id}-shadow)`}><rect x="61" y="109" width="283" height="22" rx="10" fill="#b9c5bc"/><path d="M69 113h266" stroke="#f8f8ed" strokeWidth="5"/><path d="M120 110v20m145-20v20m42-20v20" stroke="#81978c" strokeWidth="2"/><ellipse cx="91" cy="120" rx="10" ry="5" fill="#506e60"/>{Array.from({length:9},(_,n)=><g key={n}><circle cx={148+n*19} cy="126" r="8" fill="#e8eee2" stroke="#90a194"/><path d={`M${148+n*19} 117v-11`} stroke="#8ca092" strokeWidth="2"/></g>)}</g></>}
    {track === 'saxophone' && <><circle cx="200" cy="126" r="86" fill="#dcc48e"/><g transform="rotate(9 200 120)" filter={`url(#${id}-shadow)`}><path d="M196 52q-22-21-38-12" stroke="#886646" strokeWidth="11" strokeLinecap="round"/><path d="m151 32-18 6 4 10 20-5z" fill="#434d43"/><path d="M196 52v105c0 53 66 54 66-1v-39" stroke="#b78c43" strokeWidth="30" strokeLinecap="round"/><path d="M190 58v99c0 48 66 47 66-1v-28" stroke="#efcc79" strokeWidth="19" strokeLinecap="round"/><path d="m239 128-4-26 51-15-7 34q-15 16-40 7z" fill="#dfb562"/><ellipse cx="260" cy="97" rx="27" ry="11" transform="rotate(-16 260 97)" fill="#907447"/><path d="M180 76v86" stroke="#f7e1a0" strokeWidth="3"/>{[0,1,2,3,4,5].map(n=><circle key={n} cx="179" cy={80+n*16} r="6" fill="#f5e9bb" stroke="#b28b4f"/>)}</g></>}
    {track === 'guzheng' && <><circle cx="200" cy="122" r="85" fill="#dbca9f"/><g transform="rotate(-15 200 120)" filter={`url(#${id}-shadow)`}><path d="M59 76q145-33 281 0v95q-145 32-281 0z" fill="#a77b4d"/><path d="M67 81q137-29 265 0v79q-130 28-265 0z" fill="#d3ac76"/>{Array.from({length:21},(_,n)=><path key={n} d={`M68 ${83+n*3.8}Q204 ${64+n*4} 331 ${83+n*3.8}`} stroke={n%5===0?'#76927d':'#f4dfae'} strokeWidth=".8"/>)}{[0,1,2,3,4,5,6].map(n=><path key={n} d={`m${173+(n%2)*15} ${87+n*11} 7-9 7 10z`} fill="#72583e"/>)}<path d="M86 81v79m226-79v79" stroke="#6e573f" strokeWidth="5"/></g></>}
    {track === 'erhu' && <><circle cx="200" cy="123" r="85" fill="#c8c2d8"/><g transform="rotate(9 200 120)" filter={`url(#${id}-shadow)`}><path d="M185 31q-1-15 14-18l18 6-4 10-16-1v144" stroke="#805a42" strokeWidth="9"/><path d="M177 45h45m-46 21h45" stroke="#6f513e" strokeWidth="8" strokeLinecap="round"/><path d="m175 160 29-13 31 16v34l-29 15-31-17z" fill="#a17653"/><path d="m178 165 25-11 3 48-25-10z" fill="#d2b28a" stroke="#805b40" strokeWidth="2"/><path d="M191 39v143m5-143v143" stroke="#f4e2ba" strokeWidth="1"/><path d="m144 181 129-4" stroke="#775c42" strokeWidth="5"/><path d="m143 184 130-4" stroke="#f1dfbb" strokeWidth="2"/></g></>}
  </svg>;
}
