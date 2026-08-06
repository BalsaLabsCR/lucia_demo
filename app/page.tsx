import { ChatWidget } from "@/components/chat/ChatWidget";
import { Differentiators } from "@/components/Differentiators";
import { Faq } from "@/components/Faq";
import { Hero } from "@/components/Hero";
import { Location } from "@/components/Location";
import { LuciaPitch } from "@/components/LuciaPitch";
import { Services } from "@/components/Services";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Team } from "@/components/Team";
import { Testimonials } from "@/components/Testimonials";
import { TrustStrip } from "@/components/TrustStrip";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <Services />
        <Differentiators />
        <Team />
        <LuciaPitch />
        <Testimonials />
        <Faq />
        <Location />
      </main>
      <SiteFooter />
      <ChatWidget />
    </>
  );
}
