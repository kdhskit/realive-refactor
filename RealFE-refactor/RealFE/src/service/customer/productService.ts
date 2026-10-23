import apiClient from '@/lib/apiClient';
import { FeaturedSellerWithProducts } from '@/types/product';
import { ProductListDTO, ProductDetail } from '@/types/seller/product/product';

/** 🔍 [공개] 카테고리별 상품 목록 조회 */
export async function fetchPublicProducts(
    categoryId: number | null,
    page: number,
    size: number,
    keyword?: string
): Promise<ProductListDTO[]> {
    const params: Record<string, any> = {
        page,
        size,
        type: 'T', // 상품명 검색만 허용
    };
    if (categoryId !== null) params.categoryId = categoryId;
    if (keyword) params.keyword = keyword;

    const res = await apiClient.get('/public/items', { params });
    return res.data.dtoList;
}

/** 🔍 [공개] 상품 상세 조회 */
export async function fetchProductDetail(productId: number): Promise<ProductDetail> {
    const res = await apiClient.get(`/public/items/${productId}`);
    return res.data;
}

/** 🔄 관련 상품 추천 */
export async function fetchRelatedProducts(productId: number): Promise<ProductListDTO[]> {
    const res = await apiClient.get(`/public/items/${productId}/related`);
    return res.data;
}

/** ⭐ [공개] 기본 인기 상품 조회 (전체 인기순) */
export async function fetchPopularProducts(): Promise<ProductListDTO[]> {
    const res = await apiClient.get('/public/items/popular');
    return res.data;
}

/** ⭐ [공개] 카테고리별 인기 상품 조회 */
export async function fetchPopularProductsByCategory(categoryId: number): Promise<ProductListDTO[]> {
    const res = await apiClient.get('/public/items/popular/by-category', {
        params: { categoryId },
    });
    return res.data;
}

/** 🌟 추천 판매자+상품 목록 조회 */
export async function fetchFeaturedSellersWithProducts(
    candidateSize = 10,
    sellersPick = 1,
    productsPerSeller = 3,
    minReviews = 3
): Promise<FeaturedSellerWithProducts[]> {
    const response = await apiClient.get<FeaturedSellerWithProducts[]>(
        'public/items/featured-sellers-with-products',
        {
            params: { candidateSize, sellersPick, productsPerSeller, minReviews },
        }
        
    );
    return response.data;
}
