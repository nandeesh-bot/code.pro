const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
require("dotenv").config()

const User = require("./models/User")
const Video = require("./models/Video")
const auth = require("./middleware/auth")

const app = express()
const uploadDir = path.join(__dirname, "public", "uploads")
const maxUploadBytes = 25 * 1024 * 1024
let isMongoConnected = false

const videoExtByMime = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/ogg": ".ogv",
    "video/quicktime": ".mov",
    "video/x-matroska": ".mkv"
}

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

app.use(express.json({ limit: "35mb" }))
app.use(cors())
app.use(express.static("public"))

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

// MongoDB connection with fallback for preview mode
// For production, replace with your MongoDB Atlas connection string
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/authdb")
.then(()=>{
    console.log("✓ MongoDB Connected")
    isMongoConnected = true
})
.catch(err => {
    console.log("⚠ MongoDB not available - running in PREVIEW MODE")
    console.log("To enable full features:")
    console.log("1. Set up MongoDB Atlas: https://cloud.mongodb.com")
    console.log("2. Add your connection string to .env as MONGODB_URI")
    console.log("3. Or install local MongoDB and run: mongod --dbpath \"C:\\data\\db\"")
    isMongoConnected = false
});

// In-memory storage for preview mode
let demoUsers = [
    { id: 1, name: "Demo User", email: "demo@example.com", password: "$2a$10$EKy8lbAKfZMJ7NHVk/M6WeGm9aE0t/1mxFQFEPi.eEd0zxnJ46bDG" } // password: "demo123"
];
let demoVideos = [
    {
        id: 1,
        title: "API-first auth with Node & JWT",
        description: "Secure tokens, refresh flow, production tips.",
        url: "https://example.com/video1",
        category: "Backend",
        level: "Intermediate",
        length: "12:48",
        thumbnail: ""
    }
];

/* REGISTER */

app.post("/register", async(req,res)=>{
    const {name,email,password} = req.body

    try {
        if (isMongoConnected) {
            // Check if user already exists
            const existingUser = await User.findOne({email})
            if(existingUser) return res.status(400).json({message:"User already exists"})

            const hash = await bcrypt.hash(password,10)

            const user = new User({
                name,
                email,
                password:hash
            })

            await user.save()
            res.json({message:"User Registered Successfully! Please login."})
        } else {
            // Preview mode
            const existingUser = demoUsers.find(u => u.email === email)
            if(existingUser) return res.status(400).json({message:"User already exists"})

            const hash = await bcrypt.hash(password,10)
            demoUsers.push({
                id: demoUsers.length + 1,
                name,
                email,
                password: hash
            })
            res.json({message:"User Registered Successfully! (Preview Mode) Please login."})
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Server error"})
    }
})

/* LOGIN */

app.post("/login", async(req,res)=>{
    const {email,password} = req.body

    try {
        let user;
        if (isMongoConnected) {
            user = await User.findOne({email})
        } else {
            // Preview mode
            user = demoUsers.find(u => u.email === email)
        }

        if(!user) return res.status(400).json({message:"User not found"})

        const valid = await bcrypt.compare(password,user.password)

        if(!valid) return res.status(400).json({message:"Wrong password"})

        const token = jwt.sign(
            {id:user._id || user.id},
            process.env.JWT_SECRET,
            {expiresIn:"1h"}
        )

        res.json({message:"Login Success",token})
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Server error"})
    }
})

/* PROTECTED ROUTE */

app.get("/dashboard",auth,(req,res)=>{

console.log('Dashboard route hit, user:', req.user);

try {
    res.json({message:"Welcome to dashboard"})
} catch (error) {
    console.error(error)
    res.status(500).json({message:"Server error"})
}

})

/* VIDEOS */

app.get("/videos", auth, async (req, res) => {
    try {
        if (!isMongoConnected) {
            return res.json({ videos: demoVideos });
        }

        const videos = await Video.find().sort({ createdAt: -1 }).lean();
        res.json({ videos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/videos", auth, async (req, res) => {
    const {
        title,
        description,
        url,
        thumbnail,
        length,
        level,
        category,
        videoData
    } = req.body;

    const safeTitle = (title || "").trim();
    const safeDescription = (description || "").trim();
    const safeUrl = (url || "").trim();
    const safeThumbnail = (thumbnail || "").trim();
    const safeLength = (length || "").trim();
    const safeLevel = (level || "").trim();
    const safeCategory = (category || "").trim();
    const hasUpload = typeof videoData === "string" && videoData.trim().length > 0;

    if (!safeTitle || !safeLength) {
        return res.status(400).json({ message: "title and length are required" });
    }

    if (!safeUrl && !hasUpload) {
        return res.status(400).json({ message: "provide a video URL or upload a video file" });
    }

    if (safeUrl && hasUpload) {
        return res.status(400).json({ message: "choose either video URL or upload, not both" });
    }

    try {
        let finalUrl = safeUrl;

        if (hasUpload) {
            const match = videoData.trim().match(/^data:(video\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
            if (!match) {
                return res.status(400).json({ message: "invalid video upload format" });
            }

            const mimeType = match[1].toLowerCase();
            const fileExt = videoExtByMime[mimeType];
            if (!fileExt) {
                return res.status(400).json({ message: "unsupported video type" });
            }

        const fileBuffer = Buffer.from(match[2], "base64");
        if (!fileBuffer.length) {
            return res.status(400).json({ message: "uploaded file is empty" });
        }

            if (fileBuffer.length > maxUploadBytes) {
                return res.status(400).json({ message: "video file must be 25MB or smaller" });
            }

            const fileName = `${Date.now()}-${crypto.randomUUID()}${fileExt}`;
            const outputPath = path.join(uploadDir, fileName);
            await fs.promises.writeFile(outputPath, fileBuffer);
            finalUrl = `/uploads/${fileName}`;
        }

        if (!isMongoConnected) {
            const demoVideo = {
                id: demoVideos.length + 1,
                title: safeTitle,
                description: safeDescription,
                url: finalUrl,
                thumbnail: safeThumbnail,
                length: safeLength,
                level: safeLevel,
                category: safeCategory
            };
            demoVideos.unshift(demoVideo);
            return res.status(201).json({ message: "Video posted (preview mode)", video: demoVideo });
        }

        const video = new Video({
            title: safeTitle,
            description: safeDescription,
            url: finalUrl,
            thumbnail: safeThumbnail,
            length: safeLength,
            level: safeLevel,
            category: safeCategory
        });

        await video.save();
        res.status(201).json({ message: "Video posted", video });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(5000,()=>{
console.log("Server running on port 5000")
})
