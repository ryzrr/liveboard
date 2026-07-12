import Image from "next/image";

interface BrowserFrameProps {
  src: string;
  alt: string;
  url?: string;
  width: number;
  height: number;
  priority?: boolean;
  live?: boolean;
}

export function BrowserFrame({ src, alt, url = "app.liveboard.dev", width, height, priority, live }: BrowserFrameProps) {
  return (
    <div className="edge-light overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0B] shadow-2xl shadow-black/70">
      <div className="flex items-center gap-2 border-b border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2c2c31]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2c2c31]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2c2c31]" />
        </div>
        <div className="mx-auto flex items-center gap-1.5 rounded-md bg-black/40 px-3 py-1">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" className="text-[#55555c]">
            <rect x="4" y="10" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M8 10V7a4 4 0 118 0v3" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="font-mono text-[10px] text-[#6b6b74]">{url}</span>
        </div>
        {live && (
          <div className="flex items-center gap-1.5 rounded-full border border-[#22C55E]/25 bg-[#22C55E]/10 px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-live" />
            <span className="text-[10px] font-medium text-[#22C55E]">Live</span>
          </div>
        )}
      </div>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="block h-auto w-full"
      />
    </div>
  );
}
