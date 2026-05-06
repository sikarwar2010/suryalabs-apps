"use client";

import { useQuery } from "@tanstack/react-query";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getItems, getLowStockAlerts } from "@/actions/inventory.actions";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utlis/helpers";

type Item = {
	id: string;
	code: string;
	name: string;
	unit: string;
	hsnCode: string | null;
	gstRate: string;
	sellingPrice: string | null;
	purchasePrice: string | null;
	minStockLevel: string | null;
	isActive: boolean;
	isSerialized: boolean;
};

const columnHelper = createColumnHelper<Item>();

export default function InventoryItemsPage() {
	const [search, setSearch] = useState("");
	const [sorting, setSorting] = useState<SortingState>([]);
	const [page, setPage] = useState(1);

	const { data, isLoading } = useQuery({
		queryKey: ["items", search, page],
		queryFn: () => getItems({ search: search || undefined, page, pageSize: 50 }),
	});

	const { data: alertsData } = useQuery({
		queryKey: ["low-stock-alerts"],
		queryFn: getLowStockAlerts,
	});

	const columns = useMemo(
		() => [
			columnHelper.accessor("code", {
				header: "Code",
				cell: (info) => <span className="font-mono text-xs text-gray-500">{info.getValue()}</span>,
			}),
			columnHelper.accessor("name", {
				header: ({ column }) => (
					<Button
						className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide"
						onClick={() => column.toggleSorting()}
					>
						Item Name <ArrowUpDown className="h-3 w-3" />
					</Button>
				),
				cell: (info) => (
					<div>
						<p className="font-medium text-gray-800">{info.getValue()}</p>
						{info.row.original.isSerialized && <span className="text-xs text-blue-600">Serialized</span>}
					</div>
				),
			}),
			columnHelper.accessor("unit", {
				header: "Unit",
				cell: (info) => <span className="text-gray-500">{info.getValue()}</span>,
			}),
			columnHelper.accessor("hsnCode", {
				header: "HSN",
				cell: (info) => <span className="font-mono text-xs">{info.getValue() ?? "—"}</span>,
			}),
			columnHelper.accessor("gstRate", {
				header: "GST",
				cell: (info) => <span>{info.getValue()}%</span>,
			}),
			columnHelper.accessor("sellingPrice", {
				header: "Selling Price",
				cell: (info) => {
					const val = info.getValue();
					return val ? formatCurrency(val) : "—";
				},
			}),
			columnHelper.accessor("purchasePrice", {
				header: "Purchase Price",
				cell: (info) => {
					const val = info.getValue();
					return val ? formatCurrency(val) : "—";
				},
			}),
			columnHelper.accessor("isActive", {
				header: "Status",
				cell: (info) => (
					<span
						className={`status-badge ${info.getValue() ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
					>
						{info.getValue() ? "Active" : "Inactive"}
					</span>
				),
			}),
		],
		[],
	);

	const table = useReactTable({
		data: data?.items ?? [],
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
	});

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-semibold text-gray-900">Inventory — Items</h1>
					<p className="text-sm text-gray-500">{data?.total ?? 0} total items</p>
				</div>
				<Link href="/dashboard/modules/inventory/items/new" className="btn-primary">
					<Plus className="h-4 w-4" />
					Add Item
				</Link>
			</div>

			{/* Low stock alerts */}
			{alertsData && alertsData.length > 0 && (
				<div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
					<AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
					<div>
						<p className="text-sm font-medium text-amber-800">{alertsData.length} items below minimum stock level</p>
						<p className="text-xs text-amber-600 mt-0.5">
							{alertsData
								.slice(0, 3)
								.map((a) => a.item?.name)
								.filter(Boolean)
								.join(", ")}
							{alertsData.length > 3 ? ` and ${alertsData.length - 3} more` : ""}
						</p>
					</div>
					<Link href="/dashboard/modules/inventory/stock" className="ml-auto text-xs text-amber-700 underline shrink-0">
						View Stock
					</Link>
				</div>
			)}

			{/* Search */}
			<div className="relative max-w-sm">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
				<input
					className="form-input pl-9"
					placeholder="Search items…"
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
				/>
			</div>

			{/* Table */}
			<div className="table-container">
				{isLoading ? (
					<div className="p-8 text-center text-gray-400">Loading items…</div>
				) : (
					<table className="data-table">
						<thead>
							{table.getHeaderGroups().map((hg) => (
								<tr key={hg.id}>
									{hg.headers.map((header) => (
										<th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
									))}
								</tr>
							))}
						</thead>
						<tbody>
							{table.getRowModel().rows.map((row) => (
								<tr key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
									))}
								</tr>
							))}
							{table.getRowModel().rows.length === 0 && (
								<tr>
									<td colSpan={8} className="text-center py-12 text-gray-400">
										No items found
									</td>
								</tr>
							)}
						</tbody>
					</table>
				)}
			</div>

			{/* Pagination */}
			{data && data.totalPages > 1 && (
				<div className="flex items-center justify-between text-sm">
					<p className="text-gray-500">
						Page {page} of {data.totalPages} · {data.total} items
					</p>
					<div className="flex gap-2">
						<Button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
							className="btn-secondary py-1.5 px-3 disabled:opacity-40"
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<Button
							onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
							disabled={page === data.totalPages}
							className="btn-secondary py-1.5 px-3 disabled:opacity-40"
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
