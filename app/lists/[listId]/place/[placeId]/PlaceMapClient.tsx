"use client";

import { Place } from "@/types";
import dynamic from "next/dynamic";

// OpenStreetMapView を動的にインポートし、SSRを無効にする
const DynamicOpenStreetMapView = dynamic(
  () => import("@/app/components/map/OpenStreetMapView"),
  {
    ssr: false,
    loading: () => (
      <p className="flex justify-center items-center h-full">
        Map is loading...
      </p>
    ),
  }
);

interface PlaceMapClientProps {
  place: Place;
  listId: string;
  isSample?: boolean;
}

export default function PlaceMapClient({
  place,
  listId,
  isSample,
}: PlaceMapClientProps) {
  return (
    <DynamicOpenStreetMapView
      places={[place]}
      listId={listId}
      isSample={isSample}
    />
  );
}
