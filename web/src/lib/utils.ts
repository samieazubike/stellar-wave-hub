import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { headers } from 'next/headers';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  return realIp || 'unknown-ip';
}