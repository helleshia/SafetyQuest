import { useId } from "react";

export default function AccountVisual({ recovery = false, signup = false }: { recovery?: boolean; signup?: boolean }) {
  const id = useId();
  return <div className="account-visual" aria-hidden="true">
    <svg viewBox="0 0 560 270" fill="none">
      <defs>
        <linearGradient id={`${id}-paper`} x1="160" y1="54" x2="380" y2="220" gradientUnits="userSpaceOnUse"><stop stopColor="#fffdf9" /><stop offset="1" stopColor="#e8e5df" /></linearGradient>
        <linearGradient id={`${id}-coral`} x1="238" y1="75" x2="305" y2="175" gradientUnits="userSpaceOnUse"><stop stopColor="#f49b54" /><stop offset="1" stopColor="#ec6e4d" /></linearGradient>
        <radialGradient id={`${id}-glow`}><stop stopColor="#e4b85b" stopOpacity=".23" /><stop offset="1" stopColor="#e4b85b" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="280" cy="136" rx="224" ry="132" fill={`url(#${id}-glow)`} />
      <ellipse cx="284" cy="141" rx="226" ry="92" stroke="#42151b" strokeOpacity=".12" transform="rotate(-12 284 141)" />
      <ellipse cx="284" cy="141" rx="199" ry="112" stroke="#ec6e4d" strokeOpacity=".19" transform="rotate(14 284 141)" />
      <ellipse cx="281" cy="233" rx="156" ry="17" fill="#42151b" fillOpacity=".055" />
      <g className="account-visual-card">
        <rect x="154" y="60" width="223" height="165" rx="20" fill="#42151b" fillOpacity=".06" transform="rotate(-8 265 142)" />
        <rect x="140" y="54" width="223" height="165" rx="20" fill="#c3a9c4" fillOpacity=".45" stroke="#42151b" strokeOpacity=".16" transform="rotate(-8 252 137)" />
        <rect x="159" y="44" width="223" height="165" rx="20" fill="#42151b" fillOpacity=".07" transform="rotate(3 270 126)" />
        <rect x="154" y="37" width="223" height="165" rx="20" fill={`url(#${id}-paper)`} stroke="#42151b" strokeOpacity=".18" transform="rotate(3 265 119)" />
        <path d="M173 70h18m-9-9v18" stroke="#ec6e4d" strokeWidth="3" strokeLinecap="round" />
        <text x="201" y="74" fill="#766f6a" fontSize="9" fontWeight="600" letterSpacing="1.5">SAFETYQUEST</text>
        <circle cx="348" cy="74" r="3" fill="#a4c3b4" />
        {recovery ? <g transform="rotate(3 265 119)">
          <rect x="224" y="91" width="85" height="62" rx="13" fill="#42151b" fillOpacity=".08" transform="translate(5 6)" />
          <rect x="224" y="91" width="85" height="62" rx="13" fill={`url(#${id}-coral)`} stroke="#42151b" strokeWidth="2" />
          <path d="m226 96 40 29 41-29m-81 52 26-23m54 23-25-23" stroke="#42151b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="300" cy="146" r="18" fill="#e4b85b" stroke="#42151b" strokeWidth="2" />
          <path d="M300 140v12m-6-6h12" stroke="#42151b" strokeWidth="2.5" strokeLinecap="round" />
        </g> : signup ? <g transform="rotate(3 265 119)">
          <path d="M266 106c-15-10-30-11-45-7v53c17-4 31-1 45 8 14-9 28-12 45-8V99c-15-4-30-3-45 7Z" fill="#42151b" fillOpacity=".08" transform="translate(5 6)" />
          <path d="M266 100c-15-10-30-11-45-7v53c17-4 31-1 45 8 14-9 28-12 45-8V93c-15-4-30-3-45 7Z" fill={`url(#${id}-coral)`} stroke="#42151b" strokeWidth="2" strokeLinejoin="round" />
          <path d="M266 100v54m-34-45c8-1 15 1 23 5m-23 7c8-1 15 1 23 5m22-12c8-4 15-6 23-5m-23 17c8-4 15-6 23-5" stroke="#42151b" strokeWidth="2" strokeLinecap="round" />
          <path d="m301 88 4-10 5 10 10 4-10 5-5 10-4-10-10-5Z" fill="#e4b85b" stroke="#42151b" strokeWidth="1.5" />
        </g> : <g transform="rotate(3 265 119)">
          <path d="m267 85 37 15v26c0 23-21 38-37 44-16-6-37-21-37-44v-26Z" fill="#42151b" fillOpacity=".08" transform="translate(5 6)" />
          <path d="m267 81 37 15v26c0 23-21 38-37 44-16-6-37-21-37-44V96Z" fill={`url(#${id}-coral)`} stroke="#42151b" strokeWidth="2" strokeLinejoin="round" />
          <path d="m267 91 28 12v19c0 17-15 29-28 35" stroke="#fffdf9" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
          <path d="M267 109v26m-13-13h26" stroke="#42151b" strokeWidth="5" strokeLinecap="round" />
        </g>}
        <rect x="212" y="180" width="70" height="3" rx="1.5" fill="#42151b" fillOpacity=".13" />
        <rect x="288" y="180" width="29" height="3" rx="1.5" fill="#ec6e4d" fillOpacity=".55" />
      </g>
      <g className="account-visual-mascot" stroke="#42151b" strokeWidth="2.5" strokeLinejoin="round">
        <path d="m397 180-4 42c0 8 13 9 14 1l5-39m14-4 6 43c1 8-12 10-14 2l-7-40" fill="#7fa5bb" />
        <path d="M391 145c-9 10-13 16-22 14m63-14 14-21" strokeWidth="11" strokeLinecap="round" />
        <path d="M391 145c-9 10-13 16-22 14m63-14 14-21" stroke="#ec6e4d" strokeWidth="6" strokeLinecap="round" />
        <rect x="385" y="129" width="48" height="61" rx="17" fill="#e4b85b" />
        <path d="M409 148v22m-11-11h22" strokeWidth="4" strokeLinecap="round" />
        <path d="M409 70c25 0 37 16 35 36-1 22-17 32-36 31-20 0-34-13-34-33 0-20 12-34 35-34Z" fill="#ec6e4d" />
        <path d="M435 91c4 18-5 35-24 39" stroke="#42151b" strokeOpacity=".12" strokeWidth="6" strokeLinecap="round" />
        <circle cx="396" cy="101" r="8" fill="#f3f1ed" /><circle cx="420" cy="101" r="8" fill="#f3f1ed" />
        <circle cx="398" cy="102" r="2.5" fill="#42151b" stroke="none" /><circle cx="418" cy="102" r="2.5" fill="#42151b" stroke="none" />
        <path d="M401 119q7 5 14-1" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g className="account-visual-float">
        <rect x="74" y="103" width="62" height="65" rx="13" fill="#42151b" fillOpacity=".045" transform="rotate(-10 105 135) translate(3 5)" />
        <rect x="74" y="103" width="62" height="65" rx="13" fill="#d7e5dc" stroke="#42151b" strokeOpacity=".2" transform="rotate(-10 105 135)" />
        <path d="m91 129 7 7 17-19" stroke="#42151b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M88 150h27" stroke="#42151b" strokeOpacity=".23" strokeWidth="3" strokeLinecap="round" />
        <circle cx="363" cy="33" r="17" fill="#e4b85b" stroke="#42151b" strokeOpacity=".23" />
        <path d="M363 26v14m-7-7h14" stroke="#42151b" strokeWidth="2" strokeLinecap="round" />
        <circle cx="472" cy="172" r="5" fill="#c3a9c4" /><circle cx="168" cy="229" r="4" fill="#ec6e4d" />
        <path d="M131 53v12m-6-6h12M462 71v12m-6-6h12" stroke="#42151b" strokeOpacity=".35" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  </div>;
}
