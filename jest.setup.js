// 環境変数の設定
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
process.env.SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-service-role";

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// TextEncoder/TextDecoderのポリフィル
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

// Web APIのポリフィル
global.Request = require("node-fetch").Request;
global.Response = require("node-fetch").Response;
global.Headers = require("node-fetch").Headers;
global.fetch = require("node-fetch");

// MSWのセットアップ
// import { server } from "./mocks/server";

// window.alert のモック
global.window.alert = jest.fn();

// next/headers の cookies をモック
jest.mock("next/headers", () => ({
  cookies: () => ({
    get: jest.fn((name) => {
      // 必要に応じて特定のCookieのモック値を返す
      if (name === "sb-access-token") {
        return { name: "sb-access-token", value: "mock-access-token" };
      }
      return undefined;
    }),
    getAll: jest.fn(() => []),
    has: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

// Supabaseサーバークライアントをモック
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockImplementation(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: { id: "test-user-id", email: "test@example.com" },
        },
        error: null,
      }),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  })),
}));

// テスト前にMSWのサーバーを起動
// beforeAll(() => server.listen());

// 各テスト終了後にリクエストハンドラーをリセット
// afterEach(() => server.resetHandlers());

// すべてのテスト終了後にサーバーをクローズ
// afterAll(() => server.close());

// Next.jsのルーターをモック化
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
  revalidatePath: jest.fn(),
}));

// matchMediaのポリフィル
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // 非推奨
    removeListener: jest.fn(), // 非推奨
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

jest.mock("nanoid", () => require("nanoid/non-secure"));

