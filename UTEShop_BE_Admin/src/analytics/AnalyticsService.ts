import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas/OrderSchema';
import { User, UserDocument } from '../schemas/UserSchema';
import { Product, ProductDocument } from '../schemas/ProductSchema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) { }

  async getGeneralStats(year: number = new Date().getFullYear()) {
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

    const [revenueLastYearResult, ordersLastYear, customersLastYear] =
      await Promise.all([
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

    const revenueGrowth =
      revenueLastYear > 0
        ? ((totalRevenue - revenueLastYear) / revenueLastYear) * 100
        : totalRevenue > 0
          ? 100
          : 0;

    const orderGrowth =
      ordersLastYear > 0
        ? ((totalOrders - ordersLastYear) / ordersLastYear) * 100
        : totalOrders > 0
          ? 100
          : 0;

    const customerGrowth =
      customersLastYear > 0
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

  async getRevenue(
    year: number = new Date().getFullYear(),
    type: string = 'monthly',
  ) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${parseInt(year.toString()) + 1}-01-01`);

    let groupBy: any;
    if (type === 'monthly') {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      };
    } else {
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

    const monthlyData: any[] = [];
    if (type === 'monthly') {
      for (let month = 1; month <= 12; month++) {
        const found = results.find((r: any) => r._id.month === month);
        monthlyData.push({
          month: `T${month}`,
          value: found ? Math.round(found.revenue / 1000000) : 0,
          revenue: found ? found.revenue : 0,
          orderCount: found ? found.orderCount : 0,
        });
      }
    } else {
      results.forEach((r: any) => {
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

  async getCompletedOrders(page: number = 1, limit: number = 10) {
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

    const formattedOrders = orders.map((order: any) => ({
      id: order._id,
      orderCode: `#ORD${order._id.toString().slice(-6).toUpperCase()}`,
      customer: order.user?.name || 'Khách hàng đã xóa',
      customerEmail: order.user?.email || 'N/A',
      products: order.items
        .map((item: any) => {
          if (!item.product) {
            return `Sản phẩm đã xóa x${item.quantity}`;
          }
          return `${item.product.name} x${item.quantity}`;
        })
        .join(', '),
      totalProducts: order.items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0,
      ),
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

  async getNewCustomers(
    year: number = new Date().getFullYear(),
    type: string = 'monthly',
  ) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${parseInt(year.toString()) + 1}-01-01`);

    let groupBy: any;
    if (type === 'monthly') {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      };
    } else {
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

    const monthlyData: any[] = [];
    if (type === 'monthly') {
      for (let month = 1; month <= 12; month++) {
        const found = results.find((r: any) => r._id.month === month);
        monthlyData.push({
          month: `T${month}`,
          count: found ? found.count : 0,
        });
      }
    } else {
      results.forEach((r: any) => {
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

  // 🧩 Lấy top sản phẩm bán chạy theo soldCount (và tính doanh thu)
  async getTopProducts(limit: number = 10) {
    // Lấy sản phẩm theo soldCount
    const topProducts = await this.productModel
      .find({ soldCount: { $gt: 0 } })
      .populate('category', 'name')
      .populate('brand', 'name')
      .sort({ soldCount: -1 })
      .limit(limit);

    console.log(
      '🔍 DEBUG - Top products by soldCount:',
      topProducts.slice(0, 5).map((p) => ({
        name: p.name,
        soldCount: p.soldCount,
        stock: p.stock,
      })),
    );

    // Tính doanh thu = soldCount * (price sau khi giảm)
    const productsWithRevenue = topProducts.map((product: any) => {
      const discountPercent = product.discountPercentage || 0;
      const discountedPrice =
        product.price - (product.price * discountPercent) / 100;

      const revenue = (product.soldCount || 0) * discountedPrice;

      return {
        _id: product._id,
        name: product.name,
        originalPrice: product.price,
        discountedPrice,
        price: discountedPrice,
        soldCount: product.soldCount,
        sold: product.soldCount,
        deliveredQuantity: product.soldCount, // vì không dùng order nữa
        revenue,
        category: product.category?.name || 'Không có danh mục',
        brand: product.brand?.name || 'Không có thương hiệu',
        images: product.images,
        discountPercentage: discountPercent,
        stock: product.stock,
        color: this.getRandomGradient(),
      };
    });

    console.log(
      '🔍 DEBUG - Final products with revenue:',
      productsWithRevenue.slice(0, 3).map((p) => ({
        name: p.name,
        soldCount: p.soldCount,
        revenue: p.revenue,
      })),
    );

    return {
      success: true,
      data: productsWithRevenue,
      limit,
    };
  }




  private getRandomGradient(): string {
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
}






