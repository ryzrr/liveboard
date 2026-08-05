interface TechMark {
  slug: string;
  label: string;
}

// Real brand marks served from Simple Icons (https://simpleicons.org), rendered
// white so they sit flat on the dark surface; hover restores full opacity.
export const SDK_FRAMEWORKS: TechMark[] = [
  { slug: "nodedotjs", label: "Node.js" },
  { slug: "express", label: "Express" },
  { slug: "fastify", label: "Fastify" },
  { slug: "nextdotjs", label: "Next.js" },
  { slug: "python", label: "Python" },
  { slug: "fastapi", label: "FastAPI" },
  { slug: "django", label: "Django" },
  { slug: "flask", label: "Flask" },
];

export function TechMarkIcon({ slug, label, className }: { slug: string; label: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external brand mark, next/image needs SVG allow-listing for no benefit here
    <img
      src={`https://cdn.simpleicons.org/${slug}/ffffff`}
      alt={label}
      width={18}
      height={18}
      className={className}
      loading="lazy"
    />
  );
}
