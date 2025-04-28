"use client";

import AddPlaceForm from "@/app/components/places/AddPlaceForm";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AddPlacePage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handlePlaceSubmit = (placeData: {
    googleMapsUrl: string;
    name: string;
    address: string;
    notes: string;
    tags: string[];
    visitPlanned?: Date;
  }) => {
    // Here we would normally send the data to a backend
    console.log("Place submitted:", placeData);

    // Show success message
    setIsSubmitted(true);

    // Reset form after a delay
    setTimeout(() => {
      setIsSubmitted(false);
    }, 5000);
  };

  return (
    <main className="pt-16 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isSubmitted ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="inline-flex items-center justify-center p-2 bg-primary-100 text-primary-600 rounded-full mb-4">
              <PlusCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-medium text-neutral-800 mb-2">
              場所を追加しました！
            </h2>
            <p className="text-neutral-600 mb-6">
              あなたのマップに新しい場所が追加されました。
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/map"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                マイマップを見る
              </Link>
              <button
                onClick={() => setIsSubmitted(false)}
                className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors"
              >
                別の場所を追加
              </button>
            </div>
          </div>
        ) : (
          <AddPlaceForm onSubmit={handlePlaceSubmit} />
        )}
      </div>
    </main>
  );
}
