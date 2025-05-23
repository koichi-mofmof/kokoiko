import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProfileSettings } from "../../app/settings/_components/profile-settings";
import PlaceList from "../../app/components/places/PlaceList";
import { mockPlaces } from "../../lib/mockData";

// コンポーネントレンダリング時間測定用ヘルパー関数
const measureRenderTime = async (Component, props = {}, iterations = 5) => {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    render(<Component {...props} />);
    const end = performance.now();
    times.push(end - start);
  }

  // 平均時間を計算
  const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;

  return {
    avgTime,
    times,
    min: Math.min(...times),
    max: Math.max(...times),
  };
};

// モックの設定
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn().mockReturnValue({ toast: jest.fn() }),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn().mockReturnValue({
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
      }),
    },
    from: jest.fn().mockReturnValue({
      upsert: jest.fn().mockResolvedValue({ error: null }),
    }),
  }),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// UIコンポーネントのモック
jest.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, className }) => (
    <div className={className} data-testid="avatar">
      {children}
    </div>
  ),
  AvatarImage: ({ src, alt }) => (
    <img src={src} alt={alt} data-testid="avatar-image" />
  ),
  AvatarFallback: ({ children }) => (
    <div data-testid="avatar-fallback">{children}</div>
  ),
}));

// Cardコンポーネントのモック
jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...rest }) => <div {...rest}>{children}</div>,
  CardContent: ({ children, ...rest }) => <div {...rest}>{children}</div>,
  CardTitle: ({ children, ...rest }) => <div {...rest}>{children}</div>,
}));

// Next.jsのLinkコンポーネントをモック
jest.mock("next/link", () => {
  return ({ children, href, ...rest }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

// アイコンコンポーネントをモック
jest.mock("lucide-react", () => ({
  Calendar: () => <span data-testid="calendar-icon">カレンダーアイコン</span>,
  Check: () => <span data-testid="check-icon">チェックアイコン</span>,
  Circle: () => <span data-testid="circle-icon">サークルアイコン</span>,
  ExternalLink: () => (
    <span data-testid="external-link-icon">外部リンクアイコン</span>
  ),
  MapPin: () => <span data-testid="map-pin-icon">地図ピンアイコン</span>,
  Tag: () => <span data-testid="tag-icon">タグアイコン</span>,
  Upload: () => <span data-testid="upload-icon">アップロードアイコン</span>,
  User: () => <span data-testid="user-icon">ユーザーアイコン</span>,
  Mail: () => <span data-testid="mail-icon">メールアイコン</span>,
  Info: () => <span data-testid="info-icon">情報アイコン</span>,
  ChevronRight: () => (
    <span data-testid="chevron-right-icon">シェブロン右アイコン</span>
  ),
  // 他のアイコンも必要に応じて追加
}));

// モックデータ
const mockInitialData = {
  userId: "user123",
  username: "testuser",
  displayName: "テストユーザー",
  bio: "これはテスト用の自己紹介です。",
  avatarUrl: "https://example.com/avatar.jpg",
  avatarPath: "profile_images/user123/avatar.jpg",
};

describe("コンポーネントパフォーマンステスト", () => {
  it("ProfileSettingsコンポーネントのレンダリング時間を測定", async () => {
    const result = await measureRenderTime(ProfileSettings, {
      initialData: mockInitialData,
    });

    console.log(
      `ProfileSettings レンダリング時間: ${result.avgTime.toFixed(
        2
      )}ms (${result.min.toFixed(2)}ms～${result.max.toFixed(2)}ms)`
    );

    // レンダリング時間の上限を設定し、それを超えないことを確認
    expect(result.avgTime).toBeLessThan(250); // 250msを上限とする例
  });

  it("PlaceListコンポーネントのレンダリング時間を測定", async () => {
    const mockOnPlaceSelect = jest.fn();

    // 10件の場所データ
    const smallPlaces = mockPlaces.slice(0, 10);
    const smallResult = await measureRenderTime(PlaceList, {
      places: smallPlaces,
      onPlaceSelect: mockOnPlaceSelect,
    });

    console.log(
      `PlaceList (10件) レンダリング時間: ${smallResult.avgTime.toFixed(
        2
      )}ms (${smallResult.min.toFixed(2)}ms～${smallResult.max.toFixed(2)}ms)`
    );
    expect(smallResult.avgTime).toBeLessThan(150); // 150msを上限とする例

    // mockPlacesが10件以上ある場合のみ実行
    if (mockPlaces.length >= 30) {
      // 30件の場所データ
      const largePlaces = mockPlaces.slice(0, 30);
      const largeResult = await measureRenderTime(PlaceList, {
        places: largePlaces,
        onPlaceSelect: mockOnPlaceSelect,
      });

      console.log(
        `PlaceList (30件) レンダリング時間: ${largeResult.avgTime.toFixed(
          2
        )}ms (${largeResult.min.toFixed(2)}ms～${largeResult.max.toFixed(2)}ms)`
      );
      expect(largeResult.avgTime).toBeLessThan(250); // 250msを上限とする例

      // データ増加に対するパフォーマンス比例関係の確認
      // 理想的には、3倍のデータで3倍以下の時間増加であることを確認
      const ratio = largeResult.avgTime / smallResult.avgTime;
      console.log(
        `データサイズとレンダリング時間の比例関係: ${ratio.toFixed(2)}倍`
      );
      expect(ratio).toBeLessThan(3.5); // 3.5倍以下を期待
    }
  });

  // メモリリークの検出テスト
  it("連続レンダリングでメモリリークがないことを確認", async () => {
    const mockOnPlaceSelect = jest.fn();

    // メモリ使用量を取得する関数（Node.jsの場合）
    const getMemoryUsage = () => {
      const used = process.memoryUsage();
      return used.heapUsed / 1024 / 1024; // MBに変換
    };

    const initialMemory = getMemoryUsage();
    console.log(`初期メモリ使用量: ${initialMemory.toFixed(2)}MB`);

    // 20回連続でコンポーネントをレンダリング
    const iterations = 20;
    for (let i = 0; i < iterations; i++) {
      render(
        <PlaceList
          places={mockPlaces.slice(0, 10)}
          onPlaceSelect={mockOnPlaceSelect}
        />
      );
    }

    const finalMemory = getMemoryUsage();
    console.log(
      `${iterations}回レンダリング後のメモリ使用量: ${finalMemory.toFixed(2)}MB`
    );

    // メモリ使用量の増加率が一定以下であることを確認
    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreasePerIteration = memoryIncrease / iterations;
    console.log(
      `レンダリング1回あたりのメモリ増加量: ${memoryIncreasePerIteration.toFixed(
        2
      )}MB`
    );

    // 1回あたり2MB以下のメモリ増加を期待（Jest環境のオーバーヘッドを考慮して緩和）
    expect(memoryIncreasePerIteration).toBeLessThan(2.0);
  });
});
