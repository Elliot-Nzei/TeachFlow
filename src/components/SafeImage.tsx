
import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSafeImageUrl } from "@/lib/image-url";

export const SafeImage = ({
  src,
  alt,
  width,
  height,
  className,
  fallbackName = "Placeholder",
  ...props
}: {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackName?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}) => {
  const [error, setError] = useState(false);
  const safeSrc = getSafeImageUrl(src || "");
  const placeholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    fallbackName
  )}&size=200&background=random&color=fff`;

  if (!safeSrc || error) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Image
      src={safeSrc}
      alt={alt}
      width={props.fill ? undefined : width}
      height={props.fill ? undefined : height}
      className={className}
      onError={() => setError(true)}
      unoptimized={safeSrc.includes("ui-avatars.com")}
      {...props}
    />
  );
};
