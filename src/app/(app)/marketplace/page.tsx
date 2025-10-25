
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlan } from '@/contexts/plan-context';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Lock, Search, Filter, X, ShoppingCart, Package, Star, MapPin, TrendingUp, Sparkles, PackageOpen, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { toTitleCase } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { nigerianStates } from '@/lib/nigerian-states';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SafeImage } from '@/components/SafeImage';
import { getSafeImageUrl } from '@/lib/image-url';

type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    category: 'Digital Resource' | 'Physical Good' | 'Service';
    status: 'active' | 'archived';
    stock: number;
    imageUrl?: string;
    locations?: string[];
};

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'Digital Resource':
            return '📚';
        case 'Physical Good':
            return '📦';
        case 'Service':
            return '🛠️';
        default:
            return '🏷️';
    }
};

const ProductCard = ({ product, index, onClick }: { product: Product; index: number; onClick: () => void }) => {
    const isSoldOut = product.stock === 0 && product.category === 'Physical Good';
    
    return (
        <div onClick={onClick} className="group cursor-pointer h-full">
            <Card className="overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 hover:border-primary/20">
                <CardHeader className="p-0 relative">
                    <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                        <SafeImage
                            src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            priority={index < 8}
                        />
                         {isSoldOut && (
                             <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Badge variant="destructive" className="text-sm px-3 py-1">SOLD OUT</Badge>
                             </div>
                        )}
                        <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="text-xs bg-white/90 text-black backdrop-blur-sm">
                                <span className="mr-1">{getCategoryIcon(product.category)}</span>
                                {product.category}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col">
                    <div className="flex-grow space-y-2">
                        <CardTitle className="text-base sm:text-lg font-headline line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {product.description || 'Quality educational resource'}
                        </p>
                    </div>
                    {product.locations && product.locations.length > 0 && (
                        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                                {product.locations.slice(0, 2).join(', ')}
                                {product.locations.length > 2 && ` +${product.locations.length - 2}`}
                            </span>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="p-4 pt-0 flex flex-col xs:flex-row items-stretch xs:items-center xs:justify-between gap-2 border-t bg-muted/30">
                    <div className="flex flex-col text-left">
                        <span className="text-xs text-muted-foreground">Price</span>
                        <span className="text-lg sm:text-xl font-bold text-primary">
                            ₦{product.price.toLocaleString()}
                        </span>
                    </div>
                    <Button size="sm" variant="default" className="gap-1 group-hover:gap-2 transition-all" disabled={isSoldOut}>
                        {isSoldOut ? 'Sold Out' : 'View'}
                        {!isSoldOut && <ShoppingCart className="h-3 w-3" />}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

const Filters = ({ 
    filters, 
    setFilters, 
    onClear, 
    allLocations,
    productCount 
}: { 
    filters: any; 
    setFilters: any; 
    onClear: () => void; 
    allLocations: string[];
    productCount: number;
}) => {
    const hasActiveFilters = filters.searchTerm || filters.category !== 'All' || filters.location !== 'All';
    
    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium">Search Products</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        id="search"
                        placeholder="Search by name..."
                        className="pl-10"
                        value={filters.searchTerm}
                        onChange={(e) => setFilters((prev: any) => ({ ...prev, searchTerm: e.target.value }))}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters((prev: any) => ({ ...prev, category: value }))}>
                    <SelectTrigger id="category">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">
                            <span className="flex items-center gap-2">
                                All Categories
                            </span>
                        </SelectItem>
                        <SelectItem value="Digital Resource">
                            <span className="flex items-center gap-2">
                                📚 Digital Resource
                            </span>
                        </SelectItem>
                        <SelectItem value="Physical Good">
                            <span className="flex items-center gap-2">
                                📦 Physical Good
                            </span>
                        </SelectItem>
                        <SelectItem value="Service">
                            <span className="flex items-center gap-2">
                                🛠️ Service
                            </span>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                <Select value={filters.location} onValueChange={(value) => setFilters((prev: any) => ({ ...prev, location: value }))}>
                    <SelectTrigger id="location">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Locations (Nationwide)</SelectItem>
                        {allLocations.map(loc => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Separator />
            
            <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Results:</span>
                    <span className="font-semibold">{productCount} product{productCount !== 1 ? 's' : ''}</span>
                </div>
                {hasActiveFilters && (
                    <Button 
                        variant="outline" 
                        onClick={onClear} 
                        className="w-full gap-2"
                        size="sm"
                    >
                        <X className="h-4 w-4" />
                        Clear All Filters
                    </Button>
                )}
            </div>
        </div>
    );
};

const MarketplaceStats = ({ products }: { products: Product[] }) => {
    const stats = useMemo(() => {
        if (!products) return { total: 0, categories: 0, locations: 0 };
        
        const categories = new Set(products.map(p => p.category)).size;
        const locationSet = new Set<string>();
        products.forEach(p => p.locations?.forEach(loc => locationSet.add(loc)));
        
        return {
            total: products.length,
            categories,
            locations: locationSet.size
        };
    }, [products]);

    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
            <Card className="border-2">
                <CardContent className="p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-primary">{stats.total}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Products</div>
                </CardContent>
            </Card>
            <Card className="border-2">
                <CardContent className="p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-primary">{stats.categories}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Categories</div>
                </CardContent>
            </Card>
            <Card className="border-2">
                <CardContent className="p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-primary">{stats.locations}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Locations</div>
                </CardContent>
            </Card>
        </div>
    );
};

export default function MarketplacePage() {
    const { plan, isTrial } = usePlan();
    const router = useRouter();
    const { toast } = useToast();
    const { firestore } = useFirebase();

    const [isLoadingPlan, setIsLoadingPlan] = useState(true);
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    
    const [filters, setFilters] = useState({
        searchTerm: '',
        category: 'All',
        location: 'All',
    });
    
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);

    const productsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'marketplace_products'), where('status', '==', 'active')) : null, 
        [firestore]
    );
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
    
    useEffect(() => {
        if (plan) {
            if (isTrial) {
                toast({
                    variant: 'destructive',
                    title: 'Upgrade Required',
                    description: 'The marketplace is only available on paid plans.',
                });
                router.push('/billing');
            } else {
                setIsLoadingPlan(false);
            }
        }
    }, [plan, isTrial, router, toast]);

    useEffect(() => {
        if (selectedProduct) {
            setQuantity(1);
        }
    }, [selectedProduct]);
    
    const allLocations = useMemo(() => {
        if (!products) return [];
        const locationSet = new Set<string>();
        products.forEach(p => p.locations?.forEach(loc => locationSet.add(loc)));
        return Array.from(locationSet).sort();
    }, [products]);
    
    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                                p.description?.toLowerCase().includes(filters.searchTerm.toLowerCase());
            const matchesCategory = filters.category === 'All' || p.category === filters.category;
            const matchesLocation = filters.location === 'All' || 
                                  p.locations?.includes(filters.location) || 
                                  !p.locations || 
                                  p.locations.length === 0;
            return matchesSearch && matchesCategory && matchesLocation;
        });
    }, [products, filters]);

    const handleClearFilters = () => {
        setFilters({ searchTerm: '', category: 'All', location: 'All' });
    };
    
    const handleBuyNow = (product: Product) => {
        const imageUrl = getSafeImageUrl(product.imageUrl || '');
        const query = new URLSearchParams({
            productId: product.id,
            name: product.name,
            price: product.price.toString(),
            imageUrl: encodeURIComponent(imageUrl),
            quantity: quantity.toString(),
            isSubscription: 'false',
            category: product.category,
        });
        router.push(`/checkout?${query.toString()}`);
    };

    const handleQuantityChange = (amount: number) => {
        if (!selectedProduct) return;
        const newQuantity = quantity + amount;
        const maxStock = selectedProduct.category === 'Physical Good' ? selectedProduct.stock : Infinity;
        if (newQuantity >= 1 && newQuantity <= maxStock) {
            setQuantity(newQuantity);
        }
    }

    if (isLoadingPlan) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Verifying plan...</p>
                </div>
            </div>
        );
    }
    
    return (
        <Sheet open={!!selectedProduct} onOpenChange={(isOpen) => !isOpen && setSelectedProduct(null)}>
            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                {/* Header Section */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-headline">Marketplace</h1>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Discover quality educational resources, goods, and services from the community
                    </p>
                </div>

                {products && <MarketplaceStats products={products} />}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Desktop Filters Sidebar */}
                    <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-24">
                        <Card className="border-2">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Filter className="h-5 w-5" />
                                    Filters
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Filters 
                                    filters={filters} 
                                    setFilters={setFilters} 
                                    onClear={handleClearFilters} 
                                    allLocations={allLocations}
                                    productCount={filteredProducts.length}
                                />
                            </CardContent>
                        </Card>
                    </aside>

                    {/* Mobile Filters Button */}
                    <div className="lg:hidden col-span-1">
                        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="w-full border-2 gap-2">
                                    <Filter className="h-4 w-4" />
                                    Show Filters
                                    {(filters.searchTerm || filters.category !== 'All' || filters.location !== 'All') && (
                                        <Badge variant="secondary" className="ml-auto">Active</Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[85vw] sm:w-[400px]">
                                <SheetHeader className="mb-6">
                                    <SheetTitle className="flex items-center gap-2">
                                        <Filter className="h-5 w-5" />
                                        Filter Products
                                    </SheetTitle>
                                    <SheetDescription>
                                        Narrow down your search to find exactly what you need
                                    </SheetDescription>
                                </SheetHeader>
                                <ScrollArea className="h-[calc(100vh-120px)] pr-4">
                                    <Filters 
                                        filters={filters} 
                                        setFilters={setFilters} 
                                        onClear={() => { 
                                            handleClearFilters(); 
                                            setIsFilterSheetOpen(false); 
                                        }} 
                                        allLocations={allLocations}
                                        productCount={filteredProducts.length}
                                    />
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Products Grid */}
                    <main className="lg:col-span-9">
                        {isLoadingProducts ? (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <Skeleton key={i} className="h-64 sm:h-80 w-full rounded-lg" />
                                ))}
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {filteredProducts.length} of {products?.length || 0} products
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                    {filteredProducts.map((product, index) => (
                                        <ProductCard 
                                            key={product.id} 
                                            product={product} 
                                            index={index} 
                                            onClick={() => setSelectedProduct(product)} 
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <Card className="border-2 border-dashed">
                                <CardContent className="flex flex-col items-center justify-center text-center py-16 sm:py-20">
                                    <PackageOpen className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground/40 mb-4" />
                                    <h3 className="text-lg sm:text-xl font-semibold mb-2">No Products Found</h3>
                                    <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md">
                                        We couldn't find any products matching your criteria. Try adjusting your filters or search term.
                                    </p>
                                    <Button variant="outline" onClick={handleClearFilters} className="gap-2">
                                        <X className="h-4 w-4" />
                                        Clear All Filters
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </main>
                </div>
            </div>
            
            {/* Product Detail Sheet */}
            <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
                {selectedProduct && (
                    <div className="flex flex-col h-full">
                        <SheetHeader className="space-y-0 pb-0">
                            <div className="aspect-[4/3] relative -mx-6 -mt-6 mb-6 bg-muted">
                                <SafeImage 
                                    src={selectedProduct.imageUrl} 
                                    alt={selectedProduct.name} 
                                    fill 
                                    className="object-cover"
                                    priority
                                />
                                <div className="absolute top-4 left-4">
                                    <Badge variant="secondary" className="bg-white/90 text-black backdrop-blur-sm">
                                        <span className="mr-1">{getCategoryIcon(selectedProduct.category)}</span>
                                        {selectedProduct.category}
                                    </Badge>
                                </div>
                                {selectedProduct.stock > 0 && selectedProduct.stock < 10 && selectedProduct.category === 'Physical Good' && (
                                    <div className="absolute top-4 right-4">
                                        <Badge variant="destructive">
                                            Only {selectedProduct.stock} left!
                                        </Badge>
                                    </div>
                                )}
                                {selectedProduct.stock === 0 && selectedProduct.category === 'Physical Good' && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                       <Badge variant="destructive" className="text-sm px-3 py-1">SOLD OUT</Badge>
                                    </div>
                                )}
                            </div>
                            <SheetTitle className="text-xl sm:text-2xl font-headline pr-8">
                                {selectedProduct.name}
                            </SheetTitle>
                        </SheetHeader>
                        
                        <ScrollArea className="flex-1 pr-6 -mr-6">
                            <div className="space-y-6 py-6">
                                {/* Price & Quantity Section */}
                                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border-2 border-primary/10">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Total Price</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-primary">
                                            ₦{(selectedProduct.price * quantity).toLocaleString()}
                                        </p>
                                    </div>
                                     {selectedProduct.category === 'Physical Good' && (
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}><Minus className="h-4 w-4" /></Button>
                                            <span className="text-lg font-bold w-10 text-center">{quantity}</span>
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(1)} disabled={quantity >= selectedProduct.stock}><Plus className="h-4 w-4" /></Button>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                                        <span className="h-1 w-1 rounded-full bg-primary" />
                                        Description
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {selectedProduct.description || 'No description provided for this product.'}
                                    </p>
                                </div>

                                <Separator />

                                {/* Availability */}
                                <div>
                                    <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        Availability
                                    </h3>
                                    {selectedProduct.locations && selectedProduct.locations.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProduct.locations.map(loc => (
                                                <Badge key={loc} variant="outline" className="text-xs">
                                                    {loc}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <Badge variant="secondary" className="gap-1">
                                            <TrendingUp className="h-3 w-3" />
                                            Available Nationwide
                                        </Badge>
                                    )}
                                </div>

                                {/* Stock Information */}
                                <div>
                                    <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                                        <Package className="h-4 w-4 text-primary" />
                                        Stock Status
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedProduct.category !== 'Physical Good'
                                            ? 'Digital product or service (Unlimited)'
                                            : selectedProduct.stock > 0 
                                            ? `${selectedProduct.stock} unit${selectedProduct.stock > 1 ? 's' : ''} available`
                                            : 'Sold Out'
                                        }
                                    </p>
                                </div>
                            </div>
                        </ScrollArea>

                        {/* Purchase Button - Sticky at bottom */}
                        <div className="pt-6 border-t bg-background mt-auto">
                            <Button onClick={() => handleBuyNow(selectedProduct)} className="w-full" disabled={selectedProduct.stock === 0 && selectedProduct.category === 'Physical Good'}>
                                {selectedProduct.stock === 0 && selectedProduct.category === 'Physical Good' ? 'Sold Out' : <><ShoppingCart className="mr-2 h-4 w-4" /> Buy Now</>}
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
