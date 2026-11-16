import Image from "next/image";
import Link from "next/link";
import { campaign } from "@/lib/sample-data";

export function CampaignBanner() {
  return (
    <section
      aria-labelledby="campaign-title"
      className="media relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]"
    >
      <Image src={campaign.image.src} alt={campaign.image.alt} fill sizes="100vw" />
      <div className="absolute inset-0 bg-scrim" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-gutter text-center text-white">
        <p className="eyebrow">{campaign.eyebrow}</p>
        <h2 id="campaign-title" className="max-w-2xl text-display-lg text-balance">
          {campaign.title}
        </h2>
        <p className="max-w-md text-body text-pretty">{campaign.body}</p>
        <Link href={campaign.href} className="btn btn-on-media mt-3">
          Explore the edit
        </Link>
      </div>
    </section>
  );
}
