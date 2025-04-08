import { Request, Response } from "express";
import { prisma } from "../config/db";
import { sendEmail, emailTemplates } from "../config/email";
import {
  generateToken,
  generateRefreshToken,
  hashPassword,
  comparePassword,
  generateRandomToken,
  verifyRefreshToken,
} from "../utils/auth";
import { UserRole, SubscriptionPlan } from "../types";
import axios from "axios";
import querystring from "querystring";

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, username, name } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message:
          existingUser.email === email
            ? "Email already in use"
            : "Username already taken",
        status: 409,
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        name,
        role: UserRole.USER,
        plan: SubscriptionPlan.FREE,
      },
    });

    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      plan: user.plan as SubscriptionPlan,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      plan: user.plan as SubscriptionPlan,
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    await sendEmail(
      user.email,
      "Welcome to AI Code Generation Platform",
      emailTemplates.welcome(user.username)
    );

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        plan: user.plan,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Failed to register user",
      status: 500,
    });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
        status: 401,
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
        status: 401,
      });
    }

    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      plan: user.plan as SubscriptionPlan,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      plan: user.plan as SubscriptionPlan,
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    const ip = req.ip || req.headers["x-forwarded-for"] || "Unknown";
    const time = new Date().toISOString();

    await sendEmail(
      user.email,
      "New Login Detected",
      emailTemplates.loginAlert(user.username, time, ip.toString())
    );

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        plan: user.plan,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Failed to login",
      status: 500,
    });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token is required",
        status: 400,
      });
    }

    const userData = verifyRefreshToken(refreshToken);

    if (!userData) {
      return res.status(403).json({
        message: "Invalid or expired refresh token",
        status: 403,
      });
    }

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: userData.id,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!storedToken) {
      return res.status(403).json({
        message: "Invalid or expired refresh token",
        status: 403,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userData.id },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: 404,
      });
    }

    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      plan: user.plan as SubscriptionPlan,
    });

    res.status(200).json({
      message: "Token refreshed successfully",
      accessToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      message: "Failed to refresh token",
      status: 500,
    });
  }
};

export const logout = async (req: any, res: Response): Promise<any> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token is required",
        status: 400,
      });
    }

    await prisma.refreshToken.deleteMany({
      where: {
        token: refreshToken,
        userId: req.user?.id,
      },
    });

    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "Failed to logout",
      status: 500,
    });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(200).json({
        message:
          "If your email is registered, you will receive a password reset link",
      });
    }

    const resetToken = generateRandomToken();
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: tokenExpiry,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail(
      user.email,
      "Password Reset Request",
      emailTemplates.passwordReset(user.username, resetLink)
    );

    res.status(200).json({
      message:
        "If your email is registered, you will receive a password reset link",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      message: "Failed to process password reset request",
      status: 500,
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { token, password } = req.body;

    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!resetRecord) {
      return res.status(400).json({
        message: "Invalid or expired token",
        status: 400,
      });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordReset.delete({
      where: { id: resetRecord.id },
    });

    res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "Failed to reset password",
      status: 500,
    });
  }
};

export const githubAuth = (req: Request, res: Response): any => {
  const githubAuthUrl = "https://github.com/login/oauth/authorize";
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.API_URL}/api/auth/github/callback`;
  const scope = "read:user user:email";

  const url = `${githubAuthUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

  res.redirect(url);
};

export const githubCallback = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { code } = req.query;

    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const { access_token } = tokenRes.data;

    const userRes = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${access_token}`,
      },
    });

    const emailRes = await axios.get("https://api.github.com/user/emails", {
      headers: {
        Authorization: `token ${access_token}`,
      },
    });

    const primaryEmail = emailRes.data.find(
      (email: any) => email.primary
    )?.email;

    let user = await prisma.user.findUnique({
      where: { email: primaryEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: primaryEmail,
          username: userRes.data.login,
          name: userRes.data.name || userRes.data.login,
          password: await hashPassword(generateRandomToken().slice(0, 16)),
          role: UserRole.USER,
          plan: SubscriptionPlan.FREE,
          githubId: userRes.data.id.toString(),
          avatar: userRes.data.avatar_url,
        },
      });

      await sendEmail(
        user.email,
        "Welcome to AI Code Generation Platform",
        emailTemplates.welcome(user.username)
      );
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          githubId: userRes.data.id.toString(),
          avatar: userRes.data.avatar_url,
        },
      });
    }

    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      plan: user.plan as SubscriptionPlan,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      plan: user.plan as SubscriptionPlan,
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/error?message=Failed to authenticate with GitHub`
    );
  }
};

export const googleAuth = (req: Request, res: Response): any => {
  const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.API_URL}/api/auth/google/callback`;
  const scope = "profile email";

  const url = `${googleAuthUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

  res.redirect(url);
};

export const googleCallback = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { code } = req.query;

    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      querystring.stringify({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.API_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = tokenRes.data;

    const userRes = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const { email, name, sub: googleId, picture } = userRes.data;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const baseUsername = email.split("@")[0];
      let username = baseUsername;

      let usernameExists = true;
      let counter = 1;

      while (usernameExists) {
        const existingUser = await prisma.user.findUnique({
          where: { username },
        });

        if (!existingUser) {
          usernameExists = false;
        } else {
          username = `${baseUsername}${counter}`;
          counter++;
        }
      }

      user = await prisma.user.create({
        data: {
          email,
          username,
          name: name || username,
          password: await hashPassword(generateRandomToken().slice(0, 16)),
          role: UserRole.USER,
          plan: SubscriptionPlan.FREE,
          googleId,
          avatar: picture,
        },
      });

      await sendEmail(
        user.email,
        "Welcome to AI Code Generation Platform",
        emailTemplates.welcome(user.username)
      );
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          avatar: picture,
        },
      });
    }

    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      plan: user.plan as SubscriptionPlan,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      plan: user.plan as SubscriptionPlan,
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/error?message=Failed to authenticate with Google`
    );
  }
};
