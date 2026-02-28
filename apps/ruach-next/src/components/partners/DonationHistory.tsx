type Donation = {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: "completed" | "pending" | "failed" | "refunded";
  receiptUrl?: string | null;
};

type DonationHistoryProps = {
  donations: Donation[];
};

export default function DonationHistory({ donations }: DonationHistoryProps) {
  if (donations.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
        <p className="text-sm text-neutral-600">No donation history yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-6 py-4 font-semibold text-neutral-900">Date</th>
              <th className="px-6 py-4 font-semibold text-neutral-900">Amount</th>
              <th className="px-6 py-4 font-semibold text-neutral-900">Method</th>
              <th className="px-6 py-4 font-semibold text-neutral-900">Status</th>
              <th className="px-6 py-4 font-semibold text-neutral-900">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {donations.map((donation) => (
              <tr key={donation.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 text-neutral-700">
                  {new Date(donation.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4 font-semibold text-neutral-900">
                  ${donation.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-neutral-700">{donation.method}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      donation.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : donation.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {donation.receiptUrl ? (
                    <a
                      href={donation.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
