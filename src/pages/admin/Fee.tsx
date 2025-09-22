import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { feesAPI, Fee, CreateFeeData } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

const FeePage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const [formData, setFormData] = useState<CreateFeeData>({
    amount: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: feeData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["fees"],
    queryFn: feesAPI.getAll,
  });

  const createMutation = useMutation({
    mutationFn: feesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Fee created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.message || "Failed to create fee",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateFeeData> }) =>
      feesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      setEditingFee(null);
      resetForm();
      toast({
        title: "Success",
        description: "Fee updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.message || "Failed to update fee",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: feesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      toast({
        title: "Success",
        description: "Fee deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete fee",
      });
    },
  });

  const resetForm = () => {
    setFormData({ amount: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFee) {
      updateMutation.mutate({ id: editingFee._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (fee: Fee) => {
    setEditingFee(fee);
    setFormData({ amount: fee.amount.toString() });
    setIsCreateOpen(true);
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
            Error loading fees: {(error as any)?.message || "Unknown error"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const fees = feeData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fees</h1>
          <p className="text-muted-foreground">Manage transaction fees</p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setEditingFee(null);
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 shadow-glow">
              <Plus className="mr-2 h-4 w-4" />
              Create Fee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-gradient-card border-border/50">
            <DialogHeader>
              <DialogTitle>
                {editingFee ? "Edit Fee" : "Create New Fee"}
              </DialogTitle>
              <DialogDescription>
                {editingFee
                  ? "Update the fee amount"
                  : "Create a new transaction fee"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="10"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
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
                      {editingFee ? "Updating..." : "Creating..."}
                    </>
                  ) : editingFee ? (
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
          <CardTitle>All Fees</CardTitle>
          <CardDescription>Manage all transaction fees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee: Fee) => (
                  <TableRow key={fee._id} className="hover:bg-muted/20">
                    <TableCell>{fee._id}</TableCell>
                    <TableCell>₦{fee.amount}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(fee)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(fee._id)}
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

export default FeePage;
