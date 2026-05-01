import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function scoreToGrade(score: number): { label: string; color: string } {
  if (score >= 8.5) return { label: "Excellent", color: "text-emerald-400" };
  if (score >= 7) return { label: "Good", color: "text-blue-400" };
  if (score >= 5.5) return { label: "Needs Work", color: "text-amber-400" };
  return { label: "Poor", color: "text-red-400" };
}

export function confidenceLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "High", color: "text-emerald-400" };
  if (score >= 55) return { label: "Medium", color: "text-amber-400" };
  return { label: "Low — Flag for Review", color: "text-red-400" };
}
