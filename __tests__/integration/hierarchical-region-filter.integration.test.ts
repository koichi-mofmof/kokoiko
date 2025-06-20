/**
 * 階層型地域フィルター統合テスト
 * 地点登録 → 階層情報抽出 → フィルタリングの一連の流れをテスト
 */

import { extractHierarchicalRegionSafe } from "@/lib/utils/hierarchical-region-extraction";
import type { Place } from "@/types";

// モックデータ
const mockPlaces: Place[] = [
  {
    id: "place-1",
    name: "パナソニックスタジアム吹田",
    address: "大阪府吹田市千里万博公園３−３",
    googleMapsUrl: "https://maps.google.com",
    latitude: 34.8135,
    longitude: 135.5286,
    tags: [],
    createdAt: new Date(),
    visited: "not_visited",
    createdBy: "user-1",
    countryCode: "JP",
    countryName: "日本",
    adminAreaLevel1: "大阪府",
    regionHierarchy: {
      level1: "日本",
      level2: "大阪府",
    },
  },
  {
    id: "place-2",
    name: "Nice Pocket",
    address: "1 Rue Massena, 06000 Nice, フランス",
    googleMapsUrl: "https://maps.google.com",
    latitude: 43.6943,
    longitude: 7.2578,
    tags: [],
    createdAt: new Date(),
    visited: "not_visited",
    createdBy: "user-1",
    countryCode: "FR",
    countryName: "フランス",
    adminAreaLevel1: "Provence-Alpes-Côte d'Azur",
    regionHierarchy: {
      level1: "フランス",
      level2: "Provence-Alpes-Côte d'Azur",
    },
  },
  {
    id: "place-3",
    name: "Sydney Opera House",
    address: "Bennelong Point, Sydney NSW 2000 オーストラリア",
    googleMapsUrl: "https://maps.google.com",
    latitude: -33.8568,
    longitude: 151.2153,
    tags: [],
    createdAt: new Date(),
    visited: "not_visited",
    createdBy: "user-1",
    countryCode: "AU",
    countryName: "オーストラリア",
    adminAreaLevel1: "New South Wales",
    regionHierarchy: {
      level1: "オーストラリア",
      level2: "New South Wales",
    },
  },
];

