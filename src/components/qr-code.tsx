import { useMemo } from "react";
import { encode } from "uqr";
import { cn } from "@/lib/utils";

/** Scannable QR for a wallet address. Encodes the string exactly — no logo overlay. */
export function QrCode({
  value,
  label = "Payment QR code",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const qr = useMemo(() => encode(value, { ecc: "M", border: 2 }), [value]);

  if (!value) return null;

  return (
    <div className={cn("rounded-lg bg-paper p-3 text-ink shadow-[var(--shadow-paper)]", className)}>
      <svg
        viewBox={`0 0 ${qr.size} ${qr.size}`}
        className="block h-auto w-full"
        role="img"
        aria-label={label}
        shapeRendering="crispEdges"
      >
        {qr.data.map((row, y) =>
          row.map((on, x) =>
            on ? (
              <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
            ) : null,
          ),
        )}
      </svg>
    </div>
  );
}
