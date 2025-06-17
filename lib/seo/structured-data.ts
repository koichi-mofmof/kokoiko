import { ListForClient, Collaborator } from "@/lib/dal/lists";
import type { Place } from "@/types";

// Organization スキーマ（サイト情報）
export function generateOrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ClippyMap",
    description: "行きたい場所を共有できるサービス",
    url: baseUrl,
    logo: `${baseUrl}/ogp-image.webp`,
    sameAs: [
      // SNSアカウントがあれば追加
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "clippymap@gmail.com",
    },
  };
}

// WebSite スキーマ（サイト検索機能）
export function generateWebSiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ClippyMap",
    description: "行きたい場所を共有できるサービス",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/lists?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// BreadcrumbList スキーマ
export function generateBreadcrumbSchema(
  breadcrumbs: { name: string; url: string }[]
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${baseUrl}${crumb.url}`,
    })),
  };
}

// ItemList スキーマ（リスト情報）
export function generateItemListSchema(list: ListForClient) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const owner = list.collaborators.find((c: Collaborator) => c.isOwner);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: list.name,
    description:
      list.description || `${owner?.name || "ユーザー"}さんが作成したリスト`,
    url: `${baseUrl}/lists/${list.id}`,
    numberOfItems: list.places.length,
    itemListElement: list.places
      .slice(0, 10)
      .map((place: Place, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        name: place.name,
        description: place.address,
        url: `${baseUrl}/lists/${list.id}/place/${place.id}`,
      })),
    author: {
      "@type": "Person",
      name: owner?.name || "ユーザー",
    },
    dateCreated: list.created_at,
    dateModified: list.updated_at,
  };
}

// Place スキーマ（場所情報）
export function generatePlaceSchema(
  place: {
    id: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
  },
  listId: string,
  listName: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: place.name,
    description: place.address,
    address: {
      "@type": "PostalAddress",
      addressLocality: place.address,
    },
    geo:
      place.latitude && place.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: place.latitude,
            longitude: place.longitude,
          }
        : undefined,
    url: `${baseUrl}/lists/${listId}/place/${place.id}`,
    isPartOf: {
      "@type": "ItemList",
      name: listName,
      url: `${baseUrl}/lists/${listId}`,
    },
  };
}
