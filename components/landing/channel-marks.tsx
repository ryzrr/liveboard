import { Hash, Webhook } from "lucide-react";

interface ChannelMark {
  key: string;
  label: string;
  slug?: string;
}

// Discord and PagerDuty are real brand marks (Simple Icons CDN). Slack's mark
// was removed from Simple Icons, so it falls back to a generic glyph like
// "Webhook" — a delivery method, not a brand.
export const ALERT_CHANNELS: ChannelMark[] = [
  { key: "slack", label: "Slack" },
  { key: "discord", label: "Discord", slug: "discord" },
  { key: "pagerduty", label: "PagerDuty", slug: "pagerduty" },
  { key: "webhook", label: "Webhook" },
];

export function ChannelMarkIcon({ channel, className }: { channel: ChannelMark; className?: string }) {
  if (!channel.slug) {
    const Icon = channel.key === "slack" ? Hash : Webhook;
    return <Icon className={className} strokeWidth={1.75} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external brand mark, next/image needs SVG allow-listing for no benefit here
    <img
      src={`https://cdn.simpleicons.org/${channel.slug}/ffffff`}
      alt={channel.label}
      width={16}
      height={16}
      className={className}
      loading="lazy"
    />
  );
}
