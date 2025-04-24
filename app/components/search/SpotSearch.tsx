"use client";

import React, { useState, useCallback } from "react";
import { Command } from "cmdk";
import { Search, MapPin, Clock, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SpotSearchResult {
  name: string;
  address: string;
  placeId: string;
  latitude: number;
  longitude: number;
}

interface SpotSearchProps {
  onSpotSelect: (spot: SpotSearchResult) => void;
}

const SpotSearch: React.FC<SpotSearchProps> = ({ onSpotSelect }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SpotSearchResult[]>([]);

  // Mock recent searches
  const recentSearches = [
    { name: "渋谷スクランブルスクエア", address: "東京都渋谷区渋谷2-24-12" },
    { name: "代官山 蔦屋書店", address: "東京都渋谷区猿楽町17-5" },
  ];

  // Mock search function (replace with actual Google Places API call)
  const handleSearch = useCallback(async (value: string) => {
    setLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock results
    const mockResults = [
      {
        name: "渋谷スクランブルスクエア",
        address: "東京都渋谷区渋谷2-24-12",
        placeId: "mock1",
        latitude: 35.658,
        longitude: 139.7016,
      },
      {
        name: "代官山 蔦屋書店",
        address: "東京都渋谷区猿楽町17-5",
        placeId: "mock2",
        latitude: 35.6496,
        longitude: 139.7018,
      },
    ].filter(
      (item) =>
        item.name.toLowerCase().includes(value.toLowerCase()) ||
        item.address.toLowerCase().includes(value.toLowerCase())
    );

    setResults(mockResults);
    setLoading(false);
  }, []);

  return (
    <div className="relative">
      <Command className="relative rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-white">
        <div className="flex items-center border-b border-gray-100 px-3">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <Command.Input
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              handleSearch(value);
            }}
            className="flex-1 px-3 py-3 text-sm outline-none placeholder:text-gray-400"
            placeholder="場所を検索..."
            onFocus={() => setOpen(true)}
          />
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-100"
            >
              <Command.List className="max-h-[300px] overflow-y-auto p-2">
                {search === "" ? (
                  <>
                    <Command.Group heading="最近の検索">
                      {recentSearches.map((item, index) => (
                        <Command.Item
                          key={index}
                          className="flex items-center px-3 py-2 rounded-md text-sm hover:bg-gray-100 cursor-pointer"
                          onSelect={() => {
                            onSpotSelect({
                              ...item,
                              placeId: `recent${index}`,
                              latitude: 35.658,
                              longitude: 139.7016,
                            });
                            setOpen(false);
                          }}
                        >
                          <Clock className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">
                              {item.address}
                            </div>
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>
                    <Command.Group heading="おすすめ">
                      <Command.Item className="flex items-center px-3 py-2 rounded-md text-sm hover:bg-gray-100 cursor-pointer">
                        <Star className="h-4 w-4 text-amber-400 mr-2 flex-shrink-0" />
                        <div>
                          <div className="font-medium">人気のスポット</div>
                          <div className="text-xs text-gray-500">
                            今週よく保存されている場所
                          </div>
                        </div>
                      </Command.Item>
                    </Command.Group>
                  </>
                ) : loading ? (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    検索中...
                  </div>
                ) : results.length > 0 ? (
                  <Command.Group>
                    {results.map((item, index) => (
                      <Command.Item
                        key={index}
                        className="flex items-center px-3 py-2 rounded-md text-sm hover:bg-gray-100 cursor-pointer"
                        onSelect={() => {
                          onSpotSelect(item);
                          setOpen(false);
                        }}
                      >
                        <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500">
                            {item.address}
                          </div>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    検索結果が見つかりませんでした
                  </div>
                )}
              </Command.List>
            </motion.div>
          )}
        </AnimatePresence>
      </Command>

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
};

export default SpotSearch;
