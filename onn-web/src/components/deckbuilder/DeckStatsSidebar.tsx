import React from "react";
import { Card, CardBody, Badge, Progress } from "@heroui/react";
import { AlertCircle, CheckCircle } from "lucide-react";

interface DeckStatsSidebarProps {
  mainDeckCount: number;
  runeCount: number;
  battlefieldCount: number;
  isValid: boolean;
  validationErrors: string[];
  validationWarnings: string[];
}

export function DeckStatsSidebar({
  mainDeckCount,
  runeCount,
  battlefieldCount,
  isValid,
  validationErrors,
  validationWarnings,
}: DeckStatsSidebarProps) {
  return (
    <div className="space-y-3">
      {/* Validation Status */}
      <Card className="border border-gold/20 bg-black">
        <CardBody className="space-y-2 py-3 px-4">
          <div className="flex items-center gap-2">
            {isValid ? (
              <>
                <CheckCircle size={16} className="text-success" />
                <p className="text-xs font-semibold text-success">
                  Deck Valid
                </p>
              </>
            ) : (
              <>
                <AlertCircle size={16} className="text-danger" />
                <p className="text-xs font-semibold text-danger">
                  Deck Invalid
                </p>
              </>
            )}
          </div>

          {validationErrors.length > 0 && (
            <div className="text-xs text-danger/80 space-y-1">
              {validationErrors.map((error, i) => (
                <p key={i}>• {error}</p>
              ))}
            </div>
          )}

          {validationWarnings.length > 0 && validationErrors.length === 0 && (
            <div className="text-xs text-warning/80 space-y-1">
              {validationWarnings.map((warning, i) => (
                <p key={i}>• {warning}</p>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Quick Stats */}
      <Card className="border border-gold/20 bg-black">
        <CardBody className="space-y-3 py-3 px-4">
          <h4 className="text-xs font-semibold text-gold uppercase">
            Quick Stats
          </h4>

          {/* Main Deck */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Main Deck</span>
              <Badge
                color={
                  mainDeckCount === 40
                    ? "success"
                    : mainDeckCount > 40
                    ? "danger"
                    : "primary"
                }
                size="sm"
              >
                {mainDeckCount}/40
              </Badge>
            </div>
            <Progress
              size="sm"
              value={Math.min((mainDeckCount / 40) * 100, 100)}
              color={
                mainDeckCount === 40
                  ? "success"
                  : mainDeckCount > 40
                  ? "danger"
                  : "primary"
              }
            />
          </div>

          {/* Runes */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Runes</span>
              <Badge
                color={
                  runeCount === 12
                    ? "success"
                    : runeCount > 12
                    ? "danger"
                    : "primary"
                }
                size="sm"
              >
                {runeCount}/12
              </Badge>
            </div>
            <Progress
              size="sm"
              value={Math.min((runeCount / 12) * 100, 100)}
              color={
                runeCount === 12
                  ? "success"
                  : runeCount > 12
                  ? "danger"
                  : "primary"
              }
            />
          </div>

          {/* Battlefields */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Battlefields</span>
              <Badge
                color={
                  battlefieldCount === 3
                    ? "success"
                    : battlefieldCount > 3
                    ? "danger"
                    : "primary"
                }
                size="sm"
              >
                {battlefieldCount}/3
              </Badge>
            </div>
            <Progress
              size="sm"
              value={Math.min((battlefieldCount / 3) * 100, 100)}
              color={
                battlefieldCount === 3
                  ? "success"
                  : battlefieldCount > 3
                  ? "danger"
                  : "primary"
              }
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
