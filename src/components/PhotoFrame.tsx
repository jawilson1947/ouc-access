'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';

export function PhotoFrame() {
  const [imageUrl, setImageUrl] = useState('/default-profile.png');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className="w-32 h-32 border-2 border-gray-300 rounded-md overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <Image
        src={imageUrl}
        alt="Profile photo"
        width={128}
        height={128}
        className="object-cover w-full h-full"
      />
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept="image/jpeg,image/png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                setImageUrl(e.target.result as string);
              }
            };
            reader.readAsDataURL(file);
          }
        }}
      />
    </div>
  );
}