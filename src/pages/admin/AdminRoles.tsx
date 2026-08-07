import { Button } from '@/components/ui/button';
import { Plus, Users, Shield, Check, MoreVertical, UserCog, UserCheck, UserX, UserPlus, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { adminAndRolesAPI } from '@/lib/api';

// ---- Types matching the real API payload ----
interface ApiAdminMember {
	_id: string;
	fullName: string;
	email: string;
	role: string;
	isVerified: boolean;
	isBlocked: boolean;
	createdAt: string;
	updatedAt: string;
}

interface Role {
	id: string;
	name: string;
	description: string;
	permissions: string[];
}

const roles: Role[] = [
	{ id: 'super-admin', name: 'Super Admin', description: 'Full access, all actions', permissions: ['Users', 'Transactions', 'Fee Structure', 'Competitions', 'Disbursements', 'Segments', 'Campaigns', 'Withdrawals', 'Manage Roles', 'Billing'] },
	{ id: 'competition-manager', name: 'Competition Manager', description: 'Competitions, segments, campaigns', permissions: ['Competitions', 'Segments', 'Campaigns'] },
	{ id: 'finance-ops', name: 'Finance / Ops', description: 'Transactions, fees, disbursements', permissions: ['Transactions', 'Fee Structure', 'Disbursements', 'Withdrawals'] },
	{ id: 'support-agent', name: 'Support Agent', description: 'View users & transactions', permissions: ['Users', 'Transactions'] },
	{ id: 'read-only', name: 'Read Only', description: 'View-only across all modules', permissions: [] },
];

const roleColors: { [key: string]: string } = {
	'super-admin': 'bg-blue-100 text-blue-800',
	'competition-manager': 'bg-green-100 text-green-800',
	'finance-ops': 'bg-orange-100 text-orange-800',
	'support-agent': 'bg-cyan-100 text-cyan-800',
	'read-only': 'bg-gray-100 text-gray-800',
	admin: 'bg-blue-100 text-blue-800',
};

const roleIcons: { [key: string]: any } = {
	'super-admin': Shield,
	'competition-manager': Users,
	'finance-ops': UserCheck,
	'support-agent': UserPlus,
	'read-only': UserX,
	admin: UserCog,
};

const getInitials = (name: string) =>
	name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase();

const formatDate = (iso?: string) =>
	iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

const emptyForm = { fullName: '', workEmail: '', password: '', role: 'support-agent' };

const AdminRoles = () => {
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState('members');
	const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
	const [editingMember, setEditingMember] = useState<ApiAdminMember | null>(null);
	const [formData, setFormData] = useState(emptyForm);

	const isEditing = !!editingMember;


	const {
		data: membersResponse,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['admin-members'],
		queryFn: adminAndRolesAPI.getAll,
	});

	const teamMembers: ApiAdminMember[] = membersResponse?.data ?? [];


	const inviteMutation = useMutation({
		mutationFn: (payload: { email: string; fullName: string; password: string; role: string }) =>
			adminAndRolesAPI.invite(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin-members'] });
			closeSheet();
		},
	});


	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: { email: string; fullName: string; role: string } }) =>
			adminAndRolesAPI.update(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin-members'] });
			closeSheet();
		},
	});


	const deleteMutation = useMutation({
		mutationFn: (id: string) => adminAndRolesAPI.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin-members'] });
		},
	});

	const closeSheet = () => {
		setIsInviteSheetOpen(false);
		setEditingMember(null);
		setFormData(emptyForm);
	};

	const openInviteSheet = () => {
		setEditingMember(null);
		setFormData(emptyForm);
		setIsInviteSheetOpen(true);
	};

	const openEditSheet = (member: ApiAdminMember) => {
		setEditingMember(member);
		setFormData({
			fullName: member.fullName,
			workEmail: member.email,
			password: '',
			role: member.role,
		});
		setIsInviteSheetOpen(true);
	};

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (isEditing && editingMember) {
			updateMutation.mutate({
				id: editingMember._id,
				data: {
					email: formData.workEmail,
					fullName: formData.fullName,
					role: formData.role,
				},
			});
		} else {
			inviteMutation.mutate({
				email: formData.workEmail,
				fullName: formData.fullName,
				password: formData.password,
				role: formData.role,
			});
		}
	};

	const handleDelete = (id: string) => {
		if (confirm('Remove this admin member?')) {
			deleteMutation.mutate(id);
		}
	};

	const getRolePermissions = (roleId: string) => roles.find((r) => r.id === roleId)?.permissions ?? [];

	// Role counts for the summary cards (grouped by raw role string returned by the API)
	const roleCounts = teamMembers.reduce((acc, member) => {
		acc[member.role] = (acc[member.role] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const isSaving = inviteMutation.isPending || updateMutation.isPending;

	return (
		<div className="h-full flex flex-col space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Admin & Roles</h1>
					<p className="text-muted-foreground">
						Manage team access, roles, and permission policies
					</p>
				</div>
				<Button onClick={openInviteSheet}>
					<Plus className="h-4 w-4 mr-2" />
					Invite Admin
				</Button>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
				<TabsList>
					<TabsTrigger value="members">
						<Users className="h-4 w-4 mr-2" />
						Team Members
					</TabsTrigger>
					<TabsTrigger value="permissions">
						<Shield className="h-4 w-4 mr-2" />
						Permission Matrix
					</TabsTrigger>
				</TabsList>

				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
					{Object.entries(roleCounts).map(([role, count]) => (
						<Card key={role} className="bg-transparent border-border/50">
							<CardContent className="p-5">
								<p className="text-sm font-medium capitalize">{role}</p>
								<p className="text-2xl font-bold">{count}</p>
								<p className="text-xs text-muted-foreground">member{count === 1 ? '' : 's'}</p>
							</CardContent>
						</Card>
					))}
				</div>

				<TabsContent value="members" className="mt-6">
					<div className="border rounded-lg">
						{isLoading ? (
							<div className="flex items-center justify-center py-12 text-muted-foreground">
								<Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading admins...
							</div>
						) : isError ? (
							<div className="py-12 text-center text-sm text-destructive">
								Couldn't load admin members. Try refreshing.
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>ADMIN</TableHead>
										<TableHead>ROLE</TableHead>
										<TableHead>STATUS</TableHead>
										<TableHead>LAST UPDATED</TableHead>
										<TableHead>ADDED</TableHead>
										<TableHead className="text-right">ACTIONS</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{teamMembers.map((member) => {
										const status = member.isBlocked ? 'inactive' : member.isVerified ? 'active' : 'pending';
										return (
											<TableRow key={member._id}>
												<TableCell className="font-medium">
													<div className="flex items-center gap-2">
														<Avatar className="h-8 w-8">
															<AvatarFallback className="bg-[#181135] text-[#A15F7D]">
																{getInitials(member.fullName)}
															</AvatarFallback>
														</Avatar>
														<div>
															<div>{member.fullName}</div>
															<div className="text-xs text-muted-foreground">{member.email}</div>
														</div>
													</div>
												</TableCell>
												<TableCell>
													<Badge className={cn(roleColors[member.role] || 'bg-gray-100', 'capitalize')}>
														{member.role}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1">
														<div
															className={cn(
																'h-2 w-2 rounded-full',
																status === 'active' ? 'bg-green-500' : status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
															)}
														/>
														<span className="capitalize">{status}</span>
													</div>
												</TableCell>
												<TableCell>{formatDate(member.updatedAt)}</TableCell>
												<TableCell>{formatDate(member.createdAt)}</TableCell>
												<TableCell className="text-right">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="sm">
																<MoreVertical className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem onClick={() => openEditSheet(member)}>Edit Role</DropdownMenuItem>
															<DropdownMenuItem
																className="text-destructive"
																onClick={() => handleDelete(member._id)}
															>
																Remove
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						)}
					</div>
				</TabsContent>

				<TabsContent value="permissions" className="mt-6">
					<div className="text-sm text-muted-foreground py-8 text-center">
						Permission matrix isn't wired to an endpoint yet — this stays local for now.
					</div>
				</TabsContent>
			</Tabs>

			{/* Invite / Edit Admin Sheet */}
			<Sheet open={isInviteSheetOpen} onOpenChange={(open) => (open ? setIsInviteSheetOpen(true) : closeSheet())}>
				<SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
					<SheetHeader>
						<SheetTitle className="text-2xl font-bold">
							{isEditing ? 'Edit Admin' : 'Invite Admin'}
						</SheetTitle>
						<SheetDescription>
							{isEditing
								? 'Update this admin\'s details and role.'
								: 'Invite a new admin to your team with specific role-based permissions.'}
						</SheetDescription>
					</SheetHeader>

					<form onSubmit={handleFormSubmit} className="mt-6 space-y-6">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="fullName" className="text-sm font-medium">FULL NAME</Label>
								<Input
									id="fullName"
									placeholder="e.g. Amara Obi"
									value={formData.fullName}
									onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="workEmail" className="text-sm font-medium">WORK EMAIL</Label>
								<Input
									id="workEmail"
									type="email"
									placeholder="name@ravasend.com"
									value={formData.workEmail}
									onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
									required
								/>
							</div>

							{!isEditing && (
								<div className="space-y-2">
									<Label htmlFor="password" className="text-sm font-medium">TEMPORARY PASSWORD</Label>
									<Input
										id="password"
										type="text"
										placeholder="e.g. Acces0091"
										value={formData.password}
										onChange={(e) => setFormData({ ...formData, password: e.target.value })}
										required
									/>
								</div>
							)}

							<div className="space-y-2">
								<Label className="text-sm font-medium">ROLE</Label>
								<RadioGroup
									value={formData.role}
									onValueChange={(value) => setFormData({ ...formData, role: value })}
									className="space-y-3"
								>
									{roles.map((role) => (
										<div key={role.id} className="flex items-center justify-between space-y-0 bg-[#181135]/50 py-2 px-4 rounded-lg">
											<Label htmlFor={role.id} className="font-normal cursor-pointer">
												<div className="font-medium">{role.name}</div>
												<div className="text-sm text-muted-foreground">{role.description}</div>
											</Label>
											<RadioGroupItem value={role.id} id={role.id} className="mt-1" />
										</div>
									))}
								</RadioGroup>
							</div>
						</div>

						<Separator />

						<div className="space-y-2">
							<Label className="text-sm font-medium">
								Permissions for {roles.find((r) => r.id === formData.role)?.name || 'Support Agent'}
							</Label>
							<div className="bg-muted/30 rounded-lg p-4 space-y-2">
								{getRolePermissions(formData.role).length > 0 ? (
									getRolePermissions(formData.role).map((permission, index) => (
										<div key={index} className="flex items-center gap-2 text-sm">
											<Check className="h-4 w-4 text-[#A15F7D]" />
											<span>{permission}</span>
										</div>
									))
								) : (
									<div className="text-sm text-muted-foreground">No specific permissions assigned</div>
								)}
							</div>
						</div>

						{(inviteMutation.isError || updateMutation.isError) && (
							<p className="text-sm text-destructive">
								Something went wrong. Please try again.
							</p>
						)}

						<div className="flex items-center gap-3 pt-4">
							<Button type="button" variant="outline" className="flex-1" onClick={closeSheet}>
								Cancel
							</Button>
							<Button type="submit" className="flex-1" disabled={isSaving}>
								{isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
								{isEditing ? 'Save Changes' : 'Send Invite'}
							</Button>
						</div>
					</form>
				</SheetContent>
			</Sheet>
		</div>
	);
};

export default AdminRoles;