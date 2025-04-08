import { Request, Response } from "express";
import { prisma } from "../config/db";
import { hashPassword, comparePassword, generateApiKey } from "../utils/auth";
import { uploadImage } from "../config/cloudinary";

export const getCurrentUser = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        role: true,
        plan: true,
        createdAt: true,
        updatedAt: true,
        githubId: true,
        googleId: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: 404,
      });
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      message: "Failed to get user profile",
      status: 500,
    });
  }
};

export const updateProfile = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { name, username, bio, avatar } = req.body;

    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId },
        },
      });

      if (existingUser) {
        return res.status(409).json({
          message: "Username already taken",
          status: 409,
        });
      }
    }

    let avatarUrl = avatar;
    if (avatar && avatar.startsWith("data:image")) {
      const uploadResult = await uploadImage(avatar, "avatars");
      if (uploadResult.success) {
        avatarUrl = uploadResult.url;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        username: username || undefined,
        bio: bio !== undefined ? bio : undefined,
        avatar: avatarUrl || undefined,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        role: true,
        plan: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      message: "Failed to update profile",
      status: 500,
    });
  }
};

export const changePassword = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: 404,
      });
    }

    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Current password is incorrect",
        status: 401,
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      message: "Failed to change password",
      status: 500,
    });
  }
};

export const getUserUsage = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const apiUsage = await prisma.apiUsage.findMany({
      where: {
        userId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const dailyUsage: Record<string, number> = {};
    apiUsage.forEach((usage) => {
      const date = usage.createdAt.toISOString().split("T")[0];
      dailyUsage[date] = (dailyUsage[date] || 0) + 1;
    });

    const providerStats = await prisma.apiUsage.groupBy({
      by: ["provider"],
      where: {
        userId,
      },
      _count: {
        id: true,
      },
    });

    const providerUsage = providerStats.map((stat) => ({
      provider: stat.provider,
      count: stat._count.id,
    }));

    const totalUsage = await prisma.apiUsage.count({
      where: {
        userId,
      },
    });

    res.status(200).json({
      totalUsage,
      dailyUsage,
      providerUsage,
    });
  } catch (error) {
    console.error("Get usage error:", error);
    res.status(500).json({
      message: "Failed to get usage statistics",
      status: 500,
    });
  }
};

export const getApiKeys = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        name: true,
        lastUsed: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      apiKeys,
    });
  } catch (error) {
    console.error("Get API keys error:", error);
    res.status(500).json({
      message: "Failed to get API keys",
      status: 500,
    });
  }
};

export const createApiKey = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { name } = req.body;

    const apiKeyValue = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        name: name || "API Key",
        key: apiKeyValue,
        userId,
      },
    });

    res.status(201).json({
      message: "API key created successfully",
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKeyValue,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    console.error("Create API key error:", error);
    res.status(500).json({
      message: "Failed to create API key",
      status: 500,
    });
  }
};

export const deleteApiKey = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!apiKey) {
      return res.status(404).json({
        message: "API key not found",
        status: 404,
      });
    }

    await prisma.apiKey.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      message: "API key deleted successfully",
    });
  } catch (error) {
    console.error("Delete API key error:", error);
    res.status(500).json({
      message: "Failed to delete API key",
      status: 500,
    });
  }
};
