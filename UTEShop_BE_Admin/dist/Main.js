"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: ['http://localhost:3001', 'http://localhost:3000'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.setGlobalPrefix('api');
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Admin Backend running on: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=Main.js.map