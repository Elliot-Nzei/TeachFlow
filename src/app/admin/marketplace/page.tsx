
'use client';
import { useState, useMemo } from 'react';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase/provider';
import { collection, orderBy, query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Archive, Unarchive } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { toTitleCase, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { upsertProduct, deleteProduct } from './actions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { nigerianStates } from '@/lib/nigerian-states';

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
  sellerId: string;
  createdAt?: { toDate: () => Date };
  updatedAt?: { toDate: () => Date };
};

const initialProductState: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
    name: '',
    description: '',
    price: 0,
    category: 'Digital Resource',
    status: 'active',
    stock: 0,
    imageUrl: '',
    locations: [],
    sellerId: '', // Will be set from user profile
};

const ProductForm = ({ product: initialProduct, user, onSave, onCancel }: { product: Product | null, user: any, onSave: () => void, onCancel: () => void }) => {
    const [product, setProduct] = useState(initialProduct || { ...initialProductState, sellerId: user.uid });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const [locationsPopoverOpen, setLocationsPopoverOpen] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleLocationToggle = (location: string) => {
        setProduct(prev => {
            const currentLocations = prev.locations || [];
            const newLocations = currentLocations.includes(location)
                ? currentLocations.filter(loc => loc !== location)
                : [...currentLocations, location];
            return { ...prev, locations: newLocations };
        });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const result = await upsertProduct(product);
        if (result.success) {
            toast({ title: 'Success', description: `Product "${product.name}" has been saved.` });
            onSave();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <ScrollArea className="max-h-[70vh] p-1">
                <div className="space-y-4 pr-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="name">Product Name</Label>
                            <Input id="name" name="name" value={product.name} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" value={product.description} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (₦)</Label>
                            <Input id="price" name="price" type="number" value={product.price} onChange={handleInputChange} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="stock">Stock</Label>
                            <Input id="stock" name="stock" type="number" value={product.stock} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select name="category" value={product.category} onValueChange={(val) => handleSelectChange('category', val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Digital Resource">Digital Resource</SelectItem>
                                    <SelectItem value="Physical Good">Physical Good</SelectItem>
                                    <SelectItem value="Service">Service</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" value={product.status} onValueChange={(val) => handleSelectChange('status', val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="imageUrl">Image URL</Label>
                            <Input id="imageUrl" name="imageUrl" value={product.imageUrl || ''} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2 sm:col-span-2">
                            <Label>Available Locations</Label>
                             <Popover open={locationsPopoverOpen} onOpenChange={setLocationsPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {product.locations && product.locations.length > 0 ? `${product.locations.length} selected` : "Select locations..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search state..." />
                                        <CommandList>
                                        <CommandEmpty>No state found.</CommandEmpty>
                                        <CommandGroup>
                                            {nigerianStates.map(state => (
                                                <CommandItem key={state} onSelect={() => handleLocationToggle(state)}>
                                                     <Check className={cn("mr-2 h-4 w-4", (product.locations || []).includes(state) ? "opacity-100" : "opacity-0")} />
                                                    {state}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <p className="text-xs text-muted-foreground">Leave empty for nationwide availability.</p>
                         </div>
                    </div>
                </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Product'}</Button>
            </DialogFooter>
        </form>
    );
};

export default function AdminMarketplacePage() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    
    const productsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'marketplace_products'), orderBy('createdAt', 'desc')) : null,
        [firestore]
    );
    const { data: products, isLoading } = useCollection<Product>(productsQuery);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
    
    const handleAddNew = () => {
        setEditingProduct(null);
        setIsFormOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteDialog.product) return;
        const result = await deleteProduct(deleteDialog.product.id);
        if (result.success) {
            toast({ title: 'Product Deleted' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setDeleteDialog({ open: false, product: null });
    }
    
    const handleToggleStatus = async (product: Product) => {
        const newStatus = product.status === 'active' ? 'archived' : 'active';
        const result = await upsertProduct({ ...product, status: newStatus });
        if (result.success) {
            toast({ title: 'Status Updated', description: `Product is now ${newStatus}.` });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Marketplace Management</h1>
                    <p className="text-muted-foreground">Manage all products available in the marketplace.</p>
                </div>
                <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" />Add Product</Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Products ({products?.length ?? 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Price (₦)</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? Array.from({length: 3}).map((_, i) => (
                                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-14 w-full" /></TableCell></TableRow>
                            )) : products?.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Image src={product.imageUrl || `https://picsum.photos/seed/${product.id}/40/40`} alt={product.name} width={40} height={40} className="rounded-md object-cover"/>
                                            <div>
                                                <p className="font-semibold">{product.name}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>₦{product.price.toLocaleString()}</TableCell>
                                    <TableCell>{product.stock === 0 ? 'Unlimited' : product.stock}</TableCell>
                                    <TableCell><Badge variant={product.status === 'active' ? 'default' : 'secondary'} className={product.status === 'active' ? 'bg-green-600' : ''}>{toTitleCase(product.status)}</Badge></TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onSelect={() => handleEdit(product)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleToggleStatus(product)}>
                                                    {product.status === 'active' ? <Archive className="mr-2 h-4 w-4"/> : <Unarchive className="mr-2 h-4 w-4"/>}
                                                    {product.status === 'active' ? 'Archive' : 'Activate'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => setDeleteDialog({open: true, product})} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     {(!isLoading && (!products || products.length === 0)) && (
                        <div className="text-center text-muted-foreground p-8">No products found.</div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                        <DialogDescription>Fill in the details for the marketplace product.</DialogDescription>
                    </DialogHeader>
                    {user && <ProductForm user={user} product={editingProduct} onSave={() => setIsFormOpen(false)} onCancel={() => setIsFormOpen(false)} />}
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, product: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the product "{deleteDialog.product?.name}". This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
