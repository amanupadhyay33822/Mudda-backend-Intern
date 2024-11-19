const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const cors = require("cors");
const dotenv = require('dotenv');
const Video = require("./models/video");  // Ensure this model is created as per the schema below
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
dotenv.config();

// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// AWS S3 Configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'eu-north-1', // Adjust as per your AWS region
});
const s3 = new AWS.S3();

// Multer Configuration for File Upload
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, 'uploads'),
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});

// Middleware
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// Compress Video using FFmpeg
const compressVideo = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx265')
      .size('80%')
      .on('end', () => {
        console.log('Compression completed!');
        resolve();
      })
      .on('error', (err) => {
        console.error('Compression failed:', err);
        reject(err);
      })
      .run();
  });
};

// Upload File to S3
const uploadToS3 = (bucket, filePath, fileName) => {
  return s3.upload({
    Bucket: bucket,
    Key: fileName,
    Body: fs.createReadStream(filePath),
  }).promise();
};

// POST: Upload and Compress Video
app.post('/upload', upload.single('video'), async (req, res) => {
  const videoPath = req.file.path;
  const originalFileName = req.file.originalname;
  const compressedFileName = `compressed-${req.file.originalname}`;
  const compressedFilePath = path.join(__dirname, 'uploads', compressedFileName);

  try {
    // Upload Original Video to S3
    const originalUpload = await uploadToS3(
      process.env.S3_BUCKET_NAME,
      videoPath,
      originalFileName
    );

    console.log('Original video uploaded to S3:', originalUpload.Location);

    // Compress the video
    await compressVideo(videoPath, compressedFilePath);

    // Upload Compressed Video to S3
    const compressedUpload = await uploadToS3(
      process.env.S3_BUCKET_NAME,
      compressedFilePath,
      compressedFileName
    );

    console.log('Compressed video uploaded to S3:', compressedUpload.Location);

    // Save metadata to MongoDB
    const videoDoc = new Video({
      fileName: req.file.originalname,
      originalUrl: originalUpload.Location,
      compressedUrl: compressedUpload.Location,
      status: 'Completed',
    });
    await videoDoc.save();

    // Cleanup local files
    fs.unlinkSync(videoPath);
    fs.unlinkSync(compressedFilePath);

    res.status(201).json({
      message: 'Original and compressed videos uploaded successfully!',
      originalUrl: originalUpload.Location,
      compressedUrl: compressedUpload.Location,
      videoId: videoDoc._id,
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET: Generate Pre-Signed URLs for Video Download
app.get('/videos/:id/download', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Generate Pre-Signed URLs
    const originalPresignedUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: video.fileName, // Ensure this matches the original S3 object key
      Expires: 60 * 60, // 1 hour expiry
    });

    const compressedPresignedUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `compressed-${video.fileName}`, // Adjust to the compressed file's S3 key
      Expires: 60 * 60, // 1 hour expiry
    });

    res.json({
      original: originalPresignedUrl,
      compressed: compressedPresignedUrl,
    });
  } catch (error) {
    console.error('Error generating pre-signed URLs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
