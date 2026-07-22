import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { FirstTimeProfileDialog } from "../../../../app/components/auth/first-time-profile-dialog";

const mockUpsert = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({ upsert: (...a: unknown[]) => mockUpsert(...a) }),
    storage: { from: () => ({ upload: jest.fn() }) },
  }),
}));

jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: jest.fn() }) }));
jest.mock("@/lib/analytics/events", () => ({
  trackOnboardingEvents: { startFirstList: jest.fn() },
}));

jest.mock("@/hooks/use-i18n", () => ({
  __esModule: true,
  useI18n: () => ({ t: (key: string) => key, locale: "ja", setLocale: jest.fn() }),
}));

const mockPush = jest.fn();
let mockPathname = "/lists";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: jest.fn() }),
  usePathname: () => mockPathname,
}));

// 保存後は完全な再読み込みで反映させる（クライアント遷移だとレイアウトの
// プロフィール情報が古いままで、ダイアログが再度開いてしまう）
const mockAssign = jest.fn();
const mockReload = jest.fn();
beforeAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { assign: mockAssign, reload: mockReload, href: "http://localhost/" },
  });
});

const profileData = {
  userId: "u1",
  username: "user_u1",
  displayName: "",
  bio: null,
  avatarUrl: null,
} as never;

function renderDialog() {
  return render(
    <FirstTimeProfileDialog
      profileData={profileData}
      isOpen={true}
      onOpenChange={jest.fn()}
    />
  );
}

describe("FirstTimeProfileDialog（初回プロフィール設定）", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/lists";
    mockUpsert.mockResolvedValue({ error: null });
  });

  it("保存したら完全な再読み込みで作成導線へ送る", async () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText(/displayName/i), {
      target: { value: "ggg" },
    });
    fireEvent.click(screen.getByRole("button", { name: "settings.profile.save" }));

    await waitFor(() =>
      expect(mockAssign).toHaveBeenCalledWith("/lists?firstList=1")
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("その場に留まる画面では再読み込みして反映させる", async () => {
    // 招待されたリストなど、行き先がある場合は引き剥がさずに再読み込みする
    mockPathname = "/lists/list-1";
    renderDialog();
    fireEvent.change(screen.getByLabelText(/displayName/i), {
      target: { value: "ggg" },
    });
    fireEvent.click(screen.getByRole("button", { name: "settings.profile.save" }));

    await waitFor(() => expect(mockReload).toHaveBeenCalled());
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it("保存に失敗したら遷移しない", async () => {
    mockUpsert.mockResolvedValue({ error: { message: "boom" } });
    renderDialog();
    fireEvent.change(screen.getByLabelText(/displayName/i), {
      target: { value: "ggg" },
    });
    fireEvent.click(screen.getByRole("button", { name: "settings.profile.save" }));

    await waitFor(() => expect(mockUpsert).toHaveBeenCalled());
    expect(mockAssign).not.toHaveBeenCalled();
    expect(mockReload).not.toHaveBeenCalled();
  });
});
