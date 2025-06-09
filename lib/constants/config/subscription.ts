// サブスクリプションプランごとの機能制限定数
export const SUBSCRIPTION_LIMITS = {
  free: {
    MAX_PLACES_PER_MONTH: 10,
    MAX_SHARED_LISTS: 1,
  },
  premium: {
    MAX_PLACES_PER_MONTH: null, // 無制限
    MAX_SHARED_LISTS: null, // 無制限
  },
};
