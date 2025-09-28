export default function RateLimitNotice({ message="Too many requests. Please try again later." }:{ message?: string }) {
  return <p className="rounded-lg bg-yellow-100 p-3 text-sm text-yellow-800">{message}</p>;
}
