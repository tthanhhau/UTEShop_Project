import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const uri = process.env.MONGODB_URI;
const orderId = "69dd157927155c0063e7f23d";

await mongoose.connect(uri);
const db = mongoose.connection.db;
const order = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(orderId) });
const jobs = await db
  .collection("agendaJobs")
  .find({ "data.orderId": orderId })
  .sort({ nextRunAt: -1 })
  .limit(5)
  .toArray()
  .catch(() => []);

let safeItems = [];
if (order) {
  if (Array.isArray(order.items)) {
    safeItems = order.items;
  }
}

const result = {
  order: order
    ? {
      _id: order._id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      totalPrice: order.totalPrice,
      usedPointsAmount: order.usedPointsAmount,
      shippingInfo: order.shippingInfo,
      items: safeItems.map((i) => ({ quantity: i.quantity, price: i.price, product: i.product })),
    }
    : null,
  jobs: jobs.map((j) => ({
    name: j.name,
    lastRunAt: j.lastRunAt,
    lastFinishedAt: j.lastFinishedAt,
    failedAt: j.failedAt,
    failReason: j.failReason,
    nextRunAt: j.nextRunAt,
    disabled: j.disabled,
    data: j.data,
  })),
};

console.log(JSON.stringify(result, null, 2));
await mongoose.disconnect();
