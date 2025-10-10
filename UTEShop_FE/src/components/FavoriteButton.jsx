import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Heart } from 'lucide-react';
import { toggleFavoriteAsync, checkFavoriteAsync } from '../features/favorites/favoriteSlice';

const FavoriteButton = ({ productId, size = 'default', showText = false }) => {
    const dispatch = useDispatch();
    const { favoriteStatus, loading } = useSelector(state => state.favorites);
    const { user } = useSelector(state => state.auth);

    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user && productId) {
            dispatch(checkFavoriteAsync(productId));
        }
    }, [dispatch, user, productId]);

    useEffect(() => {
        setIsFavorite(favoriteStatus[productId] || false);
    }, [favoriteStatus, productId]);

    const handleToggleFavorite = async () => {
        if (!user) {
            alert('Vui lòng đăng nhập để sử dụng tính năng này');
            return;
        }

        setIsLoading(true);
        try {
            await dispatch(toggleFavoriteAsync(productId)).unwrap();
        } catch (error) {
            console.error('Error toggling favorite:', error);
            alert('Có lỗi xảy ra khi thực hiện thao tác');
        } finally {
            setIsLoading(false);
        }
    };

    const sizeClasses = {
        small: 'w-6 h-6',
        default: 'w-8 h-8',
        large: 'w-10 h-10'
    };

    const textSizeClasses = {
        small: 'text-sm',
        default: 'text-base',
        large: 'text-lg'
    };

    return (
        <button
            onClick={handleToggleFavorite}
            disabled={isLoading || loading}
            className={`
        flex items-center gap-2 p-2 rounded-full transition-all duration-200
        ${isFavorite
                    ? 'bg-red-100 text-red-500 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }
        ${isLoading || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        hover:scale-105 active:scale-95
      `}
            title={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        >
            <Heart
                className={`${sizeClasses[size]} ${isFavorite ? 'fill-current' : ''}`}
                size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            />
            {showText && (
                <span className={`${textSizeClasses[size]} font-medium`}>
                    {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
                </span>
            )}
        </button>
    );
};

export default FavoriteButton;