// shadcn/ui系コンポーネントのグローバルモック
jest.mock("@/components/ui/button", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: React.forwardRef(
      ({ children, asChild, onClick: propOnClick, ...props }, ref) => {
        const handleClick = (e) => {
          // children自身のonClick (asChildの場合)
          if (
            asChild &&
            React.isValidElement(children) &&
            children.props.onClick
          ) {
            children.props.onClick(e);
          }
          // Buttonに直接渡されたonClick (propOnClick)
          if (propOnClick) {
            propOnClick(e);
          }
        };

        if (asChild && React.isValidElement(children)) {
          return React.cloneElement(children, {
            ...props,
            ...children.props,
            ref,
            // Buttonのモックとして、最終的にhandleClickを実行するonClickを渡す
            onClick: handleClick,
          });
        }
        return (
          <button {...props} ref={ref} onClick={handleClick}>
            {children}
          </button>
        );
      }
    ),
    CtaButton: ({ type }) => <button data-testid="cta-button">{type}</button>,
    buttonVariants: () => "",
  };
});
jest.mock("@/components/ui/accordion", () => ({
  Accordion: ({ children }) => <div>{children}</div>,
  AccordionItem: ({ children }) => <div>{children}</div>,
  AccordionTrigger: ({ children }) => <button>{children}</button>,
  AccordionContent: ({ children }) => <div>{children}</div>,
}));
jest.mock("@/components/ui/dropdown-menu", () => {
  const React = require("react");
  return {
    __esModule: true,
    DropdownMenu: ({ children }) => (
      <div data-testid="dropdown-menu">{children}</div>
    ),
    DropdownMenuTrigger: ({ children, asChild }) =>
      asChild ? (
        children
      ) : (
        <button data-testid="dropdown-menu-trigger">{children}</button>
      ),
    DropdownMenuContent: ({ children, ...props }) => (
      <div data-testid="dropdown-menu-content" {...props}>
        {children}
      </div>
    ),
    DropdownMenuItem: ({ children, ...props }) => (
      <button data-testid="dropdown-menu-item" {...props}>
        {children}
      </button>
    ),
    DropdownMenuSeparator: (props) => (
      <div data-testid="dropdown-menu-separator" {...props} />
    ),
    DropdownMenuGroup: ({ children }) => (
      <div data-testid="dropdown-menu-group">{children}</div>
    ),
    DropdownMenuPortal: ({ children }) => (
      <div data-testid="dropdown-menu-portal">{children}</div>
    ),
    DropdownMenuSub: ({ children }) => (
      <div data-testid="dropdown-menu-sub">{children}</div>
    ),
    DropdownMenuSubContent: ({ children }) => (
      <div data-testid="dropdown-menu-sub-content">{children}</div>
    ),
    DropdownMenuSubTrigger: ({ children }) => (
      <div data-testid="dropdown-menu-sub-trigger">{children}</div>
    ),
    DropdownMenuRadioGroup: ({ children }) => (
      <div data-testid="dropdown-menu-radio-group">{children}</div>
    ),
    DropdownMenuCheckboxItem: ({
      children,
      checked,
      onCheckedChange,
      ...props
    }) => (
      <div
        data-testid="dropdown-menu-checkbox-item"
        {...props}
        onClick={() => onCheckedChange && onCheckedChange(!checked)}
      >
        <input type="checkbox" checked={checked} readOnly />
        {children}
      </div>
    ),
    DropdownMenuRadioItem: ({ children, value, ...props }) => (
      //  TODO: RadioGroupのvalueと連動させる必要があれば修正
      <div data-testid="dropdown-menu-radio-item" {...props}>
        <input
          type="radio"
          value={value}
          name="dropdown-radio-group"
          readOnly
        />
        {children}
      </div>
    ),
    DropdownMenuLabel: ({ children }) => (
      <div data-testid="dropdown-menu-label">{children}</div>
    ),
    DropdownMenuShortcut: ({ children }) => (
      <span data-testid="dropdown-menu-shortcut">{children}</span>
    ),
  };
});
jest.mock("@/components/ui/dialog", () => {
  const React = require("react");
  function Dialog({ open, onOpenChange, children }) {
    const [isOpen, setIsOpen] = React.useState(open);

    React.useEffect(() => {
      setIsOpen(open);
    }, [open]);

    const handleChange = (val) => {
      setIsOpen(val);
      if (onOpenChange) {
        onOpenChange(val);
      }
    };

    // Document-level event listener for Escape key
    React.useEffect(() => {
      const handleKeyDown = (event) => {
        if (event.key === "Escape" && isOpen) {
          handleChange(false);
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [isOpen, onOpenChange]);

    return React.Children.map(children, (child) =>
      React.isValidElement(child)
        ? React.cloneElement(child, {
            open: isOpen,
            onOpenChange: handleChange,
          })
        : child
    );
  }
  function DialogContent({ open, onOpenChange, children, ...props }) {
    if (!open) return null;
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        tabIndex={-1}
        {...props}
        data-testid="dialog-content"
      >
        {children}
        {/* モック用の閉じるボタン、実際には表示されないことが多い */}
        <button
          style={{ display: "none" }}
          onClick={() => onOpenChange && onOpenChange(false)}
          data-testid="mock-internal-close-dialog-btn"
        />
      </div>
    );
  }
  const DialogClose = React.forwardRef(
    ({ children, onClick, asChild, ...props }, ref) => {
      const dialogContextOnOpenChange = props.onOpenChange;

      const internalOnClick = (event) => {
        // DialogClose自体に渡されたonClick (通常はButton側で処理するため、あまり使われない想定)
        if (onClick) {
          onClick(event);
        }
        // Dialogを閉じるのが主目的
        if (dialogContextOnOpenChange) {
          dialogContextOnOpenChange(false);
        }
      };

      const { onOpenChange: _ignored, ...restProps } = props;

      if (asChild && React.isValidElement(children)) {
        // children (Button) に internalOnClick を onClickとして渡す。
        // Buttonモック側は、children自身のonClickとこの渡されたonClickを両方実行する設計。
        return React.cloneElement(children, {
          ...restProps,
          ...children.props, // Button自身のprops (例: RankingModalの variant="outline") を保持
          ref,
          onClick: internalOnClick, // このonClickがButtonモックのpropOnClickとして渡る
        });
      }

      return (
        <button
          data-testid="dialog-close"
          {...restProps}
          onClick={internalOnClick}
          ref={ref}
        >
          {children}
        </button>
      );
    }
  );
  DialogClose.displayName = "DialogClose";

  return {
    __esModule: true,
    Dialog,
    DialogPortal: ({ children }) => (
      <div data-testid="dialog-portal">{children}</div>
    ),
    DialogOverlay: ({ children }) => (
      <div data-testid="dialog-overlay">{children}</div>
    ),
    DialogTrigger: ({ children }) => (
      <button data-testid="dialog-trigger">{children}</button>
    ),
    DialogClose,
    DialogContent,
    DialogHeader: ({ children }) => (
      <div role="none" data-testid="dialog-header">
        {children}
      </div>
    ),
    DialogFooter: ({ children }) => (
      <div data-testid="dialog-footer">{children}</div>
    ),
    DialogTitle: ({ children }) => (
      <h2 id="dialog-title" role="heading" aria-level={2}>
        {children}
      </h2>
    ),
    DialogDescription: ({ children }) => (
      <p id="dialog-description">{children}</p>
    ),
  };
});
jest.mock("@/components/ui/alert-dialog", () => ({
  __esModule: true,
  AlertDialog: ({ children }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }) => <button>{children}</button>,
  AlertDialogContent: ({ children }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }) => <div>{children}</div>,
  AlertDialogAction: ({ children, ...props }) => (
    <button {...props}>{children}</button>
  ),
  AlertDialogCancel: ({ children, ...props }) => (
    <button {...props}>{children}</button>
  ),
}));
jest.mock("@/components/ui/tooltip", () => ({
  __esModule: true,
  TooltipProvider: ({ children }) => <div>{children}</div>,
  Tooltip: ({ children }) => <div>{children}</div>,
  TooltipTrigger: ({ children }) => <div>{children}</div>,
  TooltipContent: ({ children }) => <div>{children}</div>,
}));
jest.mock("@/components/ui/toast", () => ({
  __esModule: true,
  useToast: () => ({ toast: jest.fn() }),
  Toast: () => <div data-testid="toast">Toast Mock</div>,
  ToastProvider: ({ children }) => <div>{children}</div>,
  ToastViewport: () => <div data-testid="toast-viewport"></div>,
  ToastTitle: ({ children }) => <div>{children}</div>,
  ToastDescription: ({ children }) => <div>{children}</div>,
  ToastClose: () => <button>Close</button>,
  ToastAction: ({ children }) => <button>{children}</button>,
}));
jest.mock(
  "lucide-react",
  () =>
    new Proxy(
      {},
      {
        get: (target, prop) => {
          const React = require("react");
          return () => (
            <div data-testid={`icon-${String(prop)}`}>{String(prop)}</div>
          );
        },
      }
    )
);

