import { sendGAEvent } from "@/app/components/analytics/GoogleAnalytics";
import {
  trackAuthEventFromParam,
  trackConversionEvents,
  trackListEvents,
  trackMapEvents,
  trackPlaceEvents,
  trackSearchEvents,
  trackTemplateCopyEvents,
  trackUserEvents,
} from "@/lib/analytics/events";

jest.mock("@/app/components/analytics/GoogleAnalytics", () => ({
  sendGAEvent: jest.fn(),
}));

const mockSendGAEvent = sendGAEvent as jest.Mock;

describe("analytics events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("trackMapEvents", () => {
    it("viewMap は view_map を送信する", () => {
      trackMapEvents.viewMap("list-1");
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "view_map",
        "map_interaction",
        "list-1"
      );
    });

    it("clickPlace は click_place を送信する", () => {
      trackMapEvents.clickPlace("place-1");
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "click_place",
        "map_interaction",
        "place-1"
      );
    });
  });

  describe("trackListEvents", () => {
    it("createList はラベルなしで送信する", () => {
      trackListEvents.createList();
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "create_list",
        "list_management"
      );
    });

    it("viewList / editList / deleteList / bookmarkList が正しく送信される", () => {
      trackListEvents.viewList("l1");
      trackListEvents.editList("l2");
      trackListEvents.deleteList("l3");
      trackListEvents.bookmarkList("l4");

      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "view_list",
        "list_engagement",
        "l1"
      );
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "edit_list",
        "list_management",
        "l2"
      );
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "delete_list",
        "list_management",
        "l3"
      );
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "bookmark_list",
        "list_engagement",
        "l4"
      );
    });

    it("shareList は共有方法をラベルに含める", () => {
      trackListEvents.shareList("l1", "social");
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "share_list",
        "list_engagement",
        "l1_social"
      );
    });
  });

  describe("trackUserEvents", () => {
    it("signup / login は method をラベルに含める", () => {
      trackUserEvents.signup("google");
      trackUserEvents.login("email");
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "sign_up",
        "user_auth",
        "google"
      );
      expect(mockSendGAEvent).toHaveBeenCalledWith("login", "user_auth", "email");
    });

    it("logout / updateProfile が正しく送信される", () => {
      trackUserEvents.logout();
      trackUserEvents.updateProfile();
      expect(mockSendGAEvent).toHaveBeenCalledWith("logout", "user_auth");
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "update_profile",
        "user_engagement"
      );
    });
  });

  describe("trackPlaceEvents", () => {
    it("rankPlace は placeId と rank を結合してラベルにする", () => {
      trackPlaceEvents.rankPlace("p1", 3);
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "rank_place",
        "place_engagement",
        "p1_3"
      );
    });

    it("addPlace / editPlace / deletePlace / viewPlaceDetail が正しく送信される", () => {
      trackPlaceEvents.addPlace("l1");
      trackPlaceEvents.editPlace("p1");
      trackPlaceEvents.deletePlace("p2");
      trackPlaceEvents.viewPlaceDetail("p3");

      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "add_place",
        "place_management",
        "l1"
      );
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "view_place_detail",
        "place_engagement",
        "p3"
      );
    });
  });

  describe("trackSearchEvents", () => {
    it("useFilter は種別と値を結合する", () => {
      trackSearchEvents.useFilter("region", "tokyo");
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "use_filter",
        "search",
        "region_tokyo"
      );
    });

    it("clickSearchResult は index を文字列化して送る", () => {
      trackSearchEvents.clickSearchResult(2);
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "click_search_result",
        "search",
        "2"
      );
    });
  });

  describe("trackTemplateCopyEvents", () => {
    it("buttonClick はログイン状態でラベルを出し分ける", () => {
      trackTemplateCopyEvents.buttonClick("src-1", true);
      trackTemplateCopyEvents.buttonClick("src-2", false);
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "copy_button_click",
        "template_copy",
        "src-1_member"
      );
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "copy_button_click",
        "template_copy",
        "src-2_guest"
      );
    });

    it("copyComplete はコピー件数を value として送信する", () => {
      trackTemplateCopyEvents.copyComplete("src-1", 12);
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "copy_list_complete",
        "template_copy",
        "src-1",
        12
      );
    });
  });

  describe("trackConversionEvents", () => {
    it("variant なしの場合は listId のみをラベルにする", () => {
      trackConversionEvents.promptShown("list-1");
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "signup_prompt_shown",
        "conversion",
        "list-1"
      );
    });

    it("variant ありの場合は listId と variant を結合する", () => {
      trackConversionEvents.promptClicked("list-1", "B");
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        "signup_prompt_clicked",
        "conversion",
        "list-1_B"
      );
    });
  });

  describe("trackAuthEventFromParam", () => {
    it.each([
      ["signup_email", "sign_up", "user_auth", "email"],
      ["signup_google", "sign_up", "user_auth", "google"],
      ["login_email", "login", "user_auth", "email"],
      ["login_google", "login", "user_auth", "google"],
    ])("%s を対応するイベントへマップする", (code, action, category, label) => {
      const handled = trackAuthEventFromParam(code);
      expect(handled).toBe(true);
      expect(mockSendGAEvent).toHaveBeenCalledWith(action, category, label);
    });

    it("logout は logout イベントを送信する", () => {
      expect(trackAuthEventFromParam("logout")).toBe(true);
      expect(mockSendGAEvent).toHaveBeenCalledWith("logout", "user_auth");
    });

    it("未知のコードは false を返し何も送信しない", () => {
      expect(trackAuthEventFromParam("unknown")).toBe(false);
      expect(mockSendGAEvent).not.toHaveBeenCalled();
    });
  });
});
