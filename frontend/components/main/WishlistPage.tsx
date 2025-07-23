'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, ShoppingBag, Bookmark, Share, Trash2 } from 'lucide-react';
import { wishlistAPI, WishlistItem } from '@/lib/wishlistAPI';

export function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedClosets] = useState([
    {
      id: 1,
      title: "Mumbai Street Vibes",
      creator: "@fashionista_mum",
      items: 24,
      image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400"
    },
    {
      id: 2,
      title: "Date Night Essentials",
      creator: "@stylebypriya",
      items: 18,
      image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400"
    }
  ]);

  // Fetch wishlist data on component mount
  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await wishlistAPI.getWishlist();
      if (response.success) {
        setWishlistItems(response.data.wishlist.items);
      }
    } catch (err: any) {
      console.error('Failed to fetch wishlist:', err);
      setError(err.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      await wishlistAPI.removeFromWishlist(productId);
      // Remove item from local state
      setWishlistItems(prev => prev.filter(item => item.product._id !== productId));
    } catch (err: any) {
      console.error('Failed to remove item:', err);
      setError(err.message || 'Failed to remove item');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="p-4 bg-gradient-to-r from-purple-900/30 to-orange-900/30 backdrop-blur">
        <h1 className="text-2xl font-bold gradient-text text-center">Your Collections</h1>
      </header>

      <div className="p-4">
        <Tabs defaultValue="wishlist" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card">
            <TabsTrigger value="wishlist" className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Wishlist</span>
            </TabsTrigger>
            <TabsTrigger value="closets" className="flex items-center space-x-2">
              <Bookmark className="w-4 h-4" />
              <span>Saved Closets</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wishlist" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your wishlist...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Error loading wishlist</h3>
                <p className="text-gray-400 mb-6">{error}</p>
                <Button onClick={fetchWishlist} className="bg-primary hover:bg-primary/90">
                  Try Again
                </Button>
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
                <p className="text-gray-400 mb-6">Swipe right on items you love to save them here</p>
                <Button className="bg-primary hover:bg-primary/90">
                  Start Swiping
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {wishlistItems.map(item => {
                  const primaryImage = item.product.images.find(img => img.isPrimary) || item.product.images[0];
                  return (
                    <Card key={item._id} className="overflow-hidden bg-card border-0">
                      <div className="flex">
                        <img
                          src={primaryImage?.url || '/placeholder-image.jpg'}
                          alt={item.product.name}
                          className="w-24 h-24 object-cover"
                        />
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-white">{item.product.name}</h3>
                              <p className="text-sm text-gray-400">{item.product.brand}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.product._id)}
                              className="text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold text-primary">
                                ₹{item.product.price.current}
                              </span>
                              {item.product.price.original > item.product.price.current && (
                                <span className="text-sm text-gray-500 line-through">
                                  ₹{item.product.price.original}
                                </span>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" className="border-border">
                                <Share className="w-3 h-3 mr-1" />
                                Share
                              </Button>
                              <Button 
                                size="sm" 
                                disabled={!item.product.inStock}
                                className="bg-primary hover:bg-primary/90 text-black"
                              >
                                <ShoppingBag className="w-3 h-3 mr-1" />
                                {item.product.inStock ? 'Buy Now' : 'Out of Stock'}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">
                              Added {new Date(item.addedAt).toLocaleDateString()}
                            </p>
                            {item.product.inStock && (
                              <p className="text-xs text-green-400">
                                ✅ In Stock
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="closets" className="mt-6">
            {savedClosets.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No saved closets yet</h3>
                <p className="text-gray-400 mb-6">Discover and save curated closets from other users</p>
                <Button className="bg-primary hover:bg-primary/90">
                  Explore Closets
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {savedClosets.map(closet => (
                  <Card key={closet.id} className="overflow-hidden bg-card border-0">
                    <div className="flex">
                      <img
                        src={closet.image}
                        alt={closet.title}
                        className="w-20 h-20 object-cover"
                      />
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-white">{closet.title}</h3>
                            <p className="text-sm text-gray-400">{closet.creator}</p>
                            <p className="text-xs text-gray-500">{closet.items} items</p>
                          </div>
                          <Button variant="outline" size="sm" className="border-border">
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
