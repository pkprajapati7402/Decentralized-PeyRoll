'use client';

import { useState } from "react";
import Link from "next/link";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

// Custom Connect Button that only shows address
const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        if (!ready) return null;

        return (
          <div>
            {(() => {
              if (!mounted || !account || !chain) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="bg-zinc-900 dark:bg-[#14141F] hover:bg-zinc-700 dark:hover:bg-[#1c1c29] text-white py-2.5 px-6 rounded-lg border border-purple-500/20 font-medium transition-colors"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button onClick={openChainModal} className="bg-red-500/10 text-red-500 py-2.5 px-6 rounded-lg">
                    Wrong network
                  </button>
                );
              }

              return (
                <button
                  onClick={openAccountModal}
                  className="bg-zinc-900 dark:bg-[#14141F] hover:bg-zinc-700 dark:hover:bg-[#1c1c29] text-white py-2.5 px-6 rounded-lg border border-purple-500/20 font-medium transition-colors"
                >
                  {account.displayName}
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Register", href: "/register" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0A051B]/95 backdrop-blur-sm border-b border-zinc-200 dark:border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex h-20 items-center justify-between px-6">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-2xl font-bold text-zinc-900 dark:text-white hover:opacity-90 transition-opacity"
          >
            PeyRoll
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 flex-1 justify-center">
            <div className="flex items-center right-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative px-5 py-2 text-sm text-zinc-600 dark:text-gray-300 hover:text-zinc-900 dark:hover:text-white transition-colors group"
                >
                  {item.name}
                  <span className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-purple-500/0 via-[#7042E6] to-purple-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <CustomConnectButton />
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-4 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-zinc-600 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-gray-800 focus:outline-none"
            >
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden bg-white dark:bg-[#0A051B] border-t border-zinc-200 dark:border-white/5">
            <div className="px-4 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-base text-zinc-600 dark:text-gray-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-gray-800 rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="px-3 py-2">
                <CustomConnectButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;