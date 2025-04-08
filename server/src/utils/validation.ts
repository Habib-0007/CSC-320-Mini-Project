import Joi from "joi";

export const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    username: Joi.string().min(3).max(30).required(),
    name: Joi.string().min(2).max(50).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required(),
  }),
};

export const userSchemas = {
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    username: Joi.string().min(3).max(30),
    bio: Joi.string().max(500).allow(""),
    avatar: Joi.string().uri().allow(""),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  }),
};

export const projectSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).allow(""),
    language: Joi.string().allow(""),
    framework: Joi.string().allow(""),
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().max(500).allow(""),
    language: Joi.string().allow(""),
    framework: Joi.string().allow(""),
  }),

  createSnippet: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    code: Joi.string().required(),
    language: Joi.string().required(),
    description: Joi.string().max(500).allow(""),
  }),

  updateSnippet: Joi.object({
    title: Joi.string().min(3).max(100),
    code: Joi.string(),
    language: Joi.string(),
    description: Joi.string().max(500).allow(""),
  }),

  shareProject: Joi.object({
    isPublic: Joi.boolean().required(),
    expiresIn: Joi.number().integer().min(0).allow(null),
  }),
};

export const llmSchemas = {
  generate: Joi.object({
    prompt: Joi.string().required(),
    provider: Joi.string().valid("GEMINI", "OPENAI", "CLAUDE").required(),
    parameters: Joi.object().allow(null),
    language: Joi.string().allow(""),
    framework: Joi.string().allow(""),
  }),

  imageUpload: Joi.object({
    base64Image: Joi.string().required(),
    prompt: Joi.string().required(),
  }),
};

export const adminSchemas = {
  updateUserRole: Joi.object({
    role: Joi.string().valid("USER", "ADMIN").required(),
  }),

  updateUserPlan: Joi.object({
    plan: Joi.string().valid("FREE", "PREMIUM").required(),
  }),
};

export const paymentSchemas = {
  createSubscription: Joi.object({
    plan: Joi.string().valid("PREMIUM").required(),
  }),

  cancelSubscription: Joi.object({
    subscriptionId: Joi.string().required(),
  }),
};

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
        status: "error",
      });
    }
    next();
  };
};
