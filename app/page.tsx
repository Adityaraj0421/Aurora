import type { Metadata } from "next";
import { AuroraExperience } from "./AuroraExperience";

export const metadata: Metadata = {
  title: "Inspiration",
  description:
    "A considered edit of experiences, shaped around your time, tastes, and people.",
};

export default function Home() {
  return <AuroraExperience />;
}
