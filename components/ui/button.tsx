import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary-600 text-primary-foreground shadow hover:bg-primary-700 hover:!text-white",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background text-neutral-800 hover:text-neutral-900 shadow-sm hover:bg-accent",
        secondary:
          "border border-neutral-200 bg-neutral-50 text-neutral-800 shadow-sm hover:bg-neutral-100",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-15 rounded-md px-8 py-4",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

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
      href = "/lists";
      mainText = "マイリストを作成する";
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
