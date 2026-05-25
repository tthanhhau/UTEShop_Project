import { Router } from "express";
import multer from "multer";
import { transcribeAudio } from "../controllers/asrController.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const isAudio = file.mimetype?.startsWith("audio/");
        const isWebm = file.mimetype === "video/webm";
        if (isAudio || isWebm) {
            cb(null, true);
        } else {
            cb(new Error("Chi chap nhan file audio"), false);
        }
    },
});

router.post("/transcribe", upload.single("audio"), transcribeAudio);

export default router;
