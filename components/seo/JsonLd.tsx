import Script from "next/script";
import { headers } from "next/headers";

interface JsonLdProps {
  data: object;
}

export default async function JsonLd({ data }: JsonLdProps) {
  const nonce = (await headers()).get("x-nonce");

  return (
    <Script
      id={`json-ld-${Math.random().toString(36).substr(2, 9)}`}
      type="application/ld+json"
      nonce={nonce ?? undefined}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
