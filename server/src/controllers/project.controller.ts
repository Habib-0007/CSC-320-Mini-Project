import type { Request, Response } from "express";
import { prisma } from "../config/db";
import { generateShareToken } from "../utils/auth";

// export const getAllProjects = async (req: any, res: Response): Promise<any> => {
//   try {
//     const userId = req.user!.id;
//     const { page = 1, limit = 10, search = "" } = req.query;

//     const pageNum = Number.parseInt(page as string);
//     const limitNum = Number.parseInt(limit as string);
//     const skip = (pageNum - 1) * limitNum;

//     const where = {
//       userId,
//       ...(search
//         ? {
//             OR: [
//               { name: { contains: search as string, mode: "insensitive" } },
//               {
//                 description: {
//                   contains: search as string,
//                   mode: "insensitive",
//                 },
//               },
//             ],
//           }
//         : {}),
//     };

//     const [projects, totalProjects] = await Promise.all([
//       prisma.project.findMany({
//         where,
//         orderBy: {
//           updatedAt: "desc",
//         },
//         include: {
//           _count: {
//             select: {
//               snippets: true,
//             },
//           },
//         },
//         skip,
//         take: limitNum,
//       }),
//       prisma.project.count({ where }),
//     ]);

//     res.status(200).json({
//       projects,
//       pagination: {
//         total: totalProjects,
//         page: pageNum,
//         limit: limitNum,
//         pages: Math.ceil(totalProjects / limitNum),
//       },
//     });
//   } catch (error) {
//     console.error("Get all projects error:", error);
//     res.status(500).json({
//       message: "Failed to get projects",
//       error: error instanceof Error ? error.message : "Unknown error",
//       status: 500,
//     });
//   }
// };

