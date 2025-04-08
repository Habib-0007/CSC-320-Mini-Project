import { Request, Response } from "express";
import { prisma } from "../config/db";
import { UserRole, SubscriptionPlan } from "../types";
import { emailTemplates, sendEmail } from "../config/email";

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          plan: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true,
              apiUsage: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limitNum,
      }),
      prisma.user.count(),
    ]);

    res.status(200).json({
      users,
      pagination: {
        total: totalUsers,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalUsers / limitNum),
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      message: "Failed to get users",
      status: 500,
    });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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
        _count: {
          select: {
            projects: true,
            apiUsage: true,
            refreshTokens: true,
          },
        },
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
    console.error("Get user by ID error:", error);
    res.status(500).json({
      message: "Failed to get user",
      status: 500,
    });
  }
};

export const updateUserRole = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: 404,
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: role as UserRole },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    res.status(200).json({
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({
      message: "Failed to update user role",
      status: 500,
    });
  }
};

export const updateUserPlan = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: 404,
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { plan: plan as SubscriptionPlan },
      select: {
        id: true,
        email: true,
        username: true,
        plan: true,
      },
    });

    if (plan === SubscriptionPlan.PREMIUM) {
      await sendEmail(
        user.email,
        "Your Subscription Has Been Updated",
        emailTemplates.subscriptionConfirmation(user.username, plan)
      );
    }

    res.status(200).json({
      message: "User plan updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user plan error:", error);
    res.status(500).json({
      message: "Failed to update user plan",
      status: 500,
    });
  }
};

export const deleteUser = async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      return res.status(400).json({
        message: "You cannot delete your own account",
        status: 400,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: 404,
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      message: "Failed to delete user",
      status: 500,
    });
  }
};

export const getTotalUsage = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const apiUsage = await prisma.apiUsage.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const dailyUsage: Record<string, number> = {};
    apiUsage.forEach((usage: any) => {
      const date = usage.createdAt.toISOString().split("T")[0];
      dailyUsage[date] = (dailyUsage[date] || 0) + 1;
    });

    const providerStats = await prisma.apiUsage.groupBy({
      by: ["provider"],
      _count: {
        id: true,
      },
    });

    const providerUsage = providerStats.map((stat: any) => ({
      provider: stat.provider,
      count: stat._count.id,
    }));

    const userStats = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.user.count({
        where: {
          plan: SubscriptionPlan.PREMIUM,
        },
      }),
    ]);

    const projectStats = await Promise.all([
      prisma.project.count(),
      prisma.project.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    const stats = {
      users: {
        total: userStats[0],
        new: userStats[1],
        premium: userStats[2],
      },
      projects: {
        total: projectStats[0],
        new: projectStats[1],
      },
      apiUsage: {
        total: apiUsage.length,
        daily: dailyUsage,
        byProvider: providerUsage,
      },
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("Get total usage error:", error);
    res.status(500).json({
      message: "Failed to get usage statistics",
      status: 500,
    });
  }
};

export const getUserUsage = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: 404,
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const apiUsage = await prisma.apiUsage.findMany({
      where: {
        userId: id,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const dailyUsage: Record<string, number> = {};
    apiUsage.forEach((usage: any) => {
      const date = usage.createdAt.toISOString().split("T")[0];
      dailyUsage[date] = (dailyUsage[date] || 0) + 1;
    });

    const providerStats = await prisma.apiUsage.groupBy({
      by: ["provider"],
      where: {
        userId: id,
      },
      _count: {
        id: true,
      },
    });

    const providerUsage = providerStats.map((stat: any) => ({
      provider: stat.provider,
      count: stat._count.id,
    }));

    const totalUsage = await prisma.apiUsage.count({
      where: {
        userId: id,
      },
    });

    const projects = await prisma.project.count({
      where: {
        userId: id,
      },
    });

    res.status(200).json({
      totalUsage,
      dailyUsage,
      providerUsage,
      projects,
    });
  } catch (error) {
    console.error("Get user usage error:", error);
    res.status(500).json({
      message: "Failed to get user usage statistics",
      status: 500,
    });
  }
};

export const getLLMStatistics = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const providerStats = await prisma.apiUsage.groupBy({
      by: ["provider"],
      _count: {
        id: true,
      },
    });

    const errorStats = await prisma.apiUsage.groupBy({
      by: ["provider", "status"],
      _count: {
        id: true,
      },
    });

    const providers = providerStats.map((stat: any) => {
      const totalCalls = stat._count.id;
      const errors = errorStats
        .filter(
          (err: any) => err.provider === stat.provider && err.status !== "success"
        )
        .reduce((total: any, err: any) => total + err._count.id, 0);

      return {
        provider: stat.provider,
        totalCalls,
        errorCalls: errors,
        successRate: ((totalCalls - errors) / totalCalls) * 100,
      };
    });

    const avgResponseTime = await prisma.$queryRaw`
      SELECT provider, AVG(responseTime) as avg_time
      FROM ApiUsage
      GROUP BY provider
    `;

    res.status(200).json({
      providers,
      responseTime: avgResponseTime,
    });
  } catch (error) {
    console.error("Get LLM statistics error:", error);
    res.status(500).json({
      message: "Failed to get LLM statistics",
      status: 500,
    });
  }
};
