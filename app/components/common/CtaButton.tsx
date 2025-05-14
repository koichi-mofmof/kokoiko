import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CtaButtonType = "login" | "sampleHero" | "sampleCta";

interface CtaButtonProps {
  type: CtaButtonType;
}

export function CtaButton({ type }: CtaButtonProps) {
  let href: string;
  let mainText: string;
  let subText: string | undefined;
  let variant:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive" = "default";
  let showChevron: boolean = false;
  let buttonClassName: string = "";
  let linkClassName: string = "";
  let subTextClassName: string = "";

  switch (type) {
    case "login":
      href = "/mypage";
      mainText = "行きたい場所リストを作る";
      subText = "（要ログイン）";
      showChevron = true;
      variant = "default";
      buttonClassName =
        "shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group";
      subTextClassName = "text-white/80";
      break;
    case "sampleHero":
      href = "/sample";
      mainText = "サンプルを見る";
      variant = "outline";
      buttonClassName =
        "group bg-white/10 backdrop-blur-sm border-white/20 shadow-lg hover:bg-white/20 hover:text-white hover:scale-105 transition-all duration-300 hidden md:inline-flex w-full md:w-auto";
      linkClassName = "text-white group-hover:text-white";
      break;
    case "sampleCta":
      href = "/sample";
      mainText = "サンプルを見る";
      variant = "outline";
      buttonClassName =
        "group bg-white/10 backdrop-blur-sm border-white/20 shadow-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 hidden md:inline-flex w-full md:w-auto";
      linkClassName = "text-neutral-900 group-hover:text-neutral-900";
      break;
    default:
      href = "/";
      mainText = "Default Button";
      break;
  }

  return (
    <Button asChild variant={variant} className={cn("h-auto", buttonClassName)}>
      <Link
        href={href}
        className={cn(
          "inline-flex flex-col items-center justify-center text-center px-10 py-4 text-lg",
          linkClassName
        )}
      >
        <div className="inline-flex items-center">
          {mainText}
          {showChevron && (
            <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          )}
        </div>
        {subText && (
          <span className={cn("mt-1 text-xs", subTextClassName)}>
            {subText}
          </span>
        )}
      </Link>
    </Button>
  );
}
