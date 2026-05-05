"use client";

import {
	BarChart3,
	Building2,
	ChevronDown,
	FileCheck,
	LayoutDashboard,
	Package,
	Receipt,
	ShoppingCart,
	Sun,
	Truck,
	UserCog,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
	label: string;
	href: string;
	icon: React.ElementType;
	children?: { label: string; href: string }[];
	roles?: string[];
}

const NAV: NavItem[] = [
	{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{
		label: "CRM",
		href: "/dashboard/crm",
		icon: Users,
		children: [
			{ label: "Leads", href: "/dashboard/crm/leads" },
			{ label: "Customers", href: "/dashboard/customers" },
			{ label: "Site Surveys", href: "/dashboard/crm/surveys" },
			{ label: "Tasks", href: "/dashboard/crm/tasks" },
		],
	},
	{
		label: "Sales",
		href: "/dashboard/sales",
		icon: ShoppingCart,
		children: [
			{ label: "Quotations", href: "/dashboard/sales/quotations" },
			{ label: "Sales Orders", href: "/dashboard/sales/orders" },
			{ label: "Invoices", href: "/dashboard/sales/invoices" },
		],
	},
	{
		label: "Purchase",
		href: "/dashboard/purchase",
		icon: Building2,
		roles: ["admin", "manager"],
		children: [
			{ label: "Vendors", href: "/dashboard/purchase/vendors" },
			{ label: "RFQ", href: "/dashboard/purchase/rfq" },
			{ label: "Purchase Orders", href: "/dashboard/purchase/orders" },
			{ label: "GRN", href: "/dashboard/purchase/grn" },
		],
	},
	{
		label: "Inventory",
		href: "/dashboard/inventory",
		icon: Package,
		children: [
			{ label: "Items", href: "/dashboard/inventory/items" },
			{ label: "Stock", href: "/dashboard/inventory/stock" },
			{ label: "Warehouses", href: "/dashboard/inventory/warehouses" },
			{ label: "Movements", href: "/dashboard/inventory/movements" },
		],
	},
	{
		label: "Delivery",
		href: "/dashboard/delivery",
		icon: Truck,
		children: [
			{ label: "Deliveries", href: "/dashboard/delivery" },
			{
				label: "Installations",
				href: "/dashboard/delivery/installations",
			},
			{ label: "Net Metering", href: "/dashboard/delivery/netmeter" },
		],
	},
	{
		label: "Accounts",
		href: "/dashboard/accounts",
		icon: Receipt,
		roles: ["admin", "manager"],
		children: [
			{ label: "Payments", href: "/dashboard/accounts/payments" },
			{ label: "Vouchers", href: "/dashboard/accounts/vouchers" },
			{ label: "Ledger", href: "/dashboard/accounts/ledger" },
			{ label: "Reports", href: "/dashboard/accounts/reports" },
		],
	},
	{
		label: "Subsidy",
		href: "/dashboard/subsidy",
		icon: FileCheck,
		children: [
			{ label: "Claims", href: "/dashboard/subsidy" },
			{ label: "DISCOM Tracker", href: "/dashboard/subsidy/discom" },
		],
	},
	{
		label: "HR",
		href: "/dashboard/hr",
		icon: UserCog,
		roles: ["admin", "hr", "manager"],
		children: [
			{ label: "Employees", href: "/dashboard/hr/employees" },
			{ label: "Technicians", href: "/dashboard/hr/technicians" },
		],
	},
	{
		label: "Analytics",
		href: "/dashboard/analytics",
		icon: BarChart3,
		roles: ["admin", "manager"],
	},
];

function isRouteMatch(pathname: string, href: string) {
	return pathname === href || pathname.startsWith(`${href}/`);
}

function NavGroup({ item, onNavigate, pathname }: { item: NavItem; onNavigate?: () => void; pathname: string }) {
	const hasChildren = !!item.children?.length;
	const hasActiveChild = item.children?.some((child) => isRouteMatch(pathname, child.href));
	const isActive =
		(item.href === "/dashboard" ? pathname === item.href : isRouteMatch(pathname, item.href)) || !!hasActiveChild;
	const [isOpen, setIsOpen] = useState(isActive);
	const Icon = item.icon;

	useEffect(() => {
		if (isActive) {
			setIsOpen(true);
		}
	}, [isActive]);

	const linkClass = cn(
		"group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200",
		isActive
			? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
			: "text-slate-600 hover:bg-orange-50 hover:text-orange-700 dark:text-slate-300 dark:hover:bg-orange-500/10 dark:hover:text-orange-200",
	);

	if (!hasChildren) {
		return (
			<Link href={item.href} className={linkClass} onClick={onNavigate}>
				<Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
				<span className="truncate">{item.label}</span>
			</Link>
		);
	}

	return (
		<div className="space-y-1">
			<div
				className={cn(
					"group flex items-center rounded-xl text-sm transition-all duration-200",
					isActive
						? "bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-sm"
						: "text-slate-600 hover:bg-orange-50 hover:text-orange-700 dark:text-slate-300 dark:hover:bg-orange-500/10 dark:hover:text-orange-200",
				)}
			>
				<Link href={item.href} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2" onClick={onNavigate}>
					<Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
					<span className="truncate">{item.label}</span>
				</Link>
				<button
					type="button"
					onClick={() => setIsOpen((open) => !open)}
					className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/15 dark:hover:bg-white/10"
					aria-expanded={isOpen}
					aria-label={`${isOpen ? "Collapse" : "Expand"} ${item.label}`}
				>
					<ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
				</button>
			</div>
			{isOpen && item.children && (
				<div className="ml-4 grid gap-1 border-l border-orange-200/80 pl-3 dark:border-orange-500/20">
					{item.children.map((child) => (
						<Link
							key={child.href}
							href={child.href}
							onClick={onNavigate}
							className={cn(
								"block rounded-lg px-3 py-1.5 text-sm transition-all",
								isRouteMatch(pathname, child.href)
									? "bg-orange-100 font-medium text-orange-800 dark:bg-orange-500/15 dark:text-orange-200"
									: "text-slate-500 hover:bg-orange-50 hover:text-orange-700 dark:text-slate-400 dark:hover:bg-orange-500/10 dark:hover:text-orange-200",
							)}
						>
							{child.label}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}

export function Sidebar({
	mobileOpen = false,
	onMobileClose,
	user,
}: {
	mobileOpen?: boolean;
	onMobileClose?: () => void;
	user: { name: string; email: string; role?: string | null };
}) {
	const pathname = usePathname();
	const userRole = (user as { role?: string | null }).role ?? "sales";

	const filteredNav = NAV.filter((item) => !item.roles || item.roles.includes(userRole ?? "sales"));

	return (
		<>
			<button
				type="button"
				className={cn(
					"fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity lg:hidden",
					mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
				)}
				onClick={onMobileClose}
				aria-label="Close sidebar overlay"
			/>
			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(18rem,calc(100vw-2rem))] shrink-0 flex-col overflow-y-auto border-r border-orange-100/80 bg-linear-to-b from-white via-orange-50/30 to-amber-50/40 shadow-2xl shadow-slate-950/10 transition-transform duration-300 lg:static lg:z-auto lg:h-full lg:w-72 lg:translate-x-0 lg:shadow-none dark:border-white/10 dark:from-slate-950 dark:via-slate-950 dark:to-neutral-950 dark:shadow-black/40",
					mobileOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				{/* Logo */}
				<div className="border-b border-orange-100/80 px-4 py-4 dark:border-white/10">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-amber-500 shadow-sm">
							<Sun className="h-5 w-5 text-white" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-semibold text-slate-900 dark:text-white">SolarERP</p>
							<p className="text-xs font-medium text-orange-600">PM Surya Ghar</p>
						</div>
						<button
							type="button"
							className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-700 lg:hidden dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
							onClick={onMobileClose}
							aria-label="Close sidebar"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Nav */}
				<nav className="flex-1 space-y-1 px-3 py-4">
					{filteredNav.map((item) => (
						<NavGroup key={item.href} item={item} onNavigate={onMobileClose} pathname={pathname} />
					))}
				</nav>

				{/* User info */}
				<div className="border-t border-orange-100/80 px-4 py-3 dark:border-white/10">
					<div className="rounded-xl border border-orange-100 bg-white/90 p-2.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
						<div className="flex items-center gap-2.5">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700 dark:bg-orange-500/15 dark:text-orange-200">
								{user.name.charAt(0).toUpperCase()}
							</div>
							<div className="min-w-0">
								<p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{user.name}</p>
								<p className="text-xs capitalize text-slate-500 dark:text-slate-400">{userRole}</p>
							</div>
						</div>
					</div>
				</div>
			</aside>
		</>
	);
}
