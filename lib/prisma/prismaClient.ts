import { PrismaClient } from "../generated/prisma";

const globalForPrisma = globalThis as unknown as {
	prisma?: PrismaClient;
};

const createPrismaClient = () => {
	const client = new PrismaClient();

	const prisma = client.$extends({
		query: {
			$allModels: {
				async $allOperations({ args, model, operation, query }) {
					const needsHashId = (data: any) => {
						return data !== undefined && (data.hashId === undefined || data.hashId === 0);
					};

					const assignHashId = async (createData: any) => {
						if (model && createData && needsHashId(createData)) {
							try {
								const modelClient = (client as any)[model];
								if (modelClient && typeof modelClient.findFirst === 'function') {
									const latest: any = await modelClient.findFirst({
										orderBy: { hashId: "desc" },
										select: { hashId: true },
									});
									createData.hashId = (latest?.hashId ?? 0) + 1;
								}
							} catch (e) {
								// Silently ignore - DB default of 0 will be used
							}
						}
					};

					if (operation === 'create' && args) {
						await assignHashId((args as any).data);
					} else if (operation === 'upsert' && args) {
						await assignHashId((args as any).create);
					}

					return query(args as any);
				},
			},
		},
	});

	return prisma as unknown as PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}
