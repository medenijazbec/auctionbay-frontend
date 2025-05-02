// src/components/FileUploadComponent.tsx
import React, { useState } from "react";

const FileUploadComponent: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string>("");
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    // client‐side size + MIME checks
    const maxBytes = 10 * 1024 * 1024;
    const allowed = ["image/jpeg", "image/png", "image/gif"];
    if (file.size > maxBytes) {
      alert("File too large (max 10 MB).");
      return;
    }
    if (!allowed.includes(file.type)) {
      alert("Invalid file type. Only JPEG, PNG or GIF.");
      return;
    }
  
    // magic‐byte check
    const slice = file.slice(0, 8);
    const reader = new FileReader();
    reader.onload = () => {
      const buf = new Uint8Array(reader.result as ArrayBuffer);
      if (!isValidMagicBytes(buf)) {
        alert("File contents do not match a valid image.");
        return;
      }
      // finally accept it
      setSelectedFile(file);
    };
    reader.readAsArrayBuffer(slice);
  };
  

  function isValidMagicBytes(buf: Uint8Array): boolean {
    // JPEG
    if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
    // PNG
    if (buf.slice(0,8).every((b,i) => 
          [0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A][i] === b))
      return true;
    // GIF87a / GIF89a
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 &&
       buf[3] === 0x38 &&
      (buf[4] === 0x37 || buf[4] === 0x39) &&
       buf[5] === 0x61)
      return true;
    return false;
  }
  
  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    //treba dat na srvr pa pol docker addr aka nas 192.168.1.13:7056
    const response = await fetch("https://localhost:7056/api/ImageUpload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (response.ok) {
      setUploadUrl(data.url);
      alert("Image uploaded! URL: " + data.url);
    } else {
      alert("Error: " + data.error);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload Image</button>
      {uploadUrl && <p>Image URL: {uploadUrl}</p>}
    </div>
  );
};

export default FileUploadComponent;
