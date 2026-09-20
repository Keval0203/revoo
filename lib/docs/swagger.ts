import { createSwaggerSpec } from 'next-swagger-doc';
import path from 'path';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: path.join(process.cwd(), 'app/api'),
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Next.js API',
        version: '1.0.0',
        description: 'API documentation for Next.js application',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
    },
  });
  return spec;
};