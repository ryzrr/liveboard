import Image from "next/image";

interface ScreenshotFrameProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  focusTop?: boolean;
}

export function ScreenshotFrame({ src, alt, className, priority, focusTop }: ScreenshotFrameProps) {
  return (
    <div className={`relative overflow-hidden bg-surface ${className ?? ""}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 960px, 100vw"
        className={`object-cover ${focusTop ? "object-top" : ""}`}
      />
    </div>
  );
}
