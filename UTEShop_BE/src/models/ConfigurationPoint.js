import mongoose from "mongoose";

const configurationPointSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    description: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

const ConfigurationPoint = mongoose.model("ConfigurationPoint", configurationPointSchema);

export default ConfigurationPoint;
