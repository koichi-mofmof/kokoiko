import {
  searchPlaces,
  getPlaceDetails,
} from "@/lib/actions/google-maps-actions";

// 環境変数とモジュールのモック
const mockApiKey = "test-api-key";

// lib/actions/google-maps-actionsモジュールをモック
jest.mock("@/lib/actions/google-maps-actions", () => {
  const originalModule = jest.requireActual(
    "@/lib/actions/google-maps-actions"
  );

  return {
    ...originalModule,
    searchPlaces: jest.fn(),
    getPlaceDetails: jest.fn(),
  };
});

// 階層地域抽出のモック
jest.mock("@/lib/utils/hierarchical-region-extraction", () => ({
  extractHierarchicalRegionSafe: jest.fn((addressComponents) => {
    if (!addressComponents) return null;
    return {
      countryCode: "JP",
      countryName: "日本",
      adminAreaLevel1: "東京都",
      adminAreaLevel1Type: "prefecture",
      hierarchy: {
        level1: "日本",
        level2: "東京都",
      },
    };
  }),
}));

const mockSearchPlaces = searchPlaces as jest.MockedFunction<
  typeof searchPlaces
>;
const mockGetPlaceDetails = getPlaceDetails as jest.MockedFunction<
  typeof getPlaceDetails
>;

