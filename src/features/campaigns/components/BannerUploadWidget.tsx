import React from "react";
import { Upload } from "lucide-react";

interface BannerUploadWidgetProps {
  bannerImage?: string;
  setBannerImage?: (img: string) => void;
  onBannerChange?: (img: string) => void;
}

export function BannerUploadWidget({ bannerImage = "", setBannerImage, onBannerChange }: BannerUploadWidgetProps) {
  const handleChange = (val: string) => {
    if (setBannerImage) setBannerImage(val);
    if (onBannerChange) onBannerChange(val);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
      {bannerImage ? (
        <div className="relative">
          <img src={bannerImage} alt="Banner" className="max-h-40 mx-auto rounded-lg object-cover" />
          <button
            type="button"
            onClick={() => handleChange("")}
            className="mt-2 text-[11px] text-red-400 hover:underline"
          >
            Remove image
          </button>
        </div>
      ) : (
        <label className="cursor-pointer flex flex-col items-center justify-center py-3">
          <Upload size={24} className="text-muted-foreground mb-2" />
          <span className="text-[12px] font-medium text-foreground">Upload banner image</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG up to 5MB</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      )}
    </div>
  );
}
