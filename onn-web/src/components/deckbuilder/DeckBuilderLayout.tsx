import React, { ReactNode } from "react";

type DeckBuilderLayoutProps = {
  header: ReactNode;
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  rightSidebar?: ReactNode;
  bottomPanel: ReactNode;
};

export function DeckBuilderLayout({
  header,
  leftPanel,
  rightPanel,
  rightSidebar,
  bottomPanel,
}: DeckBuilderLayoutProps) {
  return (
    <div className="min-h-screen bg-darkblue text-white pb-20">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">{header}</div>

        {/* Two/Three-Panel Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Panel - Card Search */}
          <div className="lg:col-span-5 order-2 lg:order-1">{leftPanel}</div>

          {/* Right Panel - Deck List */}
          <div className="lg:col-span-4 order-1 lg:order-2">{rightPanel}</div>

          {/* Right Sidebar - Stats & Rules */}
          {rightSidebar && (
            <div className="lg:col-span-3 order-3">{rightSidebar}</div>
          )}
        </div>

        {/* Bottom Panel - Zones */}
        <div className="mt-12">{bottomPanel}</div>
      </div>
    </div>
  );
}