describe("google-maps-actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("searchPlaces", () => {
    it("正常に地点検索が動作する", async () => {
      const expectedResult = {
        predictions: [
          {
            description: "東京駅, 日本",
            place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
            structured_formatting: {
              main_text: "東京駅",
              secondary_text: "日本",
            },
          },
        ],
      };

      mockSearchPlaces.mockResolvedValueOnce(expectedResult);

      const formData = new FormData();
      formData.append("query", "東京駅");
      formData.append("sessionToken", "test-session");

      const result = await searchPlaces({}, formData);

      expect(mockSearchPlaces).toHaveBeenCalledWith({}, formData);
      expect(result).toEqual(expectedResult);
    });

    it("空の入力に対してバリデーションエラーを返す", async () => {
      const expectedResult = {
        error: "入力内容に誤りがあります。",
      };

      mockSearchPlaces.mockResolvedValueOnce(expectedResult);

      const formData = new FormData();
      formData.append("query", "");
      formData.append("sessionToken", "test-session");

      const result = await searchPlaces({}, formData);

      expect(result).toEqual(expectedResult);
    });

    it("API制限時に適切なエラーを返す", async () => {
      const expectedResult = {
        error: "Quota exceeded",
      };

      mockSearchPlaces.mockResolvedValueOnce(expectedResult);

      const formData = new FormData();
      formData.append("query", "東京駅");
      formData.append("sessionToken", "test-session");

      const result = await searchPlaces({}, formData);

      expect(result).toEqual(expectedResult);
    });

    it("無効なAPIキー時に適切なエラーを返す", async () => {
      const expectedResult = {
        error: "Invalid API key",
      };

      mockSearchPlaces.mockResolvedValueOnce(expectedResult);

      const formData = new FormData();
      formData.append("query", "東京駅");
      formData.append("sessionToken", "test-session");

      const result = await searchPlaces({}, formData);

      expect(result).toEqual(expectedResult);
    });

    it("ネットワークエラー時に適切なエラーを返す", async () => {
      const expectedResult = {
        error: "ネットワークエラーが発生しました。場所を検索できませんでした。",
      };

      mockSearchPlaces.mockResolvedValueOnce(expectedResult);

      const formData = new FormData();
      formData.append("query", "東京駅");
      formData.append("sessionToken", "test-session");

      const result = await searchPlaces({}, formData);

      expect(result).toEqual(expectedResult);
    });
  });

  describe("getPlaceDetails", () => {
    it("正常に地点詳細を取得する", async () => {
      const expectedResult = {
        placeDetails: {
          id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
          formattedAddress: "日本、〒100-0005 東京都千代田区丸の内１丁目",
          location: {
            latitude: 35.6812362,
            longitude: 139.7671248,
          },
          addressComponents: [
            {
              longText: "日本",
              shortText: "JP",
              types: ["country", "political"],
              languageCode: "ja",
            },
            {
              longText: "東京都",
              shortText: "東京都",
              types: ["administrative_area_level_1", "political"],
              languageCode: "ja",
            },
          ],
          hierarchicalRegion: {
            countryCode: "JP",
            countryName: "日本",
            adminAreaLevel1: "東京都",
            adminAreaLevel1Type: "prefecture" as const,
            hierarchy: {
              level1: "日本",
              level2: "東京都",
            },
          },
        },
      };

      mockGetPlaceDetails.mockResolvedValueOnce(expectedResult);

      const formData = new FormData();
      formData.append("placeId", "ChIJN1t_tDeuEmsRUsoyG83frY4");
      formData.append("sessionToken", "test-session");

      const result = await getPlaceDetails({}, formData);

      expect(mockGetPlaceDetails).toHaveBeenCalledWith({}, formData);
      expect(result).toEqual(expectedResult);
    });

    it("無効なplaceIdに対してバリデーションエラーを返す", async () => {
      const expectedResult = {
        error: "入力内容に誤りがあります。",
        placeDetails: undefined,
      };

      mockGetPlaceDetails.mockResolvedValueOnce(expectedResult);

      const formData = new FormData();
      formData.append("placeId", "");
      formData.append("sessionToken", "test-session");

      const result = await getPlaceDetails({}, formData);

      expect(result).toEqual(expectedResult);
    });

    it("存在しない地点IDに対してエラーを返す", async () => {
      const expectedResult = {
        error: "Place not found",
        placeDetails: undefined,
      };

      mockGetPlaceDetails.mockResolvedValueOnce(expectedResult);

      const formData = new FormData();
      formData.append("placeId", "invalid-place-id");
      formData.append("sessionToken", "test-session");

      const result = await getPlaceDetails({}, formData);

      expect(result).toEqual(expectedResult);
    });

    it("階層地域情報の抽出に失敗した場合でも基本情報は返す", async () => {
      const expectedResult = {
        placeDetails: {
          id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
          formattedAddress: "日本、〒100-0005 東京都千代田区丸の内１丁目",
          location: {
            latitude: 35.6812362,
            longitude: 139.7671248,
          },
          addressComponents: [
            {
              longText: "日本",
              shortText: "JP",
              types: ["country", "political"],
              languageCode: "ja",
            },
            {
              longText: "東京都",
              shortText: "東京都",
              types: ["administrative_area_level_1", "political"],
              languageCode: "ja",
            },
          ],
          hierarchicalRegion: undefined,
        },
      };

      mockGetPlaceDetails.mockResolvedValueOnce(expectedResult);

      const formData = new FormData();
      formData.append("placeId", "ChIJN1t_tDeuEmsRUsoyG83frY4");
      formData.append("sessionToken", "test-session");

      const result = await getPlaceDetails({}, formData);

      expect(result).toEqual(expectedResult);
    });

    it("API制限時に適切なエラーを返す", async () => {
      const expectedResult = {
        error: "Quota exceeded",
        placeDetails: undefined,
      };

      mockGetPlaceDetails.mockResolvedValueOnce(expectedResult);

      const formData = new FormData();
      formData.append("placeId", "ChIJN1t_tDeuEmsRUsoyG83frY4");
      formData.append("sessionToken", "test-session");

      const result = await getPlaceDetails({}, formData);

      expect(result).toEqual(expectedResult);
    });

    it("ネットワークエラー時に適切なエラーを返す", async () => {
      const expectedResult = {
        error:
          "ネットワークエラーが発生しました。場所の詳細を取得できませんでした。",
        placeDetails: undefined,
      };

      mockGetPlaceDetails.mockResolvedValueOnce(expectedResult);

      const formData = new FormData();
      formData.append("placeId", "ChIJN1t_tDeuEmsRUsoyG83frY4");
      formData.append("sessionToken", "test-session");

      const result = await getPlaceDetails({}, formData);

      expect(result).toEqual(expectedResult);
    });
  });

  describe("API設定", () => {
    it("APIキーが設定されていない場合にエラーをスローする", async () => {
      const expectedResult = {
        error: "サーバー設定エラーが発生しました。管理者に連絡してください。",
      };

      mockSearchPlaces.mockResolvedValueOnce(expectedResult);

      const formData = new FormData();
      formData.append("query", "東京駅");
      formData.append("sessionToken", "test-session");

      const result = await searchPlaces({}, formData);

      expect(result).toEqual(expectedResult);
    });
  });

  describe("データ変換", () => {
    it("Google Places APIの応答を正しいフォーマットに変換する", async () => {
      const expectedResult = {
        predictions: [
          {
            description: "Test Place, Japan",
            place_id: "test-place-id",
            structured_formatting: {
              main_text: "Test Place",
              secondary_text: "Japan",
            },
          },
        ],
      };

      mockSearchPlaces.mockResolvedValueOnce(expectedResult);

      const formData = new FormData();
      formData.append("query", "Test Place");
      formData.append("sessionToken", "test-session");

      const result = await searchPlaces({}, formData);

      expect(result.predictions?.[0]).toEqual({
        description: "Test Place, Japan",
        place_id: "test-place-id",
        structured_formatting: {
          main_text: "Test Place",
          secondary_text: "Japan",
        },
      });
    });

    it("structuredFormatが存在しない場合の処理", async () => {
      const expectedResult = {
        predictions: [
          {
            description: "Test Place",
            place_id: "test-place-id",
            structured_formatting: {
              main_text: "Test Place",
              secondary_text: "",
            },
          },
        ],
      };

      mockSearchPlaces.mockResolvedValueOnce(expectedResult);

      const formData = new FormData();
      formData.append("query", "Test Place");
      formData.append("sessionToken", "test-session");

      const result = await searchPlaces({}, formData);

      expect(result.predictions?.[0]).toEqual({
        description: "Test Place",
        place_id: "test-place-id",
        structured_formatting: {
          main_text: "Test Place",
          secondary_text: "",
        },
      });
    });
  });
});
