import {
  deleteShareLinkAction,
  updateShareLinkAction,
} from "@/lib/actions/share-actions";
import {
  deleteShareLink as deleteShareLinkCore,
  updateShareLink as updateShareLinkCore,
} from "@/lib/actions/lists";

jest.mock("@/lib/actions/lists", () => ({
  deleteShareLink: jest.fn(),
  updateShareLink: jest.fn(),
}));

const mockDelete = deleteShareLinkCore as jest.Mock;
const mockUpdate = updateShareLinkCore as jest.Mock;

describe("share-actions（lists.ts への委譲）", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deleteShareLinkAction は deleteShareLink に委譲し結果を返す", async () => {
    mockDelete.mockResolvedValue({ success: true });

    const result = await deleteShareLinkAction("token-1");

    expect(mockDelete).toHaveBeenCalledWith("token-1");
    expect(result).toEqual({ success: true });
  });

  it("updateShareLinkAction は引数をそのまま updateShareLink に渡す", async () => {
    mockUpdate.mockResolvedValue({ success: true });

    const args = {
      id: "token-1",
      default_permission: "edit" as const,
      is_active: false,
    };
    const result = await updateShareLinkAction(args);

    expect(mockUpdate).toHaveBeenCalledWith(args);
    expect(result).toEqual({ success: true });
  });
});
