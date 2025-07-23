const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface WishlistItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    description: string;
    brand: string;
    price: {
      original: number;
      current: number;
      currency: string;
    };
    images: Array<{
      url: string;
      isPrimary: boolean;
    }>;
    category: string;
    gender: string;
    sizes: Array<{
      size: string;
      inStock: boolean;
    }>;
    colors: string[];
    inStock: boolean;
  };
  addedAt: string;
  priority: number;
  notes?: string;
  priceWhenAdded: number;
}

export interface WishlistResponse {
  success: boolean;
  data: {
    wishlist: {
      items: WishlistItem[];
      totalItems: number;
      createdAt: string;
      updatedAt: string;
    };
  };
  message?: string;
}

export interface WishlistCheckResponse {
  success: boolean;
  data: {
    inWishlist: boolean;
    productId: string;
  };
}

class WishlistAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async getWishlist(): Promise<WishlistResponse> {
    const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async addToWishlist(productId: string, options?: {
    priority?: number;
    notes?: string;
  }): Promise<WishlistResponse> {
    const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        productId,
        priority: options?.priority || 0,
        notes: options?.notes || ''
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async removeFromWishlist(productId: string): Promise<WishlistResponse> {
    const response = await fetch(`${API_BASE_URL}/api/wishlist/${productId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async checkWishlistStatus(productId: string): Promise<WishlistCheckResponse> {
    const response = await fetch(`${API_BASE_URL}/api/wishlist/check/${productId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const wishlistAPI = new WishlistAPI();
