// src/components/FileUploadComponent.tsx
import React, { useState } from "react";

const FileUploadComponent: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      //type & size check ---
      const maxBytes = 5 * 1024 * 1024; // 5 MB
      const allowed = ["image/jpeg", "image/png", "image/gif"];
      if (file.size > maxBytes) {
        alert("File too large (max 5 MB).");
        return;
      }
      if (!allowed.includes(file.type)) {
       alert("Invalid file type. Only JPEG, PNG or GIF.");
       return;
      }
      //end checks
      setSelectedFile(file);
    }
  };

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
