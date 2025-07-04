// サブスクリプションプランごとの機能制限定数
export const SUBSCRIPTION_LIMITS = {
  free: {
    MAX_PLACES_TOTAL: 20, // 累計地点登録制限
    MAX_SHARED_LISTS: 1,
  },
  premium: {
    MAX_PLACES_TOTAL: null, // 無制限
    MAX_SHARED_LISTS: null, // 無制限
  },
};
