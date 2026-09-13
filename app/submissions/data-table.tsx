"use client";

import { type ColumnDef, useTable } from "@tanstack/react-table";

import { basicTableFeatures } from "@/app/_components/table-features";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import type { Submission } from "./columns";

interface DataTableProps {
	columns: ColumnDef<typeof basicTableFeatures, Submission, unknown>[];
	data: Submission[];
}

export function DataTable({ columns, data }: DataTableProps) {
	const table = useTable({
		features: basicTableFeatures,
		data,
		columns,
	});

	return (
		<div className="rounded-md border bg-white">
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id} className="bg-custom-cream">
										{header.isPlaceholder ? null : (
											<table.FlexRender header={header} />
										)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{row.getAllCells().map((cell) => (
									<TableCell key={cell.id} className="bg-custom-cream">
										<table.FlexRender cell={cell} />
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell
								colSpan={columns.length}
								className="h-24 text-center bg-custom-cream"
							>
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
