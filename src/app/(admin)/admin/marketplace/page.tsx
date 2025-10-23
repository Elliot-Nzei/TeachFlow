
'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, ShoppingCart, DollarSign, Package, MoreHorizontal, Edit, Trash2, Search, UploadCloud } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useStorage } from '@/firebase';
import { collection, query, serverTimestamp, doc, addDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { toTitleCase } from '@/lib/utils';
import { nigerianStates } from '@/lib/nigerian-states';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';


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
    createdAt?: any;
};

const StatCard = ({ title, value, icon, description, isLoading }: { title: string; value: string; icon: React.ReactNode, description: string, isLoading: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
        {isLoading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{value}</div> }
        <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const ProductForm = ({ product, onSave, onCancel }: { product?: Product | null, onSave: (p: Omit<Product, 'id' | 'createdAt'>, imageFile?: File | null) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price?.toString() || '0',
        category: product?.category || 'Digital Resource',
        status: product?.status || 'active',
        stock: product?.stock?.toString() || '0',
        imageUrl: product?.imageUrl || '',
        locations: product?.locations || [],
    });
    const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl || null);


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSelectChange = (name: 'category' | 'status', value: string) => {
        setFormData(prev => ({...prev, [name]: value as any }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            price: Number(formData.price) || 0,
            stock: Number(formData.stock) || 0,
        };
        onSave(dataToSave, imageFile);
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="col-span-3" required />
                </div>
                 <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2">Description</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="image" className="text-right pt-2">Image</Label>
                     <div className="col-span-3 space-y-2">
                        <div className="w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                            {imagePreview ? (
                                <Image src={imagePreview} alt="Product preview" width={128} height={128} className="object-contain h-full w-full rounded-md" />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <UploadCloud className="mx-auto h-8 w-8" />
                                    <p className="text-xs">Image Preview</p>
                                </div>
                            )}
                        </div>
                        <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="text-xs" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="price">Price (₦)</Label>
                        <Input id="price" name="price" type="text" value={formData.price} onChange={handleInputChange} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="stock">Stock</Label>
                        <Input id="stock" name="stock" type="text" value={formData.stock} onChange={handleInputChange} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" value={formData.category} onValueChange={(v) => handleSelectChange('category', v)}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Digital Resource">Digital Resource</SelectItem>
                                <SelectItem value="Physical Good">Physical Good</SelectItem>
                                <SelectItem value="Service">Service</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select name="status" value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Locations</Label>
                     <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-auto min-h-10">
                                <div className="flex flex-wrap gap-1">
                                    {formData.locations?.length > 0 ? formData.locations.map(loc => <Badge key={loc}>{loc}</Badge>) : 'Select locations...'}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width)] p-0">
                        <Command>
                            <CommandInput placeholder="Search states..." />
                            <CommandList>
                                <CommandEmpty>No state found.</CommandEmpty>
                                <CommandGroup>
                                    {nigerianStates.map((state) => (
                                    <CommandItem
                                        key={state}
                                        value={state}
                                        onSelect={() => {
                                            const current = formData.locations || [];
                                            const next = current.includes(state)
                                                ? current.filter(s => s !== state)
                                                : [...current, state];
                                            setFormData(prev => ({...prev, locations: next}));
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", formData.locations?.includes(state) ? "opacity-100" : "opacity-0")} />
                                        {state}
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                        </PopoverContent>
                    </Popover>
                 </div>
            </div>
             <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Product</Button>
            </DialogFooter>
        </form>
    )
}


export default function MarketplaceAdminPage() {
    const { firestore, user } = useFirebase();
    const storage = useStorage();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const productsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'marketplace_products')) : null, [firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

    const handleSaveProduct = async (productData: Omit<Product, 'id' | 'createdAt'>, imageFile?: File | null) => {
        if (!user || !storage || !firestore) return;

        let finalImageUrl = editingProduct?.imageUrl || '';
        const newProductId = editingProduct?.id || uuidv4();

        try {
            if (imageFile) {
                const imageRef = ref(storage, `marketplace_products/${newProductId}/image`);
                await uploadBytes(imageRef, imageFile);
                finalImageUrl = await getDownloadURL(imageRef);
            }

            const productRef = doc(firestore, 'marketplace_products', newProductId);
            
            if (editingProduct) {
                // Update existing product
                updateDocumentNonBlocking(productRef, { ...productData, imageUrl: finalImageUrl, updatedAt: serverTimestamp() });
                toast({ title: 'Product Updated', description: `"${productData.name}" has been updated.` });

            } else {
                // Add new product
                 await setDoc(productRef, { 
                    ...productData, 
                    imageUrl: finalImageUrl, 
                    sellerId: user.uid, 
                    createdAt: serverTimestamp() 
                });

                toast({ title: 'Product Added', description: `"${productData.name}" has been added to the marketplace.` });
            }
        } catch (error) {
            console.error("Error saving product: ", error);
            toast({ variant: 'destructive', title: 'Save Failed', description: "Could not save the product." });
        } finally {
            setIsDialogOpen(false);
            setEditingProduct(null);
        }
    };

    const handleDeleteProduct = (productId: string, productName: string) => {
        if (!window.confirm(`Are you sure you want to delete "${productName}"? This cannot be undone.`)) return;
        
        deleteDocumentNonBlocking(doc(firestore, 'marketplace_products', productId));
        toast({ title: 'Product Deleted', description: `"${productName}" has been removed.` });
    }

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const activeProducts = useMemo(() => products?.filter(p => p.status === 'active').length || 0, [products]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Marketplace Management</h1>
                    <p className="text-muted-foreground">Oversee products, orders, and settings for the marketplace.</p>
                </div>
                <Button onClick={() => { setEditingProduct(null); setIsDialogOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Add New Product
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Revenue" value="₦0" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} description="Revenue tracking coming soon" isLoading={false} />
                <StatCard title="Total Products" value={products?.length.toString() || '0'} icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />} description={`${activeProducts} active product(s)`} isLoading={isLoadingProducts} />
                <StatCard title="New Orders" value="0" icon={<Package className="h-4 w-4 text-muted-foreground" />} description="Order management coming soon" isLoading={false} />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                        <DialogDescription>
                            Fill in the details to add or update a product in the marketplace.
                        </DialogDescription>
                    </DialogHeader>
                    <ProductForm 
                        product={editingProduct}
                        onSave={handleSaveProduct}
                        onCancel={() => { setIsDialogOpen(false); setEditingProduct(null); }}
                    />
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle>Marketplace Products</CardTitle>
                    <CardDescription>A list of all products currently in the marketplace.</CardDescription>
                     <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name or category..." 
                            className="pl-10 max-w-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[250px]">Product</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price (₦)</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingProducts ? Array.from({length: 3}).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                                )) : filteredProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Image src={product.imageUrl || `https://picsum.photos/seed/${product.id}/40/40`} alt={product.name} width={40} height={40} className="rounded-md object-cover bg-muted" />
                                                <div className="flex-1 truncate">
                                                    <p className="font-semibold truncate">{product.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{product.category}</TableCell>
                                        <TableCell>₦{product.price.toLocaleString()}</TableCell>
                                        <TableCell>{product.stock}</TableCell>
                                        <TableCell>
                                            <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>{toTitleCase(product.status)}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { setEditingProduct(product); setIsDialogOpen(true); }}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteProduct(product.id, product.name)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
