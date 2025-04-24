"use client";

import NextLink from "next/link";
import React from "react";

interface LinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Link: React.FC<LinkProps> = ({
  href,
  children,
  className,
  onClick,
}) => {
  return (
    <NextLink href={href} onClick={onClick} className={className}>
      {children}
    </NextLink>
  );
};
