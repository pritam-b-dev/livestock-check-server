import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";

// Define custom interface for Express Request with user
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload & {
    role?: string;
    plan?: string;
    id?: string;
  };
}

const authUrl = process.env.BETTER_AUTH_URL || "http://localhost:5000";

// Initialize Remote JWK Set once at module load
const JWKS = createRemoteJWKSet(new URL(`${authUrl}/api/auth/jwks`));

export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];

    // Local JWT verification using remote JWKS
    const { payload } = await jwtVerify(token, JWKS);

    req.user = payload as AuthenticatedRequest["user"];
    next();
  } catch (error) {
    /*
     * NOTE / FALLBACK:
     * If JWKS verification encounters issues or network failures under time pressure/local testing,
     * you can fallback to querying the `sessionCollection` in MongoDB using the raw session token:
     *
     * const session = await sessionCollection.findOne({ token });
     * if (!session) return res.status(401).json({ error: "Invalid Session" });
     * const user = await usersCollection.findOne({ _id: session.userId });
     * req.user = user;
     */
    return res
      .status(401)
      .json({
        error: "Unauthorized: Invalid token",
        details: (error as Error).message,
      });
  }
};