export const getAllProjects = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10, search = "" } = req.query;

    const pageNum = Number.parseInt(page as string);
    const limitNum = Number.parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId,
    };

    // Add search conditions if search parameter is provided
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" as const } },
        {
          description: {
            contains: search as string,
            mode: "insensitive" as const,
          },
        },
      ];
    }

    const [projects, totalProjects] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          _count: {
            select: {
              snippets: true,
            },
          },
        },
        skip,
        take: limitNum,
      }),
      prisma.project.count({ where }),
    ]);

    res.status(200).json({
      projects,
      pagination: {
        total: totalProjects,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalProjects / limitNum),
      },
    });
  } catch (error) {
    console.error("Get all projects error:", error);
    res.status(500).json({
      message: "Failed to get projects",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const createProject = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { name, description, language, framework } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description: description || "",
        language: language || "",
        framework: framework || "",
        userId,
      },
    });

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({
      message: "Failed to create project",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const getProjectById = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        _count: {
          select: {
            snippets: true,
          },
        },
        share: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
        status: 404,
      });
    }

    res.status(200).json({
      project,
    });
  } catch (error) {
    console.error("Get project by ID error:", error);
    res.status(500).json({
      message: "Failed to get project",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const updateProject = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, description, language, framework } = req.body;

    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
        status: 404,
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        language: language !== undefined ? language : undefined,
        framework: framework !== undefined ? framework : undefined,
      },
    });

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({
      message: "Failed to update project",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const deleteProject = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
        status: 404,
      });
    }

    await prisma.project.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      message: "Failed to delete project",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const createSnippet = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { projectId } = req.params;
    const { title, code, language, description } = req.body;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
        status: 404,
      });
    }

    const snippet = await prisma.codeSnippet.create({
      data: {
        title,
        code,
        language,
        description: description || "",
        projectId,
      },
    });

    res.status(201).json({
      message: "Snippet created successfully",
      snippet,
    });
  } catch (error) {
    console.error("Create snippet error:", error);
    res.status(500).json({
      message: "Failed to create snippet",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const getProjectSnippets = async (
  req: any,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { projectId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Number.parseInt(page as string);
    const limitNum = Number.parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
        status: 404,
      });
    }

    const [snippets, totalSnippets] = await Promise.all([
      prisma.codeSnippet.findMany({
        where: {
          projectId,
        },
        orderBy: {
          updatedAt: "desc",
        },
        skip,
        take: limitNum,
      }),
      prisma.codeSnippet.count({
        where: {
          projectId,
        },
      }),
    ]);

    res.status(200).json({
      snippets,
      pagination: {
        total: totalSnippets,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalSnippets / limitNum),
      },
    });
  } catch (error) {
    console.error("Get project snippets error:", error);
    res.status(500).json({
      message: "Failed to get snippets",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const getSnippetById = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { projectId, snippetId } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
        status: 404,
      });
    }

    const snippet = await prisma.codeSnippet.findFirst({
      where: {
        id: snippetId,
        projectId,
      },
    });

    if (!snippet) {
      return res.status(404).json({
        message: "Snippet not found",
        status: 404,
      });
    }

    res.status(200).json({
      snippet,
    });
  } catch (error) {
    console.error("Get snippet by ID error:", error);
    res.status(500).json({
      message: "Failed to get snippet",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const updateSnippet = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { projectId, snippetId } = req.params;
    const { title, code, language, description } = req.body;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
        status: 404,
      });
    }

    const existingSnippet = await prisma.codeSnippet.findFirst({
      where: {
        id: snippetId,
        projectId,
      },
    });

    if (!existingSnippet) {
      return res.status(404).json({
        message: "Snippet not found",
        status: 404,
      });
    }

    const updatedSnippet = await prisma.codeSnippet.update({
      where: { id: snippetId },
      data: {
        title: title || undefined,
        code: code !== undefined ? code : undefined,
        language: language || undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    res.status(200).json({
      message: "Snippet updated successfully",
      snippet: updatedSnippet,
    });
  } catch (error) {
    console.error("Update snippet error:", error);
    res.status(500).json({
      message: "Failed to update snippet",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const deleteSnippet = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { projectId, snippetId } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
        status: 404,
      });
    }

    const existingSnippet = await prisma.codeSnippet.findFirst({
      where: {
        id: snippetId,
        projectId,
      },
    });

    if (!existingSnippet) {
      return res.status(404).json({
        message: "Snippet not found",
        status: 404,
      });
    }

    await prisma.codeSnippet.delete({
      where: { id: snippetId },
    });

    res.status(200).json({
      message: "Snippet deleted successfully",
    });
  } catch (error) {
    console.error("Delete snippet error:", error);
    res.status(500).json({
      message: "Failed to delete snippet",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const shareProject = async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { projectId } = req.params;
    const { isPublic, expiresIn } = req.body;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
        status: 404,
      });
    }

    const existingShare = await prisma.projectShare.findFirst({
      where: {
        projectId,
      },
    });

    let expiresAt: null | Date = null;
    if (expiresIn && expiresIn > 0) {
      expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
    }

    let share;

    if (existingShare) {
      share = await prisma.projectShare.update({
        where: { id: existingShare.id },
        data: {
          isPublic,
          expiresAt,
        },
      });
    } else {
      const token = generateShareToken();

      share = await prisma.projectShare.create({
        data: {
          projectId,
          token,
          isPublic,
          expiresAt,
        },
      });
    }

    res.status(200).json({
      message: "Project shared successfully",
      share,
    });
  } catch (error) {
    console.error("Share project error:", error);
    res.status(500).json({
      message: "Failed to share project",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const removeProjectShare = async (
  req: any,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { projectId } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
        status: 404,
      });
    }

    const share = await prisma.projectShare.findFirst({
      where: {
        projectId,
      },
    });

    if (!share) {
      return res.status(404).json({
        message: "Project share not found",
        status: 404,
      });
    }

    await prisma.projectShare.delete({
      where: { id: share.id },
    });

    res.status(200).json({
      message: "Project share removed successfully",
    });
  } catch (error) {
    console.error("Remove project share error:", error);
    res.status(500).json({
      message: "Failed to remove project share",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};

export const getSharedProject = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { token } = req.params;

    const share = await prisma.projectShare.findFirst({
      where: {
        token,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!share) {
      return res.status(404).json({
        message: "Shared project not found or link expired",
        status: 404,
      });
    }

    if (!share.isPublic) {
      return res.status(403).json({
        message: "This project is not publicly shared",
        status: 403,
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: share.projectId,
      },
      include: {
        snippets: true,
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
        status: 404,
      });
    }

    res.status(200).json({
      project,
    });
  } catch (error) {
    console.error("Get shared project error:", error);
    res.status(500).json({
      message: "Failed to get shared project",
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
};
