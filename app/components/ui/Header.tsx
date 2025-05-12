"use client";

import { Button } from "@/components/ui/button";
import { LogOut, MapPinHouse, Menu, User, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface HeaderProps {
  currentUser?: { name: string; id: string } | null;
  onLogout?: () => void;
}

const Header = ({ currentUser, onLogout }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-sm shadow-sm z-50">
      <div className="max-w-[1920px] w-full px-6 sm:px-8 lg:px-12 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link
            href="/"
            className="text-lg font-medium text-gray-800 flex items-center"
          >
            <MapPinHouse className="h-8 w-8 text-primary-500" />
            <span className="ml-2 text-2xl font-semibold font-quicksand">
              <span className="text-primary-600">ClippyMap</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {currentUser ? (
            <>
              <Link
                href="/map"
                className="text-neutral-600 hover:text-primary-600 transition-colors"
              >
                マイマップ
              </Link>
              <Link
                href="/places/add"
                className="text-neutral-600 hover:text-primary-600 transition-colors"
              >
                場所を追加
              </Link>
              <Link
                href="/groups"
                className="text-neutral-600 hover:text-primary-600 transition-colors"
              >
                グループ
              </Link>
              <div className="flex items-center space-x-4">
                <span className="text-neutral-600">{currentUser.name}</span>
                <button
                  onClick={onLogout}
                  className="text-neutral-600 hover:text-primary-600"
                  aria-label="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <Button asChild variant="secondary">
              <Link href="/login">ログイン</Link>
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-neutral-600" onClick={toggleMenu}>
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-100 px-6 sm:px-8 py-3 space-y-3 shadow-md animate-fadeIn">
          {currentUser ? (
            <>
              <Link
                href="/map"
                className="block py-2 text-neutral-600 hover:text-primary-600 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                マイマップ
              </Link>
              <Link
                href="/places/add"
                className="block py-2 text-neutral-600 hover:text-primary-600 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                場所を追加
              </Link>
              <Link
                href="/groups"
                className="block py-2 text-neutral-600 hover:text-primary-600 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                グループ
              </Link>
              <div className="flex items-center justify-between py-2 border-t border-neutral-100 pt-4 mt-2">
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-neutral-600" />
                  <span className="text-neutral-600">{currentUser.name}</span>
                </div>
                <button
                  onClick={() => {
                    onLogout?.();
                    setMenuOpen(false);
                  }}
                  className="text-neutral-600 hover:text-red-500"
                  aria-label="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild variant="default">
                <Link href="/login">ログイン</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
