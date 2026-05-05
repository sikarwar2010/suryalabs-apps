"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Calendar, Zap } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utlis/helpers";
import type { leadStatusValues } from "@/schema/crm.schema";

type LeadStatus = (typeof leadStatusValues)[number];

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  new: "secondary",
  contacted: "default",
  survey_scheduled: "outline",
  survey_done: "outline",
  quotation_sent: "outline",
  negotiation: "secondary",
  won: "default",
  lost: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  survey_scheduled: "Survey",
  survey_done: "Done",
  quotation_sent: "Quotation",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  state: string | null;
  status: LeadStatus;
  source: string | null;
  systemSizeKw: string | null;
  monthlyBill: string | null;
  createdAt: Date;
}

interface LeadsTableProps {
  leads: Lead[];
}

export function LeadsTable({ leads }: LeadsTableProps) {
  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Lead",
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <div className="space-y-1">
              <Link
                href={`/dashboard/crm/leads/${lead.id}`}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                {lead.name}
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
              {STATUS_LABELS[status] ?? status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => {
          const lead = row.original;
          if (!lead.city) return "—";
          return (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {[lead.city, lead.state].filter(Boolean).join(", ")}
            </span>
          );
        },
      },
      {
        accessorKey: "systemSizeKw",
        header: "System",
        cell: ({ row }) => {
          const size = row.original.systemSizeKw;
          if (!size) return "—";
          return (
            <span className="flex items-center gap-1 text-sm">
              <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              {size} kWp
            </span>
          );
        },
      },
      {
        accessorKey: "monthlyBill",
        header: "Bill",
        cell: ({ row }) => {
          const bill = row.original.monthlyBill;
          return bill ? formatCurrency(bill) : "—";
        },
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground capitalize">
            {row.original.source ?? "Direct"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: [],
    },
  });

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="cursor-pointer">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No leads found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