// PlaceListGridとrenderLabeledCollaboratorsのグローバルモック
jest.mock("@/components/ui/placelist-grid", () => ({
  __esModule: true,
  PlaceListGrid: ({ initialLists, emptyMessage, userId }) => (
    <div data-testid="place-list-grid">
      <div data-testid="lists-count">
        {initialLists ? initialLists.length : 0}
      </div>
      <div data-testid="lists-data">{JSON.stringify(initialLists)}</div>
      {(!initialLists || initialLists.length === 0) && (
        <p data-testid="empty-message">
          {emptyMessage || "リストは見つかりませんでした。"}
        </p>
      )}
      <div data-testid="AddPlaceButtonClient">AddPlaceButtonClient Mock</div>
    </div>
  ),
  renderLabeledCollaborators: jest.fn(),
}));

jest.mock("@/components/ui/input", () => {
  const React = require("react");
  return {
    __esModule: true,
    Input: React.forwardRef((props, ref) => <input {...props} ref={ref} />),
  };
});
jest.mock("@/components/ui/select", () => {
  const React = require("react");
  const SelectContent = ({ children }) => <>{children}</>;
  const SelectItem = ({ value, children }) => (
    <option value={value}>{children}</option>
  );
  return {
    __esModule: true,
    Select: ({ value, onValueChange, children, defaultValue }) => {
      const [currentValue, setCurrentValue] = React.useState(
        value || defaultValue
      );
      const handleChange = (e) => {
        setCurrentValue(e.target.value);
        if (onValueChange) onValueChange(e.target.value);
      };
      return (
        <select
          value={currentValue}
          onChange={handleChange}
          data-testid="sort-select"
        >
          {require("react").Children.map(children, (child) =>
            child.type === SelectContent
              ? require("react").Children.map(child.props.children, (item) =>
                  item.type === SelectItem ? item : null
                )
              : null
          )}
        </select>
      );
    },
    SelectContent,
    SelectItem,
    SelectTrigger: ({ children }) => (
      <button data-testid="select-trigger">{children}</button>
    ),
    SelectValue: ({ placeholder }) => (
      <span data-testid="select-value">{placeholder}</span>
    ),
    SelectGroup: ({ children }) => (
      <div data-testid="select-group">{children}</div>
    ),
    SelectLabel: ({ children }) => (
      <div data-testid="select-label">{children}</div>
    ),
  };
});
jest.mock("@/components/ui/switch", () => {
  const React = require("react");
  return {
    __esModule: true,
    Switch: React.forwardRef((props, ref) => (
      <input type="checkbox" {...props} ref={ref} />
    )),
  };
});
jest.mock("@/components/ui/avatar", () => ({
  __esModule: true,
  Avatar: ({ children }) => <div>{children}</div>,
  AvatarImage: (props) => <img {...props} alt="avatar" />,
  AvatarFallback: ({ children }) => <span>{children}</span>,
}));

// Textarea
jest.mock("@/components/ui/textarea", () => {
  const React = require("react");
  return {
    __esModule: true,
    Textarea: React.forwardRef((props, ref) => (
      <textarea {...props} ref={ref} />
    )),
  };
});

// RadioGroup
jest.mock("@/components/ui/radio-group", () => ({
  __esModule: true,
  RadioGroup: ({ children, value, onValueChange, ...props }) => (
    <div data-testid="radio-group" {...props}>
      {children}
    </div>
  ),
  RadioGroupItem: ({ children, ...props }) => (
    <input type="radio" data-testid="radio-group-item" {...props} />
  ),
}));

// Toasterのモック追加
jest.mock("@/components/ui/toaster", () => ({
  __esModule: true,
  Toaster: () => <div data-testid="toaster">Toaster Mock</div>,
}));