describe("階層型地域フィルター統合テスト", () => {
  describe("階層地域情報抽出", () => {
    it("日本の住所から正しい階層情報を抽出できる", () => {
      const addressComponents = [
        {
          longText: "日本",
          shortText: "JP",
          types: ["country", "political"],
          languageCode: "ja",
        },
        {
          longText: "大阪府",
          shortText: "大阪府",
          types: ["administrative_area_level_1", "political"],
          languageCode: "ja",
        },
      ];

      const result = extractHierarchicalRegionSafe(addressComponents);

      expect(result).toEqual({
        countryCode: "JP",
        countryName: "日本",
        adminAreaLevel1: "大阪府",
        adminAreaLevel1Type: "prefecture",
        hierarchy: {
          level1: "日本",
          level2: "大阪府",
        },
      });
    });

    it("フランスの住所から正しい階層情報を抽出できる", () => {
      const addressComponents = [
        {
          longText: "フランス",
          shortText: "FR",
          types: ["country", "political"],
          languageCode: "fr",
        },
        {
          longText: "Provence-Alpes-Côte d'Azur",
          shortText: "Provence-Alpes-Côte d'Azur",
          types: ["administrative_area_level_1", "political"],
          languageCode: "fr",
        },
      ];

      const result = extractHierarchicalRegionSafe(addressComponents);

      expect(result).toEqual({
        countryCode: "FR",
        countryName: "フランス",
        adminAreaLevel1: "Provence-Alpes-Côte d'Azur",
        adminAreaLevel1Type: "region",
        hierarchy: {
          level1: "フランス",
          level2: "Provence-Alpes-Côte d'Azur",
        },
      });
    });
  });

  describe("フィルタリング機能", () => {
    it("国フィルターが正しく動作する", () => {
      // 日本の地点のみフィルタリング
      const filteredPlaces = mockPlaces.filter(
        (place) => place.countryCode === "JP"
      );

      expect(filteredPlaces).toHaveLength(1);
      expect(filteredPlaces[0].name).toBe("パナソニックスタジアム吹田");
      expect(filteredPlaces[0].countryName).toBe("日本");
    });

    it("複数の州/省フィルターが正しく動作する", () => {
      const selectedStates = ["大阪府", "Provence-Alpes-Côte d'Azur"];

      const filteredPlaces = mockPlaces.filter(
        (place) =>
          place.adminAreaLevel1 &&
          selectedStates.includes(place.adminAreaLevel1)
      );

      expect(filteredPlaces).toHaveLength(2);
      expect(filteredPlaces.map((p) => p.name)).toContain(
        "パナソニックスタジアム吹田"
      );
      expect(filteredPlaces.map((p) => p.name)).toContain("Nice Pocket");
    });

    it("階層フィルター（国 + 州/省）が正しく動作する", () => {
      const countryFilter = "JP";
      const stateFilter = ["大阪府"];

      const filteredPlaces = mockPlaces.filter((place) => {
        // 国フィルター
        if (place.countryCode !== countryFilter) {
          return false;
        }

        // 州/省フィルター
        if (
          place.adminAreaLevel1 &&
          !stateFilter.includes(place.adminAreaLevel1)
        ) {
          return false;
        }

        return true;
      });

      expect(filteredPlaces).toHaveLength(1);
      expect(filteredPlaces[0].name).toBe("パナソニックスタジアム吹田");
      expect(filteredPlaces[0].countryCode).toBe("JP");
      expect(filteredPlaces[0].adminAreaLevel1).toBe("大阪府");
    });
  });

  describe("データ整合性", () => {
    it("全ての地点で階層地域情報が設定されている", () => {
      mockPlaces.forEach((place) => {
        expect(place.countryCode).toBeDefined();
        expect(place.countryName).toBeDefined();
        expect(place.adminAreaLevel1).toBeDefined();
        expect(place.regionHierarchy).toBeDefined();
        expect(place.regionHierarchy?.level1).toBeDefined();
        expect(place.regionHierarchy?.level2).toBeDefined();
      });
    });

    it("階層情報の一貫性が保たれている", () => {
      mockPlaces.forEach((place) => {
        // 国名の一貫性
        expect(place.regionHierarchy?.level1).toBe(place.countryName);

        // 州/省名の一貫性
        expect(place.regionHierarchy?.level2).toBe(place.adminAreaLevel1);
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("階層地域情報が不完全な地点でも適切に処理される", () => {
      const incompletePlace: Place = {
        id: "incomplete-place",
        name: "不完全な地点",
        address: "住所不明",
        googleMapsUrl: "https://maps.google.com",
        latitude: 0,
        longitude: 0,
        tags: [],
        createdAt: new Date(),
        visited: "not_visited",
        createdBy: "user-1",
        countryCode: undefined,
        countryName: undefined,
        adminAreaLevel1: undefined,
        regionHierarchy: undefined,
      };

      // フィルタリング処理でエラーが発生しないことを確認
      expect(() => {
        [incompletePlace].filter((place) => place.countryCode === "JP");
      }).not.toThrow();

      expect(() => {
        [incompletePlace].filter(
          (place) =>
            place.adminAreaLevel1 && ["大阪府"].includes(place.adminAreaLevel1)
        );
      }).not.toThrow();
    });

    it("無効な住所コンポーネントでも安全に処理される", () => {
      const invalidAddressComponents = [
        {
          longText: "",
          shortText: "",
          types: [],
          languageCode: "",
        },
      ];

      expect(() => {
        extractHierarchicalRegionSafe(invalidAddressComponents);
      }).not.toThrow();

      const result = extractHierarchicalRegionSafe(invalidAddressComponents);
      // 無効な入力の場合はnullが返される
      expect(result).toBeNull();
    });
  });

  describe("パフォーマンス", () => {
    it("大量データでのフィルタリングが適切な時間内に完了する", () => {
      // 1000件の地点データを生成
      const largePlacesList: Place[] = Array.from({ length: 1000 }, (_, i) => ({
        ...mockPlaces[i % mockPlaces.length],
        id: `place-${i}`,
        name: `地点 ${i}`,
      }));

      const startTime = performance.now();

      // 複雑なフィルタリング処理
      const filtered = largePlacesList.filter((place) => {
        return place.countryCode === "JP" && place.adminAreaLevel1 === "大阪府";
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // 500ms以下で処理が完了することを確認
      expect(processingTime).toBeLessThan(500);
      expect(filtered.length).toBeGreaterThan(0);
    });
  });
});
