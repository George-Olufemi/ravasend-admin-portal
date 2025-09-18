import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { promoCodesAPI, PromoCode, CreatePromoCodeData } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Plus, Edit, Trash2, Copy } from "lucide-react";

const PromoCodes = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState<CreatePromoCodeData>({
    discount: "",
    expiredAt: "",
    maxUsage: 1,
    transactionAmount: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: promoData, isLoading, error } = useQuery({
    queryKey: ['promocodes'],
    queryFn: promoCodesAPI.getAll,
  });

  const createMutation = useMutation({
    mutationFn: promoCodesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promocodes'] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Promo code created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.message || "Failed to create promo code",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePromoCodeData> }) =>
      promoCodesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promocodes'] });
      setEditingPromo(null);
      resetForm();
      toast({
        title: "Success",
        description: "Promo code updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.message || "Failed to update promo code",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: promoCodesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promocodes'] });
      toast({
        title: "Success",
        description: "Promo code deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete promo code",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      discount: "",
      expiredAt: "",
      maxUsage: 1,
      transactionAmount: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPromo) {
      updateMutation.mutate({ id: editingPromo.promoCode, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      discount: promo.discount.toString(),
      expiredAt: promo.expiredAt.split('T')[0],
      maxUsage: promo.maxUsage,
      transactionAmount: promo.transactionAmount.toString(),
    });
    setIsCreateOpen(true);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Promo code copied to clipboard",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const isExpired = (date: string) => {
    return new Date(date) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            Error loading promo codes: {(error as any)?.message || 'Unknown error'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const promoCodes = promoData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promo Codes</h1>
          <p className="text-muted-foreground">
            Manage promotional codes and discounts
          </p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setEditingPromo(null);
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 shadow-glow">
              <Plus className="mr-2 h-4 w-4" />
              Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-gradient-card border-border/50">
            <DialogHeader>
              <DialogTitle>
                {editingPromo ? "Edit Promo Code" : "Create New Promo Code"}
              </DialogTitle>
              <DialogDescription>
                {editingPromo
                  ? "Update the promo code details"
                  : "Create a new promotional code for users"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount Amount (₦)</Label>
                  <Input
                    id="discount"
                    type="number"
                    placeholder="1000"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({ ...formData, discount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transactionAmount">Min Transaction (₦)</Label>
                  <Input
                    id="transactionAmount"
                    type="number"
                    placeholder="1000"
                    value={formData.transactionAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transactionAmount: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUsage">Max Usage Count</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={formData.maxUsage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxUsage: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiredAt">Expiry Date</Label>
                  <Input
                    id="expiredAt"
                    type="date"
                    value={formData.expiredAt}
                    onChange={(e) =>
                      setFormData({ ...formData, expiredAt: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {editingPromo ? "Updating..." : "Creating..."}
                    </>
                  ) : editingPromo ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>All Promo Codes</CardTitle>
          <CardDescription>
            Manage promotional codes and their usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min Transaction</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promo: PromoCode) => (
                  <TableRow key={promo._id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="px-2 py-1 bg-muted/50 rounded text-sm font-mono">
                          {promo.promoCode}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyCode(promo.promoCode)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-400">
                        {formatCurrency(promo.discount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(promo.transactionAmount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {promo.usageCount} / {promo.maxUsage}
                        </div>
                        <div className="text-muted-foreground">
                          {((promo.usageCount / promo.maxUsage) * 100).toFixed(
                            0
                          )}
                          % used
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          isExpired(promo.expiredAt)
                            ? "destructive"
                            : promo.usageCount >= promo.maxUsage
                            ? "secondary"
                            : "default"
                        }
                        className={
                          !isExpired(promo.expiredAt) &&
                          promo.usageCount < promo.maxUsage
                            ? "bg-green-500/20 text-green-400"
                            : ""
                        }
                      >
                        {isExpired(promo.expiredAt)
                          ? "Expired"
                          : promo.usageCount >= promo.maxUsage
                          ? "Used Up"
                          : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDistanceToNow(new Date(promo.expiredAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(promo)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(promo.promoCode)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
};

export default PromoCodes;