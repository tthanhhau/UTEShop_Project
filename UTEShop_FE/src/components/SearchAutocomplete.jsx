// src/components/SearchAutocomplete.jsx
import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import axios from 'axios';

const SearchAutocomplete = ({ onProductSelect, placeholder = "Tìm kiếm sản phẩm..." }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Fetch suggestions khi query thay đổi
    useEffect(() => {
        if (query.length >= 1) {
            fetchSuggestions();
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    }, [query]);

    const fetchSuggestions = async () => {
        if (!query.trim()) return;

        try {
            setLoading(true);
            const response = await axios.get('/api/elasticsearch/autocomplete', {
                params: { q: query.trim(), limit: 8 }
            });

            setSuggestions(response.data.data || []);
            setIsOpen(true);
            setSelectedIndex(-1); // Reset selection khi có suggestions mới
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    const handleKeyDown = (e) => {
        // Navigation với bàn phím
        if (!isOpen || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSelectProduct(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;
        }
    };

    const handleSelectProduct = (product) => {
        setQuery(product.name);
        setIsOpen(false);
        setSelectedIndex(-1);

        // Callback để component cha xử lý
        if (onProductSelect) {
            onProductSelect(product);
        }
    };

    const handleClickOutside = (e) => {
        if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Scroll selected item into view
    useEffect(() => {
        if (selectedIndex >= 0 && suggestionsRef.current) {
            const selectedElement = suggestionsRef.current.children[selectedIndex];
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
            }
        }
    }, [selectedIndex]);

    return (
        <div className="relative w-full max-w-md">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.length >= 1 && setIsOpen(true)}
                />
                {loading && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                )}
            </div>

            {/* Suggestions dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
                >
                    {suggestions.map((product, index) => (
                        <div
                            key={product._id}
                            className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'hover:bg-gray-50'
                                }`}
                            onClick={() => handleSelectProduct(product)}
                        >
                            <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-md overflow-hidden mr-3">
                                {product.images && product.images.length > 0 ? (
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/40';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 text-xs">
                                        No img
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {product.name}
                                </p>
                                <div className="flex items-center mt-1">
                                    <span className="text-sm font-semibold text-blue-600">
                                        {product.discountedPrice?.toLocaleString() || product.price?.toLocaleString()}đ
                                    </span>
                                    {product.discountedPrice && product.discountedPrice < product.price && (
                                        <span className="ml-2 text-xs text-gray-500 line-through">
                                            {product.price?.toLocaleString()}đ
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {suggestions.length === 0 && !loading && (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            Không tìm thấy sản phẩm nào
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchAutocomplete;
