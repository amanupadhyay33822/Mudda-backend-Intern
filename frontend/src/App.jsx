import { useState } from 'react';
import axios from 'axios';
import Spinner from './Spinner'; // Assuming Spinner is a loading spinner component
import './App.css'; // Import the CSS file

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [videoId, setVideoId] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [compressedUrl, setCompressedUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0); // Track upload progress
  const [isUploading, setIsUploading] = useState(false); // State to track upload progress
  
  // Handle file selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Handle file upload with progress tracking
  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('video', selectedFile);

    setIsUploading(true); // Set uploading state to true when upload starts
    setUploadStatus('Uploading...');

    try {
      const response = await axios.post('https://mudda-backend-intern-production.up.railway.app/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(progress);
        },
      });
    
      setVideoId(response.data.videoId); // Store video ID
      setOriginalUrl(response.data.originalUrl);
      setCompressedUrl(response.data.compressedUrl);
      setUploadStatus('Upload successful!');
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('Upload failed. Please try again.');
    } finally {
      setIsUploading(false); // Reset uploading state once upload is done
    }
  };

  // Handle video download
  const handleDownload = async () => {
    if (!videoId) {
      setUploadStatus('Video not available for download.');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/videos/${videoId}/download`);
      const preSignedUrl = response.data.compressed;

      // Trigger the download using the pre-signed URL
      const link = document.createElement('a');
      link.href = preSignedUrl;
      link.download = preSignedUrl.split('/').pop(); // Extract file name from URL
      link.click();
    } catch (error) {
      console.error('Error fetching pre-signed URL:', error);
      setUploadStatus('Failed to download video. Please try again.');
    }
  };

  return (
    <div className="app-container">
      {/* Spinner overlay */}
      {isUploading && (
        <div className="overlay">
          <div className="spinner-wrapper">
            <Spinner />
          </div>
        </div>
      )}

      <h2>Video Upload</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload} className="upload-button">
        Upload
      </button>

      {originalUrl && (
        <div className="upload-video-section">
          <h3>Uploaded Videos:</h3>
          {/* <p>
            <strong>Compressed Video: </strong>
            <a href={compressedUrl} target="_blank" rel="noopener noreferrer">
              {compressedUrl}
            </a>
          </p> */}
          <button
            onClick={handleDownload}
            className="download-button"
          >
            Download Compressed Video
          </button>
        </div>
      )}
    </div>
  );
};

export default App;