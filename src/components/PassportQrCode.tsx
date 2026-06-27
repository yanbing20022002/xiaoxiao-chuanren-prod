import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface PassportQrCodeProps {
  value: string;
  size?: number;
  alt?: string;
}

export default function PassportQrCode({
  value,
  size = 180,
  alt = "Passport QR Code"
}: PassportQrCodeProps) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!value) {
      setDataUrl("");
      return;
    }

    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: "#111111",
        light: "#ffffff"
      }
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [size, value]);

  if (!dataUrl) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-stone-200 bg-white text-[10px] text-stone-500"
        style={{ width: size, height: size }}
      >
        Generating QR...
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      className="rounded-xl border-4 border-stone-100 shadow-xl"
      width={size}
      height={size}
    />
  );
}
