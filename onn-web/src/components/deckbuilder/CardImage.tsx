import React from "react";
import {CardOption} from "./types";

type CardImageProps = {
    card: CardOption;
    size?: "compact" | "selected" | "modal";
};

const sizeClasses = {
    compact: "aspect-[5/7]",
    modal: "aspect-[5/7] max-h-48",
    selected: "aspect-[5/7] max-h-[28rem]",
} as const;

export function CardImage({
                              card,
                              size = "compact",
                          }: CardImageProps) {
    return (
        <div
            className={`
        ${sizeClasses[size]}
        w-full
        overflow-hidden
        rounded-xl
        bg-default-100
        shadow-sm
      `}
        >
            {card.imageUrl ? (
                <img
                    src={card.imageUrl}
                    alt={card.name}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="
            h-full
            w-full
            object-contain
            transition-transform
            duration-300
            hover:scale-[1.02]
          "
                />
            ) : (
                <div
                    className="
            flex
            h-full
            flex-col
            items-center
            justify-center
            gap-2
            px-4
            text-center
            text-default-500
          "
                >
                    <span className="text-3xl opacity-50">🃏</span>
                    <span className="text-sm font-medium">{card.name}</span>
                </div>
            )}
        </div>
    );
}
