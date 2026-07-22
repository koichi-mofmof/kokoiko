import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { LoginForm } from "../../../../app/components/auth/login-form";
import { SignupForm } from "../../../../app/components/auth/signup-form";

// 招待リンク経由で認証ページに来た状態を再現する
const INVITE_PATH = "/lists/join?token=abc123";
const INVITE_QUERY = "redirect_url=" + encodeURIComponent(INVITE_PATH);

jest.mock("@/lib/actions/auth", () => ({
  loginWithCredentials: jest.fn(),
  signupWithCredentials: jest.fn(),
  loginWithGoogle: jest.fn(),
}));

jest.mock("react", () => {
  const originalReact = jest.requireActual("react");
  return {
    ...originalReact,
    useActionState: jest
      .fn()
      .mockImplementation((action, initialState) => [
        initialState || { errors: {} },
        jest.fn(),
      ]),
  };
});

jest.mock("react-dom", () => {
  const originalReactDOM = jest.requireActual("react-dom");
  return {
    ...originalReactDOM,
    useFormStatus: jest.fn().mockReturnValue({ pending: false }),
  };
});

jest.mock("@/hooks/use-i18n", () => ({
  __esModule: true,
  useI18n: () => ({ t: (key) => key, locale: "ja", setLocale: jest.fn() }),
}));

// 招待クエリ付きで来訪した状態
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(INVITE_QUERY_FOR_MOCK),
}));

jest.mock("@/hooks/use-auth-sync", () => ({
  markAuthCallbackPending: jest.fn(),
}));

jest.mock("@/lib/utils/browser-detection", () => ({
  isGoogleOAuthBlocked: jest.fn(() => false),
  getExternalBrowserAdviceKey: jest.fn(() => null),
}));

jest.mock("@/lib/utils/csrf-client", () => ({
  getCSRFTokenFromCookie: jest.fn(() => "test-csrf-token"),
}));

// jest.mock は巻き上げられるため、モック内から参照する値はグローバルに置く
global.INVITE_QUERY_FOR_MOCK = INVITE_QUERY;

// jsdom には ResizeObserver が無い（SignupForm 配下の UI が参照する）
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

function hiddenInputValue(container, name) {
  const el = container.querySelector(`input[type="hidden"][name="${name}"]`);
  return el ? el.getAttribute("value") : null;
}

describe("招待リンク経由の認証で文脈が失われないこと", () => {
  describe("LoginForm", () => {
    it("『新規登録』リンクが招待クエリを引き継ぐ", () => {
      render(<LoginForm />);

      const signupLink = screen.getByRole("link", {
        name: "auth.common.signup",
      });

      expect(signupLink.getAttribute("href")).toContain("/signup?");
      const query = new URLSearchParams(
        signupLink.getAttribute("href").split("?")[1]
      );
      expect(query.get("redirect_url")).toBe(INVITE_PATH);
    });

    it("サーバーアクションが読む returnTo として招待先を送る", () => {
      // loginWithCredentials は formData の returnTo を見るため、
      // redirect_url のままではサーバー側で /lists に落ちてしまう
      const { container } = render(<LoginForm />);

      expect(hiddenInputValue(container, "returnTo")).toBe(INVITE_PATH);
    });
  });

  describe("SignupForm", () => {
    it("『ログイン』リンクが招待クエリを引き継ぐ", () => {
      render(<SignupForm />);

      const loginLink = screen.getByRole("link", {
        name: "auth.common.login",
      });

      expect(loginLink.getAttribute("href")).toContain("/login?");
      const query = new URLSearchParams(
        loginLink.getAttribute("href").split("?")[1]
      );
      expect(query.get("redirect_url")).toBe(INVITE_PATH);
    });

    it("redirect_url で来た場合も returnTo として招待先を送る", () => {
      // 従来 signup 側は returnTo しか読まず、redirect_url を取りこぼしていた
      const { container } = render(<SignupForm />);

      expect(hiddenInputValue(container, "returnTo")).toBe(INVITE_PATH);
    });
  });
});
