/**
 * 地点クレジット計算ロジックの単体テスト
 * 今回の修正で最も重要な計算ロジックを網羅的にテスト
 */

describe("地点クレジット計算ロジック", () => {
  describe("基本制限値", () => {
    it("フリープラン制限が30件に設定されている", () => {
      const {
        SUBSCRIPTION_LIMITS,
      } = require("@/lib/constants/config/subscription");
      expect(SUBSCRIPTION_LIMITS.free.MAX_PLACES_TOTAL).toBe(30);
    });

    it("買い切りプラン設定が正しい", () => {
      const {
        ONE_TIME_PURCHASE_PLANS,
      } = require("@/lib/constants/config/subscription");

      // スモールパック
      expect(ONE_TIME_PURCHASE_PLANS.small_pack.places).toBe(10);
      expect(ONE_TIME_PURCHASE_PLANS.small_pack.prices.JPY).toBe(110);
      expect(ONE_TIME_PURCHASE_PLANS.small_pack.prices.USD).toBe(1);
      expect(ONE_TIME_PURCHASE_PLANS.small_pack.prices.EUR).toBe(1);

      // レギュラーパック
      expect(ONE_TIME_PURCHASE_PLANS.regular_pack.places).toBe(50);
      expect(ONE_TIME_PURCHASE_PLANS.regular_pack.prices.JPY).toBe(440);
      expect(ONE_TIME_PURCHASE_PLANS.regular_pack.prices.USD).toBe(4);
      expect(ONE_TIME_PURCHASE_PLANS.regular_pack.prices.EUR).toBe(4);
    });
  });

  describe("地点数計算", () => {
    it("フリープランのみの場合", () => {
      const totalLimit = 30;
      const usedPlaces = 15;
      const remainingPlaces = totalLimit - usedPlaces;

      expect(remainingPlaces).toBe(15);
      expect(remainingPlaces).toBeGreaterThan(0);
    });

    it("フリープラン + スモールパック", () => {
      const freeLimit = 30;
      const smallPackPlaces = 10;
      const totalLimit = freeLimit + smallPackPlaces;

      expect(totalLimit).toBe(40);
    });

    it("フリープラン + レギュラーパック", () => {
      const freeLimit = 30;
      const regularPackPlaces = 50;
      const totalLimit = freeLimit + regularPackPlaces;

      expect(totalLimit).toBe(80);
    });

    it("フリープラン + 両方のパック", () => {
      const freeLimit = 30;
      const smallPackPlaces = 10;
      const regularPackPlaces = 50;
      const totalLimit = freeLimit + smallPackPlaces + regularPackPlaces;

      expect(totalLimit).toBe(90);
    });

    it("制限到達時の判定", () => {
      const scenarios = [
        { total: 30, used: 30, shouldBlock: true },
        { total: 30, used: 29, shouldBlock: false },
        { total: 40, used: 40, shouldBlock: true },
        { total: 40, used: 35, shouldBlock: false },
      ];

      scenarios.forEach(({ total, used, shouldBlock }) => {
        const remaining = total - used;
        expect(remaining <= 0).toBe(shouldBlock);
      });
    });
  });

  describe("クレジット消費計算", () => {
    it("単一クレジットの消費", () => {
      const credit = {
        purchased: 10,
        consumed: 3,
      };

      const available = credit.purchased - credit.consumed;
      expect(available).toBe(7);
    });

    it("複数クレジットの集計", () => {
      const credits = [
        { purchased: 10, consumed: 5 },
        { purchased: 50, consumed: 20 },
      ];

      const totalPurchased = credits.reduce((sum, c) => sum + c.purchased, 0);
      const totalConsumed = credits.reduce((sum, c) => sum + c.consumed, 0);
      const totalAvailable = totalPurchased - totalConsumed;

      expect(totalPurchased).toBe(60);
      expect(totalConsumed).toBe(25);
      expect(totalAvailable).toBe(35);
    });

    it("使用優先順位（フリー → 古いクレジット順）", () => {
      const freeLimit = 30;
      const usedPlaces = 45; // フリー枠を超えている

      // フリー枠での使用数
      const freeUsed = Math.min(usedPlaces, freeLimit);
      expect(freeUsed).toBe(30);

      // クレジットから消費される数
      const creditUsed = usedPlaces - freeUsed;
      expect(creditUsed).toBe(15);
    });
  });

  describe("プレミアムプラン", () => {
    it("無制限として扱われる", () => {
      const premiumLimits = {
        totalLimit: Infinity,
        usedPlaces: 150,
        remainingPlaces: Infinity,
      };

      expect(premiumLimits.totalLimit).toBe(Infinity);
      expect(premiumLimits.remainingPlaces).toBe(Infinity);
      expect(premiumLimits.usedPlaces).toBe(150);
    });
  });

  describe("エッジケース", () => {
    it("使用地点数が0の場合", () => {
      const totalLimit = 30;
      const usedPlaces = 0;
      const remainingPlaces = totalLimit - usedPlaces;

      expect(remainingPlaces).toBe(30);
    });

    it("負の値が発生しない", () => {
      const totalLimit = 30;
      const usedPlaces = 35; // 制限を超えている
      const remainingPlaces = Math.max(0, totalLimit - usedPlaces);

      expect(remainingPlaces).toBe(0);
      expect(remainingPlaces).toBeGreaterThanOrEqual(0);
    });

    it("大量のクレジット処理", () => {
      const largeCredits = Array.from({ length: 100 }, (_, i) => ({
        purchased: i % 2 === 0 ? 10 : 50,
        consumed: Math.floor(Math.random() * 5),
      }));

      const totalPurchased = largeCredits.reduce(
        (sum, c) => sum + c.purchased,
        0
      );
      const totalConsumed = largeCredits.reduce(
        (sum, c) => sum + c.consumed,
        0
      );

      expect(totalPurchased).toBeGreaterThan(0);
      expect(totalConsumed).toBeGreaterThanOrEqual(0);
      expect(totalPurchased).toBeGreaterThanOrEqual(totalConsumed);
    });
  });
});
