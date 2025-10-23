
'use client';
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, ShoppingCart, DollarSign, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea";

// Dummy data for demonstration
const products = [
  { id: 'prod_1', name: 'Digital Whiteboard Pack', category: 'Software', price: 5000, stock: 100, status: 'Active' },
  { id: 'prod_2', name: 'JSS1 Lesson Plan Bundle', category: 'Resources', price: 2500, stock: 50, status: 'Active' },
  { id: 'prod_3', name: 'Printable Classroom Decor', category: 'Assets', price: 1500, stock: 200, status: 'Archived' },
  { id: 'prod_4', name: 'Primary School Science Kit', category: 'Physical Goods', price: 15000, stock: 0, status: 'Active' },
];

const StatCard = ({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode, description: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default function MarketplaceAdminPage() {

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Marketplace Management</h1>
                    <p className="text-muted-foreground">Oversee products, orders, and settings for the marketplace.</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4"/> Add New Product</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                        <DialogDescription>
                            Fill in the details of the new product to add it to the marketplace.
                        </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" placeholder="e.g., Lesson Plan Pack" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">Description</Label>
                                <Textarea id="description" placeholder="A short description of the product." className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="price" className="text-right">Price (₦)</Label>
                                <Input id="price" type="number" placeholder="2500" className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                        <Button type="submit">Save Product</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Revenue" value="₦125,500" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} description="+15.2% from last month" />
                <StatCard title="Total Products" value="4" icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />} description="2 active products" />
                <StatCard title="New Orders" value="32" icon={<Package className="h-4 w-4 text-muted-foreground" />} description="+5 from yesterday" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>A list of all products in the marketplace.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {products.map((product) => (
                            <Card key={product.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base">{product.name}</CardTitle>
                                        <Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>{product.status}</Badge>
                                    </div>
                                    <CardDescription>{product.category}</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Price</p>
                                        <p className="font-semibold">₦{product.price.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Stock</p>
                                        <p className="font-semibold">{product.stock}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price (₦)</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{product.category}</TableCell>
                                        <TableCell>₦{product.price.toLocaleString()}</TableCell>
                                        <TableCell>{product.stock}</TableCell>
                                        <TableCell>
                                            <Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>{product.status}</Badge>
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
