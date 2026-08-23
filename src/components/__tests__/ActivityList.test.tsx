// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ActivityList from "../ActivityList";
import type { Txn } from "../../services/transactions";

const credit: Txn = {
  id: "1",
  type: "credit",
  amount_usd: null,
  kwh: 58.8,
  ref: "PAY-000001",
  meter_id: "m1",
  created_at: new Date("2026-08-23T10:00:00Z").toISOString(),
};

describe("ActivityList", () => {
  it("shows the empty-ledger hint", () => {
    render(<ActivityList txns={[]} />);
    expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
  });
  it("renders a credit with its reference and +kWh value", () => {
    render(<ActivityList txns={[credit]} />);
    expect(screen.getByText("Meter credit")).toBeInTheDocument();
    expect(screen.getByText(/PAY-000001/)).toBeInTheDocument();
    expect(screen.getByText("+58.8 kWh")).toBeInTheDocument();
  });
});
