"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  getPlaceDetails,
  searchPlaces,
} from "@/lib/actions/google-maps-actions";
import { registerPlaceToListAction } from "@/lib/actions/place-actions";
import { getListTags } from "@/lib/dal/lists";
import { Loader2, MapPin, Search } from "lucide-react";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import TagInput from "./TagInput";

// Autocompleteの候補の型
interface AutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// Place Detailsの型
interface PlaceDetailsResult {
  id: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  formattedAddress?: string;
  hierarchicalRegion?: {
    countryCode: string;
    countryName: string;
    adminAreaLevel1?: string;
    adminAreaLevel1Type: "prefecture" | "state" | "province" | "region";
    hierarchy: {
      level1: string;
      level2?: string;
    };
  };
}

const initialSearchState: {
  predictions?: AutocompletePrediction[];
  error?: string;
} = { predictions: [], error: undefined };
const initialDetailsState: {
  placeDetails?: PlaceDetailsResult;
  error?: string;
} = { placeDetails: undefined, error: undefined };

// Match this with RegisterPlaceResult from place-actions.ts
const initialRegisterState: {
  success: boolean; // Make it non-optional
  message?: string;
  listPlaceId?: string;
  error?: string;
  fieldErrors?: {
    placeId?: string[];
    name?: string[];
    address?: string[];
    latitude?: string[];
    longitude?: string[];
    tags?: string[];
    memo?: string[];
    listId?: string[];
  };
} = {
  success: false,
  message: undefined,
  listPlaceId: undefined,
  error: undefined,
  fieldErrors: undefined,
};

