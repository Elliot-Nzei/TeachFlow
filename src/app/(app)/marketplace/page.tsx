
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePlan } from '@/contexts/plan-context';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Lock, Search, Filter, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { toTitleCase } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { nigerianStates } from '@/lib/nigerian-states';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
        const allowedHosts = ['images.unsplash.com', 'picsum.photos', 'drive.google.com', 'lh3.googleusercontent.com'];
        const urlObj = new URL(url);
        return allowedHosts.includes(urlObj.hostname);
    } catch (error) {
        return false;
    }
};

const getSafeImageUrl = (product: Product, size: 'small' | 'large' = 'large') => {
    if (isValidImageUrl(product.imageUrl)) {
        return product.imageUrl!;
    }
    const dimensions = size === 'small' ? '40/40' : '400/300';
    return `https://picsum.photos/seed/${product.id}/${dimensions}`;
};


const ProductCard = ({ product, index, onClick }: { product: Product; index: number; onClick: () => void }) => {
    return (
        <SheetTrigger asChild>
             <div onClick={onClick} className="group cursor-pointer">
                <Card className="overflow-hidden flex flex-col h-full">
                    <CardHeader className="p-0">
                        <div className="aspect-[4/3] relative overflow-hidden">
                            <Image
                                src={getSafeImageUrl(product)}
                                alt={product.name}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                priority={index < 12}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 flex-grow flex flex-col">
                        <div className="flex-grow">
                            <CardTitle className="text-sm font-headline line-clamp-2">{product.name}</CardTitle>
                        </div>
                         {product.locations && product.locations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {product.locations.slice(0, 2).map(loc => <Badge key={loc} variant="outline" className="text-[10px] p-1">{loc}</Badge>)}
                                {product.locations.length > 2 && <Badge variant="outline" className="text-[10px] p-1">+{product.locations.length - 2}</Badge>}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="p-3 pt-0 flex justify-between items-center bg-muted/50">
                        <p className="text-sm font-bold text-primary">₦{product.price.toLocaleString()}</p>
                    </CardFooter>
                </Card>
            </div>
        </SheetTrigger>
    )
};


const Filters = ({ filters, setFilters, onClear, allLocations }: { filters: any, setFilters: any, onClear: () => void, allLocations: string[] }) => {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
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
                <Label htmlFor="category">Category</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters((prev: any) => ({ ...prev, category: value }))}>
                    <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Categories</SelectItem>
                        <SelectItem value="Digital Resource">Digital Resource</SelectItem>
                        <SelectItem value="Physical Good">Physical Good</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select value={filters.location} onValueChange={(value) => setFilters((prev: any) => ({ ...prev, location: value }))}>
                    <SelectTrigger id="location"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Locations</SelectItem>
                        {allLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            
            <Button variant="ghost" onClick={onClear} className="w-full">Clear All Filters</Button>
        </div>
    )
}


export default function MarketplacePage() {
    const { plan, isTrial } = usePlan();
    const router = useRouter();
    const { toast } = useToast();
    const { firestore } = useFirebase();

    const [isLoadingPlan, setIsLoadingPlan] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    
    const [filters, setFilters] = useState({
        searchTerm: '',
        category: 'All',
        location: 'All',
    });
    
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const productsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'marketplace_products'), where('status', '==', 'active')) : null, [firestore]);
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
    
    const allLocations = useMemo(() => {
        if (!products) return [];
        const locationSet = new Set<string>();
        products.forEach(p => p.locations?.forEach(loc => locationSet.add(loc)));
        return Array.from(locationSet).sort();
    }, [products]);
    
    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(filters.searchTerm.toLowerCase());
            const matchesCategory = filters.category === 'All' || p.category === filters.category;
            const matchesLocation = filters.location === 'All' || p.locations?.includes(filters.location) || !p.locations || p.locations.length === 0;
            return matchesSearch && matchesCategory && matchesLocation;
        });
    }, [products, filters]);

    const handleClearFilters = () => {
        setFilters({ searchTerm: '', category: 'All', location: 'All' });
    };

    if (isLoadingPlan) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Verifying plan...</p>
                </div>
            </div>
        );
    }
    
    return (
        <Sheet open={!!selectedProduct} onOpenChange={(isOpen) => !isOpen && setSelectedProduct(null)}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <aside className="lg:col-span-3 lg:sticky lg:top-24">
                    <Card className="hidden lg:block">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/> Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Filters filters={filters} setFilters={setFilters} onClear={handleClearFilters} allLocations={allLocations} />
                        </CardContent>
                    </Card>
                    <div className="lg:hidden">
                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    <Filter className="mr-2 h-4 w-4" /> Show Filters
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px]">
                                <ScrollArea className="h-full p-6 -m-6">
                                    <h2 className="text-lg font-semibold mb-6">Filters</h2>
                                    <Filters filters={filters} setFilters={setFilters} onClear={() => { handleClearFilters(); setIsSheetOpen(false); }} allLocations={allLocations} />
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>
                    </div>
                </aside>

                <main className="lg:col-span-9">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold font-headline">Marketplace</h1>
                        <p className="text-muted-foreground">Browse educational resources and goods from the community.</p>
                    </div>

                    {isLoadingProducts ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} onClick={() => setSelectedProduct(product)} />)}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed rounded-lg">
                            <p className="text-lg font-semibold">No Products Found</p>
                            <p className="text-muted-foreground mt-2">Try adjusting your filters or check back later.</p>
                            <Button variant="outline" onClick={handleClearFilters} className="mt-4">
                                <X className="mr-2 h-4 w-4" /> Clear Filters
                            </Button>
                        </div>
                    )}
                </main>
            </div>
            
            <SheetContent className="w-full sm:max-w-lg">
                {selectedProduct && (
                    <ScrollArea className="h-full pr-6 -mr-6">
                        <SheetHeader>
                            <div className="aspect-video relative mb-4 -mx-6 -mt-6">
                                <Image src={getSafeImageUrl(selectedProduct)} alt={selectedProduct.name} fill className="object-cover"/>
                            </div>
                            <SheetTitle className="text-2xl font-headline">{selectedProduct.name}</SheetTitle>
                            <SheetDescription className="flex items-center justify-between">
                                <Badge variant="secondary">{selectedProduct.category}</Badge>
                                <span className="text-2xl font-bold text-primary">₦{selectedProduct.price.toLocaleString()}</span>
                            </SheetDescription>
                        </SheetHeader>
                        <div className="py-6 space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2">Description</h3>
                                <p className="text-sm text-muted-foreground">{selectedProduct.description || 'No description provided.'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Availability</h3>
                                {selectedProduct.locations && selectedProduct.locations.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProduct.locations.map(loc => <Badge key={loc} variant="outline">{loc}</Badge>)}
                                    </div>
                                ) : (
                                    <Badge variant="outline">Nationwide</Badge>
                                )}
                            </div>
                             <div>
                                <h3 className="font-semibold mb-2">Stock</h3>
                                <p className="text-sm text-muted-foreground">{selectedProduct.stock > 0 ? `${selectedProduct.stock} available` : 'Digital or unlimited stock'}</p>
                            </div>
                        </div>
                    </ScrollArea>
                )}
            </SheetContent>
        </Sheet>
    );
}
