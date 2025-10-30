const OrderProgress = ({ status }) => {
    return (
        <div className="flex items-center justify-between mt-4">
            <div className="flex flex-col items-center flex-1 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status !== 'cancelled' ? 'bg-primary text-white' : 'bg-gray-200'
                    }`}>
                    1
                </div>
                <div className={`mt-2 text-sm ${status !== 'cancelled' ? 'text-primary font-medium' : 'text-gray-500'
                    }`}>
                    Chờ xác nhận
                </div>
            </div>

            <div className="flex flex-col items-center flex-1 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['processing', 'shipped', 'delivered'].includes(status)
                        ? 'bg-primary text-white'
                        : 'bg-gray-200'
                    }`}>
                    2
                </div>
                <div className={`mt-2 text-sm ${status === 'processing' ? 'text-primary font-medium' : 'text-gray-500'
                    }`}>
                    Đang xử lý
                </div>
                <div className="absolute h-0.5 bg-gray-200 w-full top-4 -left-1/2 -z-10">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{
                            width: ['processing', 'shipped', 'delivered'].includes(status) ? '100%' : '0%'
                        }}
                    />
                </div>
            </div>

            <div className="flex flex-col items-center flex-1 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['shipped', 'delivered'].includes(status) ? 'bg-primary text-white' : 'bg-gray-200'
                    }`}>
                    3
                </div>
                <div className={`mt-2 text-sm ${status === 'shipped' ? 'text-primary font-medium' : 'text-gray-500'
                    }`}>
                    Đang giao
                </div>
                <div className="absolute h-0.5 bg-gray-200 w-full top-4 -left-1/2 -z-10">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{
                            width: ['shipped', 'delivered'].includes(status) ? '100%' : '0%'
                        }}
                    />
                </div>
            </div>

            <div className="flex flex-col items-center flex-1 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'delivered' ? 'bg-primary text-white' : 'bg-gray-200'
                    }`}>
                    4
                </div>
                <div className={`mt-2 text-sm ${status === 'delivered' ? 'text-primary font-medium' : 'text-gray-500'
                    }`}>
                    Đã giao
                </div>
                <div className="absolute h-0.5 bg-gray-200 w-full top-4 -left-1/2 -z-10">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{
                            width: status === 'delivered' ? '100%' : '0%'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default OrderProgress;