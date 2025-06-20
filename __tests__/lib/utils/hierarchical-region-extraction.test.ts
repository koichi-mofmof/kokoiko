/**
 * 階層地域抽出ユーティリティのテスト
 */

import {
  extractHierarchicalRegion,
  extractHierarchicalRegionSafe,
  validateHierarchicalRegion,
  getStateLabel,
  getAdminAreaTypeLabel,
  type HierarchicalRegion,
} from "@/lib/utils/hierarchical-region-extraction";

// テスト用のモックデータ
const createAddressComponent = (
  longText: string,
  shortText: string,
  types: string[]
) => ({
  longText,
  shortText,
  types,
  languageCode: "ja",
});

describe("hierarchical-region-extraction", () => {
  describe("extractHierarchicalRegion", () => {
    test("日本の都道府県を正しく抽出", () => {
      const addressComponents = [
        createAddressComponent("日本", "JP", ["country"]),
        createAddressComponent("東京都", "東京都", [
          "administrative_area_level_1",
        ]),
        createAddressComponent("渋谷区", "渋谷区", [
          "administrative_area_level_2",
        ]),
      ];

      const result = extractHierarchicalRegion(addressComponents);

      expect(result).toEqual({
        countryCode: "JP",
        countryName: "日本",
        adminAreaLevel1: "東京都",
        adminAreaLevel1Type: "prefecture",
        hierarchy: {
          level1: "日本",
          level2: "東京都",
        },
      });
    });

    test("アメリカの州を正しく抽出", () => {
      const addressComponents = [
        createAddressComponent("United States", "US", ["country"]),
        createAddressComponent("California", "CA", [
          "administrative_area_level_1",
        ]),
        createAddressComponent("Los Angeles County", "Los Angeles County", [
          "administrative_area_level_2",
        ]),
      ];

      const result = extractHierarchicalRegion(addressComponents);

      expect(result).toEqual({
        countryCode: "US",
        countryName: "United States",
        adminAreaLevel1: "California",
        adminAreaLevel1Type: "state",
        hierarchy: {
          level1: "United States",
          level2: "California",
        },
      });
    });

    test("フランスの地域を正しく抽出", () => {
      const addressComponents = [
        createAddressComponent("France", "FR", ["country"]),
        createAddressComponent("Île-de-France", "Île-de-France", [
          "administrative_area_level_1",
        ]),
      ];

      const result = extractHierarchicalRegion(addressComponents);

      expect(result).toEqual({
        countryCode: "FR",
        countryName: "France",
        adminAreaLevel1: "Île-de-France",
        adminAreaLevel1Type: "region",
        hierarchy: {
          level1: "France",
          level2: "Île-de-France",
        },
      });
    });

    test("administrative_area_level_1がない場合", () => {
      const addressComponents = [
        createAddressComponent("Singapore", "SG", ["country"]),
      ];

      const result = extractHierarchicalRegion(addressComponents);

      expect(result).toEqual({
        countryCode: "SG",
        countryName: "Singapore",
        adminAreaLevel1: undefined,
        adminAreaLevel1Type: "region", // デフォルト値
        hierarchy: {
          level1: "Singapore",
        },
      });
    });

    test("国情報がない場合", () => {
      const addressComponents = [
        createAddressComponent("Tokyo", "Tokyo", [
          "administrative_area_level_1",
        ]),
      ];

      const result = extractHierarchicalRegion(addressComponents);

      expect(result).toEqual({
        countryCode: "",
        countryName: "",
        adminAreaLevel1: "Tokyo",
        adminAreaLevel1Type: "region", // デフォルト値
        hierarchy: {
          level1: "",
          level2: "Tokyo",
        },
      });
    });
  });

  describe("validateHierarchicalRegion", () => {
    test("有効な地域情報の場合", () => {
      const region: HierarchicalRegion = {
        countryCode: "JP",
        countryName: "日本",
        adminAreaLevel1: "東京都",
        adminAreaLevel1Type: "prefecture",
        hierarchy: {
          level1: "日本",
          level2: "東京都",
        },
      };

      const result = validateHierarchicalRegion(region);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test("必須フィールドが不足している場合", () => {
      const region: HierarchicalRegion = {
        countryCode: "",
        countryName: "",
        adminAreaLevel1Type: "prefecture",
        hierarchy: {
          level1: "",
        },
      };

      const result = validateHierarchicalRegion(region);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("countryCode is required");
      expect(result.errors).toContain("countryName is required");
      expect(result.errors).toContain(
        "hierarchy.level1 (country name) is required"
      );
    });

    test("国コードの形式が不正な場合", () => {
      const region: HierarchicalRegion = {
        countryCode: "INVALID",
        countryName: "Test Country",
        adminAreaLevel1Type: "state",
        hierarchy: {
          level1: "Test Country",
        },
      };

      const result = validateHierarchicalRegion(region);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "countryCode must be a valid ISO 3166-1 alpha-2 code"
      );
    });

    test("階層の一貫性がない場合", () => {
      const region: HierarchicalRegion = {
        countryCode: "JP",
        countryName: "日本",
        adminAreaLevel1: "東京都",
        adminAreaLevel1Type: "prefecture",
        hierarchy: {
          level1: "Japan", // 不一致
          level2: "Tokyo", // 不一致
        },
      };

      const result = validateHierarchicalRegion(region);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "hierarchy.level1 must match countryName"
      );
      expect(result.errors).toContain(
        "hierarchy.level2 must match adminAreaLevel1"
      );
    });
  });

  describe("extractHierarchicalRegionSafe", () => {
    test("有効なaddressComponentsの場合", () => {
      const addressComponents = [
        createAddressComponent("日本", "JP", ["country"]),
        createAddressComponent("大阪府", "大阪府", [
          "administrative_area_level_1",
        ]),
      ];

      const result = extractHierarchicalRegionSafe(addressComponents);

      expect(result).not.toBeNull();
      expect(result?.countryCode).toBe("JP");
      expect(result?.adminAreaLevel1).toBe("大阪府");
    });

    test("空のaddressComponentsの場合", () => {
      const result = extractHierarchicalRegionSafe([]);

      expect(result).toBeNull();
    });

    test("nullのaddressComponentsの場合", () => {
      const result = extractHierarchicalRegionSafe(null as any);

      expect(result).toBeNull();
    });

    test("不正なデータでエラーが発生した場合", () => {
      // console.warnをモック
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = extractHierarchicalRegionSafe([
        createAddressComponent("", "", ["country"]),
      ]);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("getStateLabel", () => {
    test("各国の地域ラベルを正しく取得", () => {
      expect(getStateLabel("JP")).toBe("都道府県");
      expect(getStateLabel("US")).toBe("州");
      expect(getStateLabel("CA")).toBe("州・準州");
      expect(getStateLabel("AU")).toBe("州・特別地域");
      expect(getStateLabel("CN")).toBe("省・直轄市");
      expect(getStateLabel("DE")).toBe("州");
      expect(getStateLabel("FR")).toBe("地域圏");
      expect(getStateLabel("IT")).toBe("州");
      expect(getStateLabel("ES")).toBe("自治州");
      expect(getStateLabel("GB")).toBe("地域");
    });

    test("未定義の国コードの場合はデフォルトラベル", () => {
      expect(getStateLabel("XX")).toBe("地域");
    });
  });

  describe("getAdminAreaTypeLabel", () => {
    test("各地域タイプの日本語ラベルを正しく取得", () => {
      expect(getAdminAreaTypeLabel("prefecture")).toBe("都道府県");
      expect(getAdminAreaTypeLabel("state")).toBe("州");
      expect(getAdminAreaTypeLabel("province")).toBe("省・準州");
      expect(getAdminAreaTypeLabel("region")).toBe("地域");
    });
  });

  describe("地域タイプの決定", () => {
    test("主要国の地域タイプが正しく設定されている", () => {
      const testCases = [
        { country: "JP", expected: "prefecture" },
        { country: "US", expected: "state" },
        { country: "CA", expected: "province" },
        { country: "AU", expected: "state" },
        { country: "CN", expected: "province" },
        { country: "DE", expected: "state" },
        { country: "FR", expected: "region" },
        { country: "IT", expected: "region" },
        { country: "ES", expected: "region" },
        { country: "GB", expected: "region" },
        { country: "IN", expected: "state" },
        { country: "BR", expected: "state" },
        { country: "RU", expected: "region" },
        { country: "MX", expected: "state" },
        { country: "AR", expected: "province" },
      ];

      testCases.forEach(({ country, expected }) => {
        const addressComponents = [
          createAddressComponent("Test Country", country, ["country"]),
          createAddressComponent("Test Region", "Test Region", [
            "administrative_area_level_1",
          ]),
        ];

        const result = extractHierarchicalRegion(addressComponents);
        expect(result.adminAreaLevel1Type).toBe(expected);
      });
    });
  });

  describe("エッジケース", () => {
    test("複数のcountryタイプがある場合、最初のものを使用", () => {
      const addressComponents = [
        createAddressComponent("First Country", "FC", ["country"]),
        createAddressComponent("Second Country", "SC", ["country"]),
      ];

      const result = extractHierarchicalRegion(addressComponents);

      expect(result.countryCode).toBe("FC");
      expect(result.countryName).toBe("First Country");
    });

    test("複数のadministrative_area_level_1がある場合、最初のものを使用", () => {
      const addressComponents = [
        createAddressComponent("Test Country", "TC", ["country"]),
        createAddressComponent("First Region", "FR", [
          "administrative_area_level_1",
        ]),
        createAddressComponent("Second Region", "SR", [
          "administrative_area_level_1",
        ]),
      ];

      const result = extractHierarchicalRegion(addressComponents);

      expect(result.adminAreaLevel1).toBe("First Region");
      expect(result.hierarchy.level2).toBe("First Region");
    });

    test("特殊文字を含む地域名", () => {
      const addressComponents = [
        createAddressComponent("Test Country", "TC", ["country"]),
        createAddressComponent("São Paulo", "SP", [
          "administrative_area_level_1",
        ]),
      ];

      const result = extractHierarchicalRegion(addressComponents);

      expect(result.adminAreaLevel1).toBe("São Paulo");
      expect(result.hierarchy.level2).toBe("São Paulo");
    });
  });
});
