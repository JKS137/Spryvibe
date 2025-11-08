export const SITE_URL = "https://spryvibe.app";

export const SITE_INFO = {
  title: "SpryVibe Video Editor",
  description:
    "A simple but powerful video editor that gets the job done. In your browser.",
  url: SITE_URL,
  openGraphImage: "/open-graph/default.jpg",
  twitterImage: "/open-graph/default.jpg",
  favicon: "/favicon.ico",
};

export const EXTERNAL_TOOLS = [
  {
    name: "Marble",
    description:
      "Modern headless CMS for content management and the blog for SpryVibe Video Editor",
    url: "https://marblecms.com?utm_source=spryvibe",
    icon: "MarbleIcon" as const,
  },
  {
    name: "Vercel",
    description: "Platform where we deploy and host SpryVibe Video Editor",
    url: "https://vercel.com?utm_source=spryvibe",
    icon: "VercelIcon" as const,
  },
  {
    name: "Databuddy",
    description: "GDPR compliant analytics and user insights for SpryVibe Video Editor",
    url: "https://databuddy.cc?utm_source=spryvibe",
    icon: "DataBuddyIcon" as const,
  },
];
