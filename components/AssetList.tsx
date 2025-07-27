'use client';

import { Asset, Transaction } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, TrendingDown, Landmark, Car, Smartphone, Briefcase, HelpCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/finance-utils';

interface AssetListProps {
  assets: Asset[];
  transactions: Transaction[];
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

const assetIcons = {
  Property: <Landmark className="h-5 w-5 text-muted-foreground" />,
  Vehicle: <Car className="h-5 w-5 text-muted-foreground" />,
  Electronics: <Smartphone className="h-5 w-5 text-muted-foreground" />,
  Investment: <Briefcase className="h-5 w-5 text-muted-foreground" />,
  Other: <HelpCircle className="h-5 w-5 text-muted-foreground" />,
};

export function AssetList({ assets, transactions, onEdit, onDelete }: AssetListProps) {
  
  const getAssetTotalExpenses = (assetId: string) => {
    return transactions
      .filter(t => t.assetId === assetId && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  };

  if (assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Assets Found</CardTitle>
          <CardDescription>Get started by adding your first asset, like a car or property.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Assets</CardTitle>
        <CardDescription>A summary of your valuable assets and their lifetime costs.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">Lifetime Cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map(asset => {
              const totalExpenses = getAssetTotalExpenses(asset.id);
              return (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium flex items-center gap-3">
                    {assetIcons[asset.type]}
                    <div>
                      {asset.name}
                      <p className="text-xs text-muted-foreground">Purchased: {formatDate(asset.purchaseDate)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{asset.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(asset.currentValue)}
                    <p className="text-xs text-muted-foreground">Initial: {formatCurrency(asset.initialValue)}</p>
                  </TableCell>
                  <TableCell className="text-right text-red-500">{formatCurrency(totalExpenses)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(asset)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(asset.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}