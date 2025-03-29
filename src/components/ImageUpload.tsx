"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { XIcon } from "lucide-react";

interface ImageUploadProps {
  file: File | null;
  setFile: (file: File | null) => void;
  previewUrl: string | null;
  setPreviewUrl: React.Dispatch<React.SetStateAction<string>>;
}

export default function ImageUpload({ file, setFile, previewUrl, setPreviewUrl }: ImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const removeImage = () => {
    setFile(null);
    setPreviewUrl("");
  };

  return (
    <div className="flex flex-col items-center">
      {previewUrl ? (
        <div className="relative size-40">
          <img src={previewUrl} alt="Preview" className="rounded-md size-40 object-cover" />
          <button
            onClick={removeImage}
            className="absolute top-0 right-0 p-1 bg-red-500 rounded-full shadow-sm"
            type="button"
          >
            <XIcon className="h-4 w-4 text-white" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className="border-dashed border-2 border-gray-300 p-6 rounded-lg text-center cursor-pointer hover:bg-gray-100 transition w-80 h-40 flex justify-center items-center"
        >
          <input {...getInputProps()} />
          {isDragActive ? <p className="text-gray-500">Drop the file here...</p> : <p className="text-gray-500">Drag & drop an image here, or click to select</p>}
        </div>
      )}
    </div>
  );
}
