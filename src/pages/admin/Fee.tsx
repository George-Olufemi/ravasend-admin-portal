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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { feesAPI, Fee, CreateFeeData } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

type FeeType = "conversion" | "forex" | "withdrawal";

interface FeeTypeConfig {
  label: string;
  description: string;
  createFn: (data: CreateFeeData) => Promise<any>;
}

interface FeeData {
  conversion: Fee[];
  forex: Fee[];
  withdrawal: Fee[];
}

const FEE_TYPES: Record<FeeType, FeeTypeConfig> = {
  conversion: {
    label: "Conversion Fee",
    description: "Fee applied for currency conversion",
    createFn: feesAPI.create,
  },
  forex: {
    label: "Forex Fee",
    description: "Fee applied for forex transactions",
    createFn: feesAPI.createForexFee,
  },
  withdrawal: {
    label: "Withdrawal Fee",
    description: "Fee applied for withdrawals",
    createFn: feesAPI.createWithdrawalFee,
  },
};

const ITEMS_PER_PAGE = 10;

const FeePage = () => {
  const [activeTab, setActiveTab] = useState<FeeType>("conversion");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const [formData, setFormData] = useState<CreateFeeData>({
    amount: "",
  });
  const [currentPages, setCurrentPages] = useState<Record<FeeType, number>>({
    conversion: 1,
    forex: 1,
    withdrawal: 1,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: feeData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["fees"],
    queryFn: async (): Promise<FeeData> => {
      const [conversionRes, forexRes, withdrawalRes] = await Promise.all([
        feesAPI.getAll(),
        feesAPI.getAllForexFee(),
        feesAPI.getAllWithdrawalFees(),
      ]);

      return {
        conversion: conversionRes.data || [],
        forex: forexRes.data || [],
        withdrawal: withdrawalRes.data || [],
      };
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFeeData) => FEE_TYPES[activeTab].createFn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      setIsCreateOpen(false);
      resetForm();
      setCurrentPages({ ...currentPages, [activeTab]: 1 });
      toast({
        title: "Success",
        description: `${FEE_TYPES[activeTab].label} created successfully!`,
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

  const handleOpenDialog = () => {
    setEditingFee(null);
    resetForm();
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

  const FeeTable = ({ feeType }: { feeType: FeeType }) => {
    const allTypeFees = feeData?.[feeType] || [];
    const config = FEE_TYPES[feeType];
    const currentPage = currentPages[feeType];

    const totalPages = Math.ceil(allTypeFees.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedFees = allTypeFees.slice(startIndex, endIndex);

    const handlePreviousPage = () => {
      setCurrentPages({
        ...currentPages,
        [feeType]: Math.max(1, currentPage - 1),
      });
    };

    const handleNextPage = () => {
      setCurrentPages({
        ...currentPages,
        [feeType]: Math.min(totalPages, currentPage + 1),
      });
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Dialog
            open={isCreateOpen && activeTab === feeType}
            onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) {
                setEditingFee(null);
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={handleOpenDialog}
                className="hover:opacity-90 shadow-glow"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create {config.label}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-gradient-card border-border/50">
              <DialogHeader>
                <DialogTitle>
                  {editingFee ? "Edit Fee" : `Create ${config.label}`}
                </DialogTitle>
                <DialogDescription>
                  {editingFee
                    ? `Update the ${config.label.toLowerCase()} amount`
                    : `Create a new ${config.label.toLowerCase()}`}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₦)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="10"
                    step="0.01"
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
                    className="hover:opacity-90"
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

        <div className="rounded-md border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>ID</TableHead>
                <TableHead>Amount (₦)</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No {config.label.toLowerCase()} found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFees.map((fee: Fee) => (
                  <TableRow key={fee._id} className="hover:bg-muted/20">
                    <TableCell className="text-sm font-mono">
                      {/* {fee._id.substring(0, 12)}... */}
                      {fee._id}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {fee.amount}
                    </TableCell>
                    <TableCell className="text-sm">
                      {fee.createdAt
                        ? new Date(fee.createdAt).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(fee)}
                          className="h-8 w-8 p-0"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(fee._id)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {allTypeFees.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, allTypeFees.length)}{" "}
              of {allTypeFees.length} fees
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fees Management</h1>
        <p className="text-muted-foreground">
          Manage conversion, forex, and withdrawal fees
        </p>
      </div>

      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle>All Fees</CardTitle>
          <CardDescription>
            Create and manage different types of transaction fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as FeeType)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="conversion">
                Conversion Fee
                <span className="ml-2 text-xs px-2 py-1 bg-muted rounded-full">
                  {feeData?.conversion?.length || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="forex">
                Foreign Bank Transfer Fee
                <span className="ml-2 text-xs px-2 py-1 bg-muted rounded-full">
                  {feeData?.forex?.length || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="withdrawal">
                Local Bank Transfer Fee
                <span className="ml-2 text-xs px-2 py-1 bg-muted rounded-full">
                  {feeData?.withdrawal?.length || 0}
                </span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="conversion" className="space-y-4">
                <FeeTable feeType="conversion" />
              </TabsContent>

              <TabsContent value="forex" className="space-y-4">
                <FeeTable feeType="forex" />
              </TabsContent>

              <TabsContent value="withdrawal" className="space-y-4">
                <FeeTable feeType="withdrawal" />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeePage;
