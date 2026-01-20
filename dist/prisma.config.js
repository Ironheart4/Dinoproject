"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// prisma.config.ts — Prisma configuration for DinoProject
// Notes:
// - Reads `DATABASE_URL` from environment; used by Prisma CLI for generation and migration tasks
require("dotenv/config");
const config_1 = require("prisma/config");
exports.default = (0, config_1.defineConfig)({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: (0, config_1.env)('DATABASE_URL'), // Your .env DB connection lives here now
    },
});
//# sourceMappingURL=prisma.config.js.map