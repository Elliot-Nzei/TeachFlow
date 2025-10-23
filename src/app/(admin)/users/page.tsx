
'use client';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useCollection, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toTitleCase } from '@/lib/utils';
import { Search, Users } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';

export default function AdminUsersPage() {
  return null;
}
