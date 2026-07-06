import mongoose from 'mongoose';

const ghnMappingSchema = new mongoose.Schema({
    type: { type: String, enum: ['province', 'ward'], required: true },
    gsoCode: { type: String, required: true }, // Code from Province Open API v2
    gsoName: { type: String, required: true }, // Name from Province Open API v2
    ghnProvinceId: { type: Number },           // GHN Province ID
    ghnDistrictId: { type: Number },          // GHN District ID
    ghnWardCode: { type: String },            // GHN Ward Code
    ghnName: { type: String, required: true }, // Name from GHN
}, { timestamps: true });

// Ensure fast lookup and uniqueness
ghnMappingSchema.index({ type: 1, gsoCode: 1 }, { unique: true });

const GhnMapping = mongoose.model('GhnMapping', ghnMappingSchema);
export default GhnMapping;
