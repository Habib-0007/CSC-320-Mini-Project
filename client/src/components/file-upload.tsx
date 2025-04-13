import type React from "react";

import { useState, useRef } from "react";
import { Upload, X, FileText, ImageIcon, File } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  buttonText?: string;
  multiple?: boolean;
}

export function FileUpload({
  onFileSelect,
  accept = "*/*",
  maxSize = 10, // Default 10MB
  className,
  buttonText = "Upload File",
  multiple = false,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return false;
    }

    // Check file type if accept is specified
    if (accept !== "*/*") {
      const acceptedTypes = accept.split(",").map((type) => type.trim());
      const fileType = file.type;

      // Handle image/* or similar patterns
      const isAccepted = acceptedTypes.some((type) => {
        if (type.endsWith("/*")) {
          const category = type.split("/")[0];
          return fileType.startsWith(`${category}/`);
        }
        return type === fileType;
      });

      if (!isAccepted) {
        setError(`File type not accepted. Please upload ${accept}`);
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-6 w-6 text-primary" />;
    } else if (file.type.includes("pdf")) {
      return <FileText className="h-6 w-6 text-primary" />;
    } else {
      return <File className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        multiple={multiple}
        className="hidden"
      />

      {selectedFile ? (
        <div className="flex items-center justify-between p-4 border rounded-md">
          <div className="flex items-center space-x-3">
            {getFileIcon(selectedFile)}
            <div className="flex flex-col">
              <span className="text-sm font-medium truncate max-w-[200px]">
                {selectedFile.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 transition-colors",
            dragActive
              ? "border-primary/50 bg-primary/5"
              : "border-muted-foreground/25"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium mb-1">
              Drag and drop your file here
            </p>
            <p className="text-xs text-muted-foreground mb-4">or</p>
            <Button type="button" onClick={handleButtonClick}>
              {buttonText}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Max file size: {maxSize}MB {accept !== "*/*" && `(${accept})`}
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
