"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const UserSchema_1 = require("../SCHEMAS/UserSchema");
const OrderSchema_1 = require("../SCHEMAS/OrderSchema");
let CustomerService = class CustomerService {
    userModel;
    orderModel;
    constructor(userModel, orderModel) {
        this.userModel = userModel;
        this.orderModel = orderModel;
    }
    async findAll(page = 1, limit = 10, search = '') {
        const skip = (page - 1) * limit;
        const query = search
            ? {
                role: { $in: ['user', 'customer'] },
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ],
            }
            : { role: { $in: ['user', 'customer'] } };
        const [customers, total] = await Promise.all([
            this.userModel
                .find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.userModel.countDocuments(query),
        ]);
        const enrichedCustomers = await Promise.all(customers.map(async (customer) => {
            const customerObj = customer.toObject();
            const customerObjId = new mongoose_2.Types.ObjectId(customer._id.toString());
            const orders = await this.orderModel
                .find({ user: customerObjId })
                .select('totalPrice')
                .exec();
            customerObj.totalOrders = orders.length;
            customerObj.totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
            return customerObj;
        }));
        return {
            data: enrichedCustomers,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
            },
        };
    }
    async findById(id) {
        return this.userModel.findById(id).select('-password').exec();
    }
    async getCustomerStats() {
        const totalCustomers = await this.userModel.countDocuments({
            role: { $in: ['user', 'customer'] },
        });
        const activeCustomers = await this.userModel.countDocuments({
            role: { $in: ['user', 'customer'] },
            isActive: true,
        });
        return {
            totalCustomers,
            activeCustomers,
            inactiveCustomers: totalCustomers - activeCustomers,
        };
    }
    async updateStatus(id, isActive) {
        return this.userModel
            .findByIdAndUpdate(id, { isActive }, { new: true })
            .select('-password')
            .exec();
    }
    async getCustomerOrderHistory(customerId) {
        try {
            console.log('Fetching customer order history for:', customerId);
            const customer = await this.userModel
                .findById(customerId)
                .select('-password')
                .exec();
            if (!customer) {
                console.error('Customer not found:', customerId);
                throw new Error('Customer not found');
            }
            console.log('Customer found:', customer.email);
            const customerObjectId = new mongoose_2.Types.ObjectId(customerId);
            console.log('Searching orders with ObjectId:', customerObjectId);
            const orders = await this.orderModel
                .find({ user: customerObjectId })
                .populate('items.product', 'name price images')
                .sort({ createdAt: -1 })
                .exec();
            console.log(`Found ${orders.length} orders for customer ${customer.email}`);
            const customerObj = customer.toObject();
            return {
                customer: customerObj,
                orders: orders || [],
            };
        }
        catch (error) {
            console.error('Error in getCustomerOrderHistory:', error);
            throw error;
        }
    }
};
exports.CustomerService = CustomerService;
exports.CustomerService = CustomerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(UserSchema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(OrderSchema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], CustomerService);
//# sourceMappingURL=CustomerService.js.map