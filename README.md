# Video Compression API Using MERN Stack and AWS

This project provides a RESTful API for compressing video files with minimal quality loss. It allows users to upload high-size video files, compress them, and download the compressed version. The system utilizes the MERN stack (MongoDB, Express, React, Node.js) and AWS services for efficient video processing and storage.

## Features

- Upload high-size video files
- Compress videos with minimal quality loss
- Provide a download link for the compressed video
- Efficient handling of large video files
- Simple and responsive frontend for user interaction

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React.js
- **Database**: MongoDB (to store video metadata)
- **Video Compression**: FFmpeg
- **Storage**: AWS S3 (for storing original and compressed videos)
- **File Uploads**: Multer (middleware for handling multipart/form-data)

## Endpoints

- **POST /upload**: Upload a video file
- **GET /videos/:id/download**: Download the original or compressed video


## Requirements

- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud service)
- **AWS Account** (for S3 storage)
- **FFmpeg** (for video compression)
- **AWS SDK** (for interacting with AWS S3)

## Setup Instructions

### Backend Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/video-compression-api.git
   cd video-compression-api/backend

2.Setup Frontend:

   - cd frontend
   - npm install
   - npm run dev

3. Backend Setup:

- cd frontend
- npm install
- npm start

4.Set up environment variables in backend :

    ACCESS_KEY_ID=your-aws-access-key
    SECRET_ACCESS_KEY=your-aws-secret-key
    S3_BUCKET=your-s3-bucket-name
    MONGO_URI=your-mongodb-connection-uri




    

