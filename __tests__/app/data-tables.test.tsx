import { render, screen } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";
import type { basicTableFeatures } from "@/app/_components/table-features";
import { AdminDataTable } from "@/app/admin/admin-data-table";
import { columns, type Submission } from "@/app/submissions/columns";
import { DataTable } from "@/app/submissions/data-table";

describe("TanStack data tables", () => {
	it("renders the submissions table with its headers and data", () => {
		const submissions: Submission[] = [
			{
				id: 1,
				message: "Keep going",
				date: "2026-09-13",
				status: "Approved",
			},
		];

		render(<DataTable columns={columns} data={submissions} />);

		expect(
			screen.getByRole("columnheader", { name: "Message" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("cell", { name: "Keep going" }),
		).toBeInTheDocument();
		expect(screen.getByRole("cell", { name: "Approved" })).toBeInTheDocument();
	});

	it("renders the reusable admin table and its empty state", () => {
		type AdminRow = { name: string };
		const adminColumns: ColumnDef<typeof basicTableFeatures, AdminRow>[] = [
			{ accessorKey: "name", header: "Name" },
		];

		const { rerender } = render(
			<AdminDataTable columns={adminColumns} data={[{ name: "Ada" }]} />,
		);

		expect(screen.getByRole("cell", { name: "Ada" })).toBeInTheDocument();

		rerender(<AdminDataTable columns={adminColumns} data={[]} />);

		expect(screen.getByRole("cell", { name: "No results." })).toHaveAttribute(
			"colspan",
			"1",
		);
	});
});
