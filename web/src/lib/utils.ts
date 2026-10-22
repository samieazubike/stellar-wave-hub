import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shortens a Stellar account or contract address for display. */
export function truncateAddress(
  address: string,
  startLength = 4,
  endLength = 4,
): string {
  if (!address || address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}…${address.slice(-endLength)}`;
}
