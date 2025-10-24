
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Archive, Unarchive, Search, Filter, Download, PackageOpen } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { toTitleCase, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { upsertProduct, deleteProduct } from './actions';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { nigerianStates } from '@/lib/nigerian-states';

type ProductCategory = 'Digital Resource' | 'Physical Good' | 'Service';
type ProductStatus = 'active' | 'archived';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  status: ProductStatus;
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
  sellerId: '',
};

interface ProductFormProps {
  product: Product | null;
  user: any;
  onSave: () => void;
  onCancel: () => void;
}

const ProductForm = ({ product: initialProduct, user, onSave, onCancel }: ProductFormProps) => {
  const [product, setProduct] = useState<Partial<Product>>(
    initialProduct || { ...initialProductState, sellerId: user.uid }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [locationsPopoverOpen, setLocationsPopoverOpen] = useState(false);

  useEffect(() => {
    setProduct(initialProduct || { ...initialProductState, sellerId: user.uid });
    setErrors({});
  }, [initialProduct, user.uid]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!product.name?.trim()) {
      newErrors.name = 'Product name is required';
    } else if (product.name.length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    }

    if (!product.description?.trim()) {
      newErrors.description = 'Description is required';
    } else if (product.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (product.price === undefined || product.price < 0) {
      newErrors.price = 'Price must be 0 or greater';
    }

    if (product.stock === undefined || product.stock < 0) {
      newErrors.stock = 'Stock must be 0 or greater';
    }

    if (product.imageUrl && !isValidUrl(product.imageUrl)) {
      newErrors.imageUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : parseFloat(value);
    setProduct(prev => ({ ...prev, [name]: numValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors in the form'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await upsertProduct(product as Product);
      if (result.success) {
        toast({
          title: 'Success',
          description: `Product "${product.name}" has been ${initialProduct ? 'updated' : 'created'}.`
        });
        onSave();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to save product'
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ScrollArea className="h-[60vh] p-1">
        <div className="space-y-4 pr-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={product.name || ''}
                onChange={handleInputChange}
                className={errors.name ? 'border-destructive' : ''}
                placeholder="e.g., Mathematics Workbook Grade 5"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={product.description || ''}
                onChange={handleInputChange}
                className={errors.description ? 'border-destructive' : ''}
                placeholder="Provide a detailed description of the product..."
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">
                Price (₦) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={product.price || 0}
                onChange={handleNumberChange}
                className={errors.price ? 'border-destructive' : ''}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price}</p>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock">
                Stock <span className="text-destructive">*</span>
              </Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={product.stock || 0}
                onChange={handleNumberChange}
                className={errors.stock ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">Set to 0 for unlimited stock</p>
              {errors.stock && (
                <p className="text-sm text-destructive">{errors.stock}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                name="category"
                value={product.category}
                onValueChange={(val) => handleSelectChange('category', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Digital Resource">Digital Resource</SelectItem>
                  <SelectItem value="Physical Good">Physical Good</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                name="status"
                value={product.status}
                onValueChange={(val) => handleSelectChange('status', val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image URL */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                value={product.imageUrl || ''}
                onChange={handleInputChange}
                className={errors.imageUrl ? 'border-destructive' : ''}
                placeholder="https://example.com/image.jpg"
              />
              {errors.imageUrl && (
                <p className="text-sm text-destructive">{errors.imageUrl}</p>
              )}
              {product.imageUrl && !errors.imageUrl && (
                <div className="mt-2">
                  <Image
                    src={product.imageUrl}
                    alt="Preview"
                    width={100}
                    height={100}
                    className="rounded-md object-cover"
                    onError={() => setErrors(prev => ({ ...prev, imageUrl: 'Failed to load image' }))}
                  />
                </div>
              )}
            </div>

            {/* Locations */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Available Locations</Label>
              <Popover open={locationsPopoverOpen} onOpenChange={setLocationsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {product.locations && product.locations.length > 0
                      ? `${product.locations.length} state${product.locations.length > 1 ? 's' : ''} selected`
                      : 'Select locations...'}
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
                          <CommandItem
                            key={state}
                            onSelect={() => handleLocationToggle(state)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                (product.locations || []).includes(state)
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            {state}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {product.locations && product.locations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {product.locations.map(loc => (
                    <Badge key={loc} variant="secondary" className="text-xs">
                      {loc}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Leave empty for nationwide availability
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
      <DialogFooter className="pt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialProduct ? 'Update Product' : 'Create Product'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default function AdminMarketplacePage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProductCategory>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch products
  const productsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'marketplace_products'), orderBy('createdAt', 'desc'))
        : null,
    [firestore]
  );
  const { data: products, isLoading, error: queryError } = useCollection<Product>(productsQuery);

  // Handle query errors
  useEffect(() => {
    if (queryError) {
      setError('Failed to load products. Please refresh the page.');
      console.error('Products query error:', queryError);
    }
  }, [queryError]);

  // Filter and search products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter(product => {
      const matchesSearch =
        searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, searchQuery, statusFilter, categoryFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!products) return { total: 0, active: 0, archived: 0, totalValue: 0 };

    return {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      archived: products.filter(p => p.status === 'archived').length,
      totalValue: products.reduce((sum, p) => sum + (p.price * (p.stock || 1)), 0)
    };
  }, [products]);

  // Handlers
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

    try {
      const result = await deleteProduct(deleteDialog.product.id);
      if (result.success) {
        toast({
          title: 'Product Deleted',
          description: `"${deleteDialog.product.name}" has been removed from the marketplace.`
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to delete product'
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred'
      });
    } finally {
      setDeleteDialog({ open: false, product: null });
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus: ProductStatus = product.status === 'active' ? 'archived' : 'active';

    try {
      const result = await upsertProduct({ ...product, status: newStatus });
      if (result.success) {
        toast({
          title: 'Status Updated',
          description: `"${product.name}" is now ${newStatus}.`
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to update status'
        });
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred'
      });
    }
  };

  const handleExport = () => {
    if (!products || products.length === 0) return;

    const csvContent = [
      ['Name', 'Description', 'Price', 'Stock', 'Category', 'Status', 'Locations'].join(','),
      ...products.map(p =>
        [
          `"${p.name}"`,
          `"${p.description}"`,
          p.price,
          p.stock,
          p.category,
          p.status,
          `"${(p.locations || []).join('; ')}"`
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketplace-products-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: 'Export Complete', description: 'Products exported successfully' });
  };

  const ProductActionsDropdown = ({ product }: { product: Product }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => handleEdit(product)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleToggleStatus(product)}>
          {product.status === 'active' ? (
            <><Archive className="mr-2 h-4 w-4" />Archive</>
          ) : (
            <><Unarchive className="mr-2 h-4 w-4" />Activate</>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => setDeleteDialog({ open: true, product })}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Marketplace Management</h1>
          <p className="text-muted-foreground">
            Manage all products available in the marketplace.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!products || products.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Products</CardDescription>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <CardTitle className="text-2xl">{stats.total}</CardTitle>}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <CardTitle className="text-2xl text-green-600">{stats.active}</CardTitle>}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Archived</CardDescription>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <CardTitle className="text-2xl text-muted-foreground">{stats.archived}</CardTitle>}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Value</CardDescription>
            {isLoading ? <Skeleton className="h-8 w-20" /> : <CardTitle className="text-2xl">₦{stats.totalValue.toLocaleString()}</CardTitle>}
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val as any)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Digital Resource">Digital Resource</SelectItem>
                  <SelectItem value="Physical Good">Physical Good</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
           {/* Mobile Card View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <Card key={product.id}>
                    <CardHeader>
                      <div className="relative aspect-video mb-2">
                        <Image src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}`} alt={product.name} fill className="rounded-md object-cover" />
                      </div>
                      <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Price:</span>
                            <span className="font-semibold">₦{product.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Stock:</span>
                            <span>{product.stock === 0 ? "Unlimited" : product.stock}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className={product.status === 'active' ? 'bg-green-600' : ''}>{toTitleCase(product.status)}</Badge>
                        </div>
                    </CardContent>
                    <CardFooter>
                      <ProductActionsDropdown product={product} />
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 col-span-full">No products found.</div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-14 w-full" /></TableCell></TableRow>
                    ))
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 flex-shrink-0">
                              <Image src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random`} alt={product.name} fill className="rounded-md object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                        <TableCell className="font-medium">₦{product.price.toLocaleString()}</TableCell>
                        <TableCell>
                          {product.stock === 0 ? (<span className="text-muted-foreground">Unlimited</span>) : (<span className={product.stock < 10 ? 'text-orange-600' : ''}>{product.stock}</span>)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className={product.status === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}>{toTitleCase(product.status)}</Badge>
                        </TableCell>
                        <TableCell><ProductActionsDropdown product={product} /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <PackageOpen className="h-12 w-12 mb-2 opacity-30" />
                          <p className="text-sm font-medium">No products found</p>
                          <p className="text-xs">{searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first product to get started'}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>{editingProduct ? 'Update the product information below.' : 'Fill in the details to create a new product.'}</DialogDescription>
          </DialogHeader>
          {user && (<ProductForm product={editingProduct} user={user} onSave={() => { setIsFormOpen(false); setEditingProduct(null); }} onCancel={() => { setIsFormOpen(false); setEditingProduct(null); }} />)}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, product: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete &quot;{deleteDialog.product?.name}&quot; from the marketplace. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
