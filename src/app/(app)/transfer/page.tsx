import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft, Send } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { placeholderTransfers } from '@/lib/placeholder-data';
import { formatDistanceToNow } from 'date-fns';

export default function TransferPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Data Transfer</h1>
        <p className="text-muted-foreground">Securely transfer data to another user with their unique code.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Initiate a New Transfer</CardTitle>
          <CardDescription>Enter the recipient's code and select the data you wish to send.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="recipient-code">Recipient's User Code</Label>
              <Input id="recipient-code" placeholder="NSMS-XXXXX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-type">Data Type</Label>
              <Select>
                <SelectTrigger id="data-type">
                  <SelectValue placeholder="Select data to transfer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">Class Data</SelectItem>
                  <SelectItem value="grades">Grades</SelectItem>
                  <SelectItem value="report">Report Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="data-item">Specific Item (Optional)</Label>
              <Input id="data-item" placeholder="e.g., Primary 3B or Ada Okoro" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button>
            <Send className="mr-2 h-4 w-4" />
            Transfer Data
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>A log of your recent sent and received data transfers.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Direction</TableHead>
                  <TableHead>User Code</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placeholderTransfers.map((transfer) => {
                    const isSent = transfer.fromUser.startsWith('You');
                    return (
                        <TableRow key={transfer.id}>
                            <TableCell>
                                {isSent ? (
                                    <span className="flex items-center text-red-500">
                                        <ArrowRightLeft className="mr-2 h-4 w-4" /> Sent
                                    </span>
                                ) : (
                                    <span className="flex items-center text-green-500">
                                        <ArrowRightLeft className="mr-2 h-4 w-4" /> Received
                                    </span>
                                )}
                            </TableCell>
                            <TableCell className="font-mono">{isSent ? transfer.toUser : transfer.fromUser}</TableCell>
                            <TableCell>{transfer.dataType}</TableCell>
                            <TableCell>{transfer.dataTransferred}</TableCell>
                            <TableCell className="text-right">{formatDistanceToNow(new Date(transfer.timestamp), { addSuffix: true })}</TableCell>
                        </TableRow>
                    )
                })}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
