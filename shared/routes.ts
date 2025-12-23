
import { z } from 'zod';
import { insertBookmarkSchema, insertApiTokenSchema, bookmarks, apiTokens, users } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: z.object({
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6),
      }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string().min(3),
        password: z.string().min(6),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.null(),
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    }
  },
  bookmarks: {
    list: {
      method: 'GET' as const,
      path: '/api/bookmarks',
      input: z.object({
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(10),
        search: z.string().optional(),
        isPublic: z.enum(['true', 'false']).optional(), // Filter by public/private
      }),
      responses: {
        200: z.custom<{
          items: typeof bookmarks.$inferSelect[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        }>(),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/bookmarks',
      input: insertBookmarkSchema,
      responses: {
        201: z.custom<typeof bookmarks.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/bookmarks/:id',
      input: insertBookmarkSchema.partial(),
      responses: {
        200: z.custom<typeof bookmarks.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/bookmarks/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },
  },
  admin: {
    changePassword: {
      method: 'POST' as const,
      path: '/api/admin/password',
      input: z.object({
        currentPassword: z.string(),
        newPassword: z.string(),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized, // Invalid current password
        403: errorSchemas.forbidden,    // Not admin
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/admin/login',
      input: z.object({
        password: z.string(),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
      }
    }
  },
  tokens: {
    list: {
      method: 'GET' as const,
      path: '/api/tokens',
      responses: {
        200: z.array(z.custom<typeof apiTokens.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tokens',
      input: z.object({ label: z.string().optional() }),
      responses: {
        201: z.custom<typeof apiTokens.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/tokens/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
