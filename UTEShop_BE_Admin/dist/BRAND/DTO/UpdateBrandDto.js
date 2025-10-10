"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBrandDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const CreateBrandDto_1 = require("./CreateBrandDto");
class UpdateBrandDto extends (0, mapped_types_1.PartialType)(CreateBrandDto_1.CreateBrandDto) {
}
exports.UpdateBrandDto = UpdateBrandDto;
//# sourceMappingURL=UpdateBrandDto.js.map