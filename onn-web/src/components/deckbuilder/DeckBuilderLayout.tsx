import React, { ReactNode } from "react";
import { SplitPane, Pane } from "react-split-pane";
import { usePersistence } from "react-split-pane/persistence";

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
                                  }: DeckBuilderLayoutProps) {
  const [sizes, setSizes] = usePersistence({
    key: "deck-builder-layout",
  });

  return (
      <div className="min-h-screen bg-darkblue text-white">
        <div className="max-w-full mx-auto p-4">
          <div className="mb-6">{header}</div>

          <SplitPane
              split="vertical"
              sizes={sizes}
              onChange={setSizes}
              className="h-[calc(100vh-180px)]"
          >
            <Pane minSize={280} defaultSize={320}>
              {leftPanel}
            </Pane>

            <Pane minSize={400}>
              <div className="flex h-full">
                <div className="flex-1 overflow-auto">
                  {rightPanel}
                </div>
              </div>
            </Pane>
          </SplitPane>
        </div>
      </div>
  );
}
