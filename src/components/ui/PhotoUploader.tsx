/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface PhotoUploaderProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  onRemove?: () => void;
  label?: string;
  helperText?: string;
  accept?: string;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  value,
  onChange,
  onRemove,
  label = 'Upload entrance / storefront photo',
  helperText = 'Supports JPG, PNG, WebP from your device',
  accept = 'image/*',
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onChange(result);
    };
    reader.readAsDataURL(file);
  };

  if (value) {
    return (
      <div className="space-y-2">
        {label && <label className="block text-xs font-medium text-slate-700">{label}</label>}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
          <img
            src={value}
            alt="Uploaded preview"
            className="w-20 h-16 sm:w-24 sm:h-20 object-cover rounded-xl border border-slate-300"
          />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-800 block truncate">
              Photo Attached
            </span>
            <button
              type="button"
              onClick={onRemove || (() => onChange(''))}
              className="mt-1 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove Photo</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-slate-700">{label}</label>}
      <label className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-300 text-xs text-slate-600 transition-colors cursor-pointer group shadow-2xs">
        <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-sky-50 text-slate-500 group-hover:text-sky-600 flex items-center justify-center transition-colors">
          <Upload className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-slate-800 block">{label}</span>
          {helperText && <span className="text-[11px] text-slate-400 block">{helperText}</span>}
        </div>
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>
    </div>
  );
};

