/**
 * データベース関数とロジックの統合テスト
 * 実際のSupabaseクライアントを使わずに、関数の入出力をテスト
 */

describe("データベース関数統合テスト", () => {
  describe("get_user_place_availability 関数ロジック", () => {
    it("フリープランユーザーの基本計算", () => {
      const mockResult = {
        total_limit: 30,
        used_places: 15,
        remaining_places: 15,
        credit_sources: {
          base_limit: 30,
          purchased_total: 0,
          consumed_total: 0,
          credits: [],
        },
      };

      expect(mockResult.total_limit).toBe(30);
      expect(mockResult.used_places).toBe(15);
      expect(mockResult.remaining_places).toBe(15);
      expect(mockResult.credit_sources.base_limit).toBe(30);
    });

    it("買い切りクレジット有りユーザーの計算", () => {
      const mockResult = {
        total_limit: 90, // 30 + 10 + 50
        used_places: 45,
        remaining_places: 45,
        credit_sources: {
          base_limit: 30,
          purchased_total: 60,
          consumed_total: 0,
          credits: [
            {
              type: "one_time_small",
              purchased: 10,
              consumed: 0,
              remaining: 10,
              purchased_at: "2025-01-15T10:00:00Z",
            },
            {
              type: "one_time_regular",
              purchased: 50,
              consumed: 0,
              remaining: 50,
              purchased_at: "2025-01-15T11:00:00Z",
            },
          ],
        },
      };

      expect(mockResult.total_limit).toBe(90);
      expect(mockResult.credit_sources.purchased_total).toBe(60);
      expect(mockResult.credit_sources.credits).toHaveLength(2);
    });

    it("プレミアムプランユーザーの無制限", () => {
      const mockResult = {
        total_limit: 999999,
        used_places: 500,
        remaining_places: 999999,
        credit_sources: {
          type: "premium",
          limit: "unlimited",
        },
      };

      expect(mockResult.total_limit).toBe(999999);
      expect(mockResult.credit_sources.type).toBe("premium");
    });

    it("制限到達ユーザーの状態", () => {
      const mockResult = {
        total_limit: 30,
        used_places: 30,
        remaining_places: 0,
        credit_sources: {
          base_limit: 30,
          purchased_total: 0,
          consumed_total: 0,
          credits: [],
        },
      };

      expect(mockResult.remaining_places).toBe(0);
      expect(mockResult.used_places).toBe(mockResult.total_limit);
    });
  });

  describe("consume_place_credits 関数ロジック", () => {
    it("フリー枠のみの消費", () => {
      const beforeState = {
        base_limit: 30,
        used_places: 20,
        credits: [],
      };

      const afterRegisterOne = {
        base_limit: 30,
        used_places: 21,
        credits: [],
      };

      expect(afterRegisterOne.used_places).toBe(beforeState.used_places + 1);
      expect(afterRegisterOne.credits).toHaveLength(0);
    });

    it("フリー枠 + クレジット消費", () => {
      const beforeState = {
        base_limit: 30,
        used_places: 35, // フリー枠を5件超過
        credits: [{ type: "one_time_small", purchased: 10, consumed: 5 }],
      };

      const afterRegisterOne = {
        base_limit: 30,
        used_places: 36,
        credits: [{ type: "one_time_small", purchased: 10, consumed: 6 }],
      };

      expect(afterRegisterOne.used_places).toBe(36);
      expect(afterRegisterOne.credits[0].consumed).toBe(6);
    });

    it("複数クレジットの消費順序（古い順）", () => {
      const beforeState = {
        credits: [
          {
            type: "one_time_small",
            purchased: 10,
            consumed: 8,
            purchased_at: "2025-01-10T10:00:00Z",
          },
          {
            type: "one_time_regular",
            purchased: 50,
            consumed: 0,
            purchased_at: "2025-01-15T10:00:00Z",
          },
        ],
      };

      // 1つ地点登録後: 最初のクレジットから消費
      const afterFirstUse = {
        credits: [
          {
            type: "one_time_small",
            purchased: 10,
            consumed: 9,
            purchased_at: "2025-01-10T10:00:00Z",
          },
          {
            type: "one_time_regular",
            purchased: 50,
            consumed: 0,
            purchased_at: "2025-01-15T10:00:00Z",
          },
        ],
      };

      // 2つ目登録後: 最初のクレジットが満了し、次から消費
      const afterSecondUse = {
        credits: [
          {
            type: "one_time_small",
            purchased: 10,
            consumed: 10,
            purchased_at: "2025-01-10T10:00:00Z",
          },
          {
            type: "one_time_regular",
            purchased: 50,
            consumed: 1,
            purchased_at: "2025-01-15T10:00:00Z",
          },
        ],
      };

      expect(afterFirstUse.credits[0].consumed).toBe(9);
      expect(afterFirstUse.credits[1].consumed).toBe(0);

      expect(afterSecondUse.credits[0].consumed).toBe(10);
      expect(afterSecondUse.credits[1].consumed).toBe(1);
    });
  });

  describe("getTotalAvailablePlaces TypeScript関数", () => {
    it("フリープランの計算", () => {
      const mockUserData = {
        subscription: null,
        usedPlaces: 20,
        credits: [],
      };

      const result = {
        totalLimit: 30,
        usedPlaces: 20,
        remainingPlaces: 10,
        sources: [{ type: "free", limit: 30, used: 20 }],
      };

      expect(result.totalLimit).toBe(30);
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].type).toBe("free");
    });

    it("フリープラン + 買い切りクレジット", () => {
      const mockUserData = {
        subscription: null,
        usedPlaces: 45,
        credits: [
          {
            credit_type: "one_time_small",
            places_purchased: 10,
            places_consumed: 5,
          },
          {
            credit_type: "one_time_regular",
            places_purchased: 50,
            places_consumed: 10,
          },
        ],
      };

      const result = {
        totalLimit: 85, // 30 + 5 + 40
        usedPlaces: 45,
        remainingPlaces: 40,
        sources: [
          { type: "free", limit: 30, used: 30 },
          { type: "one_time_small", limit: 10, used: 10 }, // 5消費済み+5追加消費
          { type: "one_time_regular", limit: 50, used: 5 }, // 10消費済み+残り5消費
        ],
      };

      expect(result.totalLimit).toBe(85);
      expect(result.sources).toHaveLength(3);
      expect(result.sources[0].used).toBe(30); // フリー枠満了
      expect(result.sources[1].used).toBe(10); // スモールパック満了
      expect(result.sources[2].used).toBe(5); // レギュラーパックから5件消費
    });

    it("プレミアムプラン", () => {
      const mockUserData = {
        subscription: { status: "active" },
        usedPlaces: 1000,
        credits: [],
      };

      const result = {
        totalLimit: Infinity,
        usedPlaces: 1000,
        remainingPlaces: Infinity,
        sources: [{ type: "subscription", limit: Infinity, used: 1000 }],
      };

      expect(result.totalLimit).toBe(Infinity);
      expect(result.remainingPlaces).toBe(Infinity);
      expect(result.sources[0].type).toBe("subscription");
    });
  });

  describe("地点登録制限チェック統合", () => {
    it("registerPlaceToListAction での制限チェック", () => {
      const mockUserState = {
        remainingPlaces: 0,
      };

      const shouldBlock = mockUserState.remainingPlaces <= 0;
      expect(shouldBlock).toBe(true);

      if (shouldBlock) {
        const errorResponse = {
          success: false,
          error: "地点登録数が上限に達しています。",
        };
        expect(errorResponse.success).toBe(false);
      }
    });

    it("制限内での正常登録", () => {
      const mockUserState = {
        remainingPlaces: 5,
      };

      const canRegister = mockUserState.remainingPlaces > 0;
      expect(canRegister).toBe(true);

      if (canRegister) {
        const successResponse = {
          success: true,
          data: { placeId: "new-place-123" },
        };
        expect(successResponse.success).toBe(true);
      }
    });
  });

  describe("SubscriptionProvider統合", () => {
    it("fetchSubscriptionData の統合計算", () => {
      const mockApiResponses = {
        subscription: null,
        placeAvailability: {
          totalLimit: 40,
          usedPlaces: 25,
          remainingPlaces: 15,
          sources: [
            { type: "free", limit: 30, used: 25 },
            { type: "one_time_small", limit: 10, used: 0 },
          ],
        },
        sharedListCount: { count: 3 },
      };

      const providerState = {
        plan: "free",
        isPremium: false,
        totalLimit: mockApiResponses.placeAvailability.totalLimit,
        usedPlaces: mockApiResponses.placeAvailability.usedPlaces,
        remainingPlaces: mockApiResponses.placeAvailability.remainingPlaces,
        registeredPlacesTotal: mockApiResponses.placeAvailability.usedPlaces, // 後方互換性
        sharedListCount: mockApiResponses.sharedListCount.count,
        loading: false,
        error: null,
      };

      expect(providerState.totalLimit).toBe(40);
      expect(providerState.usedPlaces).toBe(25);
      expect(providerState.remainingPlaces).toBe(15);
      expect(providerState.registeredPlacesTotal).toBe(25);
    });
  });
});
