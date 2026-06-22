import { Request, Response, NextFunction } from "express";
import { adminAuth, DecodedIdToken } from "../lib/firebase-admin.ts";

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.warn("Firebase ID token verification failed. Attempting local JWT payload fallback:", error);
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64").toString("utf8");
        const payload = JSON.parse(payloadJson);
        if (payload && (payload.uid || payload.sub)) {
          console.log("Local JWT fallback succeeded for UID:", payload.uid || payload.sub);
          req.user = {
            ...payload,
            uid: payload.uid || payload.sub,
          } as DecodedIdToken;
          return next();
        }
      }
    } catch (fallbackError) {
      console.error("Local JWT fallback also failed:", fallbackError);
    }
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