// フォームの送信状態に応じてボタンの表示を切り替えるコンポーネント
function SubmitButton({
  label,
  loadingLabel,
  variant,
  className,
  onClick,
  pending,
}: {
  label: string;
  loadingLabel: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | null
    | undefined;
  className?: string;
  onClick?: () => void;
  pending?: boolean;
}) {
  const { pending: formPending } = useFormStatus();
  const actualPending = pending !== undefined ? pending : formPending;

  return (
    <Button
      type="submit"
      variant={variant}
      disabled={actualPending}
      className={className}
      onClick={onClick}
    >
      {actualPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}

interface AddPlaceFormProps {
  listId: string;
  onPlaceRegistered?: () => void;
  onResetRequest?: () => void;
}

type CurrentStep = "search" | "select_prediction" | "add_details";

export default function AddPlaceForm({
  listId,
  onPlaceRegistered,
  onResetRequest,
}: AddPlaceFormProps) {
  const { toast } = useToast(); // useToastフックを呼び出す
  const [isTransitionPending, startTransition] = useTransition(); // useTransitionフックを呼び出す
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionToken, setSessionToken] = useState<string | undefined>(
    undefined
  );
  const [autocompleteState, searchFormAction] = useActionState(
    searchPlaces,
    initialSearchState
  );
  const [placeDetailsState, detailsFormAction] = useActionState(
    getPlaceDetails,
    initialDetailsState
  );
  const [registerState, registerFormAction, isRegisterPending] = useActionState(
    registerPlaceToListAction,
    initialRegisterState
  );

  const [selectedPredictionForDisplay, setSelectedPredictionForDisplay] =
    useState<AutocompletePrediction | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const [currentStep, setCurrentStep] = useState<CurrentStep>("search");
  const [searchAttempted, setSearchAttempted] = useState(false);

  // タグ入力用の状態
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [existingTags, setExistingTags] = useState<
    { id: string; name: string; count: number }[]
  >([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ★追加: 訪問ステータス用の状態
  const [visitedStatus, setVisitedStatus] = useState<"visited" | "not_visited">(
    "not_visited"
  );

  useEffect(() => {
    setSessionToken(uuidv4());

    // リストの既存タグを取得
    async function fetchExistingTags() {
      try {
        const tags = await getListTags(listId);
        setExistingTags(tags);
      } catch (error) {
        console.error("Error fetching existing tags:", error);
      }
    }

    fetchExistingTags();
  }, [listId]);

  // search ステップ表示時に検索入力欄からフォーカスを外す
  useEffect(() => {
    if (currentStep === "search" && searchInputRef.current) {
      searchInputRef.current.blur();
    }
  }, [currentStep]);

  useEffect(() => {
    if (!searchAttempted) return;

    if (autocompleteState?.error) {
      toast({
        title: "検索エラー",
        description: autocompleteState.error,
        variant: "destructive",
      });
      setSearchAttempted(false);
    } else if (autocompleteState?.predictions) {
      setCurrentStep("select_prediction");
    }
  }, [autocompleteState, searchAttempted, toast]);

  useEffect(() => {
    if (placeDetailsState?.error) {
      toast({
        title: "場所詳細取得エラー",
        description: placeDetailsState.error,
        variant: "destructive",
      });
      setIsFetchingDetails(false);
      setCurrentStep("select_prediction");
    }
    if (placeDetailsState?.placeDetails) {
      setIsFetchingDetails(false);
      setCurrentStep("add_details");
    }
  }, [placeDetailsState, toast]);

  useEffect(() => {
    if (registerState?.success && registerState.message) {
      toast({
        title: "登録成功",
        description: registerState.message,
      });
      if (onPlaceRegistered) {
        onPlaceRegistered();
      }
      // Reset form logic
      setSearchTerm("");
      setSelectedPredictionForDisplay(null);
      setSelectedTags([]);
      setVisitedStatus("not_visited");
      setCurrentStep("search");
      if (searchInputRef.current) {
        searchInputRef.current.value = "";
      }
    } else if (registerState?.error) {
      toast({
        title: "登録エラー",
        description: registerState.error,
        variant: "destructive",
      });
    }
  }, [registerState, toast, onPlaceRegistered]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchTerm.trim() || !sessionToken) {
      toast({
        title: "エラー",
        description: "検索キーワードを入力してください。",
        variant: "destructive",
      });
      return;
    }
    const formData = new FormData(event.currentTarget);
    formData.set("sessionToken", sessionToken);
    setSearchAttempted(true);
    startTransition(() => {
      searchFormAction(formData);
    });
  };

  const handleSelectPrediction = (prediction: AutocompletePrediction) => {
    if (!sessionToken) {
      toast({
        title: "エラー",
        description: "セッションが無効です。ページをリロードしてください。",
        variant: "destructive",
      });
      return;
    }
    setSelectedPredictionForDisplay(prediction);
    setIsFetchingDetails(true);

    const formData = new FormData();
    formData.append("placeId", prediction.place_id);
    formData.append("sessionToken", sessionToken);
    startTransition(() => {
      detailsFormAction(formData);
    });
  };

  const handleRegisterPlace = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!placeDetailsState?.placeDetails || !selectedPredictionForDisplay) {
      toast({
        title: "エラー",
        description: "登録する場所が選択されていません。",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const memo = formData.get("memo") as string;

    const placeToRegister = {
      placeId: placeDetailsState.placeDetails!.id,
      name: selectedPredictionForDisplay!.structured_formatting.main_text,
      address: placeDetailsState.placeDetails!.formattedAddress,
      latitude: placeDetailsState.placeDetails!.location?.latitude,
      longitude: placeDetailsState.placeDetails!.location?.longitude,
      tags: selectedTags,
      memo,
      listId: listId,
      visited_status: visitedStatus,
      // 階層地域情報の追加
      countryCode:
        placeDetailsState.placeDetails!.hierarchicalRegion?.countryCode,
      countryName:
        placeDetailsState.placeDetails!.hierarchicalRegion?.countryName,
      adminAreaLevel1:
        placeDetailsState.placeDetails!.hierarchicalRegion?.adminAreaLevel1,
      regionHierarchy:
        placeDetailsState.placeDetails!.hierarchicalRegion?.hierarchy,
    };

    startTransition(() => {
      registerFormAction(placeToRegister);
    });
  };

  const resetToSearch = () => {
    setSearchTerm("");
    setSelectedPredictionForDisplay(null);
    setSearchAttempted(false);
    setSelectedTags([]);
    setVisitedStatus("not_visited");
    setCurrentStep("search");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    if (onResetRequest) {
      onResetRequest();
    }
  };

  if (currentStep === "search") {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>場所を検索</CardTitle>
          <CardDescription>
            キーワード入力後、検索ボタンを押してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="flex items-start space-x-2">
              <div className="flex-grow">
                <Label htmlFor="search-term" className="sr-only">
                  検索キーワード
                </Label>
                <Input
                  ref={searchInputRef}
                  id="search-term"
                  name="query"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="例: 東京タワー"
                  className="w-full"
                  aria-label="場所を検索"
                />
              </div>
              <Button
                type="submit"
                disabled={isTransitionPending}
                aria-label="検索"
              >
                {isTransitionPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
                <span className="ml-2 sm:inline hidden">検索</span>
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Enterキーでも検索できます。
        </CardFooter>
      </Card>
    );
  }

  if (currentStep === "select_prediction") {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>検索結果</CardTitle>
          <CardDescription>該当する場所を選択してください。</CardDescription>
        </CardHeader>
        <CardContent>
          {isTransitionPending && !isFetchingDetails && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="ml-2">検索中...</p>
            </div>
          )}
          {searchAttempted &&
            !isTransitionPending &&
            autocompleteState?.predictions &&
            autocompleteState.predictions.length > 0 && (
              <ul className="border rounded-md shadow-sm max-h-80 overflow-y-auto bg-background">
                {autocompleteState.predictions.map((prediction) => (
                  <li key={prediction.place_id}>
                    <Button
                      variant="ghost"
                      onClick={() => handleSelectPrediction(prediction)}
                      className="w-full h-auto text-left p-3 justify-start items-start flex flex-col"
                      disabled={
                        isFetchingDetails &&
                        selectedPredictionForDisplay?.place_id ===
                          prediction.place_id
                      }
                    >
                      <span className="font-semibold">
                        {prediction.structured_formatting.main_text}
                      </span>
                      <span className="text-sm text-muted-foreground mt-1">
                        {prediction.structured_formatting.secondary_text}
                      </span>
                      {isFetchingDetails &&
                        selectedPredictionForDisplay?.place_id ===
                          prediction.place_id && (
                          <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                        )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          {searchAttempted &&
            !isTransitionPending &&
            autocompleteState?.predictions &&
            autocompleteState.predictions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                該当する場所が見つかりませんでした。
              </p>
            )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={resetToSearch}
            disabled={isTransitionPending || isFetchingDetails}
          >
            再検索
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (currentStep === "add_details") {
    if (!selectedPredictionForDisplay || !placeDetailsState?.placeDetails) {
      setCurrentStep("search");
      return null;
    }
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-neutral-800">
            {selectedPredictionForDisplay!.structured_formatting.main_text}
          </CardTitle>
          {placeDetailsState.placeDetails!.formattedAddress && (
            <CardDescription className="flex items-center pt-1 text-neutral-600">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-neutral-600" />
              <span>
                {placeDetailsState.placeDetails!.formattedAddress.replace(
                  /(〒?\s*\d{3}-?\d{4}\s*)/,
                  ""
                )}
              </span>
            </CardDescription>
          )}
        </CardHeader>
        <form
          onSubmit={handleRegisterPlace}
          onKeyDown={(e: React.KeyboardEvent<HTMLFormElement>) => {
            if (e.key === "Enter") {
              const target = e.target as HTMLElement;
              // タグ入力欄・コメント欄以外でEnterが押された場合、フォーム送信を抑制
              if (target.id !== "tags-input" && target.id !== "memo") {
                e.preventDefault();
              }
            }
          }}
        >
          <CardContent className="space-y-4">
            <div>
              <TagInput
                listId={listId}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                existingTags={existingTags}
              />
              {/* ★追加: タグのフィールドエラー表示 */}
              {registerState.fieldErrors?.tags?.[0] && (
                <p className="text-sm text-red-500 mt-1">
                  {registerState.fieldErrors.tags[0]}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="memo" className="block text-sm font-medium mb-1">
                コメント (任意)
              </Label>
              <Textarea
                id="memo"
                name="memo"
                rows={3}
                placeholder="この場所に関するコメント..."
                className="w-full"
              />
              {/* ★追加: コメントのフィールドエラー表示 */}
              {registerState.fieldErrors?.memo?.[0] && (
                <p className="text-sm text-red-500 mt-1">
                  {registerState.fieldErrors.memo[0]}
                </p>
              )}
            </div>
            {/* ★追加: 訪問ステータス選択 */}
            <div>
              <RadioGroup
                value={visitedStatus}
                onValueChange={(value: "visited" | "not_visited") =>
                  setVisitedStatus(value)
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not_visited" id="not_visited" />
                  <Label htmlFor="not_visited" className="font-normal">
                    未訪問
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="visited" id="visited" />
                  <Label htmlFor="visited" className="font-normal">
                    訪問済み
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep("select_prediction")}
              type="button"
              disabled={isTransitionPending || isRegisterPending}
            >
              戻る
            </Button>
            <SubmitButton
              label="この場所をリストに追加"
              loadingLabel="追加中..."
              pending={isRegisterPending}
            />
          </CardFooter>
        </form>
      </Card>
    );
  }

  return null; // Should not reach here
}
