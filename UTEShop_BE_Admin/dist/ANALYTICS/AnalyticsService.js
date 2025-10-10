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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const OrderSchema_1 = require("../SCHEMAS/OrderSchema");
const UserSchema_1 = require("../SCHEMAS/UserSchema");
const ProductSchema_1 = require("../SCHEMAS/ProductSchema");
let AnalyticsService = class AnalyticsService {
    orderModel;
    userModel;
    productModel;
    constructor(orderModel, userModel, productModel) {
        this.orderModel = orderModel;
        this.userModel = userModel;
        this.productModel = productModel;
    }
    async getGeneralStats(year = new Date().getFullYear()) {
        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${parseInt(year.toString()) + 1}-01-01`);
        const revenueResult = await this.orderModel.aggregate([
            {
                $match: {
                    status: 'delivered',
                    createdAt: { $gte: startDate, $lt: endDate },
                },
            },
            { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
        ]);
        const totalRevenue = revenueResult[0]?.totalRevenue || 0;
        const totalOrders = await this.orderModel.countDocuments({
            status: 'delivered',
            createdAt: { $gte: startDate, $lt: endDate },
        });
        const totalCustomers = await this.userModel.countDocuments({
            role: 'customer',
            createdAt: { $gte: startDate, $lt: endDate },
        });
        const totalProducts = await this.productModel.countDocuments();
        const lastYear = parseInt(year.toString()) - 1;
        const lastYearStart = new Date(`${lastYear}-01-01`);
        const lastYearEnd = new Date(`${year}-01-01`);
        const [revenueLastYearResult, ordersLastYear, customersLastYear] = await Promise.all([
            this.orderModel.aggregate([
                {
                    $match: {
                        status: 'delivered',
                        createdAt: { $gte: lastYearStart, $lt: lastYearEnd },
                    },
                },
                { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
            ]),
            this.orderModel.countDocuments({
                status: 'delivered',
                createdAt: { $gte: lastYearStart, $lt: lastYearEnd },
            }),
            this.userModel.countDocuments({
                role: 'customer',
                createdAt: { $gte: lastYearStart, $lt: lastYearEnd },
            }),
        ]);
        const revenueLastYear = revenueLastYearResult[0]?.totalRevenue || 0;
        const revenueGrowth = revenueLastYear > 0
            ? ((totalRevenue - revenueLastYear) / revenueLastYear) * 100
            : totalRevenue > 0
                ? 100
                : 0;
        const orderGrowth = ordersLastYear > 0
            ? ((totalOrders - ordersLastYear) / ordersLastYear) * 100
            : totalOrders > 0
                ? 100
                : 0;
        const customerGrowth = customersLastYear > 0
            ? ((totalCustomers - customersLastYear) / customersLastYear) * 100
            : totalCustomers > 0
                ? 100
                : 0;
        return {
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                totalCustomers,
                totalProducts,
                growth: {
                    revenue: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`,
                    orders: `${orderGrowth >= 0 ? '+' : ''}${orderGrowth.toFixed(1)}%`,
                    customers: `${customerGrowth >= 0 ? '+' : ''}${customerGrowth.toFixed(1)}%`,
                    products: '+5.7%',
                },
            },
        };
    }
    async getRevenue(year = new Date().getFullYear(), type = 'monthly') {
        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${parseInt(year.toString()) + 1}-01-01`);
        let groupBy;
        if (type === 'monthly') {
            groupBy = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
            };
        }
        else {
            groupBy = { year: { $year: '$createdAt' } };
        }
        const results = await this.orderModel.aggregate([
            {
                $match: {
                    status: 'delivered',
                    createdAt: { $gte: startDate, $lt: endDate },
                },
            },
            {
                $group: {
                    _id: groupBy,
                    revenue: { $sum: '$totalPrice' },
                    orderCount: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);
        const monthlyData = [];
        if (type === 'monthly') {
            for (let month = 1; month <= 12; month++) {
                const found = results.find((r) => r._id.month === month);
                monthlyData.push({
                    month: `T${month}`,
                    value: found ? Math.round(found.revenue / 1000000) : 0,
                    revenue: found ? found.revenue : 0,
                    orderCount: found ? found.orderCount : 0,
                });
            }
        }
        else {
            results.forEach((r) => {
                monthlyData.push({
                    year: r._id.year,
                    revenue: r.revenue,
                    orderCount: r.orderCount,
                });
            });
        }
        return {
            success: true,
            data: monthlyData,
            year: parseInt(year.toString()),
            type,
        };
    }
    async getCompletedOrders(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            this.orderModel
                .find({ status: 'delivered' })
                .populate('user', 'name email')
                .populate('items.product', 'name price images')
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip),
            this.orderModel.countDocuments({ status: 'delivered' }),
        ]);
        const formattedOrders = orders.map((order) => ({
            id: order._id,
            orderCode: `#ORD${order._id.toString().slice(-6).toUpperCase()}`,
            customer: order.user?.name || 'Khách hàng đã xóa',
            customerEmail: order.user?.email || 'N/A',
            products: order.items
                .map((item) => {
                if (!item.product) {
                    return `Sản phẩm đã xóa x${item.quantity}`;
                }
                return `${item.product.name} x${item.quantity}`;
            })
                .join(', '),
            totalProducts: order.items.reduce((sum, item) => sum + item.quantity, 0),
            total: order.totalPrice,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            date: order.createdAt,
            shippingAddress: order.shippingAddress,
        }));
        return {
            success: true,
            data: formattedOrders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
            },
        };
    }
    async getNewCustomers(year = new Date().getFullYear(), type = 'monthly') {
        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${parseInt(year.toString()) + 1}-01-01`);
        let groupBy;
        if (type === 'monthly') {
            groupBy = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
            };
        }
        else {
            groupBy = { year: { $year: '$createdAt' } };
        }
        const results = await this.userModel.aggregate([
            {
                $match: {
                    role: 'customer',
                    createdAt: { $gte: startDate, $lt: endDate },
                },
            },
            {
                $group: {
                    _id: groupBy,
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);
        const monthlyData = [];
        if (type === 'monthly') {
            for (let month = 1; month <= 12; month++) {
                const found = results.find((r) => r._id.month === month);
                monthlyData.push({
                    month: `T${month}`,
                    count: found ? found.count : 0,
                });
            }
        }
        else {
            results.forEach((r) => {
                monthlyData.push({
                    year: r._id.year,
                    count: r.count,
                });
            });
        }
        return {
            success: true,
            data: monthlyData,
            year: parseInt(year.toString()),
            type,
        };
    }
    async getTopProducts(limit = 10) {
        const topProducts = await this.productModel
            .find({ soldCount: { $gt: 0 } })
            .populate('category', 'name')
            .populate('brand', 'name')
            .sort({ soldCount: -1 })
            .limit(limit);
        const productsWithRevenue = await Promise.all(topProducts.map(async (product) => {
            const revenueResult = await this.orderModel.aggregate([
                { $match: { status: 'delivered' } },
                { $unwind: '$items' },
                { $match: { 'items.product': product._id } },
                {
                    $group: {
                        _id: '$items.product',
                        totalRevenue: {
                            $sum: { $multiply: ['$items.price', '$items.quantity'] },
                        },
                        deliveredQuantity: { $sum: '$items.quantity' },
                    },
                },
            ]);
            const revenue = revenueResult[0]?.totalRevenue || 0;
            const deliveredQuantity = revenueResult[0]?.deliveredQuantity || 0;
            const originalPrice = product.price || 0;
            const discountPercent = product.discountPercentage || 0;
            const discountedPrice = originalPrice - (originalPrice * discountPercent / 100);
            return {
                _id: product._id,
                name: product.name,
                originalPrice: originalPrice,
                discountedPrice: Math.round(discountedPrice),
                price: Math.round(discountedPrice),
                soldCount: product.soldCount,
                sold: product.soldCount,
                deliveredQuantity,
                revenue,
                category: product.category?.name || 'Không có danh mục',
                brand: product.brand?.name || 'Không có thương hiệu',
                images: product.images,
                discountPercentage: discountPercent,
                stock: product.stock,
                color: this.getRandomGradient(),
            };
        }));
        return {
            success: true,
            data: productsWithRevenue,
            limit,
        };
    }
    getRandomGradient() {
        const gradients = [
            'from-purple-400 to-pink-400',
            'from-blue-400 to-purple-400',
            'from-green-400 to-blue-400',
            'from-yellow-400 to-orange-400',
            'from-pink-400 to-red-400',
            'from-indigo-400 to-purple-400',
        ];
        return gradients[Math.floor(Math.random() * gradients.length)];
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(OrderSchema_1.Order.name)),
    __param(1, (0, mongoose_1.InjectModel)(UserSchema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(ProductSchema_1.Product.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], AnalyticsService);
//# sourceMappingURL=AnalyticsService.js.map