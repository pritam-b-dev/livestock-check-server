import { Response, NextFunction } from "express";
import { jwtVerify } from "jose";
import { AuthenticatedRequest, UserPayload } from "../types";

export async function verifyToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = new TextEncoder().encode(process.env.BETTER_AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);

    req.user = payload as unknown as UserPayload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}
